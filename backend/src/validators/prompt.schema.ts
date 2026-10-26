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

// NEW: used by GET /:id/stages/:stageName and POST /:id/rerun
export const stageNameSchema = z.enum([
  "intent",
  "requirements",
  "missingInfo",
  "redundancy",
  "taskStructure",
  "optimize",
]);

// NEW: body of POST /:id/rerun
export const rerunRequestSchema = z.object({
  fromStage: stageNameSchema,
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;
export type RerunRequest = z.infer<typeof rerunRequestSchema>;