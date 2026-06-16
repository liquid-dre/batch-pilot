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

// ---------------------------------------------------------------------------
// Batch history (day-by-day tables + charts)
// ---------------------------------------------------------------------------

export interface WeighPoint {
  avgWeightG: number;
  adgG: number;
  growthRatio: number;
  uniformityPct: number;
  /** Weight as a % of the Ross 308 objective for the day. */
  vsRossPct: number;
  /** Estimated feed conversion ratio at this weigh-in. */
  fcr: number;
}

export interface HouseDayRow {
  day: number;
  date: string;
  mortality: number;
  culls: number;
  cumMort: number;
  cumPct: number;
  /** Daily mortality as a % of placed. */
  dailyMortPct: number;
  feedAddedKg: number;
  tempC?: number;
  weigh?: WeighPoint;
}

export interface HouseSeries {
  houseId: string;
  houseName: string;
  placedCount: number;
  rows: HouseDayRow[];
}

export interface BatchDayRow {
  day: number;
  date: string;
  mortality: number;
  culls: number;
  cumMort: number;
  cumPct: number;
  dailyMortPct: number;
  feedAddedKg: number;
  placed: number;
  remaining: number;
  avgWeightG?: number;
  vsRossPct?: number;
  fcr?: number;
}

export interface BatchHistory {
  maxDay: number;
  placed: number;
  houses: HouseSeries[];
  batch: BatchDayRow[];
  /** Ross 308 objective per day, for chart overlays. */
  ross: { day: number; weightG: number; fcr: number | null }[];
  /** Contractor cumulative-mortality ceiling per day, for the status band. */
  mortalityBand: { day: number; maxCumPct: number }[];
}

// ---------------------------------------------------------------------------
// Batch comparison (trends across batches, aligned by day of cycle)
// ---------------------------------------------------------------------------

export interface ComparePoint {
  day: number;
  dailyMortPct: number;
  cumPct: number;
  /** Dense for closed batches; sparse (weigh-days) for the ongoing one. */
  avgWeightG?: number;
  vsRossPct?: number;
  fcr?: number;
}

export interface ComparableBatch {
  id: string;
  cycleNo: number;
  label: string;
  status: "current" | "closed";
  placingDate: string;
  killDate: string;
  killDay: number;
  /** Last day with data: grow-out length (closed) or current age (ongoing). */
  finalDay: number;
  series: ComparePoint[];
  // Summary (latest/final values)
  weightG: number;
  vsRossPct: number;
  cumMortPct: number;
  fcr: number;
  targetWeightG: number;
  /** Day of cycle the batch reaches (or is projected to reach) target weight. */
  daysToTarget: number;
  /** daysToTarget − killDay: negative = ahead of the kill date, positive = behind. */
  readyVsKillDays: number;
}

export interface CompareData {
  batches: ComparableBatch[];
  ross: { day: number; weightG: number; fcr: number | null }[];
  maxDay: number;
}

// ---------------------------------------------------------------------------
// Contractor grower-level performance (ranked overview + position-across-days)
// ---------------------------------------------------------------------------

export interface GrowerTrendPoint {
  day: number;
  cumPct: number;
  dailyMortPct: number;
  vsRossPct: number;
  fcr: number;
}

export interface GrowerPerf {
  siteId: string;
  name: string;
  farmCode: string;
  cycleNo: number;
  status: "active" | "completed";
  /** Current age (active) or grow-out length (completed). */
  day: number;
  killDay: number;
  placed: number;
  remaining: number;
  // Headline metrics
  epef: number;
  fcr: number;
  cumMortPct: number;
  weightG: number;
  vsRossPct: number;
  /** daysToTarget − killDay: negative = ahead of the kill date, positive = behind. */
  readyVsKillDays: number;
  level: StatusLevel;
  /** Day-of-cycle trend for the position-across-days chart. */
  trend: GrowerTrendPoint[];
}

export interface ContractorGrowers {
  contractorName: string;
  growers: GrowerPerf[];
  ross: { day: number; weightG: number; fcr: number | null }[];
  maxDay: number;
}

// ---------------------------------------------------------------------------
// Hero weight-band chart (actual per house vs Ross, shaded green/amber/red)
// ---------------------------------------------------------------------------

export interface WeightBandSeries {
  houseId: string;
  houseName: string;
  /** Weigh-ins: avg weight by day of cycle. */
  points: { day: number; weightG: number }[];
}

export interface WeightBandData {
  ross: { day: number; weightG: number }[];
  houses: WeightBandSeries[];
  maxDay: number;
  yMax: number;
  /** Band thresholds as fractions of the Ross objective (for the shaded zones). */
  greenFrac: number;
  amberFrac: number;
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
