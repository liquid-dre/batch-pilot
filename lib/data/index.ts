/**
 * Data-access seam (ROADMAP §5).
 *
 * Every read and write the UI performs goes through a typed function here.
 * Today they resolve hardcoded mock data; later each becomes a Convex
 * query/mutation with the SAME signature, so the swap never touches the UI.
 *
 * All functions are async (return Promises) even though the mock is synchronous
 * — that mirrors Convex and makes the migration mechanical. Server Components
 * `await` them directly; client components call them inside effects/actions.
 */
import type {
  Amount,
  BatchProjection,
  BenchmarkSet,
  Batch,
  CatchingEvent,
  Contract,
  Contractor,
  DailyEntry,
  EditableField,
  EditRecord,
  FeedDelivery,
  TreatmentEntry,
  FlockAlert,
  House,
  HouseProjection,
  Manifest,
  PastCycle,
  PlannedBatch,
  Placement,
  Role,
  Site,
  Status,
  StatusLevel,
  WeightEntry,
} from "@/lib/types";
import type {
  BatchArchiveData,
  BatchArchiveRow,
  BatchHistory,
  CaptureHouse,
  ComparableBatch,
  CompareData,
  ComparePoint,
  ContractorGrowers,
  DashboardCycleInfo,
  DashboardMetric,
  DashboardView,
  GrowerDetailData,
  GrowerPerf,
  GrowerTrendPoint,
  HouseDayRow,
  HouseMetrics,
  HouseSeries,
  HouseTrend,
  PortfolioData,
  ProjectionLine,
  ProjectionPoint,
  SupervisorCaptureData,
  WeightBandData,
  WeightProjection,
  YesterdayEntry,
} from "@/lib/view";
import {
  BATCH,
  BENCHMARK,
  CATCHING_EVENTS,
  CONTRACT,
  CONTRACTOR,
  DAILY_ENTRIES,
  EDIT_LOG,
  FEED_DELIVERIES,
  GROWER_PROFILES,
  type GrowerProfile,
  HISTORICAL_BATCHES,
  type HistoricalBatchSeed,
  MANIFEST,
  nextHouseId,
  OTHER_CONTRACTOR,
  PAST_CYCLES,
  PLACEMENTS,
  PLANNED_BATCH,
  SITE,
  VACCINATION_SCHEDULE,
  WEIGHT_ENTRIES,
} from "./mock";
import { ROSS_308_CURVE, ROSS_308_OVERLAY, mortalityBandPctAt, ross308At } from "./ross308";
import { addDays, daysBetween } from "@/lib/format";
import { dailyTotals } from "@/lib/calc";
import {
  DEFAULT_THRESHOLDS,
  evaluateFcr,
  evaluateMortality,
  evaluatePlacement,
  evaluateWeight,
  type EngineContext,
  type MetricStatus,
  type PlacementMetrics,
} from "@/lib/engine";

/** Benchmark context the status engine scores against (Ross 308 + overlay). */
const ENGINE_CTX: EngineContext = { curve: ROSS_308_CURVE, overlay: ROSS_308_OVERLAY };

/** Build the engine's metric inputs for a placement from its latest figures. */
function metricInputFor(placementId: string): PlacementMetrics | null {
  const placement = PLACEMENTS.find((p) => p.id === placementId);
  if (!placement) return null;
  const daily = DAILY_ENTRIES.filter((e) => e.placementId === placementId).sort((a, b) => a.day - b.day);
  const latest = daily[daily.length - 1];
  const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === placementId).sort((a, b) => a.day - b.day);
  const weight = weights[weights.length - 1];

  let fcr: number | undefined;
  if (weight) {
    const cumFeed = daily.filter((e) => e.day <= weight.day).reduce((s, e) => s + e.feedAddedKg, 0);
    const remaining = (daily.find((e) => e.day === weight.day) ?? latest)?.birdsRemaining ?? placement.placedCount;
    const liveKg = (weight.avgWeightG / 1000) * remaining;
    if (liveKg) fcr = Number((cumFeed / liveKg).toFixed(2));
  }

  return {
    day: placement.dayCount,
    weightG: weight?.avgWeightG,
    weightDay: weight?.day,
    fcr,
    cumMortPct: latest?.cumPct,
    feedAddedPerBirdG: latest && latest.birdsRemaining ? (latest.feedAddedKg * 1000) / latest.birdsRemaining : undefined,
  };
}

/** Engine-scored status breakdown for one house (sync core). */
function houseDiagnostics(houseId: string): { overall: Status; metrics: MetricStatus[] } {
  const placement = PLACEMENTS.find((p) => p.houseId === houseId);
  const input = placement ? metricInputFor(placement.id) : null;
  if (!input) return { overall: { metric: "Status", level: "green", actualVsTarget: "No data yet" }, metrics: [] };
  return evaluatePlacement(input, ENGINE_CTX);
}

function houseStatusSync(houseId: string): Status {
  return houseDiagnostics(houseId).overall;
}

/** The demo "now" — the day the Nhunge cycle-85 figures were captured against. */
export const DEMO_TODAY = "2026-06-16";

/** Local async wrapper — one place to add latency/loading simulation later. */
function resolve<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// --- Site / contractor -----------------------------------------------------

export function getSite(): Promise<Site> {
  return resolve(SITE);
}

export function getHouses(): Promise<House[]> {
  return resolve(SITE.houses);
}

export function getHouse(houseId: string): Promise<House | undefined> {
  return resolve(SITE.houses.find((h) => h.id === houseId));
}

export function getContractor(): Promise<Contractor> {
  return resolve(CONTRACTOR);
}

export function getContract(): Promise<Contract> {
  return resolve(CONTRACT);
}

// --- Batches / placements --------------------------------------------------

export function getActiveBatches(): Promise<Batch[]> {
  return resolve([BATCH]);
}

export function getActiveBatch(): Promise<Batch> {
  return resolve(BATCH);
}

export function getPlacements(batchId: string = BATCH.id): Promise<Placement[]> {
  return resolve(PLACEMENTS.filter((p) => p.batchId === batchId));
}

export function getPlacementForHouse(houseId: string): Promise<Placement | undefined> {
  return resolve(PLACEMENTS.find((p) => p.houseId === houseId));
}

// --- Daily entries ---------------------------------------------------------

/** All daily entries for a house, oldest → newest. */
export async function getHouseDailyEntries(houseId: string): Promise<DailyEntry[]> {
  const placement = PLACEMENTS.find((p) => p.houseId === houseId);
  if (!placement) return [];
  return resolve(
    DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day),
  );
}

export async function getLatestDailyEntry(houseId: string): Promise<DailyEntry | undefined> {
  const entries = await getHouseDailyEntries(houseId);
  return entries[entries.length - 1];
}

// --- Weights ---------------------------------------------------------------

export function getWeightEntries(): Promise<WeightEntry[]> {
  return resolve(WEIGHT_ENTRIES);
}

export async function getLatestWeight(houseId: string): Promise<WeightEntry | undefined> {
  const placement = PLACEMENTS.find((p) => p.houseId === houseId);
  if (!placement) return undefined;
  const ours = WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id).sort((a, b) => a.day - b.day);
  return resolve(ours[ours.length - 1]);
}

// --- Feed / catching / benchmark -------------------------------------------

export function getFeedDeliveries(siteId: string = SITE.id): Promise<FeedDelivery[]> {
  return resolve(FEED_DELIVERIES.filter((f) => f.siteId === siteId));
}

export function getCatchingEvents(batchId: string = BATCH.id): Promise<CatchingEvent[]> {
  return resolve(CATCHING_EVENTS.filter((c) => c.batchId === batchId));
}

export function getBenchmark(): Promise<BenchmarkSet> {
  return resolve(BENCHMARK);
}

// --- Status (rule-based engine vs Ross 308 + overlay; ROADMAP §8 Phase 3) ---

export function getHouseStatus(houseId: string): Promise<Status | undefined> {
  return resolve(houseStatusSync(houseId));
}

/** Every house's current status, in house order. */
export function getHouseStatuses(): Promise<{ houseId: string; status: Status }[]> {
  return resolve(SITE.houses.map((h) => ({ houseId: h.id, status: houseStatusSync(h.id) })));
}

/** Full per-metric breakdown for a house (weight, mortality, FCR, feed). */
export function getHouseDiagnostics(houseId: string): Promise<{ overall: Status; metrics: MetricStatus[] }> {
  return resolve(houseDiagnostics(houseId));
}

/** Houses needing attention (amber/red), red first — the grower alerts list. */
export async function getAlerts(): Promise<FlockAlert[]> {
  const order: Record<StatusLevel, number> = { red: 0, amber: 1, green: 2 };
  const alerts = SITE.houses
    .map((h) => ({ houseId: h.id, houseName: h.name, status: houseStatusSync(h.id) }))
    .filter((a) => a.status.level !== "green");
  alerts.sort((a, b) => order[a.status.level] - order[b.status.level]);
  return resolve(alerts);
}

// --- Projection (formula-based; ROADMAP §9 — ML deferred) ------------------

/**
 * Projects each house's weight to the contractor kill date from its latest
 * weigh-in and daily gain, compared to the Ross 308 objective at that age.
 * Deliberately simple and explainable: current weight + dailyGain × days left.
 */
export async function getProjection(today: string = DEMO_TODAY): Promise<BatchProjection> {
  const levelFor = (pct: number): StatusLevel => (pct >= 98 ? "green" : pct >= 90 ? "amber" : "red");

  const houses: HouseProjection[] = [];
  for (const placement of PLACEMENTS) {
    const house = SITE.houses.find((h) => h.id === placement.houseId);
    const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id).sort((a, b) => a.day - b.day);
    const weight = weights[weights.length - 1];
    if (!house || !weight) continue;
    const killDay = daysBetween(placement.placingDate, BATCH.killDate);
    const daysLeft = Math.max(0, killDay - weight.day);
    const projectedWeightG = Math.round(weight.avgWeightG + weight.adgG * daysLeft);
    const targetWeightG = ross308At(killDay).weightG;
    const pctOfTarget = Math.round((projectedWeightG / targetWeightG) * 100);
    houses.push({
      houseId: house.id,
      houseName: house.name,
      weightDay: weight.day,
      currentWeightG: weight.avgWeightG,
      dailyGainG: weight.adgG,
      killDay,
      projectedWeightG,
      targetWeightG,
      pctOfTarget,
      level: levelFor(pctOfTarget),
    });
  }

  const projectedAvgWeightG = houses.length
    ? Math.round(houses.reduce((s, h) => s + h.projectedWeightG, 0) / houses.length)
    : 0;
  const targetAvgWeightG = houses.length
    ? Math.round(houses.reduce((s, h) => s + h.targetWeightG, 0) / houses.length)
    : 0;
  const pctOfTarget = targetAvgWeightG ? Math.round((projectedAvgWeightG / targetAvgWeightG) * 100) : 0;
  const level = levelFor(pctOfTarget);
  const under = 100 - pctOfTarget;
  const verdict =
    level === "green"
      ? "On track to meet the target weight by the kill date."
      : `Projected about ${under}% under target weight by the kill date. Lift feed intake to close the gap.`;

  return resolve({
    killDate: BATCH.killDate,
    daysToKill: daysBetween(today, BATCH.killDate),
    projectedAvgWeightG,
    targetAvgWeightG,
    pctOfTarget,
    level,
    verdict,
    houses,
  });
}

// --- Rollups ---------------------------------------------------------------

export interface SiteRollup {
  placed: number;
  remaining: number;
  cumMort: number;
  mortPct: number;
  houseCount: number;
}

/** Site average across all houses' latest entries (the block growers hand-tally). */
export async function getSiteRollup(): Promise<SiteRollup> {
  let placed = 0;
  let remaining = 0;
  let cumMort = 0;
  for (const placement of PLACEMENTS) {
    placed += placement.placedCount;
    const entries = DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day);
    const latest = entries[entries.length - 1];
    if (latest) {
      remaining += latest.birdsRemaining;
      cumMort += latest.cumMort;
    }
  }
  const mortPct = placed ? Number(((cumMort / placed) * 100).toFixed(2)) : 0;
  return resolve({ placed, remaining, cumMort, mortPct, houseCount: PLACEMENTS.length });
}

// --- Supervisor capture (the single, minimal capture screen) ---------------

/**
 * Per-house context for the supervisor's capture-first home: the day being
 * recorded, the figures today's losses/feed add onto, and the Ross 308 +
 * contractor guideline values shown as plain descriptions (target weight,
 * expected cumulative mortality, feed intake), plus whether today is a
 * vaccination day for the house. Computed server-side so the calm capture
 * screen stays a thin client. Becomes a Convex query behind the same signature.
 */
export async function getSupervisorCapture(): Promise<SupervisorCaptureData> {
  const houses: CaptureHouse[] = [];
  for (const house of SITE.houses) {
    const placement = PLACEMENTS.find((p) => p.houseId === house.id);
    if (!placement) continue;
    const entries = DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day);
    const latest = entries[entries.length - 1];
    const day = (latest?.day ?? 0) + 1;
    const placed = placement.placedCount;
    const priorCumMort = latest?.cumMort ?? 0;
    const ross = ross308At(day);
    const vac = VACCINATION_SCHEDULE.find((v) => v.day === day);
    houses.push({
      id: house.id,
      name: house.name,
      placedCount: placed,
      remaining: placed - priorCumMort,
      day,
      priorCumMort,
      priorCumPct: placed ? Number(((priorCumMort / placed) * 100).toFixed(2)) : 0,
      lastFeedKg: latest?.feedAddedKg ?? 0,
      rossTargetWeightG: ross.weightG,
      rossIntakeG: ross.dailyIntakeG,
      standardCumMortPct: Number(mortalityBandPctAt(day).toFixed(2)),
      vaccination: vac ? { vaccines: vac.vaccines, method: vac.method } : undefined,
    });
  }
  return resolve({
    siteName: SITE.name,
    cycleNo: BATCH.cycleNo,
    breed: BATCH.breed,
    today: DEMO_TODAY,
    houses,
  });
}

// --- Writes (stub seam; persistence is Phase 1 → Convex mutation) ----------

export interface DailyUpdateInput {
  houseId: string;
  date: string;
  day: number;
  /** Birds found dead during the day. */
  dayMortality: number;
  /** Birds found dead overnight. */
  nightMortality: number;
  culls: number;
  feedAddedKg: number;
  tempC?: number;
  /** Optional consumables (collapsed by default in capture). */
  charcoal?: Amount;
  vaccines?: TreatmentEntry[];
  medications?: TreatmentEntry[];
}

/**
 * Computes the derived figures (the wedge: cull&mort, cumMort, cum%, remaining)
 * and returns the resulting entry for echo-back confirmation. Mortality is the
 * sum of the day and night counts. Does NOT persist yet — Phase 1 wires the
 * form; the real write becomes a Convex mutation.
 */
export async function submitDailyUpdate(input: DailyUpdateInput): Promise<DailyEntry> {
  const placement = PLACEMENTS.find((p) => p.houseId === input.houseId);
  const prior = placement
    ? DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day).slice(-1)[0]
    : undefined;
  const placed = placement?.placedCount ?? 0;
  const mortality = input.dayMortality + input.nightMortality;
  const { cullAndMort, cumMort, birdsRemaining, cumPct } = dailyTotals({
    placed,
    priorCumMort: prior?.cumMort ?? 0,
    mortality,
    culls: input.culls,
  });
  return resolve({
    id: `${placement?.id ?? input.houseId}-d${input.day}`,
    placementId: placement?.id ?? input.houseId,
    date: input.date,
    day: input.day,
    dayMortality: input.dayMortality,
    nightMortality: input.nightMortality,
    mortality,
    culls: input.culls,
    feedAddedKg: input.feedAddedKg,
    tempC: input.tempC,
    charcoal: input.charcoal,
    vaccines: input.vaccines,
    medications: input.medications,
    cullAndMort,
    cumMort,
    cumPct,
    birdsRemaining,
  });
}

export interface FeedDeliveryInput {
  date: string;
  feedType: string;
  bagSizeKg: number;
  bagCount: number;
  netWeightKg: number;
}

export interface FeedReconciliation {
  nominalKg: number;
  netWeightKg: number;
  diffKg: number;
  diffPct: number;
  /** True when the weighed net differs from nominal beyond tolerance. */
  flagged: boolean;
}

/** Reconciles a feed delivery (nominal bags × size vs weighed net). Not persisted yet. */
export async function submitFeedDelivery(input: FeedDeliveryInput): Promise<FeedReconciliation> {
  const nominalKg = input.bagSizeKg * input.bagCount;
  const diffKg = nominalKg - input.netWeightKg;
  const diffPct = nominalKg ? Number(((diffKg / nominalKg) * 100).toFixed(1)) : 0;
  return resolve({
    nominalKg,
    netWeightKg: input.netWeightKg,
    diffKg,
    diffPct,
    flagged: Math.abs(diffPct) >= 1,
  });
}

export interface WeightsInput {
  houseId: string;
  day: number;
  avgWeightG: number;
  adgG: number;
  growthRatio: number;
  uniformityPct: number;
}

export interface WeightsResult {
  entry: WeightEntry;
  targetWeightG: number;
  pctOfTarget: number;
}

/** Records a weigh-in and compares it to the Ross 308 objective for the day. Not persisted yet. */
export async function submitWeights(input: WeightsInput): Promise<WeightsResult> {
  const placement = PLACEMENTS.find((p) => p.houseId === input.houseId);
  const targetWeightG = ross308At(input.day).weightG;
  const pctOfTarget = targetWeightG ? Math.round((input.avgWeightG / targetWeightG) * 100) : 0;
  return resolve({
    entry: {
      id: `${placement?.id ?? input.houseId}-w${input.day}`,
      placementId: placement?.id ?? input.houseId,
      day: input.day,
      avgWeightG: input.avgWeightG,
      adgG: input.adgG,
      growthRatio: input.growthRatio,
      uniformityPct: input.uniformityPct,
    },
    targetWeightG,
    pctOfTarget,
  });
}

// --- Manager corrections (maker-checker; ROADMAP §5/§9 — Clerk seam) --------

/** Plain labels for the audit trail and the edit panel. */
const EDITABLE_FIELD_LABELS: Record<EditableField, string> = {
  dayMortality: "Day mortality",
  nightMortality: "Night mortality",
  culls: "Culls",
  feedAddedKg: "Feed added (kg)",
  tempC: "Temperature (°C)",
};

export interface ManagerEditInput {
  /** The DailyEntry id being corrected. */
  entityId: string;
  /** Who is making the correction (the auth-stub manager today → Clerk later). */
  editor: { id: string; name: string; role: Role };
  /** Only the fields that changed; `null` clears an optional field (temp). */
  changes: Partial<Record<EditableField, number | null>>;
  /** Optional reason recorded with the correction. */
  note?: string;
}

export interface ManagerEditResult {
  entry: DailyEntry;
  records: EditRecord[];
}

/**
 * Re-derives a placement's cumulative chain after an entry's raw figures change
 * — mortality cascades forward (cum mort, cum %, birds remaining), so every
 * later day for the house is recomputed from the same pure arithmetic the
 * capture path uses. Writes back to the mock entries so every downstream read
 * (history, rollup, status engine) reflects the correction.
 */
function rederivePlacement(placementId: string): void {
  const placement = PLACEMENTS.find((p) => p.id === placementId);
  if (!placement) return;
  const entries = DAILY_ENTRIES.filter((e) => e.placementId === placementId).sort((a, b) => a.day - b.day);
  let priorCumMort = 0;
  for (const e of entries) {
    e.mortality = e.dayMortality + e.nightMortality;
    const t = dailyTotals({ placed: placement.placedCount, priorCumMort, mortality: e.mortality, culls: e.culls });
    e.cullAndMort = t.cullAndMort;
    e.cumMort = t.cumMort;
    e.cumPct = t.cumPct;
    e.birdsRemaining = t.birdsRemaining;
    priorCumMort = t.cumMort;
  }
}

/**
 * Applies a manager's correction to a captured daily entry. Edits are deliberate
 * and ATTRIBUTED: each changed field becomes an EditRecord (who/when/old→new)
 * appended to the audit trail, the entry's raw value is updated, and the house's
 * cumulative chain is re-derived. Nothing is silently overwritten — re-editing a
 * field appends another record. Mock mutates module memory; becomes a Convex
 * mutation behind the same signature (with the editor resolved from the session).
 */
export async function submitManagerEdit(input: ManagerEditInput): Promise<ManagerEditResult> {
  const entry = DAILY_ENTRIES.find((e) => e.id === input.entityId);
  if (!entry) throw new Error(`Daily entry not found: ${input.entityId}`);
  const houseId = PLACEMENTS.find((p) => p.id === entry.placementId)?.houseId ?? "";
  const houseName = SITE.houses.find((h) => h.id === houseId)?.name ?? houseId;
  const editedAt = new Date().toISOString();

  const records: EditRecord[] = [];
  for (const field of Object.keys(input.changes) as EditableField[]) {
    const next = input.changes[field];
    if (next === undefined) continue;
    const old = (entry[field] ?? null) as number | null;
    if (old === next) continue; // no-op, don't record
    switch (field) {
      case "dayMortality": entry.dayMortality = next ?? 0; break;
      case "nightMortality": entry.nightMortality = next ?? 0; break;
      case "culls": entry.culls = next ?? 0; break;
      case "feedAddedKg": entry.feedAddedKg = next ?? 0; break;
      case "tempC": entry.tempC = next ?? undefined; break;
    }
    records.push({
      id: `edit_${entry.id}_${field}_${EDIT_LOG.length + records.length + 1}`,
      entityType: "dailyEntry",
      entityId: entry.id,
      placementId: entry.placementId,
      houseId,
      houseName,
      day: entry.day,
      field,
      fieldLabel: EDITABLE_FIELD_LABELS[field],
      oldValue: old,
      newValue: next,
      editedById: input.editor.id,
      editedByName: input.editor.name,
      editedByRole: input.editor.role,
      editedAt,
      note: input.note,
    });
  }

  if (records.length) {
    rederivePlacement(entry.placementId);
    EDIT_LOG.push(...records);
  }
  return resolve({ entry: { ...entry }, records });
}

/** The audit trail — all corrections, or those for one entry, newest first. */
export function getEditLog(entityId?: string): Promise<EditRecord[]> {
  const rows = entityId ? EDIT_LOG.filter((r) => r.entityId === entityId) : [...EDIT_LOG];
  rows.sort((a, b) => (a.editedAt < b.editedAt ? 1 : a.editedAt > b.editedAt ? -1 : 0));
  return resolve(rows);
}

// ===========================================================================
// Contractor (Phase 2)
// ===========================================================================

export function getManifest(): Promise<Manifest> {
  return resolve(MANIFEST);
}

export function getPastCycles(): Promise<PastCycle[]> {
  return resolve(PAST_CYCLES);
}

/**
 * Per-house efficiency metrics for the portfolio / flock-overview table.
 * EPEF = (liveability% × liveweight kg) / (age days × FCR) × 100.
 * FCR is estimated from the Ross objective and worsened in proportion to the
 * weight shortfall (behind birds convert feed less efficiently) — explainable
 * and data-driven until consumed-feed capture lands.
 */
function houseMetrics(placement: Placement): HouseMetrics | null {
  const house = SITE.houses.find((h) => h.id === placement.houseId);
  if (!house) return null;
  const entries = DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day);
  const latest = entries[entries.length - 1];
  const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id).sort((a, b) => a.day - b.day);
  const weight = weights[weights.length - 1];
  const status = houseStatusSync(house.id);

  const placed = placement.placedCount;
  const remaining = latest?.birdsRemaining ?? placed;
  const ageDays = placement.dayCount;
  const livabilityPct = placed ? (remaining / placed) * 100 : 0;
  const avgWeightG = weight?.avgWeightG ?? 0;
  const rossW = ross308At(ageDays).weightG;
  const rossFcr = ross308At(ageDays).fcr ?? 1.3;
  const vsRossPct = rossW ? Math.round((avgWeightG / rossW) * 100) : 0;
  const fcr = avgWeightG ? Number((rossFcr * (rossW / avgWeightG)).toFixed(2)) : rossFcr;
  const epef = avgWeightG && ageDays ? Math.round((livabilityPct * (avgWeightG / 1000)) / (ageDays * fcr) * 100) : 0;

  return {
    houseId: house.id,
    houseName: house.name,
    day: ageDays,
    placed,
    remaining,
    livabilityPct: Number(livabilityPct.toFixed(1)),
    cumPct: latest?.cumPct ?? 0,
    avgWeightG,
    vsRossPct,
    fcr,
    epef,
    level: status?.level ?? "green",
    statusMetric: status?.metric ?? "Status",
  };
}

export async function getPortfolio(today: string = DEMO_TODAY): Promise<PortfolioData> {
  const rows = PLACEMENTS.map(houseMetrics).filter((r): r is HouseMetrics => r !== null);
  rows.sort((a, b) => b.epef - a.epef); // rank by EPEF, best first

  const projection = await getProjection(today);

  // Latest date any house is projected to reach the Ross target weight.
  let projectedReadyDate = BATCH.killDate;
  for (const placement of PLACEMENTS) {
    const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id).sort((a, b) => a.day - b.day);
    const weight = weights[weights.length - 1];
    if (!weight) continue;
    const killDay = daysBetween(placement.placingDate, BATCH.killDate);
    const target = ross308At(killDay).weightG;
    const daysToTarget = weight.adgG > 0 ? Math.ceil((target - weight.avgWeightG) / weight.adgG) : 0;
    const readyDate = addDays(placement.placingDate, weight.day + Math.max(0, daysToTarget));
    if (daysBetween(projectedReadyDate, readyDate) > 0) projectedReadyDate = readyDate;
  }

  const birdsOnSite = rows.reduce((s, r) => s + r.remaining, 0);
  const avgMortPct = rows.length ? Number((rows.reduce((s, r) => s + r.cumPct, 0) / rows.length).toFixed(2)) : 0;
  const avgEpef = rows.length ? Math.round(rows.reduce((s, r) => s + r.epef, 0) / rows.length) : 0;

  return resolve({
    summary: {
      siteName: SITE.name,
      farmCode: SITE.farmCode,
      cycleNo: BATCH.cycleNo,
      killDate: BATCH.killDate,
      daysToKill: projection.daysToKill,
      houseCount: rows.length,
      birdsOnSite,
      avgMortPct,
      avgEpef,
      projectedAvgWeightG: projection.projectedAvgWeightG,
      targetAvgWeightG: projection.targetAvgWeightG,
      pctOfTarget: projection.pctOfTarget,
      level: projection.level,
      projectedReadyDate,
    },
    rows,
  });
}

/** Per-grower drill-down: per-house detail with short trend series + track record. */
export async function getGrowerDetail(): Promise<GrowerDetailData> {
  const rollup = await getSiteRollup();
  const houses: HouseTrend[] = PLACEMENTS.map((placement): HouseTrend | null => {
    const house = SITE.houses.find((h) => h.id === placement.houseId);
    if (!house) return null;
    const entries = DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day);
    const latest = entries[entries.length - 1];
    const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id).sort((a, b) => a.day - b.day);
    const weight = weights[weights.length - 1];
    const rossW = weight ? ross308At(weight.day).weightG : 0;
    return {
      houseId: house.id,
      houseName: house.name,
      day: placement.dayCount,
      status: houseStatusSync(house.id),
      cumPct: latest?.cumPct ?? 0,
      remaining: latest?.birdsRemaining ?? placement.placedCount,
      avgWeightG: weight?.avgWeightG ?? 0,
      vsRossPct: weight && rossW ? Math.round((weight.avgWeightG / rossW) * 100) : 0,
      mortSeries: entries.map((e) => e.mortality),
      cumPctSeries: entries.map((e) => e.cumPct),
    };
  }).filter((h): h is HouseTrend => h !== null);

  return resolve({
    siteName: SITE.name,
    farmCode: SITE.farmCode,
    cycleNo: BATCH.cycleNo,
    breed: BATCH.breed,
    killDate: BATCH.killDate,
    rollup,
    houses,
    pastCycles: PAST_CYCLES,
  });
}

// ===========================================================================
// House setup + allocation (grower; ROADMAP §8 Phase 1)
// ===========================================================================

export interface HouseInput {
  /** Existing house id, or undefined for a newly added house. */
  id?: string;
  name: string;
  capacity: number;
}

/**
 * Persists the site's house list (mock: replaces SITE.houses in module memory).
 * New rows get a fresh id; capacities are coerced to positive integers. Becomes
 * a Convex mutation later behind the same signature.
 */
export async function saveHouses(inputs: HouseInput[]): Promise<House[]> {
  const houses: House[] = inputs
    .filter((h) => h.name.trim() !== "" && Number.isFinite(h.capacity) && h.capacity > 0)
    .map((h) => ({
      id: h.id ?? nextHouseId(),
      siteId: SITE.id,
      name: h.name.trim(),
      capacity: Math.round(h.capacity),
    }));
  SITE.houses = houses;
  return resolve(houses);
}

export function getSiteCapacity(): Promise<number> {
  return resolve(SITE.houses.reduce((s, h) => s + h.capacity, 0));
}

// --- Allocation recommendation --------------------------------------------

export interface Allocation {
  houseId: string;
  houseName: string;
  capacity: number;
  count: number;
}

export function getPlannedBatch(): Promise<PlannedBatch> {
  return resolve(PLANNED_BATCH);
}

/**
 * Recommends how to split `total` birds across houses: proportional to each
 * house's capacity (floored), capped at capacity, with the remainder given to
 * the largest house(s) by descending capacity. Pure and explainable.
 */
export function recommendAllocation(total: number, houses: House[] = SITE.houses): Allocation[] {
  const sumCap = houses.reduce((s, h) => s + h.capacity, 0) || 1;
  const alloc: Allocation[] = houses.map((h) => ({
    houseId: h.id,
    houseName: h.name,
    capacity: h.capacity,
    count: Math.min(h.capacity, Math.floor((total * h.capacity) / sumCap)),
  }));
  let remainder = total - alloc.reduce((s, a) => s + a.count, 0);
  // Hand the leftover to the largest house first, cascading if it fills up.
  const byCapDesc = [...alloc].sort((a, b) => b.capacity - a.capacity);
  for (const a of byCapDesc) {
    if (remainder <= 0) break;
    const room = a.capacity - a.count;
    const add = Math.min(room, remainder);
    a.count += add;
    remainder -= add;
  }
  return alloc;
}

export interface AllocatedHouse {
  houseId: string;
  houseName: string;
  count: number;
  /** House age on `placingDate` relative to today (0 = placed today). */
  dayCount: number;
}

/**
 * Confirms an allocation for the planned batch (mock: flips `allocated` and
 * records the split). Returns each house's placed count and resulting day-count.
 * The confirmed split is persisted client-side (see lib/allocationStore) so the
 * done-state survives navigation; this seam becomes a Convex mutation later.
 */
export async function confirmAllocation(
  allocations: { houseId: string; count: number }[],
  today: string = DEMO_TODAY,
): Promise<AllocatedHouse[]> {
  const dayCount = Math.max(0, daysBetween(PLANNED_BATCH.placingDate, today));
  PLANNED_BATCH.allocated = true;
  return resolve(
    allocations
      .filter((a) => a.count > 0)
      .map((a) => {
        const house = SITE.houses.find((h) => h.id === a.houseId);
        return { houseId: a.houseId, houseName: house?.name ?? a.houseId, count: a.count, dayCount };
      }),
  );
}

// ===========================================================================
// Batch history — full day-by-day per-house series + batch rollup (charts/tables)
// ===========================================================================

/**
 * Assembles a batch's whole history from raw placements/daily/weigh records:
 * each house's day-by-day rows (daily mort %, cumulative %, feed, temperature,
 * and weigh-day weight/ADG/uniformity with vs-Ross and an estimated FCR), the
 * batch-level rollup per day (carry-forward so staggered houses still aggregate
 * cleanly), plus the Ross 308 objective and the contractor mortality band for
 * chart overlays. Pure: the current batch reads module data, a closed batch
 * passes generated data — both produce the identical shape, so the History &
 * Charts view renders either without forking.
 */
function assembleBatchHistory(
  placements: Placement[],
  daily: DailyEntry[],
  weights: WeightEntry[],
  nameOf: (houseId: string) => string,
): BatchHistory {
  const maxDay = Math.max(
    ...placements.map((p) => p.dayCount),
    ...weights.map((w) => w.day),
  );
  const placedTotal = placements.reduce((s, p) => s + p.placedCount, 0);

  // Per-house as-of arrays (index by day) so the batch rollup can carry forward.
  interface Prepared {
    placement: Placement;
    houseName: string;
    asOfCum: number[];
    asOfRem: number[];
    cumFeedAsOf: number[];
    exactMort: number[];
    exactCulls: number[];
    exactFeed: number[];
    hasDay: boolean[];
    weighByDay: Map<number, HouseDayRow["weigh"]>;
    series: HouseSeries;
  }

  const prepared: Prepared[] = placements.map((p) => {
    const houseName = nameOf(p.houseId);
    const entries = daily.filter((e) => e.placementId === p.id);
    const entriesByDay = new Map(entries.map((e) => [e.day, e]));
    const weighs = weights.filter((w) => w.placementId === p.id).sort((a, b) => a.day - b.day);

    const asOfCum: number[] = [];
    const asOfRem: number[] = [];
    const cumFeedAsOf: number[] = [];
    const exactMort: number[] = [];
    const exactCulls: number[] = [];
    const exactFeed: number[] = [];
    const hasDay: boolean[] = [];

    let lastCum = 0;
    let lastRem = p.placedCount;
    let runFeed = 0;
    let lastDate = dateForDay(p, 0);
    const dateByDay = new Map<number, string>();
    for (let d = 1; d <= maxDay; d++) {
      const e = entriesByDay.get(d);
      if (e) {
        lastCum = e.cumMort;
        lastRem = e.birdsRemaining;
        runFeed += e.feedAddedKg;
        lastDate = e.date;
        exactMort[d] = e.mortality;
        exactCulls[d] = e.culls;
        exactFeed[d] = e.feedAddedKg;
        hasDay[d] = true;
      } else {
        exactMort[d] = 0;
        exactCulls[d] = 0;
        exactFeed[d] = 0;
        hasDay[d] = false;
      }
      asOfCum[d] = lastCum;
      asOfRem[d] = lastRem;
      cumFeedAsOf[d] = runFeed;
      dateByDay.set(d, e ? e.date : addDays(lastDate, d - (entries.length ? entries[entries.length - 1].day : 0)));
    }

    // Weigh points with vs-Ross and FCR.
    const weighByDay = new Map<number, HouseDayRow["weigh"]>();
    for (const w of weighs) {
      const rossW = ROSS_308_CURVE[w.day]?.weightG ?? 0;
      const rem = asOfRem[w.day] ?? lastRem;
      const cumFeed = cumFeedAsOf[w.day] ?? runFeed;
      const liveKg = (w.avgWeightG / 1000) * rem;
      weighByDay.set(w.day, {
        avgWeightG: w.avgWeightG,
        adgG: w.adgG,
        growthRatio: w.growthRatio,
        uniformityPct: w.uniformityPct,
        vsRossPct: rossW ? Math.round((w.avgWeightG / rossW) * 100) : 0,
        fcr: liveKg ? Number((cumFeed / liveKg).toFixed(2)) : 0,
      });
    }

    // House rows: every day that has a daily entry or a weigh-in.
    const dayset = new Set<number>([...entries.map((e) => e.day), ...weighs.map((w) => w.day)]);
    const rows: HouseDayRow[] = [...dayset]
      .sort((a, b) => a - b)
      .map((d) => {
        const e = entriesByDay.get(d);
        return {
          day: d,
          date: dateByDay.get(d) ?? "",
          mortality: exactMort[d] ?? 0,
          culls: exactCulls[d] ?? 0,
          cumMort: asOfCum[d] ?? 0,
          cumPct: Number(((asOfCum[d] / p.placedCount) * 100).toFixed(2)),
          dailyMortPct: Number((((exactMort[d] ?? 0) / p.placedCount) * 100).toFixed(3)),
          feedAddedKg: exactFeed[d] ?? 0,
          tempC: e?.tempC,
          weigh: weighByDay.get(d),
          entryId: e?.id,
          dayMortality: e?.dayMortality,
          nightMortality: e?.nightMortality,
        };
      });

    return {
      placement: p,
      houseName,
      asOfCum,
      asOfRem,
      cumFeedAsOf,
      exactMort,
      exactCulls,
      exactFeed,
      hasDay,
      weighByDay,
      series: { houseId: p.houseId, houseName, placedCount: p.placedCount, rows },
    };
  });

  // Batch rollup per day.
  const batch = [];
  for (let d = 1; d <= maxDay; d++) {
    let mortality = 0;
    let culls = 0;
    let cumMort = 0;
    let feedAddedKg = 0;
    let remaining = 0;
    let wWeight = 0;
    let wRem = 0;
    let cumFeedSum = 0;
    let liveKgSum = 0;
    let hasWeigh = false;
    for (const ph of prepared) {
      cumMort += ph.asOfCum[d] ?? 0;
      remaining += ph.asOfRem[d] ?? 0;
      mortality += ph.exactMort[d] ?? 0;
      culls += ph.exactCulls[d] ?? 0;
      feedAddedKg += ph.exactFeed[d] ?? 0;
      const wp = ph.weighByDay.get(d);
      if (wp) {
        hasWeigh = true;
        const rem = ph.asOfRem[d] ?? 0;
        wWeight += wp.avgWeightG * rem;
        wRem += rem;
        cumFeedSum += ph.cumFeedAsOf[d] ?? 0;
        liveKgSum += (wp.avgWeightG / 1000) * rem;
      }
    }
    const avgWeightG = hasWeigh && wRem ? Math.round(wWeight / wRem) : undefined;
    const rossW = ROSS_308_CURVE[d]?.weightG ?? 0;
    batch.push({
      day: d,
      date: prepared[0]?.series.rows.find((r) => r.day === d)?.date ?? "",
      mortality,
      culls,
      cumMort,
      cumPct: Number(((cumMort / placedTotal) * 100).toFixed(2)),
      dailyMortPct: Number(((mortality / placedTotal) * 100).toFixed(3)),
      feedAddedKg,
      placed: placedTotal,
      remaining,
      avgWeightG,
      vsRossPct: avgWeightG && rossW ? Math.round((avgWeightG / rossW) * 100) : undefined,
      fcr: hasWeigh && liveKgSum ? Number((cumFeedSum / liveKgSum).toFixed(2)) : undefined,
    });
  }

  const ross = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    const pt = ROSS_308_CURVE[day];
    return { day, weightG: pt?.weightG ?? 0, fcr: pt?.fcr ?? null };
  });

  return {
    maxDay,
    placed: placedTotal,
    houses: prepared.map((ph) => ph.series),
    batch,
    ross,
    mortalityBand: ROSS_308_OVERLAY.mortalityBand,
  };
}

/** The current batch's full day-by-day history (real captured data). */
export function getBatchHistory(): Promise<BatchHistory> {
  return resolve(
    assembleBatchHistory(PLACEMENTS, DAILY_ENTRIES, WEIGHT_ENTRIES, (id) =>
      SITE.houses.find((h) => h.id === id)?.name ?? id,
    ),
  );
}

/** ISO date for a placement's day-of-cycle (placing date = day 0). */
function dateForDay(p: Placement, day: number): string {
  return addDays(p.placingDate, day);
}

// ===========================================================================
// Batch comparison — overlay trends across batches, aligned by day of cycle
// ===========================================================================

const rossOf = (d: number) => ROSS_308_CURVE[Math.max(0, Math.min(d, ROSS_308_CURVE.length - 1))];

/** First day (or projected day) a batch reaches the target weight. */
function projectDaysToTarget(series: ComparePoint[], target: number, finalDay: number): number {
  for (const p of series) {
    if (p.avgWeightG != null && p.avgWeightG >= target) return p.day;
  }
  const weighed = series.filter((p) => p.avgWeightG != null);
  if (weighed.length < 2) return finalDay;
  const last = weighed[weighed.length - 1];
  const prev = weighed[weighed.length - 2];
  const gain = (last.avgWeightG! - prev.avgWeightG!) / (last.day - prev.day) || 1;
  return last.day + Math.ceil((target - last.avgWeightG!) / Math.max(gain, 1));
}

/** Build a closed batch's day-of-cycle curve toward its documented final result. */
function genComparable(seed: (typeof HISTORICAL_BATCHES)[number]): ComparableBatch {
  const killDay = daysBetween(seed.placingDate, seed.killDate);
  const finalRossW = rossOf(seed.finalDay).weightG || seed.finalWeightG;
  const finalFactor = seed.finalWeightG / finalRossW;
  const k = 2.4;
  const denom = 1 - Math.exp(-k);

  const series: ComparePoint[] = [];
  let prevCum = 0;
  for (let d = 1; d <= seed.finalDay; d++) {
    const cumPct = Number(((seed.finalCumMortPct * (1 - Math.exp((-k * d) / seed.finalDay))) / denom).toFixed(3));
    const dailyMortPct = Number(Math.max(0, cumPct - prevCum).toFixed(3));
    prevCum = cumPct;
    const factor = 0.97 + (finalFactor - 0.97) * ((d - 1) / (seed.finalDay - 1));
    const rossW = rossOf(d).weightG;
    const avgWeightG = Math.round(rossW * factor);
    const rossFcr = rossOf(d).fcr ?? seed.finalFcr;
    const fcr = avgWeightG ? Number((rossFcr * (rossW / avgWeightG)).toFixed(2)) : seed.finalFcr;
    series.push({ day: d, dailyMortPct, cumPct, avgWeightG, vsRossPct: rossW ? Math.round((avgWeightG / rossW) * 100) : 0, fcr });
  }

  // Pin the final point to the documented result (keeps summary == track record).
  const last = series[series.length - 1];
  last.avgWeightG = seed.finalWeightG;
  last.vsRossPct = Math.round((seed.finalWeightG / finalRossW) * 100);
  last.cumPct = seed.finalCumMortPct;
  last.fcr = seed.finalFcr;

  const targetWeightG = rossOf(killDay).weightG;
  const daysToTarget = projectDaysToTarget(series, targetWeightG, seed.finalDay);

  return {
    id: `batch_c${seed.cycleNo}`,
    cycleNo: seed.cycleNo,
    label: `Cycle ${seed.cycleNo}`,
    status: "closed",
    placingDate: seed.placingDate,
    killDate: seed.killDate,
    killDay,
    finalDay: seed.finalDay,
    series,
    weightG: seed.finalWeightG,
    vsRossPct: last.vsRossPct ?? 0,
    cumMortPct: seed.finalCumMortPct,
    fcr: seed.finalFcr,
    targetWeightG,
    daysToTarget,
    readyVsKillDays: daysToTarget - killDay,
  };
}

/**
 * Comparable batches for the grower's trend view: the current batch (from real
 * day-by-day history) plus the closed historical batches (generated curves),
 * each aligned by day of cycle, with a summary of key results.
 */
export async function getComparableBatches(): Promise<CompareData> {
  const history = await getBatchHistory();
  const placing = PLACEMENTS.reduce((min, p) => (p.placingDate < min ? p.placingDate : min), PLACEMENTS[0].placingDate);
  const killDay = daysBetween(placing, BATCH.killDate);

  const series: ComparePoint[] = history.batch.map((r) => ({
    day: r.day,
    dailyMortPct: r.dailyMortPct,
    cumPct: r.cumPct,
    avgWeightG: r.avgWeightG,
    vsRossPct: r.vsRossPct,
    fcr: r.fcr,
  }));
  const lastWeighed = [...history.batch].reverse().find((r) => r.avgWeightG != null);
  const lastRow = history.batch[history.batch.length - 1];
  const targetWeightG = rossOf(killDay).weightG;
  const daysToTarget = projectDaysToTarget(series, targetWeightG, history.maxDay);

  const current: ComparableBatch = {
    id: BATCH.id,
    cycleNo: BATCH.cycleNo,
    label: `Cycle ${BATCH.cycleNo}`,
    status: "current",
    placingDate: placing,
    killDate: BATCH.killDate,
    killDay,
    finalDay: history.maxDay,
    series,
    weightG: lastWeighed?.avgWeightG ?? 0,
    vsRossPct: lastWeighed?.vsRossPct ?? 0,
    cumMortPct: Number((lastRow?.cumPct ?? 0).toFixed(2)),
    fcr: lastWeighed?.fcr ?? 0,
    targetWeightG,
    daysToTarget,
    readyVsKillDays: daysToTarget - killDay,
  };

  const batches = [current, ...HISTORICAL_BATCHES.map(genComparable)].sort((a, b) => b.cycleNo - a.cycleNo);
  const maxDay = Math.max(...batches.map((b) => Math.max(b.finalDay, b.killDay)));
  const ross = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    const pt = rossOf(day);
    return { day, weightG: pt.weightG, fcr: pt.fcr };
  });

  return resolve({ batches, ross, maxDay });
}

// ===========================================================================
// Batch archive — the "Previous batches" table + per-batch detail history
// (manager profile). The current batch reads real captured data; closed batches
// generate a full per-house day-by-day history deterministically from their
// summary seed (the same approach as the generated growers/comparison curves),
// so the History & Charts view renders either without forking.
// ===========================================================================

const ARCHIVE_HOUSE_COUNT = 6;
const ARCHIVE_PLACED_BASE = 16_100;

interface GeneratedBatch {
  placements: Placement[];
  daily: DailyEntry[];
  weights: WeightEntry[];
  nameOf: (houseId: string) => string;
}

/** Synthesise a closed batch's per-house placements/daily/weigh records. */
function genClosedBatchData(seed: HistoricalBatchSeed): GeneratedBatch {
  const batchId = `batch_c${seed.cycleNo}`;
  const finalDay = seed.finalDay;
  const finalRossW = rossOf(finalDay).weightG || seed.finalWeightG;
  const placements: Placement[] = [];
  const daily: DailyEntry[] = [];
  const weights: WeightEntry[] = [];
  const names: Record<string, string> = {};

  for (let i = 0; i < ARCHIVE_HOUSE_COUNT; i++) {
    const houseId = `${batchId}-h${i + 1}`;
    const placementId = `${batchId}-p${i + 1}`;
    names[houseId] = `House ${i + 1}`;
    // Symmetric per-house variation, so the batch mean tracks the seed's finals.
    const centered = i - (ARCHIVE_HOUSE_COUNT - 1) / 2; // −2.5 … +2.5
    const placed = ARCHIVE_PLACED_BASE + Math.round(centered * 40);
    const hCumPct = Number(Math.max(0, seed.finalCumMortPct * (1 + centered * 0.08)).toFixed(2));
    const hFinalWeight = Math.round(seed.finalWeightG * (1 + centered * 0.006));

    placements.push({ id: placementId, batchId, houseId, placedCount: placed, placingDate: seed.placingDate, dayCount: finalDay });

    // Front-loaded daily mortality summing to the house's cumulative %.
    const { mortSeries } = genHouseDaily(placed, finalDay, hCumPct);
    let cum = 0;
    for (let d = 1; d <= finalDay; d++) {
      const mort = mortSeries[d - 1] ?? 0;
      cum += mort;
      const birdsRemaining = placed - cum;
      const intakeG = rossOf(d).dailyIntakeG ?? 0;
      const feedAddedKg = Math.round(((intakeG * birdsRemaining) / 1000) * 1.06);
      const nightMortality = Math.round(mort * 0.35);
      daily.push({
        id: `${placementId}-d${d}`,
        placementId,
        date: addDays(seed.placingDate, d),
        day: d,
        dayMortality: mort - nightMortality,
        nightMortality,
        mortality: mort,
        culls: 0,
        feedAddedKg,
        cullAndMort: mort,
        cumMort: cum,
        cumPct: Number(((cum / placed) * 100).toFixed(2)),
        birdsRemaining,
      });
    }

    // Weigh-ins climbing toward the house's final weight (same shape as live).
    const finalFactor = hFinalWeight / finalRossW;
    const weighDays = [7, 14, 21, finalDay].filter((d, idx, arr) => d <= finalDay && arr.indexOf(d) === idx);
    let prevW = rossOf(0).weightG;
    let prevD = 0;
    for (const d of weighDays) {
      const isFinal = d === finalDay;
      const frac = finalDay > 7 ? (d - 7) / (finalDay - 7) : 1;
      const factor = 0.96 + (finalFactor - 0.96) * frac;
      const avgWeightG = isFinal ? hFinalWeight : Math.round(rossOf(d).weightG * factor);
      const adgG = d > prevD ? Math.round((avgWeightG - prevW) / (d - prevD)) : 0;
      weights.push({
        id: `${placementId}-w${d}`,
        placementId,
        day: d,
        avgWeightG,
        adgG,
        growthRatio: 1.2,
        uniformityPct: Math.round(74 - centered),
      });
      prevW = avgWeightG;
      prevD = d;
    }
  }

  return { placements, daily, weights, nameOf: (id) => names[id] ?? id };
}

/** Vaccinations whose scheduled day falls within a grow-out of `finalDay`. */
function vaccinesUpTo(finalDay: number): string[] {
  return VACCINATION_SCHEDULE.filter((v) => v.day <= finalDay).flatMap((v) => v.vaccines);
}

/**
 * Full day-by-day history for any batch in the archive. The current batch reads
 * the real captured data; a closed batch is assembled from its generated
 * records. Returns null for an unknown id (the detail route 404s).
 */
export async function getArchivedBatchHistory(batchId: string): Promise<BatchHistory | null> {
  if (batchId === BATCH.id) return getBatchHistory();
  const seed = HISTORICAL_BATCHES.find((b) => `batch_c${b.cycleNo}` === batchId);
  if (!seed) return resolve(null);
  const g = genClosedBatchData(seed);
  return resolve(assembleBatchHistory(g.placements, g.daily, g.weights, g.nameOf));
}

/** The live batch as an archive row (real captured totals + estimated EPEF). */
async function currentArchiveRow(): Promise<BatchArchiveRow> {
  const [history, compare, rollup] = await Promise.all([getBatchHistory(), getComparableBatches(), getSiteRollup()]);
  const cb = compare.batches.find((b) => b.status === "current")!;
  const finalDay = history.maxDay;
  const feedUsedKg = history.batch.reduce((s, r) => s + r.feedAddedKg, 0);
  const livability = rollup.placed ? (rollup.remaining / rollup.placed) * 100 : 0;
  const epef = cb.fcr && finalDay ? Math.round(((livability * (cb.weightG / 1000)) / (finalDay * cb.fcr)) * 100) : 0;
  const vaccineNames = vaccinesUpTo(finalDay);
  return {
    id: BATCH.id,
    cycleNo: BATCH.cycleNo,
    title: `Batch ${BATCH.cycleNo}`,
    status: "current",
    placingDate: cb.placingDate,
    killDate: BATCH.killDate,
    growOutDays: finalDay,
    placed: rollup.placed,
    totalMortality: rollup.cumMort,
    cumMortPct: cb.cumMortPct,
    finalWeightG: cb.weightG,
    vsRossPct: cb.vsRossPct,
    fcr: cb.fcr,
    epef,
    feedUsedKg,
    vaccineCount: vaccineNames.length,
    vaccineNames,
    readyVsKillDays: cb.readyVsKillDays,
    level: growerLevel(cb.vsRossPct),
  };
}

/** A closed cycle as an archive row — headline figures match the track record. */
function closedArchiveRow(seed: HistoricalBatchSeed): BatchArchiveRow {
  const comp = genComparable(seed);
  const g = genClosedBatchData(seed);
  const placed = g.placements.reduce((s, p) => s + p.placedCount, 0);
  const feedUsedKg = g.daily.reduce((s, e) => s + e.feedAddedKg, 0);
  const totalMortality = g.daily.reduce((s, e) => s + e.mortality + e.culls, 0);
  const vaccineNames = vaccinesUpTo(seed.finalDay);
  return {
    id: comp.id,
    cycleNo: seed.cycleNo,
    title: `Batch ${seed.cycleNo}`,
    status: "closed",
    placingDate: seed.placingDate,
    killDate: seed.killDate,
    growOutDays: seed.finalDay,
    placed,
    totalMortality,
    cumMortPct: seed.finalCumMortPct,
    finalWeightG: seed.finalWeightG,
    vsRossPct: comp.vsRossPct,
    fcr: seed.finalFcr,
    epef: seed.epef,
    feedUsedKg,
    vaccineCount: vaccineNames.length,
    vaccineNames,
    readyVsKillDays: comp.readyVsKillDays,
    level: growerLevel(comp.vsRossPct),
  };
}

/** Every batch on the site for the Previous Batches archive (newest first). */
export async function getBatchArchive(): Promise<BatchArchiveData> {
  const current = await currentArchiveRow();
  const closed = HISTORICAL_BATCHES.map(closedArchiveRow);
  const rows = [current, ...closed].sort((a, b) => b.cycleNo - a.cycleNo);
  return resolve({ rows });
}

/** One archive row by batch id (for the detail page header + highlights). */
export async function getBatchArchiveRow(id: string): Promise<BatchArchiveRow | null> {
  const { rows } = await getBatchArchive();
  return resolve(rows.find((r) => r.id === id) ?? null);
}

// ===========================================================================
// Contractor grower-level performance (ranked overview + drill-down)
// Tenant isolation lives here: getContractorGrowers(contractorId) only ever
// returns that contractor's growers. (Becomes a Convex query scoped to the
// authed contractor.)
// ===========================================================================

const growerLevel = (vsRossPct: number): StatusLevel => (vsRossPct >= 98 ? "green" : vsRossPct >= 90 ? "amber" : "red");

/** Front-loaded daily mortality for one generated house, summing to a target cum %. */
function genHouseDaily(placed: number, day: number, cumPctTarget: number) {
  const target = Math.round((placed * cumPctTarget) / 100);
  const raw = Array.from({ length: day }, (_, i) => 3.0 * Math.exp(-i / 2.6) + 0.45);
  const sum = raw.reduce((s, r) => s + r, 0) || 1;
  const morts = raw.map((r) => Math.max(0, Math.round((r / sum) * target)));
  const order = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]);
  let diff = target - morts.reduce((s, m) => s + m, 0);
  let k = 0;
  while (diff !== 0 && k < order.length * 4) {
    const i = order[k % order.length];
    if (diff > 0) { morts[i] += 1; diff -= 1; } else if (morts[i] > 0) { morts[i] -= 1; diff += 1; }
    k += 1;
  }
  let cum = 0;
  const cumPctSeries = morts.map((m) => {
    cum += m;
    return Number(((cum / placed) * 100).toFixed(2));
  });
  return { mortSeries: morts, cumPctSeries, remaining: placed - target };
}

/** Per-day trend toward a profile's current/final state, aligned by day of cycle. */
function genGrowerTrend(profile: GrowerProfile): GrowerTrendPoint[] {
  const k = 2.4;
  const denom = 1 - Math.exp(-k);
  const out: GrowerTrendPoint[] = [];
  let prevCum = 0;
  for (let d = 1; d <= profile.age; d++) {
    const cumPct = Number(((profile.cumMortPct * (1 - Math.exp((-k * d) / profile.age))) / denom).toFixed(3));
    const dailyMortPct = Number(Math.max(0, cumPct - prevCum).toFixed(3));
    prevCum = cumPct;
    const factor = 0.97 + (profile.weightFactor - 0.97) * ((d - 1) / Math.max(1, profile.age - 1));
    const rossW = rossOf(d).weightG;
    const avgW = rossW * factor;
    const fcr = avgW ? Number(((rossOf(d).fcr ?? profile.fcr) * (rossW / avgW)).toFixed(2)) : profile.fcr;
    out.push({ day: d, cumPct, dailyMortPct, vsRossPct: Math.round(factor * 100), fcr });
  }
  return out;
}

function genGrowerPerf(profile: GrowerProfile): GrowerPerf {
  const placed = profile.houseCount * profile.placedPerHouse;
  const remaining = Math.round(placed * (1 - profile.cumMortPct / 100));
  const livability = placed ? (remaining / placed) * 100 : 0;
  const weightG = Math.round(rossOf(profile.age).weightG * profile.weightFactor);
  const vsRossPct = Math.round(profile.weightFactor * 100);
  const epef = profile.age ? Math.round((livability * (weightG / 1000)) / (profile.age * profile.fcr) * 100) : 0;
  const target = rossOf(profile.growOut).weightG;
  const recentGain = (rossOf(profile.age).dailyGainG ?? 90) * profile.weightFactor;
  const daysToTarget = weightG >= target ? profile.age : profile.age + Math.ceil((target - weightG) / Math.max(recentGain, 1));
  return {
    siteId: profile.siteId,
    name: profile.name,
    farmCode: profile.farmCode,
    cycleNo: profile.cycleNo,
    status: profile.status,
    day: profile.age,
    killDay: profile.growOut,
    placed,
    remaining,
    epef,
    fcr: profile.fcr,
    cumMortPct: profile.cumMortPct,
    weightG,
    vsRossPct,
    readyVsKillDays: daysToTarget - profile.growOut,
    level: growerLevel(vsRossPct),
    trend: genGrowerTrend(profile),
  };
}

/** Murray Downs (the real, rich grower) as a performance row. */
async function murrayPerf(): Promise<GrowerPerf> {
  const [compare, rollup] = await Promise.all([getComparableBatches(), getSiteRollup()]);
  const cb = compare.batches.find((b) => b.status === "current")!;
  const livability = rollup.placed ? (rollup.remaining / rollup.placed) * 100 : 0;
  const epef = cb.finalDay && cb.fcr ? Math.round((livability * (cb.weightG / 1000)) / (cb.finalDay * cb.fcr) * 100) : 0;
  return {
    siteId: SITE.id,
    name: SITE.name,
    farmCode: SITE.farmCode,
    cycleNo: BATCH.cycleNo,
    status: "active",
    day: cb.finalDay,
    killDay: cb.killDay,
    placed: rollup.placed,
    remaining: rollup.remaining,
    epef,
    fcr: cb.fcr,
    cumMortPct: cb.cumMortPct,
    weightG: cb.weightG,
    vsRossPct: cb.vsRossPct,
    readyVsKillDays: cb.readyVsKillDays,
    level: growerLevel(cb.vsRossPct),
    trend: cb.series.map((p) => ({
      day: p.day,
      cumPct: p.cumPct,
      dailyMortPct: p.dailyMortPct,
      vsRossPct: p.vsRossPct ?? 0,
      fcr: p.fcr ?? 0,
    })),
  };
}

export async function getContractorGrowers(contractorId: string = CONTRACTOR.id): Promise<ContractorGrowers> {
  const growers: GrowerPerf[] = [];
  if (CONTRACTOR.id === contractorId) growers.push(await murrayPerf());
  for (const profile of GROWER_PROFILES.filter((p) => p.contractorId === contractorId)) {
    growers.push(genGrowerPerf(profile));
  }
  const contractorName = contractorId === OTHER_CONTRACTOR.id ? OTHER_CONTRACTOR.name : CONTRACTOR.name;
  const maxDay = Math.max(...growers.map((g) => g.day), 1);
  const ross = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    const pt = rossOf(day);
    return { day, weightG: pt.weightG, fcr: pt.fcr };
  });
  return resolve({ contractorName, growers, ross, maxDay });
}

function genGrowerPastCycles(profile: GrowerProfile, today: string) {
  return [1, 2].map((n) => {
    const cycleNo = profile.cycleNo - n;
    const factor = Math.min(1.02, profile.weightFactor + 0.02 * n);
    const finalAvgWeightG = Math.round(rossOf(35).weightG * factor);
    const mortalityPct = Number((profile.cumMortPct * (0.95 + 0.05 * n)).toFixed(1));
    const liv = 100 - mortalityPct;
    const epef = Math.round((liv * (finalAvgWeightG / 1000)) / (35 * profile.fcr) * 100);
    return { cycleNo, killDate: addDays(today, -45 * n), finalAvgWeightG, mortalityPct, epef };
  });
}

/** Drill-down detail for any grower. Murray Downs uses the real data; the
 *  others are generated per-house from their profile (conforming to the types). */
export async function getGrowerDetailById(siteId: string): Promise<GrowerDetailData> {
  if (siteId === SITE.id) return getGrowerDetail();

  const profile = GROWER_PROFILES.find((p) => p.siteId === siteId);
  if (!profile) return getGrowerDetail();

  const today = DEMO_TODAY;
  const houses: HouseTrend[] = Array.from({ length: profile.houseCount }, (_, i) => {
    const frac = (i * 0.618) % 1; // deterministic jitter
    const hCum = Number((profile.cumMortPct * (0.8 + 0.4 * frac)).toFixed(2));
    const hFactor = profile.weightFactor + (i - (profile.houseCount - 1) / 2) * 0.008;
    const placed = profile.placedPerHouse;
    const daily = genHouseDaily(placed, profile.age, hCum);
    const avgWeightG = Math.round(rossOf(profile.age).weightG * hFactor);
    const vsRossPct = Math.round(hFactor * 100);
    const level = growerLevel(vsRossPct);
    return {
      houseId: `${siteId}-h${i + 1}`,
      houseName: `House ${i + 1}`,
      day: profile.age,
      status: {
        metric: "Weight",
        level,
        actualVsTarget: `${vsRossPct}% of Ross weight, ${pctFix(daily.cumPctSeries.at(-1) ?? hCum)} cumulative mortality`,
      },
      cumPct: daily.cumPctSeries.at(-1) ?? hCum,
      remaining: daily.remaining,
      avgWeightG,
      vsRossPct,
      mortSeries: daily.mortSeries,
      cumPctSeries: daily.cumPctSeries,
    };
  });

  const placedTotal = houses.length * profile.placedPerHouse;
  const remainingTotal = houses.reduce((s, h) => s + h.remaining, 0);
  const cumMortTotal = placedTotal - remainingTotal;
  const placing = addDays(today, -profile.age);

  return resolve({
    siteName: profile.name,
    farmCode: profile.farmCode,
    cycleNo: profile.cycleNo,
    breed: "Ross 308",
    killDate: addDays(placing, profile.growOut),
    rollup: {
      placed: placedTotal,
      remaining: remainingTotal,
      cumMort: cumMortTotal,
      mortPct: placedTotal ? Number(((cumMortTotal / placedTotal) * 100).toFixed(2)) : 0,
      houseCount: houses.length,
    },
    houses,
    pastCycles: genGrowerPastCycles(profile, today),
  });
}

function pctFix(n: number): string {
  return `${n.toFixed(2)}%`;
}

// --- Hero weight-band chart data -------------------------------------------

/**
 * Actual avg weight per house plus the Ross objective, for the hero chart with
 * its shaded green/amber/red bands. Band fractions come from the engine
 * thresholds so the chart and the status engine stay in lockstep.
 */
export async function getWeightBandData(): Promise<WeightBandData> {
  const maxDay = 35;
  const houses: WeightBandData["houses"] = PLACEMENTS.map((p) => {
    const house = SITE.houses.find((h) => h.id === p.houseId);
    const points = WEIGHT_ENTRIES.filter((w) => w.placementId === p.id)
      .sort((a, b) => a.day - b.day)
      .map((w) => ({ day: w.day, weightG: w.avgWeightG }));
    return { houseId: p.houseId, houseName: house?.name ?? p.houseId, points };
  });
  const ross = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    return { day, weightG: ROSS_308_CURVE[day]?.weightG ?? 0 };
  });
  return resolve({
    ross,
    houses,
    maxDay,
    yMax: 2400,
    greenFrac: DEFAULT_THRESHOLDS.weight.green,
    amberFrac: DEFAULT_THRESHOLDS.weight.amber,
  });
}

// --- Rebuilt dashboard (supervisor + manager share one structure) ----------

const mean = (xs: number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** Cumulative feed added per (surviving) bird for a placement, grams. */
function cumFeedPerBirdG(placementId: string): number | undefined {
  const daily = DAILY_ENTRIES.filter((e) => e.placementId === placementId).sort((a, b) => a.day - b.day);
  const latest = daily[daily.length - 1];
  if (!latest || !latest.birdsRemaining) return undefined;
  const cumFeedKg = daily.reduce((s, e) => s + e.feedAddedKg, 0);
  return (cumFeedKg * 1000) / latest.birdsRemaining;
}

/**
 * Site-level per-metric on-track cards. Averages the houses' engine inputs and
 * scores them with the SAME `lib/engine` evaluators the per-house surfaces use,
 * so a card and a house pill never disagree. Feed is cumulative feed *added* per
 * bird vs the Ross cumulative intake — an estimate (added ≠ consumed), banded
 * symmetrically around the guideline rather than via the refill flag.
 */
export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  const inputs = PLACEMENTS.map((p) => metricInputFor(p.id)).filter((x): x is PlacementMetrics => x != null);
  const rollup = await getSiteRollup();

  const weightG = mean(inputs.map((i) => i.weightG).filter((x): x is number => x != null));
  const weightDay = Math.round(mean(inputs.map((i) => i.weightDay).filter((x): x is number => x != null)));
  const fcr = mean(inputs.map((i) => i.fcr).filter((x): x is number => x != null));
  const siteDay = Math.round(mean(inputs.map((i) => i.day)));
  const cumMortPct = rollup.mortPct;
  const feedPerBird = mean(PLACEMENTS.map((p) => cumFeedPerBirdG(p.id)).filter((x): x is number => x != null));

  const weight = evaluateWeight(weightDay, weightG, ENGINE_CTX);
  const mortality = evaluateMortality(siteDay, cumMortPct, ENGINE_CTX);
  const fcrStatus = evaluateFcr(weightDay, fcr, ENGINE_CTX);

  const metrics: DashboardMetric[] = [
    {
      key: "weight",
      label: "Weight",
      level: weight.level,
      actual: Math.round(weightG),
      target: ross308At(weightDay).weightG,
      unit: "g",
      targetWord: "target",
      cause: weight.cause,
      fix: weight.fix,
    },
    {
      key: "mortality",
      label: "Mortality",
      level: mortality.level,
      actual: Number(cumMortPct.toFixed(2)),
      target: Number(mortalityBandPctAt(siteDay).toFixed(2)),
      unit: "pp",
      targetWord: "band",
      cause: mortality.cause,
      fix: mortality.fix,
    },
    {
      key: "feed",
      label: "Feed",
      level: feedLevel(feedPerBird, ross308At(siteDay).cumIntakeG ?? feedPerBird),
      actual: Math.round(feedPerBird),
      target: Math.round(ross308At(siteDay).cumIntakeG ?? feedPerBird),
      unit: "gPerBird",
      targetWord: "guide",
      estimated: true,
    },
    {
      key: "fcr",
      label: "FCR",
      level: fcrStatus.level,
      actual: Number(fcr.toFixed(2)),
      target: Number((ross308At(weightDay).fcr ?? fcr).toFixed(2)),
      unit: "ratio",
      targetWord: "target",
      estimated: true,
      cause: fcrStatus.cause,
      fix: fcrStatus.fix,
    },
  ];
  return resolve(metrics);
}

/** Feed-vs-intake band (symmetric): within 10% = on track, within 25% = watch. */
function feedLevel(actual: number, target: number): StatusLevel {
  if (!target) return "green";
  const off = Math.abs(actual - target) / target;
  return off <= 0.1 ? "green" : off <= 0.25 ? "amber" : "red";
}

/** Yesterday's captured round per house (the mock's latest entry). */
export async function getYesterdayEntries(): Promise<YesterdayEntry[]> {
  const out: YesterdayEntry[] = [];
  for (const house of SITE.houses) {
    const latest = await getLatestDailyEntry(house.id);
    if (!latest) continue;
    out.push({
      houseId: house.id,
      houseName: house.name,
      day: latest.day,
      mortality: latest.mortality,
      culls: latest.culls,
      feedAddedKg: latest.feedAddedKg,
      cumMort: latest.cumMort,
      cumPct: latest.cumPct,
      birdsRemaining: latest.birdsRemaining,
    });
  }
  return resolve(out);
}

/** Actual weigh-ins + a projected forward line (current + ADG × days) to the kill day. */
export async function getWeightProjection(): Promise<WeightProjection> {
  const proj = await getProjection();
  const killDay = proj.houses.length ? Math.max(...proj.houses.map((h) => h.killDay)) : 35;

  const ross: ProjectionPoint[] = Array.from({ length: killDay + 1 }, (_, day) => ({
    day,
    weightG: ross308At(day).weightG,
  }));

  const houseLines: ProjectionLine[] = proj.houses.map((h) => {
    const placement = PLACEMENTS.find((p) => p.houseId === h.houseId);
    const actual: ProjectionPoint[] = placement
      ? WEIGHT_ENTRIES.filter((w) => w.placementId === placement.id)
          .sort((a, b) => a.day - b.day)
          .map((w) => ({ day: w.day, weightG: w.avgWeightG }))
      : [{ day: h.weightDay, weightG: h.currentWeightG }];
    const projected: ProjectionPoint[] = [];
    for (let d = h.weightDay; d <= h.killDay; d++) {
      projected.push({ day: d, weightG: Math.round(h.currentWeightG + h.dailyGainG * (d - h.weightDay)) });
    }
    return { houseId: h.houseId, name: h.houseName, actual, projected };
  });

  // Site-average line: average the house actuals by day, then project forward
  // from the last site point at the average daily gain.
  const byDay = new Map<number, number[]>();
  for (const line of houseLines) for (const p of line.actual) byDay.set(p.day, [...(byDay.get(p.day) ?? []), p.weightG]);
  const siteActual: ProjectionPoint[] = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, ws]) => ({ day, weightG: Math.round(mean(ws)) }));
  const siteWeighDay = Math.round(mean(proj.houses.map((h) => h.weightDay)));
  const siteCurrent = Math.round(mean(proj.houses.map((h) => h.currentWeightG)));
  const siteAdg = mean(proj.houses.map((h) => h.dailyGainG));
  const siteProjected: ProjectionPoint[] = [];
  for (let d = siteWeighDay; d <= killDay; d++) {
    siteProjected.push({ day: d, weightG: Math.round(siteCurrent + siteAdg * (d - siteWeighDay)) });
  }

  const yMax = Math.ceil((ross308At(killDay).weightG * 1.05) / 500) * 500;
  return resolve({
    ross,
    killDay,
    yMax,
    greenFrac: DEFAULT_THRESHOLDS.weight.green,
    amberFrac: DEFAULT_THRESHOLDS.weight.amber,
    site: { name: "Site average", actual: siteActual, projected: siteProjected },
    houses: houseLines,
  });
}

/** Cycle info for the dashboard header (day-of-cycle = latest captured + 1, per-house range). */
export async function getDashboardCycleInfo(): Promise<DashboardCycleInfo> {
  const proj = await getProjection();
  const days: number[] = [];
  for (const house of SITE.houses) {
    const latest = await getLatestDailyEntry(house.id);
    days.push((latest?.day ?? 0) + 1);
  }
  const placingDate = PLACEMENTS.reduce(
    (min, p) => (p.placingDate < min ? p.placingDate : min),
    PLACEMENTS[0]?.placingDate ?? BATCH.killDate,
  );
  return resolve({
    siteName: SITE.name,
    cycleNo: BATCH.cycleNo,
    breed: BATCH.breed,
    today: DEMO_TODAY,
    dayLow: days.length ? Math.min(...days) : 0,
    dayHigh: days.length ? Math.max(...days) : 0,
    placingDate,
    killDate: BATCH.killDate,
    daysToKill: proj.daysToKill,
    houseCount: SITE.houses.length,
  });
}

/** The whole dashboard bundle — one call feeds both role dashboards. */
export async function getDashboardView(): Promise<DashboardView> {
  const [cycle, metrics, yesterday, projection] = await Promise.all([
    getDashboardCycleInfo(),
    getDashboardMetrics(),
    getYesterdayEntries(),
    getWeightProjection(),
  ]);
  return { cycle, metrics, yesterday, projection };
}
