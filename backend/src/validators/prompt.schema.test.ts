import { describe, it, expect } from "vitest";
import { analyzeRequestSchema, rerunRequestSchema } from "./prompt.schema";
import { AnswersBodySchema } from "../schemas/stages.schema";

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

describe("rerunRequestSchema", () => {
  it("accepts a valid stage", () => {
    expect(rerunRequestSchema.safeParse({ fromStage: "requirements" }).success).toBe(true);
  });

  it("rejects an unknown stage", () => {
    expect(rerunRequestSchema.safeParse({ fromStage: "foo" }).success).toBe(false);
  });

  it("rejects a missing stage", () => {
    expect(rerunRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("AnswersBodySchema", () => {
  it("accepts and trims an answer", () => {
    const r = AnswersBodySchema.safeParse({ answers: [{ questionId: "q1", answer: "  React  " }] });
    expect(r.success && r.data.answers[0].answer).toBe("React");
  });

  it("rejects an empty answers array", () => {
    expect(AnswersBodySchema.safeParse({ answers: [] }).success).toBe(false);
  });

  it("rejects a missing questionId", () => {
    expect(AnswersBodySchema.safeParse({ answers: [{ answer: "x" }] }).success).toBe(false);
  });

  it("rejects an answer over 1000 characters", () => {
    const r = AnswersBodySchema.safeParse({ answers: [{ questionId: "q1", answer: "a".repeat(1001) }] });
    expect(r.success).toBe(false);
  });
});