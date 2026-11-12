import { prisma } from "../lib/prisma";
import { PRICING } from "../config/pricing";

export function estimateCost(model: string, inputTokens: number, outputTokens = 0): number | null {
  const p = PRICING[model];
  if (!p) return null;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

/**
 * targetModel = the model the prompt is eventually sent to (the generator model).
 * pipelineCost  = what the 6 optimizer stages cost for this run (the overhead).
 * savingPerUse  = input-cost difference each time the optimized prompt replaces the original.
 * breakEvenUses = how many reuses until the overhead is paid back.
 */
export async function estimateSessionCost(sessionId: number, targetModel: string) {
  const session = await prisma.promptSession.findUniqueOrThrow({ where: { id: sessionId } });
  const stages = await prisma.stageResult.findMany({
    where: { sessionId, isCurrent: true, status: "success" },
  });

  let pipelineCost: number | null = 0;
  for (const s of stages) {
    const c = estimateCost(s.model ?? "", s.inputTokens, s.outputTokens);
    if (c == null) { pipelineCost = null; break; }
    pipelineCost += c;
  }

  const costOriginal = estimateCost(targetModel, session.tokensBefore ?? 0);
  const costOptimized = estimateCost(targetModel, session.tokensAfter ?? 0);
  const savingPerUse =
    costOriginal != null && costOptimized != null ? costOriginal - costOptimized : null;
  const breakEvenUses =
    pipelineCost != null && savingPerUse != null && savingPerUse > 0
      ? Math.ceil(pipelineCost / savingPerUse)
      : null;

  return { pipelineCost, costOriginal, costOptimized, savingPerUse, breakEvenUses };
}