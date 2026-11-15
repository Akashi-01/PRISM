import { prisma } from "../lib/prisma";

(async () => {
  const rows = await prisma.humanRating.findMany({
    include: { session: { include: { evaluationSummaries: { where: { isCurrent: true } } } } },
  });
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const ho = rows.map((r) => r.scoreOriginal), hp = rows.map((r) => r.scoreOptimized);

  console.table(rows.map((r) => {
    const s = r.session.evaluationSummaries[0];
    return { session: r.sessionId, humanOrig: r.scoreOriginal, humanOpt: r.scoreOptimized,
             humanDiff: r.scoreOptimized - r.scoreOriginal,
             judgeOrig: s?.qualityOriginal, judgeOpt: s?.qualityOptimized, judgeDiff: s?.qualityDelta,
             savedPct: r.session.percentSaved };
  }));

  console.table([{
    n: rows.length,
    meanHumanOriginal: Number(mean(ho).toFixed(2)),
    meanHumanOptimized: Number(mean(hp).toFixed(2)),
    humanRetentionPct: Number(((mean(hp) / mean(ho)) * 100).toFixed(1)),
    humanWins: rows.filter((r) => r.scoreOptimized > r.scoreOriginal).length,
    humanTies: rows.filter((r) => r.scoreOptimized === r.scoreOriginal).length,
    humanLosses: rows.filter((r) => r.scoreOptimized < r.scoreOriginal).length,
  }]);
})().catch(console.error).finally(() => prisma.$disconnect());