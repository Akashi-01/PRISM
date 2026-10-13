import { describe, it, expect } from "vitest";
import { analyzeRequestSchema } from "./prompt.schema";

describe("analyzeRequestSchema", () => {
  it("accepts a normal prompt", () => {
    expect(analyzeRequestSchema.safeParse({ prompt: "Write an email to my manager about leave." }).success).toBe(true);
  });

  it("trims whitespace", () => {
    const r = analyzeRequestSchema.safeParse({ prompt: "   Write an email please   " });
    expect(r.success && r.data.prompt).toBe("Write an email please");
  });

  it("rejects a prompt shorter than 10 characters", () => {
    expect(analyzeRequestSchema.safeParse({ prompt: "too short" }).success).toBe(false);
  });

  it("rejects whitespace-only input", () => {
    expect(analyzeRequestSchema.safeParse({ prompt: "            " }).success).toBe(false);
  });

  it("rejects a prompt over 8000 characters", () => {
    expect(analyzeRequestSchema.safeParse({ prompt: "a".repeat(8001) }).success).toBe(false);
  });

  it("accepts exactly 8000 characters", () => {
    expect(analyzeRequestSchema.safeParse({ prompt: "a".repeat(8000) }).success).toBe(true);
  });

  it("rejects a missing prompt", () => {
    expect(analyzeRequestSchema.safeParse({}).success).toBe(false);
  });
});