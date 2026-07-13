/**
 * Where cumulative mortality sits against the day's contractor standard, in
 * plain, calm words (never alarming). Shared by the capture round and the
 * supervisor dashboard so the wording and the status band always agree.
 * Thresholds are in percentage points.
 */
export type StandingLevel = "good" | "warn" | "bad";

export interface Standing {
  level: StandingLevel;
  /** Status word — pairs with the colour + icon + shape of the pill. */
  word: string;
  /** The size/direction of the gap, in plain words. */
  detail: string;
}

export function compareToStandard(cumPct: number, standardPct: number): Standing {
  const diff = Number((cumPct - standardPct).toFixed(2));
  const over = `${Math.abs(diff).toFixed(1)}% over standard`;
  const under = `${Math.abs(diff).toFixed(1)}% under standard`;
  if (diff <= -0.15) return { level: "good", word: "Below the day's standard", detail: under };
  if (diff <= 0.15) return { level: "good", word: "On the day's standard", detail: "right on target" };
  if (diff <= 0.5) return { level: "warn", word: "Slightly above the standard", detail: over };
  return { level: "bad", word: "Above the day's standard", detail: over };
}
