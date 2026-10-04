import { prisma } from "../lib/prisma";
import { analyzePrompt } from "../services/llm/analyze.service";
import { optimizePrompt } from "../services/llm/optimize.service";
import { llm } from "../services/llm";
import { computeSavings } from "../services/metricsService";
import type { Prisma } from "../generated/prisma/client";

export async function runPipeline(rawPrompt: string) {
  const started = Date.now();

  const analyzed = await analyzePrompt(rawPrompt);
  const optimized = await optimizePrompt(rawPrompt, analyzed.analysis);
  const optimizedText = optimized.optimization.optimizedPrompt;

  const [before, after] = await Promise.all([
    llm.countTokens(rawPrompt),
    llm.countTokens(optimizedText),
  ]);
  const metrics = computeSavings(before, after);

  return prisma.promptSession.create({
    data: {
      rawPrompt,
      optimizedPrompt: optimizedText,
      analysis: analyzed.analysis as Prisma.InputJsonValue,
      meta: {
        changes: optimized.optimization.changes,
        usage: {
          analyze: { ...analyzed.usage },
          optimize: { ...optimized.usage },
        },
      } as Prisma.InputJsonObject,
      ...metrics,
      model: optimized.model,
      latencyMs: Date.now() - started,
    },
  });
}