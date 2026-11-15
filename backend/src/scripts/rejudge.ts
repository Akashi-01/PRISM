import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { judgeResponse } from "../evaluation/judge";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round2 = (n: number) => Math.round(n * 100) / 100;

(async () => {
  const name = process.argv[2];
  if (!name) throw new Error("Usage: npx tsx src/scripts/rejudge.ts <experiment-name>");
  const exp = await prisma.experiment.findUniqueOrThrow({ where: { name } });
  const items = await prisma.experimentItem.findMany({
    where: { experimentId: exp.id, status: "success", sessionId: { not: null } },
    orderBy: { id: "asc" },
    include: { session: { include: {
      evaluations: { where: { isCurrent: true } },
      evaluationSummaries: { where: { isCurrent: true } },
    } } },
  });

  // backup of the scores given by the OLD judge (kept for the report)
  const dir = path.resolve(process.cwd(), "experiments", name);
  fs.mkdirSync(dir, { recursive: true });
  const backup = path.join(dir, "judge-before-fix.json");
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, JSON.stringify(items.map((it) => ({
      testPromptId: it.testPromptId, sessionId: it.sessionId,
      evaluations: it.session!.evaluations.map((e) => ({
        id: e.id, variant: e.variant, relevance: e.relevance, completeness: e.completeness,
        instructionFollowing: e.instructionFollowing, formatCorrectness: e.formatCorrectness,
        overallScore: e.overallScore, judgeRationale: e.judgeRationale,
      })),
    })), null, 2));
  }

  let n = 0;
  for (const it of items) {
    const s = it.session!;
    const scores: Record<string, number> = {};
    for (const ev of s.evaluations) {
      const j = await judgeResponse({ rawPrompt: s.rawPrompt, response: ev.responseText });
      const d = j.data;
      const overall = round2((d.relevance + d.completeness + d.instructionFollowing + d.formatCorrectness) / 4);
      await prisma.responseEvaluation.update({
        where: { id: ev.id },
        data: {
          relevance: d.relevance, completeness: d.completeness,
          instructionFollowing: d.instructionFollowing, formatCorrectness: d.formatCorrectness,
          overallScore: overall, judgeRationale: d.rationale, judgeModel: j.model,
        },
      });
      scores[ev.variant] = overall;
      await sleep(4500); // Gemini free tier: 15 requests/min
    }
    const sum = s.evaluationSummaries[0];
    if (sum && scores.original != null && scores.optimized != null) {
      await prisma.evaluationSummary.update({
        where: { id: sum.id },
        data: {
          qualityOriginal: scores.original,
          qualityOptimized: scores.optimized,
          qualityDelta: round2(scores.optimized - scores.original),
          qualityRetentionPct: Math.round((scores.optimized / scores.original) * 1000) / 10,
        },
      });
    }
    console.log(`[${++n}/${items.length}] ${it.testPromptId}: ${scores.original} -> ${scores.optimized}`);
  }
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());