import { z } from "zod";

export const OptimizationSchema = z.object({
  optimizedPrompt: z
    .string()
    .min(1)
    .refine((s) => !/\bthe user\b/i.test(s), {
      message: 'Do not refer to "the user"; write in the same voice as the original prompt.',
    }),
  changes: z.array(z.string()),
});

export type Optimization = z.infer<typeof OptimizationSchema>;