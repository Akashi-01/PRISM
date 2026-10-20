import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { runStage } from "./runStage";
import type { PipelineContext } from "./types";
import {
  intentStage, requirementsStage, missingInfoStage,
  redundancyStage, taskStructureStage, optimizeStage,
} from "./stages";

const STAGES = [
  intentStage, requirementsStage, missingInfoStage,
  redundancyStage, taskStructureStage, optimizeStage,
] as const;

export async function runPipeline(sessionId: number, rawPrompt: string) {
  const ctx: PipelineContext = { rawPrompt, results: {} };
  let optimization: Awaited<ReturnType<typeof runStage<any>>>["data"] | undefined;

  for (const stage of STAGES) {
    const startedAt = Date.now();
    try {
      const result = await runStage(stage as any, ctx);

      // Guard 1: drop any "redundant phrase" that isn't really in the raw prompt
      if (stage.name === "redundancy") {
        const r = result.data as { items: { text: string; reason: string }[] };
        r.items = r.items.filter((i) => rawPrompt.includes(i.text));
      }

      if (stage.name === "optimize") optimization = result.data;
      else (ctx.results as Record<string, unknown>)[stage.name] = result.data;

      await prisma.stageResult.create({
        data: {
          sessionId,
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
          sessionId, stage: stage.name, output: {},
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