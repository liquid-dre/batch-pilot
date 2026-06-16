/**
 * Mock dataset — seeded from real field data: Nhunge, Irvine's, cycle 85
 * (BRD §7, ROADMAP §2/§7). This is the ONLY place hardcoded data lives. The
 * data-access functions in `lib/data/index.ts` read from here today and become
 * Convex queries later; UI never imports this file directly.
 *
 * Where the BRD gives a figure, it is used verbatim (the day-27/26 mortality
 * block and the day-28 weights for Houses 1–2). Values the BRD doesn't record
 * (back-history before the anchor day, weights for Houses 3–6) are synthesised
 * deterministically around the real anchors and marked inline. The day-28
 * Houses running ~13% under the Ross curve is real and is the hero story.
 */
import type {
  BenchmarkSet,
  Batch,
  CatchingEvent,
  Contract,
  Contractor,
  DailyEntry,
  FeedDelivery,
  Manifest,
  PastCycle,
  PlannedBatch,
  Placement,
  Site,
  Status,
  User,
  WeightEntry,
} from "@/lib/types";
import { ROSS_308_CURVE, ROSS_308_OVERLAY } from "./ross308";

// ---------------------------------------------------------------------------
// Contractor, site, houses
// ---------------------------------------------------------------------------

export const CONTRACTOR: Contractor = {
  id: "ct_irvines",
  name: "Irvine's",
};

export const SITE: Site = {
  id: "site_nhunge",
  name: "Murray Downs",
  farmCode: "AUMD",
  location: { lat: -31.09, lng: 150.93 }, // near Tamworth, NSW
  contractorIds: [CONTRACTOR.id],
  // Capacities vary by house so the allocation recommendation (proportional to
  // capacity, remainder to the largest house) is meaningful. All stay above the
  // cycle-85 placed counts (~16,150).
  houses: [
    { id: "h1", siteId: "site_nhunge", name: "House 1", capacity: 18000 },
    { id: "h2", siteId: "site_nhunge", name: "House 2", capacity: 18000 },
    { id: "h3", siteId: "site_nhunge", name: "House 3", capacity: 16500 },
    { id: "h4", siteId: "site_nhunge", name: "House 4", capacity: 16500 },
    { id: "h5", siteId: "site_nhunge", name: "House 5", capacity: 16500 },
    { id: "h6", siteId: "site_nhunge", name: "House 6", capacity: 16500 },
  ],
};

/** Monotonic id source for houses the grower adds in the setup screen. */
let houseSeq = SITE.houses.length;
export function nextHouseId(): string {
  houseSeq += 1;
  return `h${houseSeq}`;
}

// ---------------------------------------------------------------------------
// Contract + batch (cycle 85)
// ---------------------------------------------------------------------------

export const CONTRACT: Contract = {
  id: "contract_zbnh_085",
  chickPrice: 0.55,
  feedPricePerKg: 0.7,
  buyBackPerKg: 1.6,
  focPct: 1,
};

export const BATCH: Batch = {
  id: "batch_zbnh_085",
  siteId: SITE.id,
  contractorId: CONTRACTOR.id,
  cycleNo: 85,
  breed: "Ross 308",
  // Staggered kill dates (Houses 1–2: 15 Jun, Houses 3–6: 16 Jun); the later
  // contractor target is stored on the batch, per-house age lives on Placement.
  killDate: "2026-06-16",
  focPct: 1,
  contractId: CONTRACT.id,
};

// ---------------------------------------------------------------------------
// Planned (next) batch — a total chick count with no per-house allocation yet.
// Drives the allocation-recommendation flow (mutable: `allocated` flips on
// confirm). Placing date is "today" in the demo, so confirmed houses are day 0.
// ---------------------------------------------------------------------------

export const PLANNED_BATCH: PlannedBatch = {
  id: "batch_aumd_086",
  siteId: SITE.id,
  contractorId: CONTRACTOR.id,
  cycleNo: 86,
  breed: "Ross 308",
  placingDate: "2026-06-16",
  killDate: "2026-07-17",
  focPct: 1,
  totalPlaced: 95000,
  allocated: false,
};

// ---------------------------------------------------------------------------
// Placements — per-house placed count, placing date, day-count (BRD §7.2)
// Houses 1–2 placed Fri 15 May; Houses 3–6 placed Sat 16 May (staggered).
// ---------------------------------------------------------------------------

export const PLACEMENTS: Placement[] = [
  { id: "p1", batchId: BATCH.id, houseId: "h1", placedCount: 16153, placingDate: "2026-05-15", dayCount: 27 },
  { id: "p2", batchId: BATCH.id, houseId: "h2", placedCount: 16156, placingDate: "2026-05-15", dayCount: 27 },
  { id: "p3", batchId: BATCH.id, houseId: "h3", placedCount: 16153, placingDate: "2026-05-16", dayCount: 26 },
  { id: "p4", batchId: BATCH.id, houseId: "h4", placedCount: 16156, placingDate: "2026-05-16", dayCount: 26 },
  { id: "p5", batchId: BATCH.id, houseId: "h5", placedCount: 16139, placingDate: "2026-05-16", dayCount: 26 },
  { id: "p6", batchId: BATCH.id, houseId: "h6", placedCount: 16146, placingDate: "2026-05-16", dayCount: 26 },
];

// ---------------------------------------------------------------------------
// Daily entries — FULL day-1..current series per house.
// The cumulative mortality lands EXACTLY on the documented BRD §7.2 figure at
// each house's latest day (296/298/530/273/355/368). Mortality is front-loaded
// (brooding losses) with a late rise on the two problem houses (3 & 6), so the
// cum-% curve crosses the contractor band — the red-house story. Feed follows
// the Ross intake curve scaled to the live birds; temperature is captured on
// the warm houses' last few days (a candidate cause for the high mortality).
// ---------------------------------------------------------------------------

interface HouseSeed {
  placementId: string;
  anchorDay: number;
  anchorDate: string;
  anchorCumMort: number;
  /** Problem houses whose daily losses climb toward the end. */
  rising: boolean;
  /** Peak house temperature on the final day (°C) if captured. */
  tempPeakC?: number;
}

const HOUSE_SEEDS: HouseSeed[] = [
  { placementId: "p1", anchorDay: 27, anchorDate: "2026-06-12", anchorCumMort: 296, rising: false },
  { placementId: "p2", anchorDay: 27, anchorDate: "2026-06-12", anchorCumMort: 298, rising: false },
  { placementId: "p3", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 530, rising: true, tempPeakC: 25 },
  { placementId: "p4", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 273, rising: false },
  { placementId: "p5", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 355, rising: false },
  { placementId: "p6", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 368, rising: true, tempPeakC: 26 },
];

function placedFor(placementId: string): number {
  const p = PLACEMENTS.find((x) => x.id === placementId);
  return p ? p.placedCount : 0;
}

function dateMinusDays(iso: string, days: number): string {
  // Pure date math on the ISO string; avoids Date() timezone drift.
  const [y, m, d] = iso.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d) - days * 86_400_000;
  const dt = new Date(base);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

function buildSeries(seed: HouseSeed): DailyEntry[] {
  const placed = placedFor(seed.placementId);
  const N = seed.anchorDay;

  // Raw daily-mortality shape: brooding spike + baseline + late rise on problem
  // houses. Normalised so the integer series sums to the documented cumMort.
  const raw: number[] = [];
  for (let d = 1; d <= N; d++) {
    const brood = 3.2 * Math.exp(-(d - 1) / 2.6);
    const baseline = 0.45;
    const tail = seed.rising ? 0.18 * Math.max(0, d - (N - 6)) : 0;
    raw.push(brood + baseline + tail);
  }
  const sumRaw = raw.reduce((s, r) => s + r, 0);
  const morts = raw.map((r) => Math.max(0, Math.round((r / sumRaw) * seed.anchorCumMort)));

  // Reconcile rounding so the cumulative is exact, nudging the highest days.
  const byRawDesc = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]);
  let diff = seed.anchorCumMort - morts.reduce((s, m) => s + m, 0);
  let k = 0;
  while (diff !== 0 && k < byRawDesc.length * 4) {
    const i = byRawDesc[k % byRawDesc.length];
    if (diff > 0) {
      morts[i] += 1;
      diff -= 1;
    } else if (morts[i] > 0) {
      morts[i] -= 1;
      diff += 1;
    }
    k += 1;
  }

  let cum = 0;
  return morts.map((mort, idx) => {
    const day = idx + 1;
    cum += mort;
    const birdsRemaining = placed - cum;
    const cumPct = Number(((cum / placed) * 100).toFixed(2));
    const intakeG = ROSS_308_CURVE[day]?.dailyIntakeG ?? 0;
    const feedAddedKg = Math.round((intakeG * birdsRemaining) / 1000 * 1.06);
    // Temperature on the warm houses' last 5 days, ramping toward the peak.
    let tempC: number | undefined;
    if (seed.tempPeakC && day > N - 5) {
      const t = (day - (N - 5)) / 5;
      tempC = Number((21 + (seed.tempPeakC - 21) * t).toFixed(1));
    }
    return {
      id: `${seed.placementId}-d${day}`,
      placementId: seed.placementId,
      date: dateMinusDays(seed.anchorDate, N - day),
      day,
      mortality: mort,
      culls: 0,
      feedAddedKg,
      tempC,
      cullAndMort: mort,
      cumMort: cum,
      cumPct,
      birdsRemaining,
    };
  });
}

export const DAILY_ENTRIES: DailyEntry[] = HOUSE_SEEDS.flatMap(buildSeries);

// ---------------------------------------------------------------------------
// Weights — multiple weigh-days per house. The latest weigh-in is the
// documented BRD §7.4 figure (Houses 1–2 verbatim, 3–6 synthesised); earlier
// weigh-days interpolate up toward it from ~96% of the Ross curve, so the gap
// to the breed objective WIDENS with age (the ~13%-under hero story).
// ---------------------------------------------------------------------------

interface WeighSeed {
  placementId: string;
  finalDay: number;
  finalWeightG: number;
  finalAdgG: number;
  finalGrowthRatio: number;
  finalUniformityPct: number;
}

const WEIGH_SEEDS: WeighSeed[] = [
  { placementId: "p1", finalDay: 28, finalWeightG: 1401, finalAdgG: 98, finalGrowthRatio: 1.2, finalUniformityPct: 73 }, // BRD
  { placementId: "p2", finalDay: 28, finalWeightG: 1417, finalAdgG: 89, finalGrowthRatio: 1.2, finalUniformityPct: 70 }, // BRD
  { placementId: "p3", finalDay: 26, finalWeightG: 1180, finalAdgG: 79, finalGrowthRatio: 1.1, finalUniformityPct: 68 },
  { placementId: "p4", finalDay: 26, finalWeightG: 1305, finalAdgG: 88, finalGrowthRatio: 1.2, finalUniformityPct: 74 },
  { placementId: "p5", finalDay: 26, finalWeightG: 1255, finalAdgG: 84, finalGrowthRatio: 1.2, finalUniformityPct: 71 },
  { placementId: "p6", finalDay: 26, finalWeightG: 1210, finalAdgG: 80, finalGrowthRatio: 1.1, finalUniformityPct: 67 },
];

function buildWeights(seed: WeighSeed): WeightEntry[] {
  const finalFactor = seed.finalWeightG / (ROSS_308_CURVE[seed.finalDay]?.weightG ?? seed.finalWeightG);
  const days = [7, 14, 21, seed.finalDay];
  let prevWeight = ROSS_308_CURVE[0].weightG; // ~44 g at placing
  let prevDay = 0;
  return days.map((day, i) => {
    const isFinal = i === days.length - 1;
    const frac = (day - 7) / (seed.finalDay - 7);
    const factor = 0.96 + (finalFactor - 0.96) * frac;
    const avgWeightG = isFinal ? seed.finalWeightG : Math.round((ROSS_308_CURVE[day]?.weightG ?? 0) * factor);
    const adgG = isFinal ? seed.finalAdgG : Math.round((avgWeightG - prevWeight) / (day - prevDay));
    const uniformityPct = isFinal ? seed.finalUniformityPct : Math.round(80 + (seed.finalUniformityPct - 80) * frac);
    prevWeight = avgWeightG;
    prevDay = day;
    return {
      id: `${seed.placementId}-w${day}`,
      placementId: seed.placementId,
      day,
      avgWeightG,
      adgG,
      growthRatio: seed.finalGrowthRatio,
      uniformityPct,
    };
  });
}

export const WEIGHT_ENTRIES: WeightEntry[] = WEIGH_SEEDS.flatMap(buildWeights);

// ---------------------------------------------------------------------------
// Feed delivery (BRD §7.3) — 300 × 50 = 15,000kg nominal vs 14,820kg net.
// ---------------------------------------------------------------------------

export const FEED_DELIVERIES: FeedDelivery[] = [
  {
    id: "fd1",
    siteId: SITE.id,
    date: "2026-06-11",
    feedType: "Broiler Finisher Pellet",
    bagSizeKg: 50,
    bagCount: 300,
    netWeightKg: 14820,
  },
];

// ---------------------------------------------------------------------------
// Catching schedule (BRD §7.5) — phased over nights, ~94,336 total.
// ---------------------------------------------------------------------------

export const CATCHING_EVENTS: CatchingEvent[] = [
  { id: "ce1", batchId: BATCH.id, night: "Sunday night", count: 34664 },
  { id: "ce2", batchId: BATCH.id, night: "Monday night", count: 52000 },
  { id: "ce3", batchId: BATCH.id, night: "Tuesday night", count: 7672 },
];

// ---------------------------------------------------------------------------
// Collection manifest (BRD §7.6) — authorised vehicles + drivers, held count.
// ---------------------------------------------------------------------------

export const MANIFEST: Manifest = {
  batchId: BATCH.id,
  heldCount: 47248,
  vehicles: [
    { plate: "588 AHE 1586", driver: "Mukudzeyi" },
    { plate: "588 ACZ 4465", driver: "Joel" },
    { plate: "588 ACZ 4462", driver: "Francis" },
    { plate: "558 AHE 1585", driver: "Bazil" },
    { plate: "539 AFJ 9166", driver: "Life" },
    { plate: "519 AEZ 8839", driver: "Lloyd" },
    { plate: "594 AAS 2375", driver: "Gilbert" },
    { plate: "588 AGJ 0828", driver: "Banda" },
    { plate: "600 AEG 4578", driver: "Mkanjari" },
    { plate: "270 ABP 7648", driver: "Moses" },
    { plate: "474 AGY 9861", driver: "Tanatswa" },
  ],
};

// ---------------------------------------------------------------------------
// Track record — closed cycles on this site (seed for the contractor view).
// Illustrative prior cycles; real history accrues as cycles complete.
// ---------------------------------------------------------------------------

/**
 * Closed batches on this site, the single source for both the contractor track
 * record (`PAST_CYCLES`, below) and the grower batch-comparison view. Each is a
 * realistic result the comparison's generator draws a day-of-cycle curve toward:
 * cycle 82 was a strong, short grow-out; 85 (current) is the under-Ross laggard.
 */
export interface HistoricalBatchSeed {
  cycleNo: number;
  placingDate: string;
  killDate: string;
  /** Grow-out length in days. */
  finalDay: number;
  finalCumMortPct: number;
  finalWeightG: number;
  finalFcr: number;
  epef: number;
}

export const HISTORICAL_BATCHES: HistoricalBatchSeed[] = [
  { cycleNo: 84, placingDate: "2026-03-24", killDate: "2026-04-28", finalDay: 35, finalCumMortPct: 4.1, finalWeightG: 2210, finalFcr: 1.62, epef: 352 },
  { cycleNo: 83, placingDate: "2026-02-03", killDate: "2026-03-10", finalDay: 35, finalCumMortPct: 3.4, finalWeightG: 2305, finalFcr: 1.55, epef: 389 },
  { cycleNo: 82, placingDate: "2025-12-20", killDate: "2026-01-22", finalDay: 33, finalCumMortPct: 4.8, finalWeightG: 2160, finalFcr: 1.66, epef: 331 },
  { cycleNo: 81, placingDate: "2025-10-25", killDate: "2025-12-02", finalDay: 38, finalCumMortPct: 3.9, finalWeightG: 2480, finalFcr: 1.6, epef: 365 },
];

// Contractor track-record rows are derived from the historical seed (one source).
export const PAST_CYCLES: PastCycle[] = HISTORICAL_BATCHES.map((b) => ({
  cycleNo: b.cycleNo,
  killDate: b.killDate,
  finalAvgWeightG: b.finalWeightG,
  mortalityPct: b.finalCumMortPct,
  epef: b.epef,
}));

// ---------------------------------------------------------------------------
// Benchmark set — Ross 308 as-hatched curve + contractor overlay.
// ---------------------------------------------------------------------------

export const BENCHMARK: BenchmarkSet = {
  contractorId: CONTRACTOR.id,
  breed: "Ross 308",
  sex: "as-hatched",
  unit: "g",
  curve: ROSS_308_CURVE,
  overlay: ROSS_308_OVERLAY,
};

// ---------------------------------------------------------------------------
// Users — the role switcher returns one of these (no auth yet, ROADMAP §5).
// ---------------------------------------------------------------------------

export const GROWER_USER: User = {
  id: "u_grower",
  name: "John",
  role: "grower",
  org: "Murray Downs",
  siteId: SITE.id,
};

export const CONTRACTOR_USER: User = {
  id: "u_contractor",
  name: "Andy",
  role: "contractor",
  org: "Irvine's",
  contractorId: CONTRACTOR.id,
};

// ---------------------------------------------------------------------------
// Seed statuses — hand-written for the Phase-0 preview, in brand voice.
// NOTE: these are illustrative seed content, NOT engine output. The rule-based
// status engine is Phase 3 (ROADMAP §8); it will replace this map.
// ---------------------------------------------------------------------------

export const SEED_STATUS_BY_HOUSE: Record<string, Status> = {
  h1: {
    metric: "Weight",
    level: "amber",
    actualVsTarget: "13% under curve at day 28",
    cause: "Growth is trailing the Ross 308 target.",
    fix: "Check feed access and weigh again in 2 days.",
  },
  h2: {
    metric: "Weight",
    level: "amber",
    actualVsTarget: "12% under curve at day 28",
    cause: "Growth is trailing the Ross 308 target.",
    fix: "Check feed access and weigh again in 2 days.",
  },
  h3: {
    metric: "Mortality",
    level: "red",
    actualVsTarget: "3.28% cumulative vs 2.8% band at day 26",
    cause: "Mortality is above the contractor band; warm house readings.",
    fix: "Reduce house temperature and review water lines today.",
  },
  h4: {
    metric: "Mortality",
    level: "green",
    actualVsTarget: "1.68% cumulative, inside the band",
    cause: "On track against the benchmark.",
    fix: "Keep the current routine.",
  },
  h5: {
    metric: "Mortality",
    level: "amber",
    actualVsTarget: "2.19% cumulative at day 26",
    cause: "Edging toward the upper mortality band.",
    fix: "Watch closely; record temperature at the next round.",
  },
  h6: {
    metric: "Mortality",
    level: "red",
    actualVsTarget: "2.27% and rising fast at day 26",
    cause: "Daily losses climbing; house reading 26°C (target <21°C).",
    fix: "Cool the house now and check ventilation.",
  },
};
