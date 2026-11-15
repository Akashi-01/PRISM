import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { estimateSessionCost } from "../services/costService";

const TIE_BAND = 0.25; // one rubric point on one criterion = 0.25 in the 4-criteria mean
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const median = (a: number[]) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r = (n: number, d = 2) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

(async () => {
  const name = process.argv[2];
  if (!name) throw new Error("Usage: npm run experiment:summary -- <experiment-name>");
  const exp = await prisma.experiment.findUniqueOrThrow({ where: { name } });

  const items = await prisma.experimentItem.findMany({
    where: { experimentId: exp.id },
    orderBy: { id: "asc" },
    include: {
      session: {
        include: {
          evaluationSummaries: { where: { isCurrent: true } },
          evaluations: { where: { isCurrent: true } },
        },
      },
    },
  });

  const rows: any[] = [];
  for (const it of items) {
    const s = it.session;
    const sum = s?.evaluationSummaries[0];
    if (it.status !== "success" || !s || !sum) continue;
    const targetModel = s.evaluations[0]?.genModel ?? "";
    const cost = await estimateSessionCost(s.id, targetModel);
    const detected = (s.analysis as any)?.intent?.category ?? null;
    const delta = sum.qualityDelta;
    rows.push({
      id: it.testPromptId, sessionId: s.id, intent: it.intent, tag: it.tag, detectedIntent: detected,
      tokensBefore: s.tokensBefore, tokensAfter: s.tokensAfter, savedPct: s.percentSaved,
      qualityOriginal: sum.qualityOriginal, qualityOptimized: sum.qualityOptimized, delta,
      retentionPct: sum.qualityRetentionPct,
      outcome: Math.abs(delta) <= TIE_BAND ? "tie" : delta > 0 ? "win" : "loss",
      pipelineCost: cost.pipelineCost, savingPerUse: cost.savingPerUse, breakEvenUses: cost.breakEvenUses,
    });
  }

  const group = (key: "intent" | "tag") => {
    const keys = [...new Set(rows.map((x) => x[key]))];
    return keys.map((k) => {
      const g = rows.filter((x) => x[key] === k);
      const qo = mean(g.map((x) => x.qualityOriginal)), qp = mean(g.map((x) => x.qualityOptimized));
      return { [key]: k, n: g.length, savedPct: r(mean(g.map((x) => x.savedPct)), 1),
               qualityOriginal: r(qo), qualityOptimized: r(qp), retentionPct: r((qp / qo) * 100, 1) };
    });
  };

  const qo = mean(rows.map((x) => x.qualityOriginal)), qp = mean(rows.map((x) => x.qualityOptimized));
  const intentAcc = rows.filter((x) => x.detectedIntent).length
    ? rows.filter((x) => x.detectedIntent === x.intent).length / rows.filter((x) => x.detectedIntent).length : NaN;
  const be = rows.map((x) => x.breakEvenUses).filter((x) => x != null) as number[];
  const costs = rows.map((x) => x.pipelineCost).filter((x) => x != null) as number[];

  const overall = {
    experiment: name, provider: exp.provider, model: exp.model, judge: exp.judgeProvider,
    testSetVersion: exp.testSetVersion, n: rows.length, failed: items.filter((i) => i.status === "failed").length,
    meanSavedPct: r(mean(rows.map((x) => x.savedPct)), 1), medianSavedPct: r(median(rows.map((x) => x.savedPct)), 1),
    qualityOriginal: r(qo), qualityOptimized: r(qp), qualityRetentionPct: r((qp / qo) * 100, 1),
    wins: rows.filter((x) => x.outcome === "win").length, ties: rows.filter((x) => x.outcome === "tie").length,
    losses: rows.filter((x) => x.outcome === "loss").length,
    intentAccuracyPct: r(intentAcc * 100, 1),
    meanPipelineCostUSD: r(mean(costs), 6), medianBreakEvenUses: be.length ? median(be) : null,
  };
  const byIntent = group("intent"), byTag = group("tag");

  console.log("\nOVERALL"); console.table([overall]);
  console.log("BY INTENT"); console.table(byIntent);
  console.log("BY STYLE TAG"); console.table(byTag);

  const dir = path.resolve(process.cwd(), "experiments", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "results.json"), JSON.stringify({ overall, byIntent, byTag, rows }, null, 2));
  const cols = Object.keys(rows[0]);
  fs.writeFileSync(path.join(dir, "per-prompt.csv"),
    [cols.join(","), ...rows.map((x) => cols.map((c) => x[c] ?? "").join(","))].join("\n"));
  const md = (t: any[]) => t.length ? `| ${Object.keys(t[0]).join(" | ")} |\n|${Object.keys(t[0]).map(() => "---").join("|")}|\n` +
    t.map((x) => `| ${Object.values(x).join(" | ")} |`).join("\n") : "";
  fs.writeFileSync(path.join(dir, "summary.md"),
    `# ${name}\n\n${md([overall])}\n\n## By intent\n\n${md(byIntent)}\n\n## By style\n\n${md(byTag)}\n`);
  console.log(`\nSaved to experiments/${name}/`);
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());