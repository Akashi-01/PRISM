import { prisma } from "../lib/prisma";

const TIE_BAND = 0.25; // one rubric point on one criterion
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

type Point = {
  id: string; tag: string; before: number; after: number;
  savedPct: number; qo: number; qp: number; delta: number;
};

function stats(points: Point[]) {
  const sumBefore = points.reduce((a, p) => a + p.before, 0);
  const sumAfter = points.reduce((a, p) => a + p.after, 0);
  const qo = mean(points.map((p) => p.qo));
  const qp = mean(points.map((p) => p.qp));
  return {
    n: points.length,
    medianSavedPct: r1(median(points.map((p) => p.savedPct))),
    aggregateSavedPct: sumBefore ? r1((1 - sumAfter / sumBefore) * 100) : 0,
    qualityOriginal: r2(qo),
    qualityOptimized: r2(qp),
    retentionPct: qo ? r1((qp / qo) * 100) : 0,
    wins: points.filter((p) => p.delta > TIE_BAND).length,
    ties: points.filter((p) => Math.abs(p.delta) <= TIE_BAND).length,
    losses: points.filter((p) => p.delta < -TIE_BAND).length,
  };
}

export async function getEvaluationOverview() {
  const experiments = await prisma.experiment.findMany({ orderBy: { id: "asc" } });
  const result: any[] = [];

  for (const exp of experiments) {
    const items = await prisma.experimentItem.findMany({
      where: { experimentId: exp.id, status: "success", sessionId: { not: null } },
      include: {
        session: { include: { evaluationSummaries: { where: { isCurrent: true }, take: 1 } } },
      },
    });

    const points: Point[] = [];
    const sessionIds: number[] = [];
    for (const it of items) {
      const s = it.session;
      const sum = s?.evaluationSummaries[0];
      if (!s || !sum) continue;
      sessionIds.push(s.id);
      points.push({
        id: it.testPromptId, tag: it.tag,
        before: s.tokensBefore ?? 0, after: s.tokensAfter ?? 0, savedPct: s.percentSaved ?? 0,
        qo: sum.qualityOriginal, qp: sum.qualityOptimized, delta: sum.qualityDelta,
      });
    }
    if (points.length < 10) continue; // ignore tiny test runs

    const ratings = await prisma.humanRating.findMany({ where: { sessionId: { in: sessionIds } } });
    const ho = ratings.map((x) => x.scoreOriginal);
    const hp = ratings.map((x) => x.scoreOptimized);
    const human = ratings.length
      ? {
          n: ratings.length,
          meanOriginal: r2(mean(ho)),
          meanOptimized: r2(mean(hp)),
          retentionPct: r1((mean(hp) / mean(ho)) * 100),
          better: ratings.filter((x) => x.scoreOptimized - x.scoreOriginal > 1e-9).length,
          equal: ratings.filter((x) => Math.abs(x.scoreOptimized - x.scoreOriginal) <= 1e-9).length,
          worse: ratings.filter((x) => x.scoreOptimized - x.scoreOriginal < -1e-9).length,
        }
      : null;

    const tags = [...new Set(points.map((p) => p.tag))];
    result.push({
      name: exp.name,
      createdAt: exp.createdAt,
      overall: stats(points),
      byTag: tags.map((t) => ({ tag: t, ...stats(points.filter((p) => p.tag === t)) })),
      points: points.map((p) => ({ id: p.id, tag: p.tag, savedPct: r1(p.savedPct), delta: r2(p.delta) })),
      human,
    });
  }
  return { experiments: result };
}