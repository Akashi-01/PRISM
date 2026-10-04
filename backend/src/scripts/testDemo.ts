import { demoPrompts } from "./demoPrompts";
import { runPipeline } from "../services/promptPipeline";

(async () => {
  const entries = Object.entries(demoPrompts);
  for (let i = 0; i < entries.length; i++) {
    const [name, raw] = entries[i];
    const r = await runPipeline(raw);
    const meta = r.meta as { changes: string[]; usage: unknown };
    console.log("=====", name.toUpperCase(), "=====");
    console.log("TOKENS:", r.tokensBefore, "->", r.tokensAfter, `(${r.percentSaved}%)`);
    console.log("OPTIMIZED:", r.optimizedPrompt);
    console.log("CHANGES:", meta.changes);
    console.log();
    // wait sirf prompts ke beech mein, last ke baad nahi
    if (i < entries.length - 1) {
      await new Promise((res) => setTimeout(res, 20000)); // free-tier limit
    }
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});