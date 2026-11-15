import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { JUDGE_PROVIDER } from "../services/llm";
import { runOne } from "../experiments/runOne";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

(async () => {
  const name = arg("name");
  if (!name) throw new Error("Usage: npm run experiment -- --name groq-v1 [--limit 3] [--delay 3000]");
  const limit = Number(arg("limit", "0"));
  const delay = Number(arg("delay", "3000"));

  const file = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "data/testPrompts.json"), "utf8")
  ) as { version: string; prompts: { id: string; intent: string; tag: string; text: string }[] };
  const prompts = limit ? file.prompts.slice(0, limit) : file.prompts;

  const provider = env.LLM_PROVIDER;
  const model = provider === "groq" ? env.GROQ_MODEL : env.GEMINI_MODEL;

  const exp =
    (await prisma.experiment.findUnique({ where: { name } })) ??
    (await prisma.experiment.create({
      data: { name, provider, model, judgeProvider: JUDGE_PROVIDER, testSetVersion: file.version },
    }));
  console.log(`Experiment "${name}" (id ${exp.id}) provider=${exp.provider} judge=${exp.judgeProvider}`);

  let failed = 0;
  for (const [i, tp] of prompts.entries()) {
    const key = { experimentId_testPromptId: { experimentId: exp.id, testPromptId: tp.id } };
    const existing = await prisma.experimentItem.findUnique({ where: key });
    if (existing?.status === "success") {
      console.log(`[${i + 1}/${prompts.length}] ${tp.id} already done, skipping`);
      continue;
    }

    const t0 = Date.now();
    try {
      const { sessionId } = await runOne(tp.text);
      await prisma.experimentItem.upsert({
        where: key,
        create: { experimentId: exp.id, testPromptId: tp.id, intent: tp.intent, tag: tp.tag,
                  sessionId, status: "success", durationMs: Date.now() - t0 },
        update: { sessionId, status: "success", error: null, durationMs: Date.now() - t0 },
      });
      console.log(`[${i + 1}/${prompts.length}] ${tp.id} ok (session ${sessionId}, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    } catch (e: any) {
      failed++;
      const msg = String(e?.message ?? e).slice(0, 1000);
      await prisma.experimentItem.upsert({
        where: key,
        create: { experimentId: exp.id, testPromptId: tp.id, intent: tp.intent, tag: tp.tag,
                  status: "failed", error: msg, durationMs: Date.now() - t0 },
        update: { status: "failed", error: msg, durationMs: Date.now() - t0 },
      });
      console.error(`[${i + 1}/${prompts.length}] ${tp.id} FAILED: ${msg}`);
    }
    await sleep(delay);
  }

  if (!failed) await prisma.experiment.update({ where: { id: exp.id }, data: { finishedAt: new Date() } });
  console.log(failed ? `Done with ${failed} failures. Re-run the same command to retry them.` : "All prompts done.");
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());