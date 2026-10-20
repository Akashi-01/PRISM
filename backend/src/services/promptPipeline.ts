import { prisma } from "../lib/prisma";
import { llm } from "./llm";
import { computeSavings } from "./metricsService";
import { runPipeline as runStages } from "../pipeline/orchestrator";
import type { Prisma } from "../generated/prisma/client";

const ANALYZE_STAGES = ["intent", "requirements", "missingInfo", "redundancy", "taskStructure"];

export async function runPipeline(rawPrompt: string) {
  const started = Date.now();

  // the session must exist first so every stage can save its row against it
  const before = await llm.countTokens(rawPrompt);
  const session = await prisma.promptSession.create({
    data: { rawPrompt, tokensBefore: before },
  });

  try {
    const { analysis, optimization } = await runStages(session.id, rawPrompt);
    const optimizedText = (optimization as { optimizedPrompt: string }).optimizedPrompt;
    const changes = (optimization as { changes?: string[] }).changes ?? [];

    const after = await llm.countTokens(optimizedText);
    const metrics = computeSavings(before, after);

    // usage per stage, read from the rows the orchestrator saved
    const rows = await prisma.stageResult.findMany({
      where: { sessionId: session.id },
      orderBy: { id: "asc" },
    });
    const sum = (list: typeof rows) => ({
      inputTokens: list.reduce((n, r) => n + r.inputTokens, 0),
      outputTokens: list.reduce((n, r) => n + r.outputTokens, 0),
    });
    const optimizeRow = rows.find((r) => r.stage === "optimize");

    await prisma.promptSession.update({
      where: { id: session.id },
      data: {
        optimizedPrompt: optimizedText,
        analysis: analysis as Prisma.InputJsonValue,
        meta: {
          changes,
          usage: {
            // same keys the old flow wrote, so existing readers keep working
            analyze: sum(rows.filter((r) => ANALYZE_STAGES.includes(r.stage))),
            optimize: sum(rows.filter((r) => r.stage === "optimize")),
          },
        } as Prisma.InputJsonObject,
        ...metrics,
        model: optimizeRow?.model ?? null,
        latencyMs: Date.now() - started,
      },
    });

    return await prisma.promptSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { stages: { orderBy: { id: "asc" } } },
    });
  } catch (e: any) {
    await prisma.promptSession.update({
      where: { id: session.id },
      data: {
        latencyMs: Date.now() - started,
        meta: { status: "failed", error: String(e?.message ?? e) } as Prisma.InputJsonObject,
      },
    });
    throw e; // your controller's next(err) turns this into the HTTP error
  }
}