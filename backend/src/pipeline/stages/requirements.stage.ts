import { RequirementsSchema, type RequirementsOutput } from "../../schemas/stages.schema";
import type { StageDef } from "../types";

export const requirementsStage: StageDef<RequirementsOutput> = {
  name: "requirements",
  schema: RequirementsSchema,
  system: `You extract requirements from a user's prompt.
Return ONLY JSON: {"explicit": string[], "implicit": string[]}
Rules:
- explicit: things the prompt directly asks for.
- implicit: only things that are logically unavoidable for the task to make sense
  (e.g. the target language when it is named). If unsure, return an empty array.
- Requirements describe WHAT the user needs, never HOW to solve it.
  Do not name technologies, tools, platforms, hosting, or services unless the prompt names them.
  If the user asks you to recommend something, that is an explicit requirement
  ("recommend technologies"), not something to fill in yourself.
- Never add topics, prerequisites, sections, or content the user did not ask for.
- Do NOT add quality suggestions, best practices, documentation, error handling or testing
  unless the prompt mentions them.
- Keep each item short (under 15 words).`,
  buildInput: ({ rawPrompt, results }) => `Prompt:\n"""${rawPrompt}"""

Intent: ${JSON.stringify(results.intent)}`,
};