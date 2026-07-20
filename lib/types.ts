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

/**
 * Who's looking. In Convex mode this is the signed-in account's role; the
 * no-backend demo falls back to a role switcher (ROADMAP §5/§9).
 *
 * The grower experience is split into two profiles that share the same site
 * scope but do different jobs: `supervisor` (the foreman who captures the daily
 * numbers) and `manager` (oversight — analytics and projections). `contractor`
 * runs the supply side; `platformAdmin` is the BatchPilot operator above every
 * tenant (white-label theming — see `isPlatformAdmin`).
 */
export type Role = "supervisor" | "manager" | "contractor" | "platformAdmin";

/** The two grower-side profiles (both scoped to a site). */
export type GrowerRole = Extract<Role, "supervisor" | "manager">;

/** True for either grower profile — use instead of comparing to a single role. */
export function isGrowerRole(role: Role): role is GrowerRole {
  return role === "supervisor" || role === "manager";
}

/**
 * The BatchPilot platform operator (dev team). Sits above every tenant: manages
 * white-label theming across contractor orgs (ROADMAP §9 / BRD §4). Created via
 * the `PLATFORM_ADMIN_EMAILS` allowlist at sign-up — never self-serve or
 * invited, since nothing sits above it. The Contractor Org Admin the BRD
 * describes is the existing `contractor` role (co-admins share its `contractorId`).
 */
export function isPlatformAdmin(role: Role): role is "platformAdmin" {
  return role === "platformAdmin";
}

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

/**
 * An optional consumable logged against a day — a vaccine or medication. Carries
 * a free-text name plus an amount and its unit (e.g. "Gumboro", 16, "L").
 */
export interface TreatmentEntry {
  name: string;
  amount: number;
  unit: string;
}

/** A simple amount + unit, used for additives like charcoal (no name). */
export interface Amount {
  amount: number;
  unit: string;
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
  expectedCollectionDate: ISODate;
  /** Free-of-charge allowance, e.g. 1 (%) — excluded from chargeable count. */
  focPct: number;
  contractId: ID;
}

/**
 * A cycle that has a total chick count from the contractor's planning message
 * but no per-house allocation yet (ROADMAP §8 Phase 1 — allocation step). Once
 * the grower confirms an allocation it becomes Placements.
 */
export interface PlannedBatch {
  id: ID;
  siteId: ID;
  contractorId: ID;
  cycleNo: number;
  breed: Breed;
  placementDate: ISODate;
  expectedCollectionDate: ISODate;
  focPct: number;
  /** Total birds to place across the site, not yet split per house. */
  totalPlaced: number;
  allocated: boolean;
}

/** Per-house placement: its own placed count, placing date and day-count. */
export interface Placement {
  id: ID;
  batchId: ID;
  houseId: ID;
  placedCount: number;
  placementDate: ISODate;
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
  /** Birds found dead during the day. */
  dayMortality: number;
  /** Birds found dead overnight. */
  nightMortality: number;
  /** Total deaths = dayMortality + nightMortality. The single figure every
   *  downstream calc/chart reads, so the day/night split is additive metadata. */
  mortality: number;
  culls: number;
  /** Feed *added* to the house (bin refill) — differs from consumed. */
  feedAddedKg: number;
  /** Feed *consumed* — the figure FCR/intake scoring needs (often absent). */
  feedConsumedKg?: number;
  /** Optional, diagnostic only (not a benchmark). */
  tempC?: number;
  // optional consumables (all collapsed by default in capture)
  /** Charcoal used (amount + unit). */
  charcoal?: Amount;
  /** Vaccines administered (name + amount + unit). */
  vaccines?: TreatmentEntry[];
  /** Medications administered (name + amount + unit). */
  medications?: TreatmentEntry[];
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
  /** Contractor's scheduled target for the night. */
  count: number;
  /** Birds the supervisor recorded actually caught this night. */
  caughtCount?: number;
  collectionWeightKg?: number;
  caughtAt?: ISODate;
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
// Manager corrections — the attributed audit trail (maker-checker; ROADMAP §5/§9)
// ---------------------------------------------------------------------------

/** A captured field a manager is allowed to correct on a daily entry. */
export type EditableField = "dayMortality" | "nightMortality" | "culls" | "feedAddedKg" | "tempC";

/**
 * One attributed correction to a captured value — the maker-checker audit trail.
 * Supervisors capture; managers correct, and every correction is deliberate and
 * recorded: who, when, and old→new. The edited entry stays visibly marked and
 * the change remains viewable. In Convex mode the editor is the signed-in
 * manager and these records are the `editLog` table; the demo path attributes
 * them to the mock manager. Nothing is ever silently overwritten.
 */
export interface EditRecord {
  id: ID;
  /** Extensible — only daily entries are correctable today. */
  entityType: "dailyEntry";
  /** The corrected DailyEntry's id. */
  entityId: ID;
  placementId: ID;
  houseId: ID;
  houseName: string;
  /** Day of cycle of the corrected entry. */
  day: number;
  field: EditableField;
  /** Human label for the field, e.g. "Day mortality". */
  fieldLabel: string;
  oldValue: number | null;
  newValue: number | null;
  editedById: ID;
  editedByName: string;
  editedByRole: Role;
  /** ISO timestamp of the correction. */
  editedAt: string;
  /** Optional reason the manager gave for the correction. */
  note?: string;
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
  /** House age on the collection date. */
  collectionDay: number;
  projectedWeightG: number;
  /** Ross 308 objective weight at the kill day (the target to beat). */
  targetWeightG: number;
  pctOfTarget: number;
  level: StatusLevel;
}

export interface BatchProjection {
  expectedCollectionDate: ISODate;
  /** Whole days from "today" to the collection date (0 = today). */
  daysToCollection: number;
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
  /** Plates the supervisor has ticked off at the gate. */
  verifiedPlates?: string[];
}

/** A finished cycle on a site — the grower's track record (ROADMAP §8 Phase 2). */
export interface PastCycle {
  cycleNo: number;
  expectedCollectionDate: ISODate;
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
