// # Zod schemas
import { z } from "zod";

// Stage 1: Analyze
export const AnalysisSchema = z.object({
  intent: z.string(),
  requirements: z.array(z.string()),
  missingInfo: z.array(z.string()),
  redundancies: z.array(z.string()),
});

// Stage 2: Optimize
export const OptimizedPromptSchema = z.object({
  optimizedPrompt: z.string(),
  changesMade: z.array(z.string()),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type OptimizedPrompt = z.infer<typeof OptimizedPromptSchema>;