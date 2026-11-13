import { prisma } from "../lib/prisma";
import { runPipeline } from "../pipeline/orchestrator";
import { llm } from "../services/llm";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const prompts = [
  "Rewrite the following sentence to be more professional, make it sound more professional and formal: 'hey guys, the meeting got pushed to tomorrow cuz the boss is busy, sorry for the mess'.",
  "Hi, I have a list of customer reviews and I want to figure out whether each one is positive, negative or neutral. I do not have time to read them one by one. Can you classify these three reviews for me and give a one-line reason for each? 1) 'Delivery was late but the product is great.' 2) 'Worst purchase ever, broke in two days.' 3) 'It works as described.'",
  "Role: career coach. Task: prepare 5 interview questions for a junior data analyst role with a one-line ideal-answer hint for each. Constraints: mix of technical and behavioral. Output: numbered list.",
  "Write a SQL query to find the top 5 customers by total order value from tables customers(id, name) and orders(id, customer_id, total).",
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