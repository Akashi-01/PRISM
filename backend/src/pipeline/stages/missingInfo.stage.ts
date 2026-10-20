import { MissingInfoSchema, type MissingInfoOutput } from "../../schemas/stages.schema";
import type { StageDef } from "../types";

export const missingInfoStage: StageDef<MissingInfoOutput> = {
  name: "missingInfo",
  schema: MissingInfoSchema,
  system: `You find information that is missing from a prompt and that the LLM would need to answer well.
Return ONLY JSON: {"items": [{"question": string, "importance": "high" | "medium" | "low"}]}
Rules:
- Only list gaps that would change the quality of the answer.
- Phrase each as a question the user could answer.
- Return an empty items array if nothing important is missing.
- Maximum 5 items.`,
  buildInput: ({ rawPrompt, results }) => `Prompt:\n"""${rawPrompt}"""

Intent: ${JSON.stringify(results.intent)}
Requirements: ${JSON.stringify(results.requirements)}`,
};