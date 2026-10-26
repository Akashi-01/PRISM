import { z } from "zod";

// Blocks "the user wants / needs / is a beginner ...", where the model describes the author in third person.
// Allows legitimate product wording such as "the user's email" or "when the user submits the form".
const THIRD_PERSON_AUTHOR =
  /\bthe user\s+(?:wants?|needs?|asks?|asked|would|requires?|prefers?|seeks?|is an?|has asked)\b|\bthe user(?:'s|’s)\s+(?:goal|request|prompt|background|skill level|situation)\b/i;

export const OptimizationSchema = z.object({
  optimizedPrompt: z
    .string()
    .min(1)
    .refine((s) => !THIRD_PERSON_AUTHOR.test(s), {
      message:
        'Do not describe the author as "the user" (for example "the user wants..."); write in the same voice as the original prompt.',
    }),
  changes: z.array(z.string()),
});

export type Optimization = z.infer<typeof OptimizationSchema>;