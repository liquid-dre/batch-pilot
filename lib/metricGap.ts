/**
 * Per-metric gap phrasing for the dashboard on-track cards. The weight gap has
 * its own module (`lib/weightCompare.ts`, grams-only); this generalises the same
 * difference⇄percentage idea to the other dashboard metrics — mortality
 * (percentage points), FCR (ratio points) and feed (g/bird) — so one
 * `BenchmarkToggle` drives all four cards. Pure, unit-tested.
 */
import { num } from "@/lib/format";
import type { WeightCompareMode } from "@/lib/weightCompare";

export type GapUnit = "g" | "pp" | "ratio" | "gPerBird";

export interface MetricGapValue {
  /** actual − target (unrounded). */
  diff: number;
  /** (actual − target) / target × 100, 1 dp. */
  diffPct: number;
  direction: "above" | "below" | "on";
}

export function metricGap(actual: number, target: number): MetricGapValue {
  const diff = actual - target;
  const diffPct = target ? Number(((diff / target) * 100).toFixed(1)) : 0;
  const eps = 1e-6;
  const direction = diff > eps ? "above" : diff < -eps ? "below" : "on";
  return { diff, diffPct, direction };
}

function absUnit(diff: number, unit: GapUnit): string {
  const a = Math.abs(diff);
  switch (unit) {
    case "g":
      return `${num(Math.round(a))} g`;
    case "gPerBird":
      return `${num(Math.round(a))} g/bird`;
    case "pp":
      return `${a.toFixed(2)} pp`;
    case "ratio":
      return a.toFixed(2);
  }
}

/** Verbose: "89 g below the target" / "6.4% below the band". `targetWord` names the reference. */
export function formatMetricGap(
  g: MetricGapValue,
  mode: WeightCompareMode,
  unit: GapUnit,
  targetWord = "target",
): string {
  if (g.direction === "on") return `on the ${targetWord}`;
  const mag = mode === "difference" ? absUnit(g.diff, unit) : `${Math.abs(g.diffPct)}%`;
  return `${mag} ${g.direction} the ${targetWord}`;
}

/** Compact signed chip: "−89 g" / "+0.08" / "−6.4%" (U+2212 minus, matches our numeric set). */
export function signedMetricGap(g: MetricGapValue, mode: WeightCompareMode, unit: GapUnit): string {
  if (g.direction === "on") return mode === "difference" ? absUnit(0, unit) : "0%";
  const sign = g.diff > 0 ? "+" : "−";
  const mag = mode === "difference" ? absUnit(g.diff, unit) : `${Math.abs(g.diffPct)}%`;
  return `${sign}${mag}`;
}
