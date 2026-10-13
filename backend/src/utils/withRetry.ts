export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`LLM call timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isRetryable(err: any): boolean {
  if (err instanceof TimeoutError) return true;
  if ([429, 500, 503, 504].includes(Number(err?.status))) return true;
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(
    String(err?.message ?? "")
  );
}

// Per-attempt timeout + exponential backoff with jitter. Retries only transient errors.
// `attempts` is the TOTAL number of tries (first try included).
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  attempts = 3,
  label = "llm",
  opts: { timeoutMs?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 40000;
  const baseDelayMs = opts.baseDelayMs ?? 1000;

  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fn(controller.signal);
    } catch (e) {
      const err = controller.signal.aborted ? new TimeoutError(timeoutMs) : e;
      if (attempt >= attempts || !isRetryable(err)) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 300;
      console.warn(`[${label}] attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }
}