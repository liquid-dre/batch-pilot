/**
 * View models — the shape the page (a Server Component) assembles from the
 * data seam and hands to the client overview components. Keeping these as plain
 * types (no React) lets both server and client import them freely.
 */
import type {
  Batch,
  CatchingEvent,
  Contractor,
  DailyEntry,
  FeedDelivery,
  House,
  PastCycle,
  Placement,
  Site,
  Status,
  StatusLevel,
  WeightEntry,
} from "@/lib/types";
import type { SiteRollup } from "@/lib/data";

export interface HouseView {
  house: House;
  placement: Placement;
  latest?: DailyEntry;
  weight?: WeightEntry;
  status?: Status;
  /** Latest weight as a % of the Ross 308 target for that day (e.g. 87). */
  vsRossPct?: number;
}

/** Lean per-house context the daily-update form needs (keeps the client bundle small). */
export interface FormHouse {
  id: string;
  name: string;
  placedCount: number;
  /** The day this entry records (latest recorded day + 1). */
  nextDay: number;
  /** Cumulative mortality before today (to add today's losses onto). */
  priorCumMort: number;
  /** Yesterday's feed, used as the stepper's starting value. */
  lastFeedKg: number;
}

export interface DailyFormData {
  houses: FormHouse[];
  sitePlaced: number;
  siteCumMort: number;
  today: string;
}

export interface DashboardData {
  site: Site;
  contractor: Contractor;
  batch: Batch;
  rollup: SiteRollup;
  houses: HouseView[];
  feed: FeedDelivery[];
  catching: CatchingEvent[];
  /** Whole days from "today" to the batch kill date (0 = today, <0 = past). */
  killCountdownDays: number;
}

// ---------------------------------------------------------------------------
// Contractor (Phase 2) view-models
// ---------------------------------------------------------------------------

/** One house's efficiency line in the portfolio / flock-overview table. */
export interface HouseMetrics {
  houseId: string;
  houseName: string;
  day: number;
  placed: number;
  remaining: number;
  livabilityPct: number;
  cumPct: number;
  avgWeightG: number;
  /** Latest weight as a % of the Ross 308 target for its age. */
  vsRossPct: number;
  /** Estimated feed conversion ratio. */
  fcr: number;
  /** European Production Efficiency Factor. */
  epef: number;
  level: StatusLevel;
  statusMetric: string;
}

export interface PortfolioSummary {
  siteName: string;
  farmCode: string;
  cycleNo: number;
  killDate: string;
  daysToKill: number;
  houseCount: number;
  birdsOnSite: number;
  avgMortPct: number;
  avgEpef: number;
  projectedAvgWeightG: number;
  targetAvgWeightG: number;
  pctOfTarget: number;
  level: StatusLevel;
  /** When the slowest house is projected to reach target weight. */
  projectedReadyDate: string;
}

export interface PortfolioData {
  summary: PortfolioSummary;
  rows: HouseMetrics[];
}

/** Per-house detail with short trend series for the grower drill-down. */
export interface HouseTrend {
  houseId: string;
  houseName: string;
  day: number;
  status?: Status;
  cumPct: number;
  remaining: number;
  avgWeightG: number;
  vsRossPct: number;
  mortSeries: number[];
  cumPctSeries: number[];
}

export interface GrowerDetailData {
  siteName: string;
  farmCode: string;
  cycleNo: number;
  breed: string;
  killDate: string;
  rollup: SiteRollup;
  houses: HouseTrend[];
  pastCycles: PastCycle[];
}
