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

// What the LLM returns (no ids; the server adds them)
export const MissingInfoSchema = z.object({
  items: z.array(z.object({
    question: z.string().min(1),
    importance: z.enum(["high", "medium", "low"]),
    suggestedAnswers: z.array(z.string()).max(4).optional(), // optional chips in the UI
  })).max(5),
});

// What gets saved in the DB and sent to the UI: same items plus a stable id
export const MissingInfoStoredSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    question: z.string(),
    importance: z.enum(["high", "medium", "low"]),
    suggestedAnswers: z.array(z.string()).optional(),
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

// Request body for POST /api/prompts/:id/answers
export const AnswersBodySchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().min(1),
    answer: z.string().trim().max(1000),
  })).min(1),
});

export type IntentOutput = z.infer<typeof IntentSchema>;
export type RequirementsOutput = z.infer<typeof RequirementsSchema>;
export type MissingInfoOutput = z.infer<typeof MissingInfoSchema>;
export type MissingInfoStored = z.infer<typeof MissingInfoStoredSchema>;
export type RedundancyOutput = z.infer<typeof RedundancySchema>;
export type TaskStructureOutput = z.infer<typeof TaskStructureSchema>;
export type AnswersBody = z.infer<typeof AnswersBodySchema>;