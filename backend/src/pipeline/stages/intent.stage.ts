import { IntentSchema, type IntentOutput } from "../../schemas/stages.schema";
import type { StageDef } from "../types";

export const intentStage: StageDef<IntentOutput> = {
  name: "intent",
  schema: IntentSchema,
  system: `You classify the intent of a user's prompt written for an LLM.
Return ONLY JSON in this shape:
{"category": "coding" | "writing" | "analysis" | "explanation" | "data" | "other",
 "primaryGoal": string,
 "confidence": number between 0 and 1}
Rules:
- primaryGoal is one sentence describing what the user wants done.
- Base the answer only on what the prompt says.`,
  buildInput: ({ rawPrompt }) => `Prompt:\n"""${rawPrompt}"""`,
};