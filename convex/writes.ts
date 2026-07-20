import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { dailyTotals, EDITABLE_FIELD_LABELS, toApp } from "./lib";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Writes (ROADMAP §5 — the data seam). Each mirrors a `lib/data/` write-stub,
 * but now actually persists: the daily/feed/weights capture and the attributed
 * manager corrections land in Convex, and any change invalidates the reactive
 * queries that read them so every subscribed screen updates live. Derived flock
 * arithmetic is the same pure `dailyTotals` the capture path always used.
 */

const treatment = v.object({ name: v.string(), amount: v.number(), unit: v.string() });
const amount = v.object({ amount: v.number(), unit: v.string() });

/** Placement (by house), its daily entries sorted by day, and the placed count. */
async function placementContext(ctx: { db: any }, houseId: string) {
  const placement = await ctx.db
    .query("placements")
    .withIndex("by_house", (q: any) => q.eq("houseId", houseId))
    .first();
  const daily: Doc<"dailyEntries">[] = placement
    ? (await ctx.db
        .query("dailyEntries")
        .withIndex("by_placement", (q: any) => q.eq("placementId", placement.extId))
        .collect()).sort((a: Doc<"dailyEntries">, b: Doc<"dailyEntries">) => a.day - b.day)
    : [];
  return { placement, daily };
}

/** Recompute a placement's whole cumulative chain forward from its raw figures. */
async function rederivePlacement(ctx: { db: any }, placementExtId: string, placedCount: number) {
  const entries: Doc<"dailyEntries">[] = (await ctx.db
    .query("dailyEntries")
    .withIndex("by_placement", (q: any) => q.eq("placementId", placementExtId))
    .collect()).sort((a: Doc<"dailyEntries">, b: Doc<"dailyEntries">) => a.day - b.day);
  let priorCumMort = 0;
  for (const e of entries) {
    const mortality = e.dayMortality + e.nightMortality;
    const t = dailyTotals({ placed: placedCount, priorCumMort, mortality, culls: e.culls });
    await ctx.db.patch(e._id, {
      mortality,
      cullAndMort: t.cullAndMort,
      cumMort: t.cumMort,
      cumPct: t.cumPct,
      birdsRemaining: t.birdsRemaining,
    });
    priorCumMort = t.cumMort;
  }
}

export const submitDailyUpdate = mutation({
  args: {
    houseId: v.string(),
    date: v.string(),
    day: v.number(),
    dayMortality: v.number(),
    nightMortality: v.number(),
    culls: v.number(),
    feedAddedKg: v.number(),
    tempC: v.optional(v.number()),
    charcoal: v.optional(amount),
    vaccines: v.optional(v.array(treatment)),
    medications: v.optional(v.array(treatment)),
  },
  handler: async (ctx, input) => {
    // Tenant guard: a signed-in grower may only capture into their own farm's
    // houses. (No-op on the mock/no-auth path.)
    const authId = await getAuthUserId(ctx);
    if (authId) {
      const u = await ctx.db.get(authId);
      if (u?.siteId) {
        const h = await ctx.db.query("houses").withIndex("by_extId", (q: any) => q.eq("extId", input.houseId)).first();
        if (!h || h.siteId !== u.siteId) throw new Error("House is not in your farm");
      }
    }

    const { placement, daily } = await placementContext(ctx, input.houseId);
    const placementId = placement?.extId ?? input.houseId;
    const placed = placement?.placedCount ?? 0;
    const mortality = input.dayMortality + input.nightMortality;
    const prior = daily.filter((e) => e.day < input.day).slice(-1)[0];
    const t = dailyTotals({ placed, priorCumMort: prior?.cumMort ?? 0, mortality, culls: input.culls });

    const extId = `${placementId}-d${input.day}`;
    const fields = {
      extId,
      placementId,
      date: input.date,
      day: input.day,
      dayMortality: input.dayMortality,
      nightMortality: input.nightMortality,
      mortality,
      culls: input.culls,
      feedAddedKg: input.feedAddedKg,
      tempC: input.tempC,
      charcoal: input.charcoal,
      vaccines: input.vaccines,
      medications: input.medications,
      cullAndMort: t.cullAndMort,
      cumMort: t.cumMort,
      cumPct: t.cumPct,
      birdsRemaining: t.birdsRemaining,
    };

    const existing = daily.find((e) => e.day === input.day);
    if (existing) await ctx.db.patch(existing._id, fields);
    else await ctx.db.insert("dailyEntries", fields);

    // Inserting/correcting a day shifts every later day's cumulative chain.
    if (placement) await rederivePlacement(ctx, placementId, placed);

    const saved = await ctx.db
      .query("dailyEntries")
      .withIndex("by_extId", (q: any) => q.eq("extId", extId))
      .first();
    return toApp(saved!);
  },
});

export const submitFeedDelivery = mutation({
  args: {
    siteId: v.string(),
    date: v.string(),
    feedType: v.string(),
    bagSizeKg: v.number(),
    bagCount: v.number(),
    netWeightKg: v.number(),
  },
  handler: async (ctx, input) => {
    // Server-authoritative tenant scope: a signed-in grower can only log feed
    // against their own farm, whatever siteId the client passed.
    const authId = await getAuthUserId(ctx);
    let siteId = input.siteId;
    if (authId) {
      const u = await ctx.db.get(authId);
      if (u?.siteId) siteId = u.siteId as string;
    }
    const count = (await ctx.db.query("feedDeliveries").collect()).length;
    await ctx.db.insert("feedDeliveries", { extId: `fd${count + 1}`, ...input, siteId });

    const nominalKg = input.bagSizeKg * input.bagCount;
    const diffKg = nominalKg - input.netWeightKg;
    const diffPct = nominalKg ? Number(((diffKg / nominalKg) * 100).toFixed(1)) : 0;
    return { nominalKg, netWeightKg: input.netWeightKg, diffKg, diffPct, flagged: Math.abs(diffPct) >= 1 };
  },
});

export const submitWeights = mutation({
  args: {
    houseId: v.string(),
    day: v.number(),
    avgWeightG: v.number(),
    adgG: v.number(),
    growthRatio: v.number(),
    uniformityPct: v.number(),
  },
  handler: async (ctx, input) => {
    const { placement } = await placementContext(ctx, input.houseId);
    const placementId = placement?.extId ?? input.houseId;
    const extId = `${placementId}-w${input.day}`;
    const fields = {
      extId,
      placementId,
      day: input.day,
      avgWeightG: input.avgWeightG,
      adgG: input.adgG,
      growthRatio: input.growthRatio,
      uniformityPct: input.uniformityPct,
    };
    const existing = await ctx.db
      .query("weightEntries")
      .withIndex("by_extId", (q: any) => q.eq("extId", extId))
      .first();
    if (existing) await ctx.db.patch(existing._id, fields);
    else await ctx.db.insert("weightEntries", fields);
    // Target/pct-of-Ross are computed client-side (it holds the Ross curve), so
    // this returns just the persisted entry — the seam wrapper rebuilds the rest.
    return toApp({ ...fields, _id: existing?._id as Id<"weightEntries">, _creationTime: 0 });
  },
});

export const submitManagerEdit = mutation({
  args: {
    entityId: v.string(),
    // Fallback attribution for the demo / no-auth path. When a user is signed
    // in, the server-resolved identity below wins so an edit can't be spoofed.
    editor: v.optional(v.object({ id: v.string(), name: v.string(), role: v.string() })),
    changes: v.object({
      dayMortality: v.optional(v.union(v.number(), v.null())),
      nightMortality: v.optional(v.union(v.number(), v.null())),
      culls: v.optional(v.union(v.number(), v.null())),
      feedAddedKg: v.optional(v.union(v.number(), v.null())),
      tempC: v.optional(v.union(v.number(), v.null())),
    }),
    note: v.optional(v.string()),
  },
  handler: async (ctx, input) => {
    const entry = await ctx.db
      .query("dailyEntries")
      .withIndex("by_extId", (q: any) => q.eq("extId", input.entityId))
      .first();
    if (!entry) throw new Error(`Daily entry not found: ${input.entityId}`);

    const placement = await ctx.db
      .query("placements")
      .withIndex("by_extId", (q: any) => q.eq("extId", entry.placementId))
      .first();
    const houseId = placement?.houseId ?? "";
    const house = houseId
      ? await ctx.db.query("houses").withIndex("by_extId", (q: any) => q.eq("extId", houseId)).first()
      : null;
    const houseName = house?.name ?? houseId;
    const editedAt = new Date().toISOString();

    // Prefer the authenticated identity (attribution can't be spoofed by the
    // client); fall back to the passed editor for the demo / pre-auth path.
    const authUserId = await getAuthUserId(ctx);
    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const editor = authUser
      ? { id: authUser._id as string, name: authUser.name ?? "", role: (authUser.role as string) ?? "manager" }
      : input.editor;
    if (!editor) throw new Error("No editor identity for the correction");

    const logCount = (await ctx.db.query("editLog").collect()).length;
    const patch: Record<string, number | undefined> = {};
    const records: Doc<"editLog">[] = [];
    let n = 0;
    for (const field of Object.keys(input.changes) as Array<keyof typeof input.changes>) {
      const next = input.changes[field];
      if (next === undefined) continue;
      const old = ((entry as Record<string, unknown>)[field] ?? null) as number | null;
      if (old === next) continue;
      patch[field] = field === "tempC" ? (next ?? undefined) : (next ?? 0);
      n += 1;
      const rec = {
        extId: `edit_${entry.extId}_${field}_${logCount + n}`,
        entityType: "dailyEntry",
        entityId: entry.extId,
        placementId: entry.placementId,
        houseId,
        houseName,
        day: entry.day,
        field,
        fieldLabel: EDITABLE_FIELD_LABELS[field] ?? field,
        oldValue: old,
        newValue: next,
        editedById: editor.id,
        editedByName: editor.name,
        editedByRole: editor.role,
        editedAt,
        note: input.note,
      };
      const id = await ctx.db.insert("editLog", rec);
      records.push({ ...rec, _id: id, _creationTime: 0 } as Doc<"editLog">);
    }

    if (n > 0) {
      await ctx.db.patch(entry._id, patch);
      if (placement) await rederivePlacement(ctx, entry.placementId, placement.placedCount);
    }
    const updated = await ctx.db
      .query("dailyEntries")
      .withIndex("by_extId", (q: any) => q.eq("extId", input.entityId))
      .first();
    return { entry: toApp(updated!), records: records.map(toApp) };
  },
});

export const saveHouses = mutation({
  args: {
    siteId: v.string(),
    houses: v.array(v.object({ id: v.optional(v.string()), name: v.string(), capacity: v.number() })),
  },
  handler: async (ctx, input) => {
    const site = await ctx.db
      .query("sites")
      .withIndex("by_extId", (q: any) => q.eq("extId", input.siteId))
      .first();
    if (!site) throw new Error(`Site not found: ${input.siteId}`);

    const existing = await ctx.db
      .query("houses")
      .withIndex("by_site", (q: any) => q.eq("siteId", input.siteId))
      .collect();

    const valid = input.houses.filter(
      (h) => h.name.trim() !== "" && Number.isFinite(h.capacity) && h.capacity > 0,
    );
    const keepIds = new Set(valid.map((h) => h.id).filter(Boolean));

    // Remove houses the grower dropped.
    await Promise.all(existing.filter((h) => !keepIds.has(h.extId)).map((h) => ctx.db.delete(h._id)));

    // Monotonic id source above any existing hN id.
    let seq = existing.reduce((m, h) => Math.max(m, parseInt(h.extId.replace(/^h/, ""), 10) || 0), 0);
    const orderedIds: string[] = [];
    for (const h of valid) {
      const capacity = Math.round(h.capacity);
      const name = h.name.trim();
      if (h.id) {
        const row = existing.find((e) => e.extId === h.id);
        if (row) await ctx.db.patch(row._id, { name, capacity });
        else await ctx.db.insert("houses", { extId: h.id, siteId: input.siteId, name, capacity });
        orderedIds.push(h.id);
      } else {
        seq += 1;
        const extId = `h${seq}`;
        await ctx.db.insert("houses", { extId, siteId: input.siteId, name, capacity });
        orderedIds.push(extId);
      }
    }
    await ctx.db.patch(site._id, { houseIds: orderedIds });

    const saved = await ctx.db
      .query("houses")
      .withIndex("by_site", (q: any) => q.eq("siteId", input.siteId))
      .collect();
    return orderedIds
      .map((id) => saved.find((h) => h.extId === id))
      .filter(Boolean)
      .map((h) => toApp(h!));
  },
});

export const confirmAllocation = mutation({
  args: {
    plannedBatchId: v.string(),
    today: v.string(),
    allocations: v.array(v.object({ houseId: v.string(), count: v.number() })),
  },
  handler: async (ctx, input) => {
    const planned = await ctx.db
      .query("plannedBatches")
      .withIndex("by_extId", (q: any) => q.eq("extId", input.plannedBatchId))
      .first();
    if (!planned) throw new Error(`Planned batch not found: ${input.plannedBatchId}`);

    // Whole days from the planned placing date to today (0 = placed today).
    const dayCount = Math.max(0, daysBetween(planned.placementDate, input.today));
    await ctx.db.patch(planned._id, { allocated: true });

    const out = [];
    for (const a of input.allocations.filter((x) => x.count > 0)) {
      const house = await ctx.db
        .query("houses")
        .withIndex("by_extId", (q: any) => q.eq("extId", a.houseId))
        .first();
      out.push({ houseId: a.houseId, houseName: house?.name ?? a.houseId, count: a.count, dayCount });
    }
    return out;
  },
});

/** Whole days from ISO `a` to ISO `b` (b − a); mirrors lib/format daysBetween. */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}
