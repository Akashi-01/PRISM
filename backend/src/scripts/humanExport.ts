import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

function rng(seed: number) { // mulberry32, so the sample is reproducible
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

(async () => {
  const name = process.argv[2];
  const N = Number(process.argv[3] ?? 12);
  if (!name) throw new Error("Usage: npm run experiment:human:export -- <experiment-name> [12]");
  const rand = rng(42);

  const exp = await prisma.experiment.findUniqueOrThrow({ where: { name } });
  const items = await prisma.experimentItem.findMany({
    where: { experimentId: exp.id, status: "success", sessionId: { not: null } },
    include: { session: { include: { evaluations: { where: { isCurrent: true } } } } },
  });

  // stratify: shuffle inside each intent, then take round-robin across intents
  const byIntent = new Map<string, typeof items>();
  for (const it of items) byIntent.set(it.intent, [...(byIntent.get(it.intent) ?? []), it]);
  for (const list of byIntent.values()) list.sort(() => rand() - 0.5);
  const picked: typeof items = [];
  while (picked.length < N && [...byIntent.values()].some((l) => l.length)) {
    for (const l of byIntent.values()) { const x = l.shift(); if (x && picked.length < N) picked.push(x); }
  }

  const key: Record<number, { A: string; B: string }> = {};
  let md = `# Human rating sheet (${name})\n\nScore each response 1-5 using the rubric (average of relevance, completeness, instruction following, format). Decimals like 3.5 are fine. Fill scores in scores.csv.\n`;
  const csv = ["sessionId,scoreA,scoreB"];

  for (const it of picked) {
    const s = it.session!;
    const orig = s.evaluations.find((e) => e.variant === "original")!;
    const opt = s.evaluations.find((e) => e.variant === "optimized")!;
    const swap = rand() < 0.5;
    const [A, B] = swap ? [opt, orig] : [orig, opt];
    key[s.id] = { A: A.variant, B: B.variant };
    md += `\n---\n\n## Session ${s.id}\n\n**Task:**\n\n${s.rawPrompt}\n\n### Response A\n\n${A.responseText}\n\n### Response B\n\n${B.responseText}\n`;
    csv.push(`${s.id},,`);
  }

  const dir = path.resolve(process.cwd(), "experiments", name, "human");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "rating-sheet.md"), md);
  fs.writeFileSync(path.join(dir, "scores.csv"), csv.join("\n"));
  fs.writeFileSync(path.join(dir, "key.json"), JSON.stringify(key, null, 2));
  console.log(`Wrote ${picked.length} prompts to experiments/${name}/human/. Do NOT open key.json until you finish scoring.`);
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());