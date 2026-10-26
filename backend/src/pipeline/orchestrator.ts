import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { runStage } from "./runStage";
import type { PipelineContext, StageName, Clarification } from "./types";
import type { MissingInfoOutput } from "../schemas/stages.schema";
import {
  intentStage, requirementsStage, missingInfoStage,
  redundancyStage, taskStructureStage, optimizeStage,
} from "./stages";

const STAGES = [
  intentStage, requirementsStage, missingInfoStage,
  redundancyStage, taskStructureStage, optimizeStage,
] as const;

export const STAGE_NAMES: StageName[] = STAGES.map((s) => s.name);

export interface RunOptions {
  fromStage?: StageName;
  clarifications?: Clarification[];
}

export async function runPipeline(
  sessionId: number,
  rawPrompt: string,
  opts: RunOptions = {}
) {
  const startIndex = opts.fromStage ? STAGE_NAMES.indexOf(opts.fromStage) : 0;
  if (startIndex < 0) throw new Error(`Unknown stage "${opts.fromStage}"`);

  const session = await prisma.promptSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  // a first run keeps run 1; every re-run starts a new run
  const runNumber = opts.fromStage ? session.currentRun + 1 : session.currentRun;

  const ctx: PipelineContext = {
    rawPrompt,
    results: {},
    clarifications: opts.clarifications,
  };
  let optimization: any;

  // 1. Load saved outputs of the stages we are NOT re-running
  const earlier = STAGE_NAMES.slice(0, startIndex);
  if (earlier.length) {
    const saved = await prisma.stageResult.findMany({
      where: { sessionId, isCurrent: true, status: "success", stage: { in: earlier } },
    });
    for (const name of earlier) {
      const row = saved.find((r) => r.stage === name);
      if (!row) {
        throw new Error(`Cannot re-run from "${opts.fromStage}": "${name}" has no saved result`);
      }
      (ctx.results as Record<string, unknown>)[name] = row.output;
    }
  }

  // 2. Mark the old rows of the stages we are about to re-run as superseded
  const toRun = STAGES.slice(startIndex);
  await prisma.stageResult.updateMany({
    where: { sessionId, isCurrent: true, stage: { in: toRun.map((s) => s.name) } },
    data: { isCurrent: false },
  });
  await prisma.promptSession.update({
    where: { id: sessionId },
    data: {
      currentRun: runNumber,
      ...(opts.clarifications ? { clarifications: opts.clarifications as any } : {}),
    },
  });

  // 3. Run the remaining stages
  for (const stage of toRun) {
    const startedAt = Date.now();
    try {
      const result = await runStage(stage as any, ctx, stage.name === "optimize" ? 2 : 1);

      // Guard 1: drop any "redundant phrase" that isn't really in the raw prompt
      if (stage.name === "redundancy") {
        const r = result.data as { items: { text: string; reason: string }[] };
        r.items = r.items.filter((i) => rawPrompt.includes(i.text));
      }

      // give every missing-info question a stable id
      if (stage.name === "missingInfo") {
        const r = result.data as MissingInfoOutput;
        (result as any).data = {
          items: r.items.map((it, i) => ({ id: `q${i + 1}`, ...it })),
        };
      }

      if (stage.name === "optimize") optimization = result.data;
      else (ctx.results as Record<string, unknown>)[stage.name] = result.data;

      await prisma.stageResult.create({
        data: {
          sessionId,
          runNumber,
          stage: stage.name,
          output: result.data as object,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          latencyMs: result.latencyMs,
          status: "success",
          provider: env.LLM_PROVIDER,
          model: result.model,
        },
      });
    } catch (e: any) {
      await prisma.stageResult.create({
        data: {
          sessionId, runNumber, stage: stage.name, output: {},
          latencyMs: Date.now() - startedAt,
          status: "failed", error: String(e?.message ?? e),
          provider: env.LLM_PROVIDER,
        },
      });
      throw new Error(`Stage "${stage.name}" failed: ${e?.message ?? e}`);
    }
  }

  return { analysis: ctx.results, optimization: optimization! };
}