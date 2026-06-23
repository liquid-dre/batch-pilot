import { describe, it, expect } from "vitest";
import {
  vsBenchmark,
  vsBenchmarkFromPct,
  formatGap,
  compactGap,
} from "@/lib/weightCompare";

describe("weight-vs-benchmark comparison", () => {
  it("computes the gap below target (grams + percentage)", () => {
    // 1401 g actual vs 1490 g Ross objective → 89 g below, ~6.0%
    const v = vsBenchmark(1401, 1490);
    expect(v.diffG).toBe(-89);
    expect(v.diffPct).toBe(-6); // -89 / 1490 = -5.97% → -6.0
    expect(v.direction).toBe("below");
  });

  it("computes the gap above target", () => {
    const v = vsBenchmark(1550, 1490);
    expect(v.diffG).toBe(60);
    expect(v.direction).toBe("above");
  });

  it("reports on-target exactly", () => {
    expect(vsBenchmark(1490, 1490).direction).toBe("on");
  });

  it("guards divide-by-zero when there is no target", () => {
    expect(vsBenchmark(1401, 0).diffPct).toBe(0);
  });

  it("reconstructs the target from a percentage-of-target figure", () => {
    // 94% of target with actual 1401 → target ≈ 1490
    const v = vsBenchmarkFromPct(1401, 94);
    expect(v.diffG).toBeLessThan(0);
    expect(Math.abs(v.diffG)).toBeGreaterThan(80);
  });

  it("formats the verbose gap per mode (difference is the default elsewhere)", () => {
    const v = vsBenchmark(1401, 1490);
    expect(formatGap(v, "difference")).toBe("89 g below target");
    expect(formatGap(v, "percentage")).toBe("6% below target");
    expect(formatGap(vsBenchmark(1490, 1490), "difference")).toBe("On target");
  });

  it("formats a compact signed gap for table cells", () => {
    const below = vsBenchmark(1401, 1490);
    expect(compactGap(below, "difference")).toBe("−89 g");
    expect(compactGap(below, "percentage")).toBe("−6%");
    const above = vsBenchmark(1550, 1490);
    expect(compactGap(above, "difference")).toBe("+60 g");
  });
});
