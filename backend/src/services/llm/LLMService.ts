// # interface + shared types
import { z } from "zod";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LLMResult<T> {
  data: T;
  usage: TokenUsage;
  model: string;
  latencyMs: number;
}

export interface GenerateJSONArgs<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  stage?: string;
  maxOutputTokens?: number;
}

export interface LLMService {
  generateJSON<T>(args: GenerateJSONArgs<T>): Promise<LLMResult<T>>;
  countTokens(text: string): Promise<number>;
}