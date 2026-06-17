import { describe, it, expect } from "vitest";
import { dailyTotals } from "@/lib/calc";

describe("dailyTotals (the morning cumulative maths)", () => {
  it("adds today's deaths + culls and carries the running total", () => {
    const t = dailyTotals({ placed: 16000, priorCumMort: 120, mortality: 8, culls: 2 });
    expect(t.cullAndMort).toBe(10);
    expect(t.cumMort).toBe(130);
    expect(t.birdsRemaining).toBe(16000 - 130);
    expect(t.cumPct).toBe(0.81); // 130 / 16000 = 0.8125 → 0.81 to 2dp
  });

  it("is all zeros on a clean day-one with no losses", () => {
    expect(dailyTotals({ placed: 16000, priorCumMort: 0, mortality: 0, culls: 0 })).toEqual({
      cullAndMort: 0,
      cumMort: 0,
      birdsRemaining: 16000,
      cumPct: 0,
    });
  });

  it("rounds cumulative % to two decimals", () => {
    // 1 / 3 placed = 33.333% → 33.33
    expect(dailyTotals({ placed: 3, priorCumMort: 0, mortality: 1, culls: 0 }).cumPct).toBe(33.33);
  });

  it("guards against divide-by-zero when nothing was placed", () => {
    expect(dailyTotals({ placed: 0, priorCumMort: 0, mortality: 5, culls: 0 }).cumPct).toBe(0);
  });
});
