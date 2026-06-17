/**
 * Pure flock arithmetic — the cumulative figures BatchPilot computes for the
 * grower each morning so they don't hand-tally them (ROADMAP §1, the wedge).
 * No data-layer imports, so it's unit-testable and reused by the daily-update
 * seam. Convex keeps calling this; only where the prior total comes from changes.
 */

export interface DailyTotalsInput {
  /** Birds originally placed in the house. */
  placed: number;
  /** Cumulative deaths + culls up to (not including) today. */
  priorCumMort: number;
  /** Birds found dead today. */
  mortality: number;
  /** Birds culled today. */
  culls: number;
}

export interface DailyTotals {
  /** Today's deaths + culls. */
  cullAndMort: number;
  /** Running total of deaths + culls. */
  cumMort: number;
  /** Birds still on the floor. */
  birdsRemaining: number;
  /** Cumulative mortality as a % of placed, to 2 dp. */
  cumPct: number;
}

export function dailyTotals({ placed, priorCumMort, mortality, culls }: DailyTotalsInput): DailyTotals {
  const cullAndMort = mortality + culls;
  const cumMort = priorCumMort + cullAndMort;
  const birdsRemaining = placed - cumMort;
  const cumPct = placed ? Number(((cumMort / placed) * 100).toFixed(2)) : 0;
  return { cullAndMort, cumMort, birdsRemaining, cumPct };
}
