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
  BatchProjection,
  BenchmarkSet,
  Batch,
  CatchingEvent,
  Contract,
  Contractor,
  DailyEntry,
  FeedDelivery,
  FlockAlert,
  House,
  HouseProjection,
  Manifest,
  PastCycle,
  PlannedBatch,
  Placement,
  Site,
  Status,
  StatusLevel,
  WeightEntry,
} from "@/lib/types";
import type {
  BatchHistory,
  ComparableBatch,
  CompareData,
  ComparePoint,
  ContractorGrowers,
  GrowerDetailData,
  GrowerPerf,
  GrowerTrendPoint,
  HouseDayRow,
  HouseMetrics,
  HouseSeries,
  HouseTrend,
  PortfolioData,
} from "@/lib/view";
import {
  BATCH,
  BENCHMARK,
  CATCHING_EVENTS,
  CONTRACT,
  CONTRACTOR,
  DAILY_ENTRIES,
  FEED_DELIVERIES,
  GROWER_PROFILES,
  type GrowerProfile,
  HISTORICAL_BATCHES,
  MANIFEST,
  nextHouseId,
  OTHER_CONTRACTOR,
  PAST_CYCLES,
  PLACEMENTS,
  PLANNED_BATCH,
  SEED_STATUS_BY_HOUSE,
  SITE,
  WEIGHT_ENTRIES,
} from "./mock";
import { ROSS_308_CURVE, ROSS_308_OVERLAY, ross308At } from "./ross308";
import { addDays, daysBetween } from "@/lib/format";

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

// --- Status (seed; engine arrives in Phase 3) ------------------------------

export function getHouseStatus(houseId: string): Promise<Status | undefined> {
  return resolve(SEED_STATUS_BY_HOUSE[houseId]);
}

/** Every house's current status, in house order. */
export function getHouseStatuses(): Promise<{ houseId: string; status: Status }[]> {
  return resolve(SITE.houses.map((h) => ({ houseId: h.id, status: SEED_STATUS_BY_HOUSE[h.id] })).filter((x) => x.status));
}

/** Houses needing attention (amber/red), red first — the grower alerts list. */
export async function getAlerts(): Promise<FlockAlert[]> {
  const order: Record<StatusLevel, number> = { red: 0, amber: 1, green: 2 };
  const alerts = SITE.houses
    .map((h) => ({ houseId: h.id, houseName: h.name, status: SEED_STATUS_BY_HOUSE[h.id] }))
    .filter((a) => a.status && a.status.level !== "green");
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

// --- Writes (stub seam; persistence is Phase 1 → Convex mutation) ----------

export interface DailyUpdateInput {
  houseId: string;
  date: string;
  day: number;
  mortality: number;
  culls: number;
  feedAddedKg: number;
  tempC?: number;
}

/**
 * Computes the derived figures (the wedge: cull&mort, cumMort, cum%, remaining)
 * and returns the resulting entry for echo-back confirmation. Does NOT persist
 * yet — Phase 1 wires the form; the real write becomes a Convex mutation.
 */
export async function submitDailyUpdate(input: DailyUpdateInput): Promise<DailyEntry> {
  const placement = PLACEMENTS.find((p) => p.houseId === input.houseId);
  const prior = placement
    ? DAILY_ENTRIES.filter((e) => e.placementId === placement.id).sort((a, b) => a.day - b.day).slice(-1)[0]
    : undefined;
  const placed = placement?.placedCount ?? 0;
  const cullAndMort = input.mortality + input.culls;
  const cumMort = (prior?.cumMort ?? 0) + cullAndMort;
  const birdsRemaining = placed - cumMort;
  const cumPct = placed ? Number(((cumMort / placed) * 100).toFixed(2)) : 0;
  return resolve({
    id: `${placement?.id ?? input.houseId}-d${input.day}`,
    placementId: placement?.id ?? input.houseId,
    date: input.date,
    day: input.day,
    mortality: input.mortality,
    culls: input.culls,
    feedAddedKg: input.feedAddedKg,
    tempC: input.tempC,
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
  const status = SEED_STATUS_BY_HOUSE[house.id];

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
      status: SEED_STATUS_BY_HOUSE[house.id],
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
 * Assembles the whole current batch's history: each house's day-by-day rows
 * (daily mort %, cumulative %, feed, temperature, and weigh-day weight/ADG/
 * uniformity with vs-Ross and an estimated FCR), the batch-level rollup per day
 * (carry-forward so staggered houses still aggregate cleanly), plus the Ross 308
 * objective and the contractor mortality band for chart overlays.
 */
export async function getBatchHistory(): Promise<BatchHistory> {
  const maxDay = Math.max(
    ...PLACEMENTS.map((p) => p.dayCount),
    ...WEIGHT_ENTRIES.map((w) => w.day),
  );
  const placedTotal = PLACEMENTS.reduce((s, p) => s + p.placedCount, 0);

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

  const prepared: Prepared[] = PLACEMENTS.map((p) => {
    const house = SITE.houses.find((h) => h.id === p.houseId);
    const houseName = house?.name ?? p.houseId;
    const entries = DAILY_ENTRIES.filter((e) => e.placementId === p.id);
    const entriesByDay = new Map(entries.map((e) => [e.day, e]));
    const weights = WEIGHT_ENTRIES.filter((w) => w.placementId === p.id).sort((a, b) => a.day - b.day);

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
    for (const w of weights) {
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
    const dayset = new Set<number>([...entries.map((e) => e.day), ...weights.map((w) => w.day)]);
    const rows: HouseDayRow[] = [...dayset]
      .sort((a, b) => a - b)
      .map((d) => ({
        day: d,
        date: dateByDay.get(d) ?? "",
        mortality: exactMort[d] ?? 0,
        culls: exactCulls[d] ?? 0,
        cumMort: asOfCum[d] ?? 0,
        cumPct: Number(((asOfCum[d] / p.placedCount) * 100).toFixed(2)),
        dailyMortPct: Number((((exactMort[d] ?? 0) / p.placedCount) * 100).toFixed(3)),
        feedAddedKg: exactFeed[d] ?? 0,
        tempC: entriesByDay.get(d)?.tempC,
        weigh: weighByDay.get(d),
      }));

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

  return resolve({
    maxDay,
    placed: placedTotal,
    houses: prepared.map((ph) => ph.series),
    batch,
    ross,
    mortalityBand: ROSS_308_OVERLAY.mortalityBand,
  });
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
