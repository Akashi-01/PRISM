import { env } from "../../config/env";
import type { LLMService } from "./LLMService";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";

function createProvider(): LLMService {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER}`);
  }
}

console.log(`[llm] provider=${env.LLM_PROVIDER}`);

export const llm: LLMService = createProvider();