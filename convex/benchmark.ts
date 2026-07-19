import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Contractor-tunable benchmark (ROADMAP §8 Phase 4).
 *
 * A contractor tunes the overlay bands (mortality ceiling + uniformity target)
 * the status engine scores their growers against, plus optional threshold
 * overrides. The growth curve stays code (`lib/data/ross308.ts`); only this
 * tunable surface is stored (`benchmarkSets`, one row per contractor). An absent
 * row means the grower dataset carries no benchmark and the engine falls back to
 * the Ross-308 default (`ctxOf` in `lib/data/index.ts`).
 *
 * `myBenchmark` returns the signed-in contractor's set (seeded with the Ross-308
 * default so the tuning form always has a starting point); `myDataset`
 * (convex/dataset.ts) resolves the grower's contractor's set and hands the
 * engine the tuned overlay + thresholds on live data.
 */

// The Convex-side mirror of `ROSS_308_OVERLAY` (lib/data/ross308.ts). Dependency
// free on purpose: the app copy imports app types through the `@/` alias the
// Convex typecheck can't resolve, so the backend keeps its own copy of this
// static default (same pattern as `convex/ross.ts`).
const DEFAULT_OVERLAY = {
  mortalityBand: [
    { day: 7, maxCumPct: 1.0 },
    { day: 14, maxCumPct: 1.6 },
    { day: 21, maxCumPct: 2.2 },
    { day: 28, maxCumPct: 2.8 },
    { day: 35, maxCumPct: 3.5 },
    { day: 42, maxCumPct: 4.2 },
  ],
  uniformityTarget: [
    { day: 7, minPct: 80 },
    { day: 14, minPct: 78 },
    { day: 21, minPct: 75 },
    { day: 28, minPct: 72 },
    { day: 35, minPct: 70 },
  ],
};

// Mirror of `DEFAULT_THRESHOLDS` (lib/engine/thresholds.ts).
const DEFAULT_THRESHOLDS = {
  weight: { green: 0.97, amber: 0.9 },
  fcr: { green: 0.03, amber: 0.08 },
  feedRefillRatio: 1.2,
  mortality: { amber: 0.85, red: 1.0 },
  uniformity: { green: 0.97, amber: 0.9 },
};

const bandArg = v.object({ day: v.number(), maxCumPct: v.number() });
const uniformityArg = v.object({ day: v.number(), minPct: v.number() });
const overlayArg = v.object({
  mortalityBand: v.array(bandArg),
  uniformityTarget: v.array(uniformityArg),
});
const thresholdsArg = v.object({
  weight: v.object({ green: v.number(), amber: v.number() }),
  fcr: v.object({ green: v.number(), amber: v.number() }),
  feedRefillRatio: v.number(),
  mortality: v.object({ amber: v.number(), red: v.number() }),
  uniformity: v.object({ green: v.number(), amber: v.number() }),
});

/** The signed-in contractor + throws if the caller isn't one. */
async function requireContractor(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "contractor" || !user.contractorId) {
    throw new Error("Only a contractor can manage benchmarks");
  }
  return { userId, contractorId: user.contractorId as string };
}

/**
 * The signed-in contractor's tuned benchmark, or the Ross-308 default when they
 * haven't saved one yet. `isDefault` lets the tuning UI show "using the Ross-308
 * default" vs "your tuned set". Returns null for a non-contractor / signed-out
 * caller.
 */
export const myBenchmark = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "contractor" || !user.contractorId) return null;
    const contractorId = user.contractorId as string;

    const row = await ctx.db
      .query("benchmarkSets")
      .withIndex("by_contractor", (q) => q.eq("contractorId", contractorId))
      .first();

    if (!row) {
      return { contractorId, overlay: DEFAULT_OVERLAY, thresholds: DEFAULT_THRESHOLDS, targetWeightG: null, isDefault: true };
    }
    return {
      contractorId,
      overlay: row.overlay,
      thresholds: row.thresholds ?? DEFAULT_THRESHOLDS,
      targetWeightG: row.targetWeightG ?? null,
      isDefault: false,
    };
  },
});

/**
 * Contractor: save (create or replace) the tuned benchmark for their org. The
 * overlay is required; thresholds are optional (omit to keep the engine's
 * defaults). Idempotent per contractor — one row, overwritten on each save.
 */
export const setBenchmark = mutation({
  args: { overlay: overlayArg, thresholds: v.optional(thresholdsArg), targetWeightG: v.optional(v.number()) },
  handler: async (ctx, { overlay, thresholds, targetWeightG }) => {
    const { contractorId } = await requireContractor(ctx);
    const updatedAt = new Date().toISOString();
    const existing = await ctx.db
      .query("benchmarkSets")
      .withIndex("by_contractor", (q) => q.eq("contractorId", contractorId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { overlay, thresholds, targetWeightG, updatedAt });
      return { contractorId };
    }
    await ctx.db.insert("benchmarkSets", { contractorId, overlay, thresholds, targetWeightG, updatedAt });
    return { contractorId };
  },
});
