/**
 * Ross 308 (as-hatched) objective curve — the columns the contractor grower
 * queries need (weight, daily gain, FCR by day). Self-contained on purpose: the
 * app's copy in `lib/data/ross308.ts` imports app types via the `@/` alias,
 * which the Convex typecheck can't resolve, so the backend keeps its own
 * dependency-free mirror of this static, breed-fixed reference data.
 */

export interface RossPoint {
  day: number;
  weightG: number;
  dailyGainG: number | null;
  fcr: number | null;
}

// day, weightG, dailyGainG, fcr — mirrors ROSS_308_CURVE (ross308_as_hatched).
const CURVE: RossPoint[] = [
  { day: 0, weightG: 44, dailyGainG: null, fcr: null },
  { day: 1, weightG: 62, dailyGainG: 18, fcr: 0.196 },
  { day: 2, weightG: 81, dailyGainG: 19, fcr: 0.352 },
  { day: 3, weightG: 102, dailyGainG: 21, fcr: 0.476 },
  { day: 4, weightG: 125, dailyGainG: 23, fcr: 0.577 },
  { day: 5, weightG: 151, dailyGainG: 26, fcr: 0.658 },
  { day: 6, weightG: 181, dailyGainG: 29, fcr: 0.724 },
  { day: 7, weightG: 213, dailyGainG: 32, fcr: 0.78 },
  { day: 8, weightG: 249, dailyGainG: 36, fcr: 0.826 },
  { day: 9, weightG: 288, dailyGainG: 39, fcr: 0.865 },
  { day: 10, weightG: 330, dailyGainG: 42, fcr: 0.9 },
  { day: 11, weightG: 376, dailyGainG: 46, fcr: 0.93 },
  { day: 12, weightG: 425, dailyGainG: 49, fcr: 0.957 },
  { day: 13, weightG: 477, dailyGainG: 52, fcr: 0.982 },
  { day: 14, weightG: 533, dailyGainG: 56, fcr: 1.005 },
  { day: 15, weightG: 592, dailyGainG: 59, fcr: 1.026 },
  { day: 16, weightG: 655, dailyGainG: 62, fcr: 1.047 },
  { day: 17, weightG: 720, dailyGainG: 66, fcr: 1.066 },
  { day: 18, weightG: 789, dailyGainG: 69, fcr: 1.086 },
  { day: 19, weightG: 860, dailyGainG: 72, fcr: 1.105 },
  { day: 20, weightG: 935, dailyGainG: 74, fcr: 1.123 },
  { day: 21, weightG: 1012, dailyGainG: 77, fcr: 1.142 },
  { day: 22, weightG: 1092, dailyGainG: 80, fcr: 1.16 },
  { day: 23, weightG: 1174, dailyGainG: 82, fcr: 1.178 },
  { day: 24, weightG: 1258, dailyGainG: 85, fcr: 1.196 },
  { day: 25, weightG: 1345, dailyGainG: 87, fcr: 1.214 },
  { day: 26, weightG: 1434, dailyGainG: 89, fcr: 1.233 },
  { day: 27, weightG: 1524, dailyGainG: 91, fcr: 1.251 },
  { day: 28, weightG: 1616, dailyGainG: 92, fcr: 1.269 },
  { day: 29, weightG: 1710, dailyGainG: 94, fcr: 1.288 },
  { day: 30, weightG: 1805, dailyGainG: 95, fcr: 1.306 },
  { day: 31, weightG: 1901, dailyGainG: 96, fcr: 1.325 },
  { day: 32, weightG: 1999, dailyGainG: 97, fcr: 1.343 },
  { day: 33, weightG: 2097, dailyGainG: 98, fcr: 1.362 },
  { day: 34, weightG: 2196, dailyGainG: 99, fcr: 1.381 },
  { day: 35, weightG: 2296, dailyGainG: 100, fcr: 1.399 },
  { day: 36, weightG: 2396, dailyGainG: 100, fcr: 1.418 },
  { day: 37, weightG: 2496, dailyGainG: 100, fcr: 1.437 },
  { day: 38, weightG: 2597, dailyGainG: 101, fcr: 1.456 },
  { day: 39, weightG: 2697, dailyGainG: 101, fcr: 1.474 },
  { day: 40, weightG: 2798, dailyGainG: 100, fcr: 1.493 },
  { day: 41, weightG: 2898, dailyGainG: 100, fcr: 1.512 },
  { day: 42, weightG: 2998, dailyGainG: 100, fcr: 1.531 },
  { day: 43, weightG: 3097, dailyGainG: 100, fcr: 1.55 },
  { day: 44, weightG: 3197, dailyGainG: 99, fcr: 1.569 },
  { day: 45, weightG: 3295, dailyGainG: 98, fcr: 1.587 },
  { day: 46, weightG: 3393, dailyGainG: 98, fcr: 1.606 },
  { day: 47, weightG: 3490, dailyGainG: 97, fcr: 1.625 },
  { day: 48, weightG: 3586, dailyGainG: 96, fcr: 1.644 },
  { day: 49, weightG: 3681, dailyGainG: 95, fcr: 1.663 },
  { day: 50, weightG: 3776, dailyGainG: 94, fcr: 1.681 },
  { day: 51, weightG: 3869, dailyGainG: 93, fcr: 1.7 },
  { day: 52, weightG: 3961, dailyGainG: 92, fcr: 1.719 },
  { day: 53, weightG: 4052, dailyGainG: 91, fcr: 1.738 },
  { day: 54, weightG: 4142, dailyGainG: 90, fcr: 1.756 },
  { day: 55, weightG: 4230, dailyGainG: 89, fcr: 1.775 },
  { day: 56, weightG: 4318, dailyGainG: 87, fcr: 1.793 },
];

/** Lookup a curve point by day (clamped to the available range). */
export function rossAt(day: number): RossPoint {
  const clamped = Math.max(0, Math.min(day, CURVE.length - 1));
  return CURVE[clamped];
}
