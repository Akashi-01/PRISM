import { env } from "../../config/env";
import type { LLMService } from "./LLMService";
import { GeminiProvider } from "./GeminiProvider";

function createProvider(): LLMService {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      // Week 2: return new GroqProvider();
      throw new Error("Groq provider is not implemented yet");
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER}`);
  }
}

export const llm: LLMService = createProvider();