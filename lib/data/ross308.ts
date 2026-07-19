import type { BenchmarkPoint, BenchmarkOverlay } from "@/lib/types";

/**
 * Ross 308 (as-hatched) performance objectives — seeded verbatim from
 * `ross308_as_hatched_benchmark.csv` at the repo root (ROADMAP §2, §7).
 * Day 0 has no gain/intake/fcr; nulls are preserved rather than zeroed so the
 * curve reads truthfully and charts can skip undefined points.
 */
export const ROSS_308_CURVE: BenchmarkPoint[] = [
  { day: 0, weightG: 44, dailyGainG: null, avgDailyGainG: null, dailyIntakeG: null, cumIntakeG: null, fcr: null },
  { day: 1, weightG: 62, dailyGainG: 18, avgDailyGainG: null, dailyIntakeG: 12, cumIntakeG: null, fcr: 0.196 },
  { day: 2, weightG: 81, dailyGainG: 19, avgDailyGainG: null, dailyIntakeG: 16, cumIntakeG: 28, fcr: 0.352 },
  { day: 3, weightG: 102, dailyGainG: 21, avgDailyGainG: null, dailyIntakeG: 20, cumIntakeG: 48, fcr: 0.476 },
  { day: 4, weightG: 125, dailyGainG: 23, avgDailyGainG: null, dailyIntakeG: 24, cumIntakeG: 72, fcr: 0.577 },
  { day: 5, weightG: 151, dailyGainG: 26, avgDailyGainG: null, dailyIntakeG: 27, cumIntakeG: 100, fcr: 0.658 },
  { day: 6, weightG: 181, dailyGainG: 29, avgDailyGainG: null, dailyIntakeG: 31, cumIntakeG: 131, fcr: 0.724 },
  { day: 7, weightG: 213, dailyGainG: 32, avgDailyGainG: 24, dailyIntakeG: 35, cumIntakeG: 166, fcr: 0.78 },
  { day: 8, weightG: 249, dailyGainG: 36, avgDailyGainG: 26, dailyIntakeG: 39, cumIntakeG: 206, fcr: 0.826 },
  { day: 9, weightG: 288, dailyGainG: 39, avgDailyGainG: 27, dailyIntakeG: 44, cumIntakeG: 249, fcr: 0.865 },
  { day: 10, weightG: 330, dailyGainG: 42, avgDailyGainG: 29, dailyIntakeG: 48, cumIntakeG: 297, fcr: 0.9 },
  { day: 11, weightG: 376, dailyGainG: 46, avgDailyGainG: 30, dailyIntakeG: 52, cumIntakeG: 349, fcr: 0.93 },
  { day: 12, weightG: 425, dailyGainG: 49, avgDailyGainG: 32, dailyIntakeG: 57, cumIntakeG: 406, fcr: 0.957 },
  { day: 13, weightG: 477, dailyGainG: 52, avgDailyGainG: 33, dailyIntakeG: 62, cumIntakeG: 468, fcr: 0.982 },
  { day: 14, weightG: 533, dailyGainG: 56, avgDailyGainG: 35, dailyIntakeG: 67, cumIntakeG: 535, fcr: 1.005 },
  { day: 15, weightG: 592, dailyGainG: 59, avgDailyGainG: 37, dailyIntakeG: 72, cumIntakeG: 608, fcr: 1.026 },
  { day: 16, weightG: 655, dailyGainG: 62, avgDailyGainG: 38, dailyIntakeG: 77, cumIntakeG: 685, fcr: 1.047 },
  { day: 17, weightG: 720, dailyGainG: 66, avgDailyGainG: 40, dailyIntakeG: 83, cumIntakeG: 768, fcr: 1.066 },
  { day: 18, weightG: 789, dailyGainG: 69, avgDailyGainG: 41, dailyIntakeG: 88, cumIntakeG: 856, fcr: 1.086 },
  { day: 19, weightG: 860, dailyGainG: 72, avgDailyGainG: 43, dailyIntakeG: 94, cumIntakeG: 950, fcr: 1.105 },
  { day: 20, weightG: 935, dailyGainG: 74, avgDailyGainG: 45, dailyIntakeG: 100, cumIntakeG: 1050, fcr: 1.123 },
  { day: 21, weightG: 1012, dailyGainG: 77, avgDailyGainG: 46, dailyIntakeG: 105, cumIntakeG: 1155, fcr: 1.142 },
  { day: 22, weightG: 1092, dailyGainG: 80, avgDailyGainG: 48, dailyIntakeG: 111, cumIntakeG: 1266, fcr: 1.16 },
  { day: 23, weightG: 1174, dailyGainG: 82, avgDailyGainG: 49, dailyIntakeG: 117, cumIntakeG: 1383, fcr: 1.178 },
  { day: 24, weightG: 1258, dailyGainG: 85, avgDailyGainG: 51, dailyIntakeG: 122, cumIntakeG: 1505, fcr: 1.196 },
  { day: 25, weightG: 1345, dailyGainG: 87, avgDailyGainG: 52, dailyIntakeG: 128, cumIntakeG: 1633, fcr: 1.214 },
  { day: 26, weightG: 1434, dailyGainG: 89, avgDailyGainG: 53, dailyIntakeG: 134, cumIntakeG: 1767, fcr: 1.233 },
  { day: 27, weightG: 1524, dailyGainG: 91, avgDailyGainG: 55, dailyIntakeG: 139, cumIntakeG: 1907, fcr: 1.251 },
  { day: 28, weightG: 1616, dailyGainG: 92, avgDailyGainG: 56, dailyIntakeG: 145, cumIntakeG: 2051, fcr: 1.269 },
  { day: 29, weightG: 1710, dailyGainG: 94, avgDailyGainG: 57, dailyIntakeG: 150, cumIntakeG: 2202, fcr: 1.288 },
  { day: 30, weightG: 1805, dailyGainG: 95, avgDailyGainG: 59, dailyIntakeG: 156, cumIntakeG: 2357, fcr: 1.306 },
  { day: 31, weightG: 1901, dailyGainG: 96, avgDailyGainG: 60, dailyIntakeG: 161, cumIntakeG: 2518, fcr: 1.325 },
  { day: 32, weightG: 1999, dailyGainG: 97, avgDailyGainG: 61, dailyIntakeG: 166, cumIntakeG: 2684, fcr: 1.343 },
  { day: 33, weightG: 2097, dailyGainG: 98, avgDailyGainG: 62, dailyIntakeG: 171, cumIntakeG: 2855, fcr: 1.362 },
  { day: 34, weightG: 2196, dailyGainG: 99, avgDailyGainG: 63, dailyIntakeG: 176, cumIntakeG: 3031, fcr: 1.381 },
  { day: 35, weightG: 2296, dailyGainG: 100, avgDailyGainG: 64, dailyIntakeG: 180, cumIntakeG: 3211, fcr: 1.399 },
  { day: 36, weightG: 2396, dailyGainG: 100, avgDailyGainG: 65, dailyIntakeG: 185, cumIntakeG: 3396, fcr: 1.418 },
  { day: 37, weightG: 2496, dailyGainG: 100, avgDailyGainG: 66, dailyIntakeG: 189, cumIntakeG: 3584, fcr: 1.437 },
  { day: 38, weightG: 2597, dailyGainG: 101, avgDailyGainG: 67, dailyIntakeG: 193, cumIntakeG: 3777, fcr: 1.456 },
  { day: 39, weightG: 2697, dailyGainG: 101, avgDailyGainG: 68, dailyIntakeG: 197, cumIntakeG: 3974, fcr: 1.474 },
  { day: 40, weightG: 2798, dailyGainG: 100, avgDailyGainG: 69, dailyIntakeG: 201, cumIntakeG: 4175, fcr: 1.493 },
  { day: 41, weightG: 2898, dailyGainG: 100, avgDailyGainG: 70, dailyIntakeG: 204, cumIntakeG: 4379, fcr: 1.512 },
  { day: 42, weightG: 2998, dailyGainG: 100, avgDailyGainG: 70, dailyIntakeG: 207, cumIntakeG: 4586, fcr: 1.531 },
  { day: 43, weightG: 3097, dailyGainG: 100, avgDailyGainG: 71, dailyIntakeG: 211, cumIntakeG: 4797, fcr: 1.55 },
  { day: 44, weightG: 3197, dailyGainG: 99, avgDailyGainG: 72, dailyIntakeG: 213, cumIntakeG: 5010, fcr: 1.569 },
  { day: 45, weightG: 3295, dailyGainG: 98, avgDailyGainG: 72, dailyIntakeG: 216, cumIntakeG: 5226, fcr: 1.587 },
  { day: 46, weightG: 3393, dailyGainG: 98, avgDailyGainG: 73, dailyIntakeG: 219, cumIntakeG: 5445, fcr: 1.606 },
  { day: 47, weightG: 3490, dailyGainG: 97, avgDailyGainG: 73, dailyIntakeG: 221, cumIntakeG: 5666, fcr: 1.625 },
  { day: 48, weightG: 3586, dailyGainG: 96, avgDailyGainG: 74, dailyIntakeG: 223, cumIntakeG: 5890, fcr: 1.644 },
  { day: 49, weightG: 3681, dailyGainG: 95, avgDailyGainG: 74, dailyIntakeG: 225, cumIntakeG: 6115, fcr: 1.663 },
  { day: 50, weightG: 3776, dailyGainG: 94, avgDailyGainG: 75, dailyIntakeG: 227, cumIntakeG: 6342, fcr: 1.681 },
  { day: 51, weightG: 3869, dailyGainG: 93, avgDailyGainG: 75, dailyIntakeG: 229, cumIntakeG: 6571, fcr: 1.7 },
  { day: 52, weightG: 3961, dailyGainG: 92, avgDailyGainG: 75, dailyIntakeG: 230, cumIntakeG: 6801, fcr: 1.719 },
  { day: 53, weightG: 4052, dailyGainG: 91, avgDailyGainG: 76, dailyIntakeG: 231, cumIntakeG: 7032, fcr: 1.738 },
  { day: 54, weightG: 4142, dailyGainG: 90, avgDailyGainG: 76, dailyIntakeG: 233, cumIntakeG: 7265, fcr: 1.756 },
  { day: 55, weightG: 4230, dailyGainG: 89, avgDailyGainG: 76, dailyIntakeG: 233, cumIntakeG: 7498, fcr: 1.775 },
  { day: 56, weightG: 4318, dailyGainG: 87, avgDailyGainG: 76, dailyIntakeG: 234, cumIntakeG: 7733, fcr: 1.793 },
];

/**
 * Contractor overlay on top of the breed curve (ROADMAP §2). These default
 * bands (mortality ceiling and uniformity floor by day) are the seam the
 * Phase-3 status engine reads; values are sensible defaults, contractor-tunable.
 */
export const ROSS_308_OVERLAY: BenchmarkOverlay = {
  mortalityBand: [
    { day: 7, maxCumPct: 1.0 },
    { day: 14, maxCumPct: 1.6 },
    { day: 21, maxCumPct: 2.2 },
    { day: 28, maxCumPct: 2.8 },
    { day: 35, maxCumPct: 3.5 },
    { day: 42, maxCumPct: 4.2 },
  ],
  uniformityTarget: [
    { day: 7, minPct: 80 },
    { day: 14, minPct: 78 },
    { day: 21, minPct: 75 },
    { day: 28, minPct: 72 },
    { day: 35, minPct: 70 },
  ],
};

/** Lookup a curve point by day (clamped to the available range). */
export function ross308At(day: number): BenchmarkPoint {
  const clamped = Math.max(0, Math.min(day, ROSS_308_CURVE.length - 1));
  return ROSS_308_CURVE[clamped];
}

/**
 * The inverse of `ross308At`: the age (day of cycle, fractional) at which the
 * breed curve reaches `targetWeightG`, linearly interpolated between points.
 * Used to derive the expected collection date from a contractor's target weight
 * (placement date + this many days). Clamps to the curve's range; returns 0 for
 * a non-positive/absent target.
 */
export function ageAtWeight(targetWeightG: number, curve: BenchmarkPoint[] = ROSS_308_CURVE): number {
  if (!(targetWeightG > 0) || curve.length === 0) return 0;
  if (targetWeightG <= curve[0].weightG) return curve[0].day;
  for (let i = 1; i < curve.length; i++) {
    if (targetWeightG <= curve[i].weightG) {
      const a = curve[i - 1];
      const b = curve[i];
      const span = b.weightG - a.weightG;
      const f = span > 0 ? (targetWeightG - a.weightG) / span : 0;
      return a.day + (b.day - a.day) * f;
    }
  }
  return curve[curve.length - 1].day; // beyond the curve — clamp to the last day
}

/**
 * The contractor's standard cumulative-mortality ceiling (%) for a day,
 * linearly interpolated between the overlay band points. This is the "expected
 * by today" figure the grower screens describe in plain language and compare
 * against. Pure; mirrors the engine's internal band lookup so the descriptive
 * line and the status pill always agree.
 */
export function mortalityBandPctAt(day: number, overlay: BenchmarkOverlay = ROSS_308_OVERLAY): number {
  const band = overlay.mortalityBand;
  if (band.length === 0) return 100;
  if (day <= band[0].day) return band[0].maxCumPct;
  for (let i = 1; i < band.length; i++) {
    if (day <= band[i].day) {
      const a = band[i - 1];
      const b = band[i];
      const t = (day - a.day) / (b.day - a.day);
      return a.maxCumPct + (b.maxCumPct - a.maxCumPct) * t;
    }
  }
  return band[band.length - 1].maxCumPct;
}
