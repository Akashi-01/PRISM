import { demoPrompts } from "./demoPrompts";
import { runPipeline } from "../services/pipeline.service";

(async () => {
  for (const [name, raw] of Object.entries(demoPrompts)) {
    const r = await runPipeline(raw);
    console.log("=====", name.toUpperCase(), "=====");
    console.log("TOKENS:", r.tokensBefore, "->", r.tokensAfter, `(${r.percentSaved}%)`);
    console.log("OPTIMIZED:", r.optimizedPrompt);
    console.log("CHANGES:", r.changes);
    console.log();
    await new Promise((res) => setTimeout(res, 20000)); // stay under the free-tier limit
  }
})();