import { analyzePrompt } from "./llm/analyze.service";
import { optimizePrompt } from "./llm/optimize.service";
import { GeminiProvider } from "./llm/GeminiProvider";

const llm = new GeminiProvider();

export async function runPipeline(rawPrompt: string) {
  const analyzed = await analyzePrompt(rawPrompt);
  const optimized = await optimizePrompt(rawPrompt, analyzed.analysis);

  const tokensBefore = await llm.countTokens(rawPrompt);
  const tokensAfter = await llm.countTokens(optimized.optimization.optimizedPrompt);
  const percentSaved =
    tokensBefore > 0 ? ((tokensBefore - tokensAfter) / tokensBefore) * 100 : 0;

  return {
    rawPrompt,
    analysis: analyzed.analysis,
    optimizedPrompt: optimized.optimization.optimizedPrompt,
    changes: optimized.optimization.changes,
    tokensBefore,
    tokensAfter,
    percentSaved: Math.round(percentSaved * 10) / 10,
    usage: { analyze: analyzed.usage, optimize: optimized.usage },
    model: optimized.model,
  };
}