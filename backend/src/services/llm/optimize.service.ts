import { OptimizationSchema } from "../../schemas/optimization.schema";
import type { Analysis } from "../../schemas/analysis.schema";
import { OPTIMIZE_SYSTEM, buildOptimizeInput } from "../../prompts/optimize.prompt";
import { llm } from "./index";

export async function optimizePrompt(rawPrompt: string, analysis: Analysis) {
  const runOnce = () =>
    llm.generateJSON({
      systemPrompt: OPTIMIZE_SYSTEM,
      userPrompt: buildOptimizeInput(rawPrompt, analysis),
      schema: OptimizationSchema,
      stage: "optimize",
    });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await runOnce();
      return { optimization: result.data, usage: result.usage, model: result.model };
    } catch (e) {
      console.error(`Optimize attempt ${attempt + 1} failed:`, e);
      if (attempt === 1) throw e;
    }
  }
  throw new Error("Optimize failed");
}