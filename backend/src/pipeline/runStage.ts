import { llm } from "../services/llm";
import type { LLMResult } from "../services/llm/LLMService";
import type { PipelineContext, StageDef } from "./types";

export async function runStage<T>(
  stage: StageDef<T>,
  ctx: PipelineContext,
  maxAttempts = 1
): Promise<LLMResult<T>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await llm.generateJSON({
        systemPrompt: stage.system,
        userPrompt: stage.buildInput(ctx),
        schema: stage.schema,
        stage: stage.name,
        maxOutputTokens: stage.maxOutputTokens,
      });
    } catch (e) {
      lastError = e;
      console.error(`[${stage.name}] attempt ${attempt} failed:`, e);
    }
  }
  throw lastError;
}