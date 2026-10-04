import { z } from "zod";

export const analyzeRequestSchema = z.object({
  prompt: z
    .string({ error: "Prompt is required" })
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(8000, "Prompt must be at most 8000 characters"),
});

export const optimizeRequestSchema = z.object({
  prompt: z
    .string({ error: "Prompt is required" })
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(8000, "Prompt must be at most 8000 characters"),
  analysis: z.any().optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;