import Groq from "groq-sdk";
import { z } from "zod";
import { getEncoding } from "js-tiktoken";
import { env } from "../../config/env";
import type { LLMService, LLMResult, GenerateJSONArgs, TokenUsage } from "./LLMService";
import { withRetry, isRetryable } from "../../utils/withRetry";
import { LLMError } from "./GeminiProvider";

const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 40000);
const MAX_ATTEMPTS = Number(process.env.LLM_MAX_ATTEMPTS ?? 3);

export class GroqProvider implements LLMService {
  private client: Groq;
  private model: string;
  private enc = getEncoding("o200k_base"); // approximation, see note below

  constructor(model: string = env.GROQ_MODEL) {
    if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing");
    this.client = new Groq({ apiKey: env.GROQ_API_KEY, maxRetries: 0 });
    this.model = model;
  }

  async generateJSON<T>(args: GenerateJSONArgs<T>): Promise<LLMResult<T>> {
    const { systemPrompt, schema, stage = "llm", maxOutputTokens } = args;
    const started = Date.now();
    const total: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    // Groq's JSON mode guarantees valid JSON, not your schema, so put the schema in the prompt
    const fullSystem =
      `${systemPrompt}\n\nRespond ONLY with a JSON object matching this JSON schema:\n` +
      JSON.stringify(z.toJSONSchema(schema));

    let userPrompt = args.userPrompt;
    let lastError = "";

    for (let round = 1; round <= 2; round++) {
      const { response, usedModel } = await this.callWithFallback(
        fullSystem, userPrompt, stage, maxOutputTokens
      );

      const u = response.usage;
      total.inputTokens += u?.prompt_tokens ?? 0;
      total.outputTokens += u?.completion_tokens ?? 0;
      total.totalTokens += u?.total_tokens ?? 0;

      const rawText = response.choices?.[0]?.message?.content;
      if (!rawText) {
        lastError = "empty response";
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(rawText);
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
      console.log(`[${stage}] total ${(latencyMs / 1000).toFixed(1)}s repairRounds=${round - 1} provider=groq`);
      return { data: validated.data, usage: total, model: usedModel, latencyMs };
    }

    throw new LLMError(`Groq output invalid after repair attempt (${stage}): ${lastError}`);
  }

  private repairPrompt(original: string, error: string): string {
    return `${original}\n\nYour previous output was invalid (${error}).\nReturn only valid JSON matching the schema.`;
  }

  private async callWithFallback(
    systemPrompt: string,
    userPrompt: string,
    stage: string,
    maxOutputTokens?: number
  ) {
    const run = (model: string, attempts: number) =>
      withRetry(
        (signal) => this.callOnce(model, systemPrompt, userPrompt, stage, maxOutputTokens, signal),
        attempts,
        stage,
        { timeoutMs: TIMEOUT_MS }
      );

    try {
      return { response: await run(this.model, MAX_ATTEMPTS), usedModel: this.model };
    } catch (err: any) {
      if (isRetryable(err) && env.GROQ_FALLBACK_MODEL) {
        console.warn(`[${stage}] groq primary failed, using fallback model`);
        try {
          const usedModel = env.GROQ_FALLBACK_MODEL;
          return { response: await run(usedModel, 2), usedModel };
        } catch (err2) {
          throw new LLMError("Groq API call failed (primary and fallback)", err2);
        }
      }
      throw new LLMError("Groq API call failed", err);
    }
  }

  private async callOnce(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    stage: string,
    maxOutputTokens: number | undefined,
    signal: AbortSignal
  ) {
    const t0 = Date.now();
    const response = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_completion_tokens: maxOutputTokens ? Math.round(maxOutputTokens * 1.5) : undefined,
        reasoning_effort: "low",
      } as any,
      { signal }
    );
    const u = response.usage;
    console.log(
      `[${stage}] call ${((Date.now() - t0) / 1000).toFixed(1)}s in=${u?.prompt_tokens} out=${u?.completion_tokens} model=${model}`
    );
    return response;
  }

  // Groq has no count-tokens endpoint, so this is a local estimate
  async countTokens(text: string): Promise<number> {
    return this.enc.encode(text).length;
  }
}