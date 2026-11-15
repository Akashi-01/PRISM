import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

async function load(name: string) {
  const exp = await prisma.experiment.findUniqueOrThrow({ where: { name } });
  const items = await prisma.experimentItem.findMany({
    where: { experimentId: exp.id, status: "success", sessionId: { not: null } },
    include: { session: { include: { evaluationSummaries: { where: { isCurrent: true } } } } },
  });
  const map = new Map<string, any>();
  for (const it of items) {
    const s = it.session!, sum = s.evaluationSummaries[0];
    if (!sum) continue;
    map.set(it.testPromptId, {
      tag: it.tag, before: s.tokensBefore ?? 0, after: s.tokensAfter ?? 0,
      saved: s.percentSaved ?? 0, qo: sum.qualityOriginal, qp: sum.qualityOptimized, delta: sum.qualityDelta,
    });
  }
  return map;
}

function stats(rows: any[]) {
  const sb = rows.reduce((a, x) => a + x.before, 0), sa = rows.reduce((a, x) => a + x.after, 0);
  return {
    n: rows.length,
    medianSavedPct: r(median(rows.map((x) => x.saved))),
    aggregateSavedPct: r((1 - sa / sb) * 100),
    qualityOriginal: r(mean(rows.map((x) => x.qo)), 2),
    qualityOptimized: r(mean(rows.map((x) => x.qp)), 2),
    retentionPct: r((mean(rows.map((x) => x.qp)) / mean(rows.map((x) => x.qo))) * 100),
    losses: rows.filter((x) => x.delta < -0.25).length,
  };
}

(async () => {
  const [a, b] = [process.argv[2], process.argv[3]];
  if (!a || !b) throw new Error("Usage: npx tsx src/scripts/compareExperiments.ts groq-v1 groq-v2");
  const [m1, m2] = [await load(a), await load(b)];
  const ids = [...m2.keys()].filter((id) => m1.has(id));
  const pair = (m: Map<string, any>, filter?: (x: any) => boolean) =>
    ids.map((id) => m.get(id)).filter((x) => (filter ? filter(x) : true));

  const overall = [{ version: a, ...stats(pair(m1)) }, { version: b, ...stats(pair(m2)) }];
  console.log(`\nPaired prompts: ${ids.length}`);
  console.table(overall);

  const tags = [...new Set(ids.map((id) => m1.get(id).tag))];
  const byTag = tags.flatMap((t) => [
    { tag: t, version: a, ...stats(pair(m1, (x) => x.tag === t)) },
    { tag: t, version: b, ...stats(pair(m2, (x) => x.tag === t)) },
  ]);
  console.table(byTag);

  const dir = path.resolve(process.cwd(), "experiments");
  fs.writeFileSync(path.join(dir, `compare-${a}-vs-${b}.json`), JSON.stringify({ overall, byTag }, null, 2));
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());