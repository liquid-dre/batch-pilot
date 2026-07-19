/**
 * The raw, single-tenant `Dataset` the view-builders read (ROADMAP §5 / the
 * `docs/CONVEX.md` §3 migration recipe).
 *
 * Today the builders in `lib/data/index.ts` read module-level mock arrays
 * directly. To make them tenant-agnostic and reusable on live Convex data, they
 * take a `Dataset` instead: the mock path builds one from `lib/data/mock.ts`
 * (`datasetFromMock`), the Convex path builds one from the per-tenant
 * `convex/dataset.ts` `myDataset` query. Same builders, same `lib/view` output —
 * only the source of the rows changes.
 *
 * This is a **grower / single-site** dataset (one site, its houses, its current
 * cycle + history). The contractor's inherently cross-farm screens (Growers,
 * Schedule, Benchmark) use bespoke scoped queries instead — the hybrid split.
 */
import type {
  Batch,
  CatchingEvent,
  Contract,
  Contractor,
  DailyEntry,
  EditRecord,
  FeedDelivery,
  Manifest,
  PastCycle,
  PlannedBatch,
  Placement,
  Site,
  WeightEntry,
} from "@/lib/types";
import type { HistoricalBatchSeed } from "./mock";
import {
  BATCH,
  CATCHING_EVENTS,
  CONTRACT,
  CONTRACTOR,
  DAILY_ENTRIES,
  EDIT_LOG,
  FEED_DELIVERIES,
  HISTORICAL_BATCHES,
  MANIFEST,
  PAST_CYCLES,
  PLACEMENTS,
  PLANNED_BATCH,
  SITE,
  WEIGHT_ENTRIES,
} from "./mock";

export interface Dataset {
  site: Site;
  contractor: Contractor;
  contract: Contract;
  batch: Batch;
  plannedBatch: PlannedBatch | null;
  placements: Placement[];
  dailyEntries: DailyEntry[];
  weightEntries: WeightEntry[];
  feedDeliveries: FeedDelivery[];
  catchingEvents: CatchingEvent[];
  manifest: Manifest | null;
  /** Closed cycles on this site (seed for the contractor track record + compare). */
  historicalBatches: HistoricalBatchSeed[];
  editLog: EditRecord[];
  pastCycles: PastCycle[];
}

/** The demo single-site dataset, straight from the mock seam. */
export function datasetFromMock(): Dataset {
  return {
    site: SITE,
    contractor: CONTRACTOR,
    contract: CONTRACT,
    batch: BATCH,
    plannedBatch: PLANNED_BATCH,
    placements: PLACEMENTS,
    dailyEntries: DAILY_ENTRIES,
    weightEntries: WEIGHT_ENTRIES,
    feedDeliveries: FEED_DELIVERIES,
    catchingEvents: CATCHING_EVENTS,
    manifest: MANIFEST,
    historicalBatches: HISTORICAL_BATCHES,
    editLog: EDIT_LOG,
    pastCycles: PAST_CYCLES,
  };
}
