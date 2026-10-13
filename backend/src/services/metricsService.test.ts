import { describe, it, expect } from "vitest";
import { computeSavings } from "./metricsService";

describe("computeSavings", () => {
  it("computes savings for a normal case", () => {
    expect(computeSavings(100, 60)).toEqual({
      tokensBefore: 100,
      tokensAfter: 60,
      tokensSaved: 40,
      percentSaved: 40,
    });
  });

  it("rounds to one decimal place", () => {
    expect(computeSavings(101, 40).percentSaved).toBe(60.4);
  });

  it("returns 0 when nothing changed", () => {
    const r = computeSavings(50, 50);
    expect(r.tokensSaved).toBe(0);
    expect(r.percentSaved).toBe(0);
  });

  it("gives negative savings when the prompt grows", () => {
    const r = computeSavings(78, 81);
    expect(r.tokensSaved).toBe(-3);
    expect(r.percentSaved).toBe(-3.8);
  });

  it("does not divide by zero", () => {
    expect(computeSavings(0, 10).percentSaved).toBe(0);
  });
});