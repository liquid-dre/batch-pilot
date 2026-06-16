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
  BenchmarkSet,
  Batch,
  CatchingEvent,
  Contract,
  Contractor,
  DailyEntry,
  FeedDelivery,
  House,
  Placement,
  Site,
  Status,
  WeightEntry,
} from "@/lib/types";
import {
  BATCH,
  BENCHMARK,
  CATCHING_EVENTS,
  CONTRACT,
  CONTRACTOR,
  DAILY_ENTRIES,
  FEED_DELIVERIES,
  PLACEMENTS,
  SEED_STATUS_BY_HOUSE,
  SITE,
  WEIGHT_ENTRIES,
} from "./mock";

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
