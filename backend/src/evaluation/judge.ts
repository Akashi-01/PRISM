import { z } from "zod";
import { judgeLLM } from "../services/llm";
import { RUBRIC_TEXT } from "./rubric";

const score = z.number().int().min(1).max(5);

// rationale comes first on purpose: the model reasons before it scores
export const JudgeSchema = z.object({
  rationale: z.string().min(1),
  relevance: score,
  completeness: score,
  instructionFollowing: score,
  formatCorrectness: score,
});
export type JudgeOutput = z.infer<typeof JudgeSchema>;

const SYSTEM = `You are a strict, impartial evaluator of AI assistant responses.
You are given a task and ONE response to it. Score the response against the task using the rubric.
Rules:
- Judge only how well the response does what the task asks. Do not reward length, politeness or extra content the task did not ask for.
- Do not assume anything about how the response was produced.
- First write a short rationale (2-4 sentences) naming specific strengths and gaps, then the scores.

${RUBRIC_TEXT}

Return ONLY JSON: {"rationale": string, "relevance": 1-5, "completeness": 1-5, "instructionFollowing": 1-5, "formatCorrectness": 1-5}`;

export function judgeResponse(args: { rawPrompt: string; response: string }) {
  return judgeLLM.generateJSON({
    stage: "judge",
    systemPrompt: SYSTEM,
    userPrompt: `Task:\n"""${args.rawPrompt}"""\n\nResponse to evaluate:\n"""${args.response}"""`,
    schema: JudgeSchema,
    maxOutputTokens: 600,
  });
}