/**
 * Configurable bands for the rule-based status engine (ROADMAP §8 Phase 3).
 * Defaults follow the brief; a contractor can override any of these later
 * without touching the engine logic.
 */

export type GrowthPhase = "brooding" | "starter" | "grower" | "finisher";

/** Ross 308 growth phases by day of cycle. */
export function growthPhase(day: number): GrowthPhase {
  if (day <= 10) return "brooding";
  if (day <= 21) return "starter";
  if (day <= 32) return "grower";
  return "finisher";
}

export interface StatusThresholds {
  /** Weight as a fraction of the Ross objective. */
  weight: { green: number; amber: number };
  /** FCR over target, as a fraction (e.g. 0.03 = within +3%). */
  fcr: { green: number; amber: number };
  /** Feed added per bird above this multiple of the intake target reads as a
   *  bin refill rather than consumption. */
  feedRefillRatio: number;
  /** Cumulative mortality as a fraction of the contractor band ceiling. */
  mortality: { amber: number; red: number };
  /** Uniformity as a fraction of the contractor target (higher is better). */
  uniformity: { green: number; amber: number };
}

export const DEFAULT_THRESHOLDS: StatusThresholds = {
  weight: { green: 0.97, amber: 0.9 }, // ≥97% green · 90–97% amber · <90% red
  fcr: { green: 0.03, amber: 0.08 }, // ≤+3% green · +3–8% amber · >+8% red
  feedRefillRatio: 1.2, // >120% of intake target → likely a bin refill
  mortality: { amber: 0.85, red: 1.0 }, // vs the contractor cumulative band
  uniformity: { green: 0.97, amber: 0.9 }, // ≥97% of target green · 90–97% amber · <90% red
};
