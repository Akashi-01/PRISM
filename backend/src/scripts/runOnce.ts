import { runPipeline } from "../services/promptPipeline";

const DEFAULT_PROMPT =
  "Hey, can you please help me write a really good, professional, short email to my manager asking for leave next week because of a family function, make it polite and brief.";

(async () => {
  // command line se prompt lo, nahi diya to default use hoga
  const prompt = process.argv.slice(2).join(" ").trim() || DEFAULT_PROMPT;

  console.log("Running 1 prompt...\n");
  const r = await runPipeline(prompt);
  const meta = r.meta as { changes: string[]; usage: unknown };

  console.log(`ID: ${r.id}`);
  console.log(`TOKENS: ${r.tokensBefore} -> ${r.tokensAfter} (${r.percentSaved}%)`);
  console.log(`LATENCY: ${r.latencyMs}ms`);
  console.log("OPTIMIZED:", r.optimizedPrompt);
  console.log("CHANGES:", meta.changes);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});