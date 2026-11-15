import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
function pearson(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y);
  let n = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { n += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return n / Math.sqrt(dx * dy);
}
function ranks(a: number[]) { // average ranks for ties
  const idx = a.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
  const out = new Array(a.length).fill(0);
  for (let i = 0; i < idx.length; ) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) out[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}
const sign = (d: number, band: number) => (Math.abs(d) <= band ? 0 : d > 0 ? 1 : -1);

(async () => {
  const name = process.argv[2];
  if (!name) throw new Error("Usage: npm run experiment:human:agreement -- <experiment-name>");
  const dir = path.resolve(process.cwd(), "experiments", name, "human");
  const key = JSON.parse(fs.readFileSync(path.join(dir, "key.json"), "utf8"));
  const lines = fs.readFileSync(path.join(dir, "scores.csv"), "utf8").trim().split("\n").slice(1);

  const human: number[] = [], judge: number[] = [];
  let prefAgree = 0, n = 0;

  for (const line of lines) {
    const [sid, a, b] = line.split(",");
    if (a === "" || b === "" || a === undefined || b === undefined) continue;
    const sessionId = Number(sid);
    const scoreA = Number(a), scoreB = Number(b);
    const k = key[sessionId];
    const scoreOriginal = k.A === "original" ? scoreA : scoreB;
    const scoreOptimized = k.A === "original" ? scoreB : scoreA;

    await prisma.humanRating.upsert({
      where: { sessionId_rater: { sessionId, rater: "me" } },
      create: { sessionId, rater: "me", scoreOriginal, scoreOptimized },
      update: { scoreOriginal, scoreOptimized },
    });

    const evs = await prisma.responseEvaluation.findMany({ where: { sessionId, isCurrent: true } });
    const jo = evs.find((e) => e.variant === "original")!.overallScore;
    const jp = evs.find((e) => e.variant === "optimized")!.overallScore;

    human.push(scoreOriginal, scoreOptimized);
    judge.push(jo, jp);
    if (sign(scoreOptimized - scoreOriginal, 0.25) === sign(jp - jo, 0.25)) prefAgree++;
    n++;
  }
  if (!n) throw new Error("No scores found in scores.csv");

  const result = {
    prompts: n, responses: human.length,
    pearson: Number(pearson(human, judge).toFixed(3)),
    spearman: Number(pearson(ranks(human), ranks(judge)).toFixed(3)),
    meanAbsDiff: Number(mean(human.map((h, i) => Math.abs(h - judge[i]))).toFixed(2)),
    within1PointPct: Number(((human.filter((h, i) => Math.abs(h - judge[i]) <= 1).length / human.length) * 100).toFixed(1)),
    preferenceAgreementPct: Number(((prefAgree / n) * 100).toFixed(1)),
    meanHuman: Number(mean(human).toFixed(2)), meanJudge: Number(mean(judge).toFixed(2)),
  };
  console.table([result]);
  fs.writeFileSync(path.join(dir, "agreement.json"), JSON.stringify(result, null, 2));
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());