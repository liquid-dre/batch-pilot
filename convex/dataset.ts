import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { toApp } from "./lib";

/**
 * Per-tenant single-site dataset (ROADMAP §5 / `docs/CONVEX.md` §3) — reactive.
 *
 * Returns ONLY the signed-in grower's own site and its rows, so the pure
 * `lib/data` view-builders can run on live data with the tenant boundary
 * enforced server-side (this replaces the deleted, unscoped `getDataset`). The
 * contractor's cross-farm screens use bespoke scoped queries instead
 * (`convex/growers.ts` etc.) — the hybrid split. Returns null for a
 * contractor / signed-out / not-yet-placed user.
 */
export const myDataset = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const role = (user?.role as string) ?? "";
    if (!user || !user.siteId || (role !== "supervisor" && role !== "manager")) return null;
    const siteId = user.siteId as string;

    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first();
    if (!site) return null;

    // Rebuild the site's ordered houses array (the `lib/types` Site shape).
    const houseRows = await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();
    const houseById = new Map(houseRows.map((h) => [h.extId, h]));
    const houses = (site.houseIds ?? [])
      .map((hid) => houseById.get(hid))
      .filter((h): h is NonNullable<typeof h> => Boolean(h))
      .map((h) => toApp(h));

    const contractorId = (site.contractorIds ?? [])[0] ?? "";
    const contractorRow = contractorId
      ? await ctx.db.query("contractors").withIndex("by_extId", (q) => q.eq("extId", contractorId)).first()
      : null;

    const batch = await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", siteId)).first();
    const placements = batch
      ? await ctx.db.query("placements").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).collect()
      : [];

    const dailyEntries = [];
    const weightEntries = [];
    for (const p of placements) {
      const daily = await ctx.db.query("dailyEntries").withIndex("by_placement", (q) => q.eq("placementId", p.extId)).collect();
      const weights = await ctx.db.query("weightEntries").withIndex("by_placement", (q) => q.eq("placementId", p.extId)).collect();
      dailyEntries.push(...daily);
      weightEntries.push(...weights);
    }

    const feedDeliveries = await ctx.db.query("feedDeliveries").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();
    const catchingEvents = batch
      ? await ctx.db.query("catchingEvents").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).collect()
      : [];
    const manifest = batch
      ? await ctx.db.query("manifests").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).first()
      : null;

    const plannedRows = await ctx.db.query("plannedBatches").collect();
    const plannedBatch = plannedRows.find((pb) => pb.siteId === siteId) ?? null;

    const contract = batch?.contractId
      ? await ctx.db.query("contracts").withIndex("by_extId", (q) => q.eq("extId", batch.contractId)).first()
      : null;

    // Edit log entries for this site's placements only.
    const placementIds = new Set(placements.map((p) => p.extId));
    const editLog = (await ctx.db.query("editLog").collect()).filter((e) => placementIds.has(e.placementId));

    return {
      site: { ...toApp(site), houses },
      contractor: contractorRow ? toApp(contractorRow) : { id: contractorId, name: "" },
      contract: contract ? toApp(contract) : null,
      batch: batch ? toApp(batch) : null,
      plannedBatch: plannedBatch ? toApp(plannedBatch) : null,
      placements: placements.map(toApp),
      dailyEntries: dailyEntries.map(toApp),
      weightEntries: weightEntries.map(toApp),
      feedDeliveries: feedDeliveries.map(toApp),
      catchingEvents: catchingEvents.map(toApp),
      manifest: manifest ? toApp(manifest) : null,
      // Closed-cycle history + track record become real once `closeCycle` lands
      // (Phase 2); a live-onboarded farm has none yet.
      historicalBatches: [],
      editLog: editLog.map(toApp),
      pastCycles: [],
    };
  },
});
