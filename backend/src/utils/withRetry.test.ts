import { describe, it, expect, vi } from "vitest";
import { withRetry, isRetryable, TimeoutError } from "./withRetry";

const fast = { baseDelayMs: 1, timeoutMs: 1000 };

describe("withRetry", () => {
  it("retries 503s and then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("ok");
    await expect(withRetry(fn, 3, "test", fast)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 400", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 400 });
    await expect(withRetry(fn, 3, "test", fast)).rejects.toEqual({ status: 400 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the attempt limit", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 503 });
    await expect(withRetry(fn, 3, "test", fast)).rejects.toEqual({ status: 503 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws TimeoutError when the call hangs", async () => {
    const hang = (signal: AbortSignal) =>
      new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(new Error("aborted")))
      );
    await expect(
      withRetry(hang, 1, "test", { baseDelayMs: 1, timeoutMs: 20 })
    ).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("isRetryable", () => {
  it("accepts transient errors", () => {
    expect(isRetryable({ status: 429 })).toBe(true);
    expect(isRetryable({ status: 504 })).toBe(true);
    expect(isRetryable(new Error("fetch failed"))).toBe(true);
  });
  it("rejects client errors", () => {
    expect(isRetryable({ status: 400 })).toBe(false);
    expect(isRetryable({ status: 401 })).toBe(false);
  });
});