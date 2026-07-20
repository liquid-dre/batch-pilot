import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Alert dismissal (ROADMAP §8 — alerts). Alerts are derived reactively from the
 * status engine (`getAlerts` over `myDataset`), never stored; dismissal is a
 * per-user overlay. A dismissal is keyed by house + metric + level so it stays
 * hidden until that house's flagged metric or severity changes, then re-appears.
 */

/** The signed-in grower (supervisor/manager) + their farm, or throws. */
async function requireGrower(ctx: any): Promise<{ userId: string; siteId: string }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  const role = user?.role as string;
  if (!user || !user.siteId || (role !== "supervisor" && role !== "manager")) {
    throw new Error("Only a farm's grower can manage alerts");
  }
  return { userId: userId as string, siteId: user.siteId as string };
}

/** Turn off an alert for this user (idempotent per house + metric + level). */
export const dismissAlert = mutation({
  args: { houseId: v.string(), metric: v.string(), level: v.string() },
  handler: async (ctx, { houseId, metric, level }) => {
    const { userId, siteId } = await requireGrower(ctx);
    const existing = await ctx.db
      .query("dismissedAlerts")
      .withIndex("by_user_house", (q) => q.eq("userId", userId).eq("houseId", houseId))
      .collect();
    if (existing.some((d) => d.metric === metric && d.level === level)) return { ok: true as const };
    await ctx.db.insert("dismissedAlerts", {
      userId,
      siteId,
      houseId,
      metric,
      level,
      dismissedAt: new Date().toISOString(),
    });
    return { ok: true as const };
  },
});

/** Restore (un-dismiss) an alert for this user. */
export const restoreAlert = mutation({
  args: { houseId: v.string(), metric: v.string(), level: v.string() },
  handler: async (ctx, { houseId, metric, level }) => {
    const { userId } = await requireGrower(ctx);
    const rows = await ctx.db
      .query("dismissedAlerts")
      .withIndex("by_user_house", (q) => q.eq("userId", userId).eq("houseId", houseId))
      .collect();
    await Promise.all(rows.filter((r) => r.metric === metric && r.level === level).map((r) => ctx.db.delete(r._id)));
    return { ok: true as const };
  },
});

/** This user's dismissed-alert keys (reactive) — house + metric + level. */
export const myDismissedAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("dismissedAlerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ houseId: r.houseId, metric: r.metric, level: r.level }));
  },
});
