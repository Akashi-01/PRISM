import { z } from "zod";

export const AnalysisSchema = z.object({
  intent: z.object({
    summary: z.string(),
    category: z.enum(["coding", "writing", "analysis", "summarization", "qa", "creative", "other"]),
  }),
  requirements: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["explicit", "implicit"]),
    })
  ),
  missingInfo: z.array(
    z.object({
      item: z.string(),
      why: z.string(),
    })
  ),
  redundancies: z.array(
    z.object({
      text: z.string(),
      reason: z.string(),
    })
  ),
});

export type Analysis = z.infer<typeof AnalysisSchema>;