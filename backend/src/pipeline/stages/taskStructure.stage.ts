import { TaskStructureSchema, type TaskStructureOutput } from "../../schemas/stages.schema";
import type { StageDef } from "../types";

export const taskStructureStage: StageDef<TaskStructureOutput> = {
  name: "taskStructure",
  schema: TaskStructureSchema,
    system: `You turn a prompt analysis into a structured skeleton for a better prompt.
Return ONLY JSON:
{"role": string, "context": string, "constraints": string[], "outputFormat": string}
Rules:
- role: the expert persona best suited to the task.
- context: background facts stated in the prompt (who the user is, their level, their situation),
  written in the user's voice or as neutral facts. Do not restate the task itself.
  Use an empty string if the prompt gives no background.
- constraints: only rules the user explicitly stated that limit HOW the task is done
  (language, length, style, cost limits, things to avoid). Never restate the task itself.
  Use an empty array if the prompt states none.
- outputFormat: describe only the kind of answer the user asked for
  (e.g. "step-by-step guide with technology recommendations").
  Do not list specific technologies, topics, or extra sections the user did not ask for.
- context and constraints must contain ONLY things the user stated. Do not add negative rules
  ("do not assume...") and never claim the user requested something they did not.
- Where essential information is missing, use a short [placeholder]. Maximum 2 placeholders in total.`,
  buildInput: ({ rawPrompt, results }) => `Prompt:\n"""${rawPrompt}"""

Intent: ${JSON.stringify(results.intent)}
Requirements: ${JSON.stringify(results.requirements)}
Missing info: ${JSON.stringify(results.missingInfo)}`,
};