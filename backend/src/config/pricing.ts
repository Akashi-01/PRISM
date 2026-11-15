// USD per 1M tokens. Fill these from the providers' pricing pages and update the date.
// On the free tier you pay $0, so we report the list-price equivalent.
export const PRICING_CHECKED_ON = "2026-11-12";

export const PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-oss-120b": { input: 0.15, output: 0.6 },
  "openai/gpt-oss-20b": { input: 0.075, output: 0.3 },
  "gemini-3.5-flash": { input: 1.5, output: 9 },
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.5 },
};