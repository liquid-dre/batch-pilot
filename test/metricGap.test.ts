import { describe, it, expect } from "vitest";
import { metricGap, formatMetricGap, signedMetricGap } from "@/lib/metricGap";

/**
 * One toggle drives all four on-track cards, so the gap math has to phrase every
 * metric's unit correctly in both difference and percentage mode.
 */
describe("metricGap", () => {
  it("computes diff, %, and direction", () => {
    expect(metricGap(1480, 1616)).toEqual({ diff: -136, diffPct: -8.4, direction: "below" });
    expect(metricGap(1700, 1616).direction).toBe("above");
    expect(metricGap(1616, 1616)).toEqual({ diff: 0, diffPct: 0, direction: "on" });
  });
});

describe("formatMetricGap — verbose, unit-aware", () => {
  const g = metricGap(1480, 1616);
  it("weight in grams vs %", () => {
    expect(formatMetricGap(g, "difference", "g", "target")).toBe("136 g below the target");
    expect(formatMetricGap(g, "percentage", "g", "target")).toBe("8.4% below the target");
  });
  it("mortality in percentage points, named 'band'", () => {
    const m = metricGap(3.1, 2.8);
    expect(formatMetricGap(m, "difference", "pp", "band")).toBe("0.30 pp above the band");
  });
  it("FCR in ratio points", () => {
    const f = metricGap(1.35, 1.27);
    expect(formatMetricGap(f, "difference", "ratio", "target")).toBe("0.08 above the target");
  });
  it("on-target reads plainly", () => {
    expect(formatMetricGap(metricGap(100, 100), "difference", "g", "guide")).toBe("on the guide");
  });
});

describe("signedMetricGap — compact chip", () => {
  it("signs the magnitude, toggles unit vs %", () => {
    const g = metricGap(1480, 1616);
    expect(signedMetricGap(g, "difference", "g")).toBe("−136 g");
    expect(signedMetricGap(g, "percentage", "g")).toBe("−8.4%");
    expect(signedMetricGap(metricGap(1.35, 1.27), "difference", "ratio")).toBe("+0.08");
  });
});
