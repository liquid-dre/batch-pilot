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
  name: "Nhunge",
  farmCode: "ZBNH",
  location: { lat: -17.78, lng: 31.05 },
  contractorIds: [CONTRACTOR.id],
  houses: [
    { id: "h1", siteId: "site_nhunge", name: "House 1", capacity: 16000 },
    { id: "h2", siteId: "site_nhunge", name: "House 2", capacity: 16000 },
    { id: "h3", siteId: "site_nhunge", name: "House 3", capacity: 16000 },
    { id: "h4", siteId: "site_nhunge", name: "House 4", capacity: 16000 },
    { id: "h5", siteId: "site_nhunge", name: "House 5", capacity: 16000 },
    { id: "h6", siteId: "site_nhunge", name: "House 6", capacity: 16000 },
  ],
};

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
// Daily entries.
// Anchors (mortality, culls, feed, cumMort, day) come verbatim from BRD §7.2
// for the latest day (date 12/06/26). The 8-day window before each anchor is
// synthesised so the cumulative arrives EXACTLY at the BRD cumMort, giving
// charts real shape without inventing the documented numbers.
// ---------------------------------------------------------------------------

interface DailyAnchor {
  placementId: string;
  anchorDay: number;
  anchorDate: string;
  anchorCumMort: number;
  anchorFeedKg: number;
  /** Per-day mortality across the window; last element = the BRD anchor day. */
  morts: number[];
  /** Optional per-house temperature on the anchor day (diagnostic only). */
  anchorTempC?: number;
}

const DAILY_ANCHORS: DailyAnchor[] = [
  { placementId: "p1", anchorDay: 27, anchorDate: "2026-06-12", anchorCumMort: 296, anchorFeedKg: 2350, morts: [9, 11, 8, 12, 10, 13, 15, 17] },
  { placementId: "p2", anchorDay: 27, anchorDate: "2026-06-12", anchorCumMort: 298, anchorFeedKg: 2600, morts: [10, 9, 12, 8, 11, 13, 14, 16] },
  { placementId: "p3", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 530, anchorFeedKg: 2350, morts: [14, 16, 13, 19, 17, 21, 16, 18], anchorTempC: 24.5 },
  { placementId: "p4", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 273, anchorFeedKg: 2350, morts: [6, 7, 5, 9, 6, 8, 7, 8] },
  { placementId: "p5", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 355, anchorFeedKg: 2450, morts: [11, 13, 10, 15, 12, 17, 14, 19] },
  { placementId: "p6", anchorDay: 26, anchorDate: "2026-06-12", anchorCumMort: 368, anchorFeedKg: 3000, morts: [13, 16, 14, 20, 18, 22, 25, 30], anchorTempC: 26.2 },
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

function buildSeries(a: DailyAnchor): DailyEntry[] {
  const placed = placedFor(a.placementId);
  const windowSum = a.morts.reduce((s, n) => s + n, 0);
  // cumMort at the first window day so the series lands exactly on anchorCumMort.
  let cum = a.anchorCumMort - windowSum + a.morts[0];
  const n = a.morts.length;

  return a.morts.map((mort, i) => {
    if (i > 0) cum += mort;
    const day = a.anchorDay - (n - 1 - i);
    const cullAndMort = mort; // culls are 0 in this block (BRD §7.2)
    const birdsRemaining = placed - cum;
    const cumPct = Number(((cum / placed) * 100).toFixed(2));
    // Feed ramps with age toward the BRD anchor figure on the last day.
    const feedAddedKg = Math.round(a.anchorFeedKg * (0.9 + (0.1 * i) / (n - 1)));
    const isAnchor = i === n - 1;
    return {
      id: `${a.placementId}-d${day}`,
      placementId: a.placementId,
      date: isAnchor ? a.anchorDate : dateMinusDays(a.anchorDate, n - 1 - i),
      day,
      mortality: mort,
      culls: 0,
      feedAddedKg: isAnchor ? a.anchorFeedKg : feedAddedKg,
      tempC: isAnchor ? a.anchorTempC : undefined,
      cullAndMort,
      cumMort: cum,
      cumPct,
      birdsRemaining,
    };
  });
}

export const DAILY_ENTRIES: DailyEntry[] = DAILY_ANCHORS.flatMap(buildSeries);

// ---------------------------------------------------------------------------
// Weights (BRD §7.4 — day 28, Houses 1–2 verbatim).
// Houses 3–6 are synthesised ~13–18% under the Ross curve for their day,
// consistent with the documented Houses 1–2 under-performance (the hero story).
// ---------------------------------------------------------------------------

export const WEIGHT_ENTRIES: WeightEntry[] = [
  { id: "w1", placementId: "p1", day: 28, avgWeightG: 1401, adgG: 98, growthRatio: 1.2, uniformityPct: 73 }, // BRD
  { id: "w2", placementId: "p2", day: 28, avgWeightG: 1417, adgG: 89, growthRatio: 1.2, uniformityPct: 70 }, // BRD
  { id: "w3", placementId: "p3", day: 26, avgWeightG: 1180, adgG: 79, growthRatio: 1.1, uniformityPct: 68 }, // synthesised
  { id: "w4", placementId: "p4", day: 26, avgWeightG: 1305, adgG: 88, growthRatio: 1.2, uniformityPct: 74 }, // synthesised
  { id: "w5", placementId: "p5", day: 26, avgWeightG: 1255, adgG: 84, growthRatio: 1.2, uniformityPct: 71 }, // synthesised
  { id: "w6", placementId: "p6", day: 26, avgWeightG: 1210, adgG: 80, growthRatio: 1.1, uniformityPct: 67 }, // synthesised
];

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
  name: "Tendai Moyo",
  role: "grower",
  org: "Nhunge",
  siteId: SITE.id,
};

export const CONTRACTOR_USER: User = {
  id: "u_contractor",
  name: "Rumbi Chikwava",
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
