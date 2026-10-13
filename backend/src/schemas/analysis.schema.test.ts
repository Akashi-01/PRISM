import { describe, it, expect } from "vitest";
import { AnalysisSchema } from "./analysis.schema";

const valid = {
  intent: { summary: "Write a leave email", category: "writing" },
  requirements: [{ text: "Polite tone", type: "explicit" }],
  missingInfo: [{ item: "Leave dates", why: "Needed for the email" }],
  redundancies: [{ text: "I hope you are doing well", reason: "Filler" }],
};

describe("AnalysisSchema", () => {
  it("accepts a valid analysis", () => {
    expect(AnalysisSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts empty lists", () => {
    const r = AnalysisSchema.safeParse({ ...valid, requirements: [], missingInfo: [], redundancies: [] });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown category", () => {
    const bad = { ...valid, intent: { summary: "x", category: "cooking" } };
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an invalid requirement type", () => {
    const bad = { ...valid, requirements: [{ text: "x", type: "maybe" }] };
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a missing field", () => {
    const { redundancies, ...rest } = valid;
    expect(AnalysisSchema.safeParse(rest).success).toBe(false);
  });
});