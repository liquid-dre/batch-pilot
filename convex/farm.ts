import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Per-farm operational data (stage 2b) — reactive. Both the supervisor capture
 * panel and the manager review panel subscribe to this, so a saved daily update
 * shows up live on every open screen for the same farm. Scoped to the signed-in
 * grower's `siteId`; returns `null` for non-growers / signed-out.
 */
export const farmData = query({
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

    const batch = await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", siteId)).first();
    if (!batch) return { role, farmName: site.name, today: new Date().toISOString().slice(0, 10), cycle: null, houses: [] };

    const placements = (
      await ctx.db.query("placements").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).collect()
    ).sort((a, b) => (a.extId < b.extId ? -1 : 1));
    const today = new Date().toISOString().slice(0, 10);

    const houses = [];
    for (const p of placements) {
      const house = await ctx.db.query("houses").withIndex("by_extId", (q) => q.eq("extId", p.houseId)).first();
      const entries = (
        await ctx.db.query("dailyEntries").withIndex("by_placement", (q) => q.eq("placementId", p.extId)).collect()
      ).sort((a, b) => a.day - b.day);
      const latest = entries[entries.length - 1];
      houses.push({
        houseId: p.houseId,
        name: house?.name ?? p.houseId,
        placedCount: p.placedCount,
        // The next day to record: one past the latest captured day (starts at 1).
        dayToRecord: (latest?.day ?? 0) + 1,
        priorCumMort: latest?.cumMort ?? 0,
        priorCumPct: latest?.cumPct ?? 0,
        remaining: latest?.birdsRemaining ?? p.placedCount,
        lastFeedKg: latest?.feedAddedKg ?? 0,
        latest: latest
          ? {
              day: latest.day,
              mortality: latest.mortality,
              cumMort: latest.cumMort,
              cumPct: latest.cumPct,
              birdsRemaining: latest.birdsRemaining,
              feedAddedKg: latest.feedAddedKg,
            }
          : null,
        recentDays: entries.slice(-8).map((e) => ({
          day: e.day,
          mortality: e.mortality,
          culls: e.culls,
          cumMort: e.cumMort,
          cumPct: e.cumPct,
          birdsRemaining: e.birdsRemaining,
          feedAddedKg: e.feedAddedKg,
        })),
      });
    }

    return {
      role,
      farmName: site.name,
      today,
      cycle: { cycleNo: batch.cycleNo, breed: batch.breed, killDate: batch.killDate },
      houses,
    };
  },
});
