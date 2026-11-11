import { env } from "../../config/env";
import type { LLMService } from "./LLMService";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";

const cache = new Map<string, LLMService>();

export function getProvider(name: string): LLMService {
  const cached = cache.get(name);
  if (cached) return cached;
  let p: LLMService;
  switch (name) {
    case "gemini": p = new GeminiProvider(); break;
    case "groq": p = new GroqProvider(); break;
    default: throw new Error(`Unknown provider: ${name}`);
  }
  cache.set(name, p);
  return p;
}

export const GENERATOR_PROVIDER = process.env.GENERATOR_PROVIDER ?? env.LLM_PROVIDER;
export const JUDGE_PROVIDER = process.env.JUDGE_PROVIDER ?? env.LLM_PROVIDER;

console.log(`[llm] pipeline=${env.LLM_PROVIDER} generator=${GENERATOR_PROVIDER} judge=${JUDGE_PROVIDER}`);

export const llm = getProvider(env.LLM_PROVIDER);          // pipeline stages (unchanged)
export const generatorLLM = getProvider(GENERATOR_PROVIDER);
export const judgeLLM = getProvider(JUDGE_PROVIDER);