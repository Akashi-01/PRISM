import { AnalysisSchema } from "../../schemas/analysis.schema";
import { ANALYZE_SYSTEM, buildAnalyzeInput } from "../../prompts/analyze.prompt";
import { GeminiProvider } from "./GeminiProvider";

const llm = new GeminiProvider();

export async function analyzePrompt(rawPrompt: string) {
  const runOnce = () =>
    llm.generateJSON({
      systemPrompt: ANALYZE_SYSTEM,
      userPrompt: buildAnalyzeInput(rawPrompt),
      schema: AnalysisSchema,
    });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await runOnce();
      return {
        analysis: result.data, // already typed as Analysis via the schema
        usage: result.usage,   // { inputTokens, outputTokens, totalTokens }
        model: result.model,
      };
    } catch (e) {
      console.error(`Analyze attempt ${attempt + 1} failed:`, e);
      if (attempt === 1) throw e;
    }
  }

  throw new Error("Analyze failed"); // unreachable, satisfies TypeScript
}