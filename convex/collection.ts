import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { toApp } from "./lib";

/**
 * Collection / catching (ROADMAP §9 Phase 2). BRD-split roles: the **contractor**
 * posts the night schedule + vehicle manifest (postCatchingSchedule); the farm's
 * **supervisor/manager** records birds caught per night + ticks trucks off at the
 * gate (recordCatch / verifyVehicle). Catching is batch-level; "birds collected"
 * is tracked as the sum of recorded catches and drawn down against the flock's
 * remaining birds at read time, leaving the per-house mortality chain untouched.
 */

/** The signed-in contractor who owns `siteId`, or throws. */
async function requireOwner(ctx: any, siteId: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "contractor" || !user.contractorId) {
    throw new Error("Only a contractor can manage collection");
  }
  const site = await ctx.db.query("sites").withIndex("by_extId", (q: any) => q.eq("extId", siteId)).first();
  if (!site || !(site.contractorIds ?? []).includes(user.contractorId)) throw new Error("Farm not found");
  return { site };
}

/** The signed-in grower (supervisor/manager) + their farm id, or throws. */
async function requireGrower(ctx: any): Promise<{ siteId: string }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  const role = user?.role as string;
  if (!user || !user.siteId || (role !== "supervisor" && role !== "manager")) {
    throw new Error("Only a farm's grower can record collection");
  }
  return { siteId: user.siteId as string };
}

async function activeBatch(ctx: any, siteId: string) {
  return ctx.db
    .query("batches")
    .withIndex("by_site", (q: any) => q.eq("siteId", siteId))
    .filter((q: any) => q.eq(q.field("closedAt"), undefined))
    .first();
}

/** Birds still on the farm = Σ each house's latest remaining (mortality chain). */
async function birdsRemaining(ctx: any, batchExtId: string): Promise<number> {
  const placements = await ctx.db.query("placements").withIndex("by_batch", (q: any) => q.eq("batchId", batchExtId)).collect();
  let remaining = 0;
  for (const p of placements) {
    const daily = (
      await ctx.db.query("dailyEntries").withIndex("by_placement", (q: any) => q.eq("placementId", p.extId)).collect()
    ).sort((a: any, b: any) => a.day - b.day);
    remaining += daily[daily.length - 1]?.birdsRemaining ?? p.placedCount;
  }
  return remaining;
}

/** The shared collection view for one active batch. */
async function collectionView(ctx: any, batch: any, site: any) {
  const events = (
    await ctx.db.query("catchingEvents").withIndex("by_batch", (q: any) => q.eq("batchId", batch.extId)).collect()
  ).sort((a: any, b: any) => (a.extId < b.extId ? -1 : 1));
  const manifest = await ctx.db.query("manifests").withIndex("by_batch", (q: any) => q.eq("batchId", batch.extId)).first();
  const remaining = await birdsRemaining(ctx, batch.extId);
  const collected = events.reduce((s: number, e: any) => s + (e.caughtCount ?? 0), 0);
  return {
    active: true as const,
    siteName: site.name,
    cycleNo: batch.cycleNo,
    killDate: batch.killDate,
    events: events.map(toApp),
    manifest: manifest ? toApp(manifest) : null,
    remaining,
    collected,
    onFarm: Math.max(0, remaining - collected),
  };
}

/* -------------------------------------------------------------- Contractor -- */

/** Contractor: post/replace the catching schedule + vehicle manifest for a farm. */
export const postCatchingSchedule = mutation({
  args: {
    siteId: v.string(),
    nights: v.array(v.object({ night: v.string(), count: v.number() })),
    vehicles: v.array(v.object({ plate: v.string(), driver: v.string() })),
    heldCount: v.number(),
  },
  handler: async (ctx, { siteId, nights, vehicles, heldCount }) => {
    await requireOwner(ctx, siteId);
    const batch = await activeBatch(ctx, siteId);
    if (!batch) throw new Error("This farm has no active cycle");

    // Replace the schedule (keep any already-recorded night's actuals? No — a
    // re-post is an explicit reset of the plan).
    const existing = await ctx.db.query("catchingEvents").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).collect();
    await Promise.all(existing.map((e) => ctx.db.delete(e._id)));
    let n = 0;
    for (const night of nights) {
      if (!night.night.trim() || night.count <= 0) continue;
      n += 1;
      await ctx.db.insert("catchingEvents", {
        extId: `${batch.extId}_c${n}`,
        batchId: batch.extId,
        night: night.night.trim(),
        count: Math.round(night.count),
      });
    }

    const cleanVehicles = vehicles.filter((veh) => veh.plate.trim() !== "");
    const m = await ctx.db.query("manifests").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).first();
    const fields = { batchId: batch.extId, heldCount: Math.round(heldCount), vehicles: cleanVehicles };
    if (m) await ctx.db.patch(m._id, fields);
    else await ctx.db.insert("manifests", fields);
    return { nights: n };
  },
});

/** Contractor: the collection view for one of their farms (reactive). */
export const contractorCatching = query({
  args: { siteId: v.string() },
  handler: async (ctx, { siteId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "contractor" || !user.contractorId) return null;
    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first();
    if (!site || !(site.contractorIds ?? []).includes(user.contractorId as string)) return null;
    const batch = await activeBatch(ctx, siteId);
    if (!batch) return { active: false as const, siteName: site.name };
    return collectionView(ctx, batch, site);
  },
});

/* ---------------------------------------------------------------- Grower ---- */

/** Supervisor/manager: their farm's collection view (reactive). */
export const growerCatching = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const role = user?.role as string;
    if (!user || !user.siteId || (role !== "supervisor" && role !== "manager")) return null;
    const siteId = user.siteId as string;
    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first();
    if (!site) return null;
    const batch = await activeBatch(ctx, siteId);
    if (!batch) return { active: false as const, siteName: site.name };
    return collectionView(ctx, batch, site);
  },
});

/** Supervisor: record the birds caught + collection weight for a night. */
export const recordCatch = mutation({
  args: { eventId: v.string(), caughtCount: v.number(), collectionWeightKg: v.number() },
  handler: async (ctx, { eventId, caughtCount, collectionWeightKg }) => {
    const { siteId } = await requireGrower(ctx);
    const event = await ctx.db.query("catchingEvents").withIndex("by_extId", (q) => q.eq("extId", eventId)).first();
    if (!event) throw new Error("Catching night not found");
    const batch = await ctx.db.query("batches").withIndex("by_extId", (q) => q.eq("extId", event.batchId)).first();
    if (!batch || batch.siteId !== siteId) throw new Error("Not your farm's collection");
    await ctx.db.patch(event._id, {
      caughtCount: Math.round(caughtCount),
      collectionWeightKg,
      caughtAt: new Date().toISOString(),
    });
    return { ok: true as const };
  },
});

/** Supervisor: tick a manifest vehicle off (or on) at the gate. */
export const verifyVehicle = mutation({
  args: { plate: v.string(), verified: v.boolean() },
  handler: async (ctx, { plate, verified }) => {
    const { siteId } = await requireGrower(ctx);
    const batch = await activeBatch(ctx, siteId);
    if (!batch) throw new Error("No active cycle");
    const m = await ctx.db.query("manifests").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).first();
    if (!m) throw new Error("No manifest posted yet");
    const set = new Set(m.verifiedPlates ?? []);
    if (verified) set.add(plate);
    else set.delete(plate);
    await ctx.db.patch(m._id, { verifiedPlates: [...set] });
    return { ok: true as const };
  },
});
