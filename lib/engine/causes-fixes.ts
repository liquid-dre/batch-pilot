/**
 * Causes-&-fixes lookup, keyed by metric + growth phase + level (ROADMAP §8
 * Phase 3). Written in the grower voice (action first, reason second; calm,
 * never blaming). The engine attaches the matching entry to amber/red statuses.
 */
import type { StatusLevel } from "@/lib/types";
import type { GrowthPhase } from "./thresholds";

export type MetricKey = "weight" | "fcr" | "mortality" | "feed" | "uniformity";

export interface CauseFix {
  cause: string;
  fix: string;
}

type ByLevel = { amber: CauseFix; red: CauseFix };
type ByPhase = Partial<Record<GrowthPhase, ByLevel>>;

const WEIGHT: ByPhase = {
  brooding: {
    amber: { cause: "Chicks are a little behind weight in the brooding period.", fix: "Check brooder temperature and that every chick reaches feed and water." },
    red: { cause: "Chicks are well behind weight in the brooding period.", fix: "Check brooder temperature, feed and water access now, and chick quality." },
  },
  starter: {
    amber: { cause: "Growth is slightly behind the curve early in the cycle.", fix: "Keep feed in front of the birds; check feeder height and water flow." },
    red: { cause: "Growth is behind the curve early in the cycle.", fix: "Make sure every bird reaches feed and water; check stocking and brooding set-up." },
  },
  grower: {
    amber: { cause: "Growth is a little behind the Ross 308 curve.", fix: "Check feeder space and water; weigh again in a couple of days." },
    red: { cause: "Growth is well behind the Ross 308 curve.", fix: "Check feeder space, feed quality and water flow; weigh again in 2 days." },
  },
  finisher: {
    amber: { cause: "Birds are a little under target weight near the kill date.", fix: "Maximise feed access in the final days." },
    red: { cause: "Birds are well under target weight near the kill date.", fix: "Maximise feed access now and tell the contractor the projected weight." },
  },
};

const MORTALITY: ByPhase = {
  brooding: {
    amber: { cause: "Early losses are edging toward the contractor band.", fix: "Check brooder temperature and humidity; remove and record culls." },
    red: { cause: "Early mortality is above the band — often brooding temperature or chick quality.", fix: "Check brooder temperature and humidity now; review chick quality with the contractor." },
  },
  starter: {
    amber: { cause: "Losses are edging toward the contractor band.", fix: "Watch closely; check water lines and ventilation." },
    red: { cause: "Mortality is above the contractor band.", fix: "Check water lines, ventilation and stocking today." },
  },
  grower: {
    amber: { cause: "Mortality is edging toward the upper band.", fix: "Watch closely and record house temperature at the next round." },
    red: { cause: "Mortality is above the band; warm houses or water issues are common causes.", fix: "Cool the house, check ventilation and water lines today." },
  },
  finisher: {
    amber: { cause: "Losses are edging up late in the cycle.", fix: "Keep the house cool and well ventilated as birds get heavier." },
    red: { cause: "Mortality is above the band late in the cycle — heat stress is common in heavy birds.", fix: "Cool the house and improve airflow now; check water." },
  },
};

// FCR and feed advice barely changes by phase, so one entry covers all phases.
const FCR_ANY: ByLevel = {
  amber: { cause: "Birds are eating a little more feed per kg of gain than target.", fix: "Check for feed spillage and feeder height; make sure water is flowing." },
  red: { cause: "Feed conversion is well above target — more feed per kg of gain than it should take.", fix: "Check for feed wastage and spillage, feeder calibration and water; review feed quality." },
};

const FEED_ANY: ByLevel = {
  amber: { cause: "Feed added is well above the expected intake — likely a bin refill, not what the birds ate.", fix: "Record the weighed delivery separately so intake and FCR stay accurate." },
  red: { cause: "Feed added is far above expected intake — almost certainly a bin refill, not consumption.", fix: "Log it as a delivery, not daily feed, so the FCR figure isn't thrown off." },
};

const UNIFORMITY: ByLevel = {
  amber: { cause: "Flock uniformity is below the contractor target — the spread of bird weights is widening.", fix: "Check feeder and drinker access and space across the house; grading the slowest birds can tighten the spread." },
  red: { cause: "Flock uniformity is well below target — a wide weight spread that cuts the graded yield.", fix: "Review stocking density, feeder space and health, and grade off the tail-end birds." },
};

const TABLE: Record<MetricKey, ByPhase | ByLevel> = {
  weight: WEIGHT,
  mortality: MORTALITY,
  fcr: FCR_ANY,
  feed: FEED_ANY,
  uniformity: UNIFORMITY,
};

/** Returns the cause + fix for a metric at a level/phase, or undefined for green. */
export function causeFix(metric: MetricKey, level: StatusLevel, phase: GrowthPhase): CauseFix | undefined {
  if (level === "green") return undefined;
  const entry = TABLE[metric];
  const byLevel = "amber" in entry && "red" in entry ? (entry as ByLevel) : (entry as ByPhase)[phase];
  return byLevel?.[level];
}
