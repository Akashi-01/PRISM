import { z } from "zod";

export const OptimizationSchema = z.object({
  optimizedPrompt: z.string(),
  changes: z.array(z.string()), // short list of what was changed and why
});

export type Optimization = z.infer<typeof OptimizationSchema>;