import { analyzePrompt } from "../services/llm/analyze.service";
import { optimizePrompt } from "../services/llm/optimize.service";
import { GeminiProvider } from "../services/llm/GeminiProvider";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const llm = new GeminiProvider();

const prompts = [
  "write code for login",
  "Please please write a very detailed, detailed essay about climate change, make it detailed and long",
];

(async () => {
  for (const raw of prompts) {
    const { analysis } = await analyzePrompt(raw);
    const { optimization } = await optimizePrompt(raw, analysis);

    const before = await llm.countTokens(raw);
    const after = await llm.countTokens(optimization.optimizedPrompt);
    const saved = (((before - after) / before) * 100).toFixed(1);

    console.log("ORIGINAL :", raw);
    console.log("OPTIMIZED:", optimization.optimizedPrompt);
    console.log("CHANGES  :", optimization.changes);
    console.log(`TOKENS   : ${before} -> ${after} (${saved}% saved)`);
    console.log("-----");
    await sleep(20000); // 4 calls per prompt, stay under the free-tier limit
  }
})();