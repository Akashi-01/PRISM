import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "../../config/env";
import type { LLMService, LLMResult } from "./LLMService";

export class LLMError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "LLMError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retries only on 503 (overloaded) and 429 (rate limit)
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const retryable = err?.status === 503 || err?.status === 429;
      if (!retryable || attempt === retries) break;
      await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
  throw lastErr;
}

export class GeminiProvider implements LLMService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(model: string = env.GEMINI_MODEL) {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.model = model;
  }

  async generateJSON<T>(args: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
  }): Promise<LLMResult<T>> {
    const { systemPrompt, userPrompt, schema } = args;

    // 1. Call Gemini (retry, then fall back to a second model)
    const call = (model: string) =>
      withRetry(() =>
        this.ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(schema),
            temperature: 0.2,
          },
        })
      );

    let response;
    let usedModel = this.model;
    try {
      response = await call(this.model);
    } catch (err: any) {
      if ((err?.status === 503 || err?.status === 429) && env.GEMINI_FALLBACK_MODEL) {
        try {
          usedModel = env.GEMINI_FALLBACK_MODEL;
          response = await call(usedModel);
        } catch (err2) {
          throw new LLMError("Gemini API call failed (primary and fallback)", err2);
        }
      } else {
        throw new LLMError("Gemini API call failed", err);
      }
    }

    // 2. Parse the JSON text
    const rawText = response.text;
    if (!rawText) {
      throw new LLMError("Gemini returned an empty response");
    }

    let json: unknown;
    try {
      json = JSON.parse(this.stripCodeFences(rawText));
    } catch (err) {
      throw new LLMError(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`, err);
    }

    // 3. Validate with Zod
    const validated = schema.safeParse(json);
    if (!validated.success) {
      throw new LLMError(
        `Response failed schema validation: ${JSON.stringify(z.treeifyError(validated.error))}`,
        validated.error
      );
    }

    // 4. Read token usage
    const usage = response.usageMetadata;
    return {
      data: validated.data,
      usage: {
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
      },
      model: usedModel,
    };
  }

  async countTokens(text: string): Promise<number> {
  try {
    const res = await withRetry(() =>
      this.ai.models.countTokens({ model: this.model, contents: text })
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