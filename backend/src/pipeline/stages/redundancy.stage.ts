import { RedundancySchema, type RedundancyOutput } from "../../schemas/stages.schema";
import type { StageDef } from "../types";

export const redundancyStage: StageDef<RedundancyOutput> = {
  name: "redundancy",
  schema: RedundancySchema,
    system: `You find redundant or low-value text in a prompt.
Return ONLY JSON: {"items": [{"text": string, "reason": string}]}
Rules:
- "text" must be an exact phrase copied from the prompt.
- Flag only: greetings, filler words ("so basically", "like"), repeated words ("please please"),
  and thank-you or closing lines.
- Never flag a sentence that states a preference, skill level, or requirement
  (for example "I want it simple", "I am a beginner"), even if it repeats something said elsewhere.
- Never flag text that carries a requirement, constraint, or example.
- Return an empty items array if the prompt is already tight.`,
  buildInput: ({ rawPrompt }) => `Prompt:\n"""${rawPrompt}"""`,
};