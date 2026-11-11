import { prisma } from "../lib/prisma";
import { generatorLLM, GENERATOR_PROVIDER, JUDGE_PROVIDER } from "../services/llm";
import { judgeResponse } from "./judge";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function evaluateSession(sessionId: number) {
  const session = await prisma.promptSession.findUnique({ where: { id: sessionId } });
  if (!session) return { error: "not_found" as const };
  if (!session.optimizedPrompt) return { error: "not_optimized" as const };

  const variants = [
    { variant: "original", prompt: session.rawPrompt },
    { variant: "optimized", prompt: session.optimizedPrompt },
  ];

  // 1. Same model, same settings for both prompts
  const generated = await Promise.all(
    variants.map((v) =>
      generatorLLM.generateText({
        userPrompt: v.prompt,
        stage: `respond-${v.variant}`,
        maxOutputTokens: 4096,
      })
    )
  );

  // 2. Judge each response against the RAW prompt (blind: judge never sees the variant)
  const judged = await Promise.all(
    generated.map((g) => judgeResponse({ rawPrompt: session.rawPrompt, response: g.data }))
  );

  // 3. Build rows (overall score is computed here, not by the LLM)
  const rows = variants.map((v, i) => {
    const g = generated[i];
    const j = judged[i];
    const s = j.data;
    return {
      sessionId,
      runNumber: session.currentRun,
      variant: v.variant,
      promptText: v.prompt,
      responseText: g.data,
      genInputTokens: g.usage.inputTokens,
      genOutputTokens: g.usage.outputTokens,
      genLatencyMs: g.latencyMs,
      genProvider: GENERATOR_PROVIDER,
      genModel: g.model,
      judgeProvider: JUDGE_PROVIDER,
      judgeModel: j.model,
      relevance: s.relevance,
      completeness: s.completeness,
      instructionFollowing: s.instructionFollowing,
      formatCorrectness: s.formatCorrectness,
      overallScore: round2(
        (s.relevance + s.completeness + s.instructionFollowing + s.formatCorrectness) / 4
      ),
      judgeRationale: s.rationale,
    };
  });

  // 4. Aggregate
  const qualityOriginal = rows[0].overallScore;
  const qualityOptimized = rows[1].overallScore;
  const summary = {
    sessionId,
    runNumber: session.currentRun,
    qualityOriginal,
    qualityOptimized,
    qualityDelta: round2(qualityOptimized - qualityOriginal),
    qualityRetentionPct: Math.round((qualityOptimized / qualityOriginal) * 1000) / 10,
    tokensSavedPct: session.percentSaved ?? 0,
    hasClarifications: Array.isArray(session.clarifications) && session.clarifications.length > 0,
  };

  // 5. Save. Re-evaluating replaces the current evaluation and keeps the old one as history.
  await prisma.$transaction([
    prisma.responseEvaluation.updateMany({ where: { sessionId, isCurrent: true }, data: { isCurrent: false } }),
    prisma.evaluationSummary.updateMany({ where: { sessionId, isCurrent: true }, data: { isCurrent: false } }),
    prisma.responseEvaluation.createMany({ data: rows }),
    prisma.evaluationSummary.create({ data: summary }),
  ]);

  return { summary, responses: rows };
}