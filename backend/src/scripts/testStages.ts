import { runStage } from "../pipeline/runStage";
import type { PipelineContext } from "../pipeline/types";
import {
  intentStage, requirementsStage, missingInfoStage,
  redundancyStage, taskStructureStage, optimizeStage,
} from "../pipeline/stages";
import { llm } from "../services/llm";   // import goes at the top with the others

const SAMPLES = [
  "Hey, could you please write me a python function to reverse a string? Thanks a lot!",
  "I want to build a website for my small bakery. It should look nice and modern and have a menu and maybe online ordering. Please tell me how to do it, step by step, and also what technologies to use.",
  "Hi there! I hope you're doing well. So basically I have been thinking a lot about this and I really want to learn machine learning. I am a complete beginner, I have never done any machine learning before, and I know only a little bit of Python. Could you please please explain to me how I can start learning machine learning from scratch? I would like a step by step roadmap, like what should I learn first, then second, and so on. Also please tell me which resources are good, like books or courses, but they should be free if possible. I want it to be simple and easy to understand because I am a beginner. Thank you so much in advance, I really appreciate your help!",
];

async function main() {
  const rawPrompt = SAMPLES[Number(process.argv[2] ?? 0)];
  const ctx: PipelineContext = { rawPrompt, results: {} };
  const stages = [intentStage, requirementsStage, missingInfoStage,
                  redundancyStage, taskStructureStage, optimizeStage];

  let totalIn = 0, totalOut = 0;
  let optimized = "";                       // 1) declare before the loop
  console.log("RAW:", rawPrompt, "\n");

  for (const stage of stages) {
    const r = await runStage(stage as any, ctx);
    totalIn += r.usage.inputTokens;
    totalOut += r.usage.outputTokens;

    if (stage.name === "optimize") {
      optimized = (r.data as any).optimizedPrompt;   // 2) capture it inside the loop
    } else {
      (ctx.results as any)[stage.name] = r.data;
    }

    console.log(`--- ${stage.name} (${r.latencyMs}ms) ---`);
    console.log(JSON.stringify(r.data, null, 2), "\n");
  }

  console.log(`Pipeline cost: in=${totalIn} out=${totalOut}`);

  // 3) after the loop, still inside main()
  const before = await llm.countTokens(rawPrompt);
  const after = await llm.countTokens(optimized);
  console.log(`Tokens: ${before} -> ${after} (${(((before - after) / before) * 100).toFixed(1)}% saved)`);
}

main().catch((e) => { console.error(e); process.exit(1); });