import { z } from "zod";

export const IntentSchema = z.object({
  category: z.enum(["coding", "writing", "analysis", "explanation", "data", "other"]),
  primaryGoal: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const RequirementsSchema = z.object({
  explicit: z.array(z.string()),
  implicit: z.array(z.string()),
});

export const MissingInfoSchema = z.object({
  items: z.array(z.object({
    question: z.string(),
    importance: z.enum(["high", "medium", "low"]),
  })),
});

export const RedundancySchema = z.object({
  items: z.array(z.object({
    text: z.string(),    // exact phrase from the raw prompt
    reason: z.string(),
  })),
});

export const TaskStructureSchema = z.object({
  role: z.string(),
  context: z.string(),
  constraints: z.array(z.string()),
  outputFormat: z.string(),
});

export type IntentOutput = z.infer<typeof IntentSchema>;
export type RequirementsOutput = z.infer<typeof RequirementsSchema>;
export type MissingInfoOutput = z.infer<typeof MissingInfoSchema>;
export type RedundancyOutput = z.infer<typeof RedundancySchema>;
export type TaskStructureOutput = z.infer<typeof TaskStructureSchema>;