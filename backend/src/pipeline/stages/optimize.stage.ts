import { OptimizationSchema } from "../../schemas/optimization.schema";
import type { z } from "zod";
import type { StageDef } from "../types";

type OptimizationOutput = z.infer<typeof OptimizationSchema>;

export const optimizeStage: StageDef<OptimizationOutput> = {
  name: "optimize",
  schema: OptimizationSchema,
    system: `You rewrite a prompt so it is clearer and shorter without losing meaning.
Return ONLY JSON: {"optimizedPrompt": string}

Preservation rules (strict, they override everything below):
- Never remove or paraphrase content the task operates on: quoted text, pasted data, code, numbers, names and lists. Copy it word for word.
- Keep every explicit output-format and length requirement exactly as given (for example "numbered list", "5 bullets", "under 120 words", "JSON").
- Do not invent details the user did not give.
- Do not turn the task into a request for clarification. The optimized prompt must be directly executable as it stands.
- If the prompt is already short and well structured and nothing in it is redundant, return it unchanged.

Rewriting rules:
- Build the prompt from the provided skeleton: Role, Context, Constraints, Output format.
- Remove the listed redundant phrases.
- Keep every requirement from the original prompt.
- Do not add technologies, tools, services, requirements, constraints or formats that are not in the original prompt or the skeleton.
- If the skeleton contains a [placeholder] and one of my answers fills it, replace the placeholder with my answer. Otherwise delete the placeholder and the phrase around it. Never leave a [placeholder] in the result.
- The result should be shorter than the original whenever possible.
- Write in the same voice as the original (usually first person, "I want...", "Help me..."). Never write "the user", "the person" or "they" for the author. Give the model its role in one short sentence only if it adds something. You may drop the role line, but never drop the context.
- Keep every fact about my background, skill level and situation from the skeleton's context.
- Do not say the same thing twice. If the task already implies the output format, skip the output-format line.
- If "Answers I gave to clarifying questions" are provided, they are facts about me. Work them into the prompt in first person ("I am...", "I need..."), even though they are not in the skeleton. Including my answers matters more than making the prompt shorter.`,      buildInput: ({ rawPrompt, results, clarifications }) => {
    const answered = (clarifications ?? []).filter((c) => c.answer.trim());
    const clarificationBlock = answered.length
      ? `\n\nAnswers I gave to clarifying questions (my own words, first person):\n${answered
          .map((c) => `- Q: ${c.question}\n  A: ${c.answer}`)
          .join("\n")}`
      : "";

    return `Original prompt:\n"""${rawPrompt}"""

Skeleton: ${JSON.stringify(results.taskStructure)}
Redundant phrases to remove: ${JSON.stringify(results.redundancy)}${clarificationBlock}`;
  },
};