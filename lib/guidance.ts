/**
 * Constructive framing for a flock that is behind the Ross 308 weight curve.
 *
 * THIS IS THE ONE PLACE the under-performance wording lives — tune the strings
 * here and every surface updates. The voice is the brand's calm, on-your-side
 * register (docs/brand-guidelines §7): a clear status, the gap in plain words,
 * the likely cause, then the action. A red number becomes guidance, not an alarm.
 *
 * The headline insight (from real Nhunge data): when birds are eating at or
 * above the target intake yet still sitting under weight, the feed is going in
 * but not converting — after day 21 that usually points to heat in the house
 * (Ross guidance: keep it under 21 °C from day 21), with feed quality the other
 * suspect. That is the difference between "they're not eating" and "they're
 * eating but not gaining", and it changes what you do next.
 */
import type { StatusLevel } from "@/lib/types";

export interface WeightGapInput {
  /** Average live weight as a percentage of the Ross 308 target (88 = 12% under). */
  vsRossPct: number;
  /** Day of cycle — drives the heat-stress guidance (relevant from day 21). */
  day: number;
  /**
   * True when the birds are eating at or above the target intake despite being
   * under weight (i.e. FCR is off, not intake): the efficiency / heat signal.
   */
  eatingAtOrAboveTarget: boolean;
}

export interface WeightGuidance {
  level: StatusLevel;
  /** Status word — pairs with the colour + icon + shape of the pill. */
  status: string;
  /** Names the gap, plainly and without blame. */
  gap: string;
  /** The likely cause, in the grower's voice. */
  cause: string;
  /** The single next action. */
  action: string;
}

/** Heat-stress matters once the birds are big and the house runs warm. */
const HEAT_FROM_DAY = 21;

/**
 * Returns constructive guidance for the weight gap, or null when the flock is on
 * track (≥97% of target) and needs no special framing.
 */
export function weightGuidance({ vsRossPct, day, eatingAtOrAboveTarget }: WeightGapInput): WeightGuidance | null {
  if (vsRossPct >= 97) return null;

  const level: StatusLevel = vsRossPct >= 90 ? "amber" : "red";
  const status = level === "amber" ? "Behind, but in reach" : "Behind target";
  // The precise gap is shown separately via the difference/percentage toggle, so
  // the framing stays in plain words and doesn't double up on the number.
  const gap = "The flock is behind the Ross 308 weight for its age. There's still time to close some of it before the collection date.";

  if (eatingAtOrAboveTarget) {
    // Eating enough (or more) yet under weight — efficiency / heat signal.
    const cause =
      day >= HEAT_FROM_DAY
        ? "The birds are eating their feed but not turning it into weight. Once they're past day 21 that usually means the house is running too warm — heat stress holds back gain even when the feed is there."
        : "The birds are eating their feed but not turning it into weight, so the feed isn't the problem. Check feed quality and that the brooding set-up let every chick get a strong start.";
    const action =
      day >= HEAT_FROM_DAY
        ? "Cool the house and improve airflow — aim to keep it under 21 °C. Keep feed and water in front of the birds, and tell the contractor the projected weight."
        : "Have the feed checked, keep fresh feed and water in front of the birds, and weigh again in two days to see if the gap closes.";
    return { level, status, gap, cause, action };
  }

  // Intake itself is short — get more feed into the birds.
  return {
    level,
    status,
    gap,
    cause: "The birds aren't taking in enough feed for their age, so growth is lagging.",
    action: "Check feeder height and spacing and that water is flowing freely, top feed up through the day, and weigh again in two days.",
  };
}
