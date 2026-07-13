/**
 * Save-confirmation & feedback copy — THE ONE PLACE this wording lives.
 *
 * Mirrors the lib/guidance.ts pattern: rewrite the strings here and every
 * capture screen updates together — the supervisor round (`SupervisorHome`),
 * the manager daily form (`DailyUpdateForm`), the onboarding/Convex capture
 * (`FarmData`), and the feed / weights / allocation / house-setup toasts.
 *
 * Voice: the brand's calm, on-your-side register (docs/brand-guidelines §7) —
 * plain words, "lost" not "deaths", "still going" not "remaining". A save
 * should make it obvious what went in and what it means, without jargon.
 */
import { grams, kg, num } from "@/lib/format";

/* --------------------------------------------------- daily update (the round) --- */

export interface DailySavedInput {
  houseName: string;
  day: number;
  /** Total birds found dead today (day + night). */
  mortality: number;
  dayMortality: number;
  nightMortality: number;
  culls: number;
  feedAddedKg: number;
  tempC?: number;
  /** Cumulative deaths so far this cycle. */
  cumMort: number;
  /** Cumulative mortality as a % of birds placed. */
  cumPct: number;
  /** Birds still alive in the house. */
  birdsRemaining: number;
}

/** Field labels for the computed tiles — plain and warm. */
export const savedLabels = {
  lostToday: "Lost today",
  lostThisCycle: "Lost this cycle",
  stillGoing: "Birds still going",
  vsStandard: "Vs standard",
  siteMortality: "Site mortality now",
} as const;

/** The read-back of exactly what the grower just entered, in plain words. */
export function savedRecorded(i: DailySavedInput): string {
  const temp = i.tempC !== undefined ? `, ${i.tempC}°C` : "";
  return `${num(i.mortality)} lost (${num(i.dayMortality)} day · ${num(i.nightMortality)} night), ${num(i.culls)} culls, ${kg(i.feedAddedKg)} feed${temp}.`;
}

/** Every string a daily-save confirmation needs — pick the ones a surface shows. */
export function dailySaved(i: DailySavedInput) {
  return {
    /** Toast title — the reassurance as the round moves to the next house. */
    toastTitle: `${i.houseName} saved`,
    toastDescription: `Day ${i.day} is in.`,
    /** Card headline for the full confirmation / review. */
    headline: `${i.houseName}, day ${i.day} is in.`,
    /** Read-back of what was entered. */
    recorded: savedRecorded(i),
    /** One-line summary for compact surfaces (the onboarding capture banner). */
    banner: `${i.houseName}, day ${i.day} is in. ${num(i.mortality)} lost today — ${num(i.cumMort)} lost so far this cycle, ${num(i.birdsRemaining)} birds still going.`,
  };
}

/* ----------------------------------------------------------- sibling captures --- */
/* Feed / weights / allocation / house setup toasts live here too, so the whole
 * save-confirmation family has one editable home. Tone stays with the caller
 * (it depends on the saved data); only the words live here. */

export function feedSavedToast(flagged: boolean, diffKg: number) {
  return {
    title: "Delivery logged",
    description: flagged
      ? `${kg(Math.abs(diffKg))} ${diffKg > 0 ? "short" : "over"} — flagged for the driver.`
      : "Matched the order.",
  };
}

export function weightsSavedToast(houseName: string, avgWeightG: number, pctOfTarget: number) {
  return {
    title: `${houseName} weights saved`,
    description: `${grams(avgWeightG)} · ${pctOfTarget}% of the Ross target.`,
  };
}

export function allocationSavedToast(total: number, houseCount: number) {
  return {
    title: "Cycle allocated",
    description: `${num(total)} birds across ${houseCount} houses.`,
  };
}

export function housesSavedToast(count: number, totalCapacity: number) {
  return {
    title: "Houses saved",
    description: `${count} houses · ${num(totalCapacity)} bird capacity.`,
  };
}

export function housesInvalidToast() {
  return {
    title: "Check the houses",
    description: "Each house needs a name and a capacity.",
  };
}
