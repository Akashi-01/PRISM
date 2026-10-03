import { analyzePrompt } from "../services/llm/analyze.service";

const prompts = [
  "write code for login",
  "Please please write a very detailed, detailed essay about climate change, make it detailed and long",
  "Summarize this article",
];

(async () => {
  for (const p of prompts) {
    const out = await analyzePrompt(p);
    console.log("PROMPT:", p);
    console.log(JSON.stringify(out, null, 2));
    console.log("-----");
  }
})();