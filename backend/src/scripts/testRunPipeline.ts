import { prisma } from "../lib/prisma";
import { runPipeline } from "../pipeline/orchestrator";
import { llm } from "../services/llm";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const prompts = [
  "Hi there! I hope you're doing well. So basically I want to learn machine learning. I am a complete beginner and know only a little bit of Python. Could you please please explain how I can start learning from scratch? I would like a step by step roadmap. Also please tell me which resources are good, but they should be free if possible. Thank you so much in advance!",
//   "Please please write a very detailed, detailed essay about climate change, make it detailed and long",
];

(async () => {
  for (const rawPrompt of prompts) {
    const tokensBefore = await llm.countTokens(rawPrompt);
    const session = await prisma.promptSession.create({
      data: { rawPrompt, tokensBefore },
    });

    const out = await runPipeline(session.id, rawPrompt);
    const optimized = (out.optimization as any).optimizedPrompt as string;
    const tokensAfter = await llm.countTokens(optimized);
    const saved = (((tokensBefore - tokensAfter) / tokensBefore) * 100).toFixed(1);

    console.log("SESSION  :", session.id);
    console.log("ORIGINAL :", rawPrompt);
    console.log("OPTIMIZED:", optimized);
    console.log(`TOKENS   : ${tokensBefore} -> ${tokensAfter} (${saved}% saved)`);

    const rows = await prisma.stageResult.findMany({
      where: { sessionId: session.id },
      orderBy: { id: "asc" },
    });
    console.table(
      rows.map((r) => ({
        stage: r.stage,
        status: r.status,
        in: r.inputTokens,
        out: r.outputTokens,
        ms: r.latencyMs,
      }))
    );

    console.log("-----");
    await sleep(20000); // 6 calls per prompt now, stay under the Gemini free-tier limit
  }
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());