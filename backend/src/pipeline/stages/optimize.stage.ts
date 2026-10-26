import { OptimizationSchema } from "../../schemas/optimization.schema";
import type { z } from "zod";
import type { StageDef } from "../types";

type OptimizationOutput = z.infer<typeof OptimizationSchema>;

export const optimizeStage: StageDef<OptimizationOutput> = {
  name: "optimize",
  schema: OptimizationSchema,
  system: `You rewrite a prompt so it is clearer and shorter without losing meaning.
Return ONLY JSON: {"optimizedPrompt": string}
Rules:
- Build the prompt from the provided skeleton: Role, Context, Constraints, Output format.
- Remove the listed redundant phrases.
- Keep every requirement from the original prompt.
- Do not add technologies or requirements that are not in the skeleton.
- - Keep any [placeholder] from the skeleton as it is, unless one of my answers fills it. In that case, replace the placeholder with my answer.
- The result must be shorter than the original whenever possible.
- Write the prompt in the same voice as the original prompt (usually first person, "I want...", "Help me...").
  Never write "the user". Give the model its role in a single short sentence if useful.
- Do not name technologies, tools, or services that are not in the original prompt.
- Do not add any requirement, constraint, or format that is not in the skeleton.
- Keep it as short as possible. Keep every fact about the person's background, skill level, and situation from the skeleton's context.
  You may drop the role line if it adds nothing, but never drop the context.
- Do not say the same thing twice. If the task already implies the output format, skip the output-format line.
- If "Answers I gave to clarifying questions" are provided, they are facts about me. Work them into the prompt in first person ("I am...", "I need..."), even though they are not in the skeleton.
- Never write "the user", "the person" or "they" for the author of the prompt. Including my answers matters more than making the prompt shorter.`,
      buildInput: ({ rawPrompt, results, clarifications }) => {
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