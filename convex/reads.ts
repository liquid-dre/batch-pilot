import { query } from "./_generated/server";
import { toApp } from "./lib";

/**
 * Reactive reads (ROADMAP §5 — the data seam, now backed by Convex).
 *
 * The single-site demo dataset is tiny (a few hundred rows), so `getDataset`
 * returns the whole raw dataset in one reactive query. Any mutation invalidates
 * it and every subscribed screen recomputes its view-models from the SAME pure
 * builders the mock seam used — that's what makes the app realtime without
 * threading a bespoke query through each screen. Each row is mapped back to the
 * app's plain shape (`extId` → `id`, system fields dropped) so the `lib/types`
 * contract is unchanged.
 */
export const getDataset = query({
  args: {},
  handler: async (ctx) => {
    const [
      contractors,
      contracts,
      sites,
      houses,
      batches,
      plannedBatches,
      placements,
      dailyEntries,
      weightEntries,
      feedDeliveries,
      catchingEvents,
      manifests,
      editLog,
      historicalBatches,
      growerProfiles,
    ] = await Promise.all([
      ctx.db.query("contractors").collect(),
      ctx.db.query("contracts").collect(),
      ctx.db.query("sites").collect(),
      ctx.db.query("houses").collect(),
      ctx.db.query("batches").collect(),
      ctx.db.query("plannedBatches").collect(),
      ctx.db.query("placements").collect(),
      ctx.db.query("dailyEntries").collect(),
      ctx.db.query("weightEntries").collect(),
      ctx.db.query("feedDeliveries").collect(),
      ctx.db.query("catchingEvents").collect(),
      ctx.db.query("manifests").collect(),
      ctx.db.query("editLog").collect(),
      ctx.db.query("historicalBatches").collect(),
      ctx.db.query("growerProfiles").collect(),
    ]);

    const houseRows = houses.map(toApp);
    // Rebuild each site's ordered `houses` array from its houseIds (the shape
    // `lib/types.ts` Site expects), so the UI sees an unchanged Site object.
    const siteRows = sites.map((s) => {
      const { houseIds, ...site } = toApp(s) as Record<string, unknown> & { houseIds: string[] };
      const ordered = (houseIds ?? []).map((hid) => houseRows.find((h) => (h as { id: string }).id === hid)).filter(Boolean);
      return { ...site, houses: ordered };
    });

    return {
      contractors: contractors.map(toApp),
      contracts: contracts.map(toApp),
      sites: siteRows,
      houses: houseRows,
      batches: batches.map(toApp),
      plannedBatches: plannedBatches.map(toApp),
      placements: placements.map(toApp),
      dailyEntries: dailyEntries.map(toApp),
      weightEntries: weightEntries.map(toApp),
      feedDeliveries: feedDeliveries.map(toApp),
      catchingEvents: catchingEvents.map(toApp),
      manifests: manifests.map(toApp),
      editLog: editLog.map(toApp),
      historicalBatches: historicalBatches.map(toApp),
      growerProfiles: growerProfiles.map(toApp),
    };
  },
});
