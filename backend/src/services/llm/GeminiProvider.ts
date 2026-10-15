import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "../../config/env";
import type { LLMService, LLMResult, GenerateJSONArgs, TokenUsage } from "./LLMService";
import { withRetry, isRetryable } from "../../utils/withRetry";

export class LLMError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "LLMError";
  }
}

const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 40000);
const MAX_ATTEMPTS = Number(process.env.LLM_MAX_ATTEMPTS ?? 3);

export class GeminiProvider implements LLMService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(model: string = env.GEMINI_MODEL) {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.model = model;
  }

  async generateJSON<T>(args: GenerateJSONArgs<T>): Promise<LLMResult<T>> {
    const { systemPrompt, schema, stage = "llm", maxOutputTokens } = args;
    const started = Date.now();
    const total: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    let userPrompt = args.userPrompt;
    let lastError = "";

    // Up to 2 rounds: normal call, then one repair call if the output is invalid
    for (let round = 1; round <= 2; round++) {
      const { response, usedModel } = await this.callWithFallback(
        systemPrompt,
        userPrompt,
        schema,
        stage,
        maxOutputTokens
      );

      const u = response.usageMetadata;
      total.inputTokens += u?.promptTokenCount ?? 0;
      total.outputTokens += u?.candidatesTokenCount ?? 0;
      total.totalTokens += u?.totalTokenCount ?? 0;

      const rawText = response.text;
      if (!rawText) {
        lastError = "empty response";
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(this.stripCodeFences(rawText));
      } catch {
        lastError = `invalid JSON: ${rawText.slice(0, 200)}`;
        userPrompt = this.repairPrompt(args.userPrompt, lastError);
        continue;
      }

      const validated = schema.safeParse(json);
      if (!validated.success) {
        lastError = `schema validation failed: ${JSON.stringify(z.treeifyError(validated.error))}`.slice(0, 600);
        userPrompt = this.repairPrompt(args.userPrompt, lastError);
        continue;
      }

      const latencyMs = Date.now() - started;
      console.log(`[${stage}] total ${(latencyMs / 1000).toFixed(1)}s repairRounds=${round - 1}`);
      return { data: validated.data, usage: total, model: usedModel, latencyMs };
    }

    throw new LLMError(`Gemini output invalid after repair attempt (${stage}): ${lastError}`);
  }

  private repairPrompt(original: string, error: string): string {
    return `${original}\n\nYour previous output was invalid (${error}).\nReturn only valid JSON matching the schema.`;
  }

  // Retry primary model; if it still fails with a transient error, try the fallback model
  private async callWithFallback<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    stage: string,
    maxOutputTokens?: number
  ) {
    const run = (model: string, attempts: number) =>
      withRetry(
        (signal) => this.callOnce(model, systemPrompt, userPrompt, schema, stage, maxOutputTokens, signal),
        attempts,
        stage,
        { timeoutMs: TIMEOUT_MS }
      );

    try {
      const primaryAttempts = env.GEMINI_FALLBACK_MODEL ? 1 : MAX_ATTEMPTS;
      return { response: await run(this.model, primaryAttempts), usedModel: this.model };
    } catch (err: any) {
      if (isRetryable(err) && env.GEMINI_FALLBACK_MODEL) {
        console.warn(`[${stage}] primary failed, using fallback model`);
        try {
          const usedModel = env.GEMINI_FALLBACK_MODEL;
          return { response: await run(usedModel, 2), usedModel };
        } catch (err2) {
          throw new LLMError("Gemini API call failed (primary and fallback)", err2);
        }
      }
      throw new LLMError("Gemini API call failed", err);
    }
  }

  private async callOnce<T>(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    stage: string,
    maxOutputTokens: number | undefined,
    signal: AbortSignal
  ) {
    const t0 = Date.now();
    const response = await this.ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0.2,
        maxOutputTokens,
        abortSignal: signal,
        thinkingConfig: { thinkingLevel: "low" } as any, // 2.5 models: { thinkingBudget: 0 }
      },
    });
    const u = response.usageMetadata;
    console.log(
      `[${stage}] call ${((Date.now() - t0) / 1000).toFixed(1)}s in=${u?.promptTokenCount} ` +
      `out=${u?.candidatesTokenCount} thoughts=${u?.thoughtsTokenCount ?? 0} model=${model}`
    );
    return response;
  }

  async countTokens(text: string): Promise<number> {
    try {
      const res = await withRetry(
        (signal) =>
          this.ai.models.countTokens({
            model: this.model,
            contents: text,
            config: { abortSignal: signal },
          }),
        MAX_ATTEMPTS,
        "countTokens",
        { timeoutMs: TIMEOUT_MS }
      );
      return res.totalTokens ?? 0;
    } catch (err) {
      throw new LLMError("Gemini countTokens failed", err);
    }
  }

  // Safety net in case the model wraps JSON in ```json fences
  private stripCodeFences(text: string): string {
    return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
}