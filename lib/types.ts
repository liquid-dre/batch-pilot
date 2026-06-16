/**
 * BatchPilot data model — the contract (ROADMAP §7).
 *
 * Mock data (lib/data/mock.ts) and the future Convex backend BOTH conform to
 * these types. UI talks only to the typed functions in `lib/data/`; it never
 * imports mock data directly. Keep this file backend-agnostic.
 *
 * IDs are branded-ish string aliases for readability at call sites. Dates are
 * ISO `YYYY-MM-DD` strings (channel- and timezone-agnostic for WhatsApp ingest
 * later); render with the helpers in lib/format, never parse raw in components.
 */

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'

/** Who's looking. No login yet — a role switcher stands in (ROADMAP §5). */
export type Role = "grower" | "contractor";

export interface User {
  id: ID;
  name: string;
  role: Role;
  /** Display org: the grower's site, or the contractor's company. */
  org: string;
  /** Scopes what this user can see — a site (grower) or a contractor (contractor). */
  siteId?: ID;
  contractorId?: ID;
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Contractor {
  id: ID;
  name: string;
  /** Optional white-label brand override (themeable Horizon scale). */
  brandTheme?: { brand700: string; brand500: string };
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A physical farm. One record per real site (ROADMAP §7 "Grower/Site"). */
export interface Site {
  id: ID;
  name: string;
  /** Contractor farm code, e.g. "ZBNH" (Nhunge). */
  farmCode: string;
  location: GeoPoint;
  contractorIds: ID[];
  houses: House[];
}

export interface House {
  id: ID;
  siteId: ID;
  name: string;
  capacity: number;
}

export type Breed = "Ross 308" | "Cobb 500";
export type Sex = "as-hatched" | "male" | "female";

/** A cycle on a site, supplied by one contractor. May span houses with
 *  staggered placing dates — per-house age lives on Placement. */
export interface Batch {
  id: ID;
  siteId: ID;
  contractorId: ID;
  cycleNo: number;
  breed: Breed;
  /** Contractor's target collection date (a stored target, not computed). */
  killDate: ISODate;
  /** Free-of-charge allowance, e.g. 1 (%) — excluded from chargeable count. */
  focPct: number;
  contractId: ID;
}

/** Per-house placement: its own placed count, placing date and day-count. */
export interface Placement {
  id: ID;
  batchId: ID;
  houseId: ID;
  placedCount: number;
  placingDate: ISODate;
  /** Age in days as of the latest entry (placing date = day 0). */
  dayCount: number;
}

/**
 * One day's record for a house. Typed fields are entered; the rest are derived
 * by the app (the "do the maths for them" wedge, ROADMAP §1).
 */
export interface DailyEntry {
  id: ID;
  placementId: ID;
  date: ISODate;
  day: number;
  // entered
  mortality: number;
  culls: number;
  /** Feed *added* to the house (bin refill) — differs from consumed. */
  feedAddedKg: number;
  /** Feed *consumed* — the figure FCR/intake scoring needs (often absent). */
  feedConsumedKg?: number;
  /** Optional, diagnostic only (not a benchmark). */
  tempC?: number;
  // derived
  cullAndMort: number;
  cumMort: number;
  cumPct: number;
  birdsRemaining: number;
}

export interface WeightEntry {
  id: ID;
  placementId: ID;
  day: number;
  avgWeightG: number;
  adgG: number;
  growthRatio: number;
  uniformityPct: number;
}

export interface FeedDelivery {
  id: ID;
  siteId: ID;
  date: ISODate;
  feedType: string;
  bagSizeKg: number;
  bagCount: number;
  /** Weighed net on arrival — compared to nominal (bagSize × bagCount). */
  netWeightKg: number;
}

export interface CatchingEvent {
  id: ID;
  batchId: ID;
  /** Night label, e.g. "Sunday night". */
  night: string;
  count: number;
  collectionWeightKg?: number;
}

// ---------------------------------------------------------------------------
// Benchmark + contract
// ---------------------------------------------------------------------------

export interface BenchmarkPoint {
  day: number;
  weightG: number;
  dailyGainG: number | null;
  avgDailyGainG: number | null;
  dailyIntakeG: number | null;
  cumIntakeG: number | null;
  fcr: number | null;
}

/** Mortality band / uniformity target overlay supplied by the contractor. */
export interface BenchmarkOverlay {
  mortalityBand: { day: number; maxCumPct: number }[];
  uniformityTarget: { day: number; minPct: number }[];
}

export interface BenchmarkSet {
  contractorId: ID;
  breed: Breed;
  sex: Sex;
  unit: "g";
  curve: BenchmarkPoint[];
  overlay: BenchmarkOverlay;
}

export interface Contract {
  id: ID;
  chickPrice: number;
  feedPricePerKg: number;
  buyBackPerKg: number;
  focPct: number;
}

// ---------------------------------------------------------------------------
// Status (the signature output) + billing seam
// ---------------------------------------------------------------------------

export type StatusLevel = "green" | "amber" | "red";

/** Status is never colour alone (ROADMAP §6): colour + icon + word + shape. */
export interface Status {
  metric: string;
  level: StatusLevel;
  /** Human-readable actual-vs-target, e.g. "13% under curve at day 28". */
  actualVsTarget: string;
  cause?: string;
  fix?: string;
}

/** A house whose status needs attention — the grower alerts list (cause & fix). */
export interface FlockAlert {
  houseId: ID;
  houseName: string;
  status: Status;
}

// ---------------------------------------------------------------------------
// Projections (formula-based & explainable; ML deferred — ROADMAP §9)
// ---------------------------------------------------------------------------

export interface HouseProjection {
  houseId: ID;
  houseName: string;
  /** Day of the latest weigh-in. */
  weightDay: number;
  currentWeightG: number;
  /** Daily gain used to project forward (g/day). */
  dailyGainG: number;
  /** House age on the kill date. */
  killDay: number;
  projectedWeightG: number;
  /** Ross 308 objective weight at the kill day (the target to beat). */
  targetWeightG: number;
  pctOfTarget: number;
  level: StatusLevel;
}

export interface BatchProjection {
  killDate: ISODate;
  /** Whole days from "today" to the kill date (0 = today). */
  daysToKill: number;
  projectedAvgWeightG: number;
  targetAvgWeightG: number;
  pctOfTarget: number;
  level: StatusLevel;
  /** Plain-language verdict for the grower. */
  verdict: string;
  houses: HouseProjection[];
}

// ---------------------------------------------------------------------------
// Collection (catching) — schedule + authorised-vehicle manifest
// ---------------------------------------------------------------------------

export interface Vehicle {
  plate: string;
  driver: string;
}

export interface Manifest {
  batchId: ID;
  /** Birds held for this catching round (the gate-verification count). */
  heldCount: number;
  vehicles: Vehicle[];
}

/** A finished cycle on a site — the grower's track record (ROADMAP §8 Phase 2). */
export interface PastCycle {
  cycleNo: number;
  killDate: ISODate;
  finalAvgWeightG: number;
  mortalityPct: number;
  /** European Production Efficiency Factor for the closed cycle. */
  epef: number;
}

/** Billing stub → Stripe later (ROADMAP §5, §9). */
export type PlanTier = "free" | "pro" | "contractor";

export interface Plan {
  tier: PlanTier;
  name: string;
  /** Capability flags the UI can gate on without knowing about Stripe. */
  features: {
    projections: boolean;
    benchmarkOverlay: boolean;
    whatsappIngest: boolean;
  };
}
