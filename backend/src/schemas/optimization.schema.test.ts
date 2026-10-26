import { describe, it, expect } from "vitest";
import { OptimizationSchema } from "./optimization.schema";

const parse = (optimizedPrompt: string) =>
  OptimizationSchema.safeParse({ optimizedPrompt, changes: [] });

describe("OptimizationSchema: third-person author check", () => {
  it("rejects 'the user wants ...'", () => {
    expect(parse("The user wants a signup page.").success).toBe(false);
  });

  it("rejects 'the user is a beginner'", () => {
    expect(parse("The user is a beginner who needs help.").success).toBe(false);
  });

  it("rejects 'the user's goal'", () => {
    expect(parse("Help with the user's goal of building a site.").success).toBe(false);
  });

  it("allows product wording like 'the user's email'", () => {
    expect(parse("Design a signup page that validates the user's email.").success).toBe(true);
  });

  it("allows 'when the user submits the form'", () => {
    expect(parse("Show an error when the user submits an empty form.").success).toBe(true);
  });

  it("rejects an empty prompt", () => {
    expect(parse("").success).toBe(false);
  });
});