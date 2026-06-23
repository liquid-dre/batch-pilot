/**
 * Weight-vs-benchmark comparison (ROADMAP §8 — manager profile).
 *
 * Anywhere BatchPilot shows weight against the Ross 308 objective, the gap can
 * be read two ways: as an ACTUAL NUMERICAL DIFFERENCE (the default — "89 g below
 * target") or as a PERCENTAGE ("6.4% below target"). This is the ONE place that
 * logic lives, so cards, tables and chart annotations all phrase the gap the
 * same. Pure (no React) and unit-tested; the session-remembered mode lives in
 * the client hook (components/ui/BenchmarkToggle).
 */
import { num } from "@/lib/format";

export type WeightCompareMode = "difference" | "percentage";

export interface VsBenchmark {
  /** actual − target, grams (negative = below target). */
  diffG: number;
  /** (actual − target) / target × 100, to 1 dp (negative = below). */
  diffPct: number;
  direction: "below" | "above" | "on";
}

function direction(diffG: number): VsBenchmark["direction"] {
  return diffG > 0 ? "above" : diffG < 0 ? "below" : "on";
}

/** Gap from an actual weight and the benchmark target (both grams). */
export function vsBenchmark(actualG: number, targetG: number): VsBenchmark {
  const diffG = Math.round(actualG - targetG);
  const diffPct = targetG ? Number(((diffG / targetG) * 100).toFixed(1)) : 0;
  return { diffG, diffPct, direction: direction(diffG) };
}

/**
 * Gap from an actual weight and a known percentage-of-target (e.g. a stored
 * vs-Ross figure), reconstructing the target. Lets summary surfaces that only
 * keep a % still show the grams difference, consistent with the toggle.
 */
export function vsBenchmarkFromPct(actualG: number, pctOfTarget: number): VsBenchmark {
  const targetG = pctOfTarget ? Math.round(actualG / (pctOfTarget / 100)) : actualG;
  return vsBenchmark(actualG, targetG);
}

const DIR_WORD: Record<VsBenchmark["direction"], string> = {
  below: "below target",
  above: "above target",
  on: "on target",
};

/** Verbose phrasing: "89 g below target" / "6.4% below target" / "On target". */
export function formatGap(v: VsBenchmark, mode: WeightCompareMode): string {
  if (v.direction === "on") return "On target";
  const mag = mode === "difference" ? `${num(Math.abs(v.diffG))} g` : `${Math.abs(v.diffPct)}%`;
  return `${mag} ${DIR_WORD[v.direction]}`;
}

/** Compact, signed phrasing for table cells: "−89 g" / "+120 g" / "−6.4%". */
export function compactGap(v: VsBenchmark, mode: WeightCompareMode): string {
  if (v.direction === "on") return mode === "difference" ? "0 g" : "0%";
  const sign = v.diffG > 0 ? "+" : "−"; // U+2212 minus, matches our numeric set
  return mode === "difference" ? `${sign}${num(Math.abs(v.diffG))} g` : `${sign}${Math.abs(v.diffPct)}%`;
}
