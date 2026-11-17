import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { getProvider, type ProviderName } from "./llm";
import type { LLMService } from "./llm/LLMService";
import { computeSavings } from "./metricsService";
import {
  runPipeline as runStages,
  STAGE_NAMES,
  type RunOptions,
} from "../pipeline/orchestrator";
import type { Prisma } from "../generated/prisma/client";
import type { Clarification, StageName } from "../pipeline/types";

const ANALYZE_STAGES = ["intent", "requirements", "missingInfo", "redundancy", "taskStructure"];

// Saves metrics, usage and the optimized prompt on the session, from the CURRENT stage rows
async function finalizeSession(args: {
  sessionId: number;
  before: number;
  analysis: unknown;
  optimization: unknown;
  started: number;
  isRerun: boolean;
  client: LLMService;
}) {
  const { sessionId, before, analysis, optimization, started, isRerun, client } = args;

  const optimizedText = (optimization as { optimizedPrompt: string }).optimizedPrompt;
  const changes = (optimization as { changes?: string[] }).changes ?? [];

  const after = await client.countTokens(optimizedText);
  const metrics = computeSavings(before, after);

  const rows = await prisma.stageResult.findMany({
    where: { sessionId, isCurrent: true },
    orderBy: { id: "asc" },
  });
  const sum = (list: typeof rows) => ({
    inputTokens: list.reduce((n, r) => n + r.inputTokens, 0),
    outputTokens: list.reduce((n, r) => n + r.outputTokens, 0),
  });
  const optimizeRow = rows.find((r) => r.stage === "optimize");

  // first run: wall-clock time. re-run: total of the current stages' latencies
  const latencyMs = isRerun
    ? rows.reduce((n, r) => n + r.latencyMs, 0)
    : Date.now() - started;

  await prisma.promptSession.update({
    where: { id: sessionId },
    data: {
      optimizedPrompt: optimizedText,
      analysis: analysis as Prisma.InputJsonValue,
      meta: {
        changes,
        usage: {
          analyze: sum(rows.filter((r) => ANALYZE_STAGES.includes(r.stage))),
          optimize: sum(rows.filter((r) => r.stage === "optimize")),
        },
      } as Prisma.InputJsonObject,
      ...metrics,
      model: optimizeRow?.model ?? null,
      latencyMs,
    },
  });
}

const withCurrentStages = {
  stages: { where: { isCurrent: true }, orderBy: { id: "asc" as const } },
};

export async function runPipeline(rawPrompt: string, provider: ProviderName = env.LLM_PROVIDER) {
  const started = Date.now();
  const client = getProvider(provider);

  const before = await client.countTokens(rawPrompt);
  const session = await prisma.promptSession.create({
    data: { rawPrompt, tokensBefore: before, provider },
  });

  try {
    const { analysis, optimization } = await runStages(session.id, rawPrompt, {
      llm: client,
      provider,
    });
    await finalizeSession({
      sessionId: session.id, before, analysis, optimization, started, isRerun: false, client,
    });

    return await prisma.promptSession.findUniqueOrThrow({
      where: { id: session.id },
      include: withCurrentStages,
    });
  } catch (e: any) {
    await prisma.promptSession.update({
      where: { id: session.id },
      data: {
        latencyMs: Date.now() - started,
        meta: { status: "failed", error: String(e?.message ?? e) } as Prisma.InputJsonObject,
      },
    });
    throw e;
  }
}

// Re-run from a given stage. Returns null if the session does not exist.
export async function rerunPipeline(
  sessionId: number,
  opts: { fromStage: StageName; clarifications?: Clarification[] }
) {
  const session = await prisma.promptSession.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  // same provider as the original run (older sessions have none -> the default)
  const provider = (session.provider ?? env.LLM_PROVIDER) as ProviderName;
  const client = getProvider(provider);

  const started = Date.now();
  const before = session.tokensBefore ?? (await client.countTokens(session.rawPrompt));

  // Answers belong to the questions of the current missingInfo run.
  // Re-running missingInfo or an earlier stage makes new questions, so old answers are dropped.
  const existing = (session.clarifications as Clarification[] | null) ?? [];
  const afterMissingInfo =
    STAGE_NAMES.indexOf(opts.fromStage) > STAGE_NAMES.indexOf("missingInfo");
  const clarifications = opts.clarifications ?? (afterMissingInfo ? existing : []);

  const runOpts: RunOptions = { fromStage: opts.fromStage, clarifications, llm: client, provider };
  const { analysis, optimization } = await runStages(sessionId, session.rawPrompt, runOpts);

  await finalizeSession({
    sessionId, before, analysis, optimization, started, isRerun: true, client,
  });

  return prisma.promptSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: withCurrentStages,
  });
}