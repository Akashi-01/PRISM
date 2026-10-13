import { describe, it, expect } from "vitest";
import { OptimizationSchema } from "./optimization.schema";

describe("OptimizationSchema", () => {
  it("accepts a valid optimization", () => {
    const r = OptimizationSchema.safeParse({
      optimizedPrompt: "Write a polite leave email to my manager.",
      changes: ["Removed filler", "Kept the tone"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects a missing changes list", () => {
    expect(OptimizationSchema.safeParse({ optimizedPrompt: "x" }).success).toBe(false);
  });

  it("rejects a non-string optimizedPrompt", () => {
    expect(OptimizationSchema.safeParse({ optimizedPrompt: 5, changes: [] }).success).toBe(false);
  });
});