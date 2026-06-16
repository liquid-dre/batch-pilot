/**
 * Rule-based status engine (ROADMAP §8 Phase 3). Pure: it scores a placement's
 * metrics against the Ross 308 curve + contractor overlay and returns
 * green/amber/red with a cause and a fix. No data-layer imports — the seam
 * passes the benchmark in, so the engine stays testable and backend-agnostic.
 */
import type { BenchmarkOverlay, BenchmarkPoint, Status, StatusLevel } from "@/lib/types";
import { DEFAULT_THRESHOLDS, growthPhase, type StatusThresholds } from "./thresholds";
import { causeFix, type MetricKey } from "./causes-fixes";

export interface MetricStatus extends Status {
  key: MetricKey;
}

export interface PlacementMetrics {
  /** Age in days for mortality/feed checks. */
  day: number;
  /** Latest weigh-in (may differ in day from `day`). */
  weightG?: number;
  weightDay?: number;
  fcr?: number;
  cumMortPct?: number;
  /** Feed added per bird, grams (latest day). */
  feedAddedPerBirdG?: number;
}

export interface EngineContext {
  curve: BenchmarkPoint[];
  overlay: BenchmarkOverlay;
  thresholds?: StatusThresholds;
}

const SEVERITY: Record<StatusLevel, number> = { green: 0, amber: 1, red: 2 };

function curveAt(curve: BenchmarkPoint[], day: number): BenchmarkPoint {
  return curve[Math.max(0, Math.min(day, curve.length - 1))];
}

/** Linear-interpolated contractor mortality ceiling for a day. */
function bandAt(overlay: BenchmarkOverlay, day: number): number {
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

export function evaluateWeight(day: number, weightG: number, ctx: EngineContext): MetricStatus {
  const t = ctx.thresholds ?? DEFAULT_THRESHOLDS;
  const ross = curveAt(ctx.curve, day).weightG;
  const frac = ross ? weightG / ross : 1;
  const level: StatusLevel = frac >= t.weight.green ? "green" : frac >= t.weight.amber ? "amber" : "red";
  const cf = causeFix("weight", level, growthPhase(day));
  return {
    key: "weight",
    metric: "Weight",
    level,
    actualVsTarget: `${Math.round(frac * 100)}% of the Ross target (${Math.round(weightG)} g vs ${ross} g) at day ${day}`,
    cause: cf?.cause,
    fix: cf?.fix,
  };
}

export function evaluateFcr(day: number, fcr: number, ctx: EngineContext): MetricStatus {
  const t = ctx.thresholds ?? DEFAULT_THRESHOLDS;
  const target = curveAt(ctx.curve, day).fcr ?? fcr;
  const over = target ? (fcr - target) / target : 0;
  const level: StatusLevel = over <= t.fcr.green ? "green" : over <= t.fcr.amber ? "amber" : "red";
  const cf = causeFix("fcr", level, growthPhase(day));
  const sign = over >= 0 ? "+" : "";
  return {
    key: "fcr",
    metric: "FCR",
    level,
    actualVsTarget: `${fcr.toFixed(2)} vs ${target.toFixed(2)} target (${sign}${Math.round(over * 100)}%) at day ${day}`,
    cause: cf?.cause,
    fix: cf?.fix,
  };
}

export function evaluateMortality(day: number, cumPct: number, ctx: EngineContext): MetricStatus {
  const t = ctx.thresholds ?? DEFAULT_THRESHOLDS;
  const band = bandAt(ctx.overlay, day);
  const frac = band ? cumPct / band : 0;
  const level: StatusLevel = frac >= t.mortality.red ? "red" : frac >= t.mortality.amber ? "amber" : "green";
  const cf = causeFix("mortality", level, growthPhase(day));
  return {
    key: "mortality",
    metric: "Mortality",
    level,
    actualVsTarget: `${cumPct.toFixed(2)}% cumulative vs ${band.toFixed(1)}% band at day ${day}`,
    cause: cf?.cause,
    fix: cf?.fix,
  };
}

/** Feed-intake sanity check: flags a likely bin refill (not consumption). */
export function evaluateFeedIntake(day: number, feedAddedPerBirdG: number, ctx: EngineContext): MetricStatus {
  const t = ctx.thresholds ?? DEFAULT_THRESHOLDS;
  const target = curveAt(ctx.curve, day).dailyIntakeG ?? feedAddedPerBirdG;
  const ratio = target ? feedAddedPerBirdG / target : 1;
  const level: StatusLevel = ratio >= t.feedRefillRatio ? "amber" : "green";
  const cf = causeFix("feed", level, growthPhase(day));
  return {
    key: "feed",
    metric: "Feed intake",
    level,
    actualVsTarget: `${Math.round(feedAddedPerBirdG)} g/bird vs ${Math.round(target)} g target (${Math.round(ratio * 100)}% of intake) at day ${day}`,
    cause: cf?.cause,
    fix: cf?.fix,
  };
}

/**
 * Scores all available metrics for a placement. Returns the per-metric
 * breakdown plus an overall status (the worst metric — the thing to act on),
 * carrying that metric's cause and fix.
 */
export function evaluatePlacement(m: PlacementMetrics, ctx: EngineContext): { overall: Status; metrics: MetricStatus[] } {
  const metrics: MetricStatus[] = [];
  if (m.weightG != null) metrics.push(evaluateWeight(m.weightDay ?? m.day, m.weightG, ctx));
  if (m.cumMortPct != null) metrics.push(evaluateMortality(m.day, m.cumMortPct, ctx));
  if (m.fcr != null) metrics.push(evaluateFcr(m.weightDay ?? m.day, m.fcr, ctx));
  if (m.feedAddedPerBirdG != null) metrics.push(evaluateFeedIntake(m.day, m.feedAddedPerBirdG, ctx));

  // Overall = worst metric; ties resolved by a priority order (act on welfare/
  // growth before efficiency).
  const priority: MetricKey[] = ["mortality", "weight", "fcr", "feed"];
  const worst =
    [...metrics].sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level] || priority.indexOf(a.key) - priority.indexOf(b.key))[0];

  const overall: Status = worst
    ? { metric: worst.metric, level: worst.level, actualVsTarget: worst.actualVsTarget, cause: worst.cause, fix: worst.fix }
    : { metric: "Status", level: "green", actualVsTarget: "On track against the benchmark" };

  return { overall, metrics };
}
