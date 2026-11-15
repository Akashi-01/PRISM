import { prisma } from "../lib/prisma";
import { llm } from "../services/llm";
import { runPipeline } from "../pipeline/orchestrator";
import { computeSavings } from "../services/metricsService";
import { evaluateSession } from "../evaluation/evaluateSession";

export async function runOne(rawPrompt: string) {
  const t0 = Date.now();
  const tokensBefore = await llm.countTokens(rawPrompt);
  const session = await prisma.promptSession.create({ data: { rawPrompt, tokensBefore } });

  const out = await runPipeline(session.id, rawPrompt);
  const optimized = (out.optimization as any).optimizedPrompt as string;
  const tokensAfter = await llm.countTokens(optimized);
  const m = computeSavings(tokensBefore, tokensAfter);

  const optStage = await prisma.stageResult.findFirst({
    where: { sessionId: session.id, stage: "optimize", isCurrent: true },
  });

  await prisma.promptSession.update({
    where: { id: session.id },
    data: {
      optimizedPrompt: optimized,
      analysis: out.analysis as any,
      tokensAfter,
      tokensSaved: m.tokensSaved,
      percentSaved: m.percentSaved,
      model: optStage?.model ?? null,
      latencyMs: Date.now() - t0,
    },
  });

  const ev = await evaluateSession(session.id);
  if ("error" in ev) throw new Error(`evaluateSession: ${ev.error}`);

  return { sessionId: session.id };
}