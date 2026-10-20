import type { z } from "zod";
import type { IntentOutput, RequirementsOutput, MissingInfoOutput,
  RedundancyOutput, TaskStructureOutput } from "../schemas/stages.schema";

export interface PipelineContext {
  rawPrompt: string;
  results: {
    intent?: IntentOutput;
    requirements?: RequirementsOutput;
    missingInfo?: MissingInfoOutput;
    redundancy?: RedundancyOutput;
    taskStructure?: TaskStructureOutput;
  };
}

export interface StageDef<T> {
  name: "intent" | "requirements" | "missingInfo" | "redundancy" | "taskStructure" | "optimize";
  system: string;
  schema: z.ZodType<T>;
  buildInput: (ctx: PipelineContext) => string;
  maxOutputTokens?: number;
}