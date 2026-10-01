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
}

export interface LLMService {
  generateJSON<T>(args: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
  }): Promise<LLMResult<T>>;

  countTokens(text: string): Promise<number>;
}