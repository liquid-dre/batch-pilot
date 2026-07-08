import type { Doc } from "./_generated/dataModel";

/**
 * Small helpers shared by the Convex functions. Kept self-contained (no imports
 * from the Next app) so the backend bundles cleanly.
 */

/** Strip Convex system fields and rename `extId` back to the app's `id`. */
export function toApp<T extends { _id: unknown; _creationTime: number }>(doc: T) {
  const { _id, _creationTime, extId, ...rest } = doc as T & { extId?: string };
  return (extId !== undefined ? { id: extId, ...rest } : { ...rest }) as Record<string, unknown>;
}

/** Pure cumulative flock arithmetic — mirrors `lib/calc.ts` (kept in sync). */
export function dailyTotals(input: { placed: number; priorCumMort: number; mortality: number; culls: number }) {
  const cullAndMort = input.mortality + input.culls;
  const cumMort = input.priorCumMort + cullAndMort;
  const birdsRemaining = input.placed - cumMort;
  const cumPct = input.placed ? Number(((cumMort / input.placed) * 100).toFixed(2)) : 0;
  return { cullAndMort, cumMort, birdsRemaining, cumPct };
}

export const EDITABLE_FIELD_LABELS: Record<string, string> = {
  dayMortality: "Day mortality",
  nightMortality: "Night mortality",
  culls: "Culls",
  feedAddedKg: "Feed added (kg)",
  tempC: "Temperature (°C)",
};

export type DailyEntryDoc = Doc<"dailyEntries">;
