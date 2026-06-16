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
  Placement,
  Site,
  Status,
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
