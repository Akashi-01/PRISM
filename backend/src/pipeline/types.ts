import type { z } from "zod";
import type { LLMService } from "../services/llm/LLMService";
import type { IntentOutput, RequirementsOutput, MissingInfoStored,
  RedundancyOutput, TaskStructureOutput } from "../schemas/stages.schema";

export type StageName =
  | "intent" | "requirements" | "missingInfo"
  | "redundancy" | "taskStructure" | "optimize";

export interface Clarification {
  questionId: string;
  question: string;
  answer: string;
}

export interface PipelineContext {
  rawPrompt: string;
  clarifications?: Clarification[];
  llm?: LLMService;   // provider client for this run (default: the global one)
  results: {
    intent?: IntentOutput;
    requirements?: RequirementsOutput;
    missingInfo?: MissingInfoStored;
    redundancy?: RedundancyOutput;
    taskStructure?: TaskStructureOutput;
  };
}

export interface StageDef<T> {
  name: StageName;
  system: string;
  schema: z.ZodType<T>;
  buildInput: (ctx: PipelineContext) => string;
  maxOutputTokens?: number;
}