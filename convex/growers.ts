import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rossAt } from "./ross";

/**
 * Contractor grower-performance reads (ROADMAP §5) — reactive, per-tenant.
 *
 * Both queries are scoped to the signed-in contractor via `getAuthUserId` →
 * `contractorId`, so a contractor only ever sees the farms they own. The
 * headline metrics (EPEF, FCR, weight-vs-Ross, on-time) are derived server-side
 * from the farm's real captured daily + weight entries — the same arithmetic the
 * mock seam used, now run on live Convex rows. Farms that own no cycle yet, or a
 * cycle with no capture, surface as "not yet reporting" rather than as zeroed
 * rows, so the ranking stays honest.
 */

type StatusLevel = "green" | "amber" | "red";

const growerLevel = (vsRossPct: number): StatusLevel =>
  vsRossPct >= 98 ? "green" : vsRossPct >= 90 ? "amber" : "red";

/** Whole days from ISO `a` to ISO `b` (b − a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  if ([ay, am, ad, by, bm, bd].some((n) => Number.isNaN(n))) return 0;
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** The signed-in contractor's id, or null for non-contractors / signed-out. */
async function contractorScope(ctx: any): Promise<{ contractorId: string; org: string } | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "contractor" || !user.contractorId) return null;
  return { contractorId: user.contractorId as string, org: (user.org as string) ?? "" };
}

interface PlacementData {
  placedCount: number;
  entries: any[]; // dailyEntries, sorted by day asc
  weights: any[]; // weightEntries, sorted by day asc
  placementDate: string;
  houseId: string;
  dayCount: number;
}

/** Load a farm's ongoing batch + every placement's daily/weight rows. */
async function loadFarm(ctx: any, siteId: string) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const batch = (await ctx.db.query("batches").withIndex("by_site", (q: any) => q.eq("siteId", siteId)).collect())
    .filter((b: any) => !b.closedAt && (!b.placementDate || b.placementDate <= todayIso))
    .sort((a: any, b: any) => (b.placementDate ?? "").localeCompare(a.placementDate ?? ""))[0] ?? null;
  if (!batch) return null;
  const rawPlacements = await ctx.db
    .query("placements")
    .withIndex("by_batch", (q: any) => q.eq("batchId", batch.extId))
    .collect();
  if (rawPlacements.length === 0) return null;
  const placements: PlacementData[] = [];
  for (const p of rawPlacements) {
    const entries = (
      await ctx.db.query("dailyEntries").withIndex("by_placement", (q: any) => q.eq("placementId", p.extId)).collect()
    ).sort((a: any, b: any) => a.day - b.day);
    const weights = (
      await ctx.db.query("weightEntries").withIndex("by_placement", (q: any) => q.eq("placementId", p.extId)).collect()
    ).sort((a: any, b: any) => a.day - b.day);
    placements.push({
      placedCount: p.placedCount,
      entries,
      weights,
      placementDate: p.placementDate,
      houseId: p.houseId,
      dayCount: p.dayCount,
    });
  }
  return { batch, placements };
}

/** A placement's cumulative mortality at (or before) day `d` — a step function. */
function cumMortAt(entries: any[], d: number): number {
  let v = 0;
  for (const e of entries) {
    if (e.day <= d) v = e.cumMort;
    else break;
  }
  return v;
}

/** Build one farm's GrowerPerf, or null when it has a cycle but no capture yet. */
function sitePerf(site: any, farm: { batch: any; placements: PlacementData[] }) {
  const { batch, placements } = farm;
  const anyDaily = placements.some((p) => p.entries.length > 0);
  if (!anyDaily) return null; // cycle started, nothing captured → not yet reporting

  let placed = 0;
  let remaining = 0;
  let day = 0;
  let weightNum = 0; // Σ avgWeight × birds (birds-weighted site average)
  let weightDen = 0;
  let adgSum = 0;
  let adgCount = 0;
  const weighByDay = new Map<number, { wSum: number; bSum: number }>();

  for (const p of placements) {
    placed += p.placedCount;
    const latest = p.entries[p.entries.length - 1];
    const birds = latest?.birdsRemaining ?? p.placedCount;
    remaining += birds;
    if (latest) day = Math.max(day, latest.day);
    const w = p.weights[p.weights.length - 1];
    if (w) {
      weightNum += w.avgWeightG * birds;
      weightDen += birds;
      if (typeof w.adgG === "number" && w.adgG > 0) {
        adgSum += w.adgG;
        adgCount += 1;
      }
    }
    for (const we of p.weights) {
      const cur = weighByDay.get(we.day) ?? { wSum: 0, bSum: 0 };
      cur.wSum += we.avgWeightG * birds;
      cur.bSum += birds;
      weighByDay.set(we.day, cur);
    }
  }
  if (day === 0) day = Math.max(0, ...placements.map((p) => p.dayCount));

  const livability = placed ? (remaining / placed) * 100 : 0;
  const cumMortPct = placed ? Number((((placed - remaining) / placed) * 100).toFixed(2)) : 0;
  const rossW = rossAt(day).weightG;
  const rossFcr = rossAt(day).fcr ?? 1.3;
  const weightG = weightDen ? Math.round(weightNum / weightDen) : 0;
  const vsRossPct = weightG && rossW ? Math.round((weightG / rossW) * 100) : 0;
  // FCR estimated from the Ross objective, worsened in proportion to the weight
  // shortfall (behind birds convert less efficiently) — until consumed-feed lands.
  const fcr = weightG ? Number((rossFcr * (rossW / weightG)).toFixed(2)) : rossFcr;
  const epef = weightG && day ? Math.round(((livability * (weightG / 1000)) / (day * fcr)) * 100) : 0;

  const collectionDay = daysBetween(placements[0].placementDate, batch.expectedCollectionDate);
  const target = rossAt(collectionDay).weightG;
  const adg = adgCount ? adgSum / adgCount : rossAt(day).dailyGainG ?? 90;
  const daysToTarget = weightG >= target ? day : day + Math.ceil((target - weightG) / Math.max(adg, 1));
  const readyVsCollectionDays = weightG ? daysToTarget - collectionDay : 0;
  const status: "active" | "completed" = collectionDay > 0 && day >= collectionDay ? "completed" : "active";

  // Day-of-cycle trend: site cumulative mortality %, plus weight-vs-Ross and FCR
  // forward-filled from the weigh days (0 before the first weigh-in).
  const trend: { day: number; cumPct: number; dailyMortPct: number; vsRossPct: number; fcr: number }[] = [];
  let prevCum = 0;
  let lastVsRoss = 0;
  let lastFcr = 0;
  for (let d = 1; d <= day; d++) {
    const siteCum = placements.reduce((s, p) => s + cumMortAt(p.entries, d), 0);
    const cumPct = placed ? Number(((siteCum / placed) * 100).toFixed(3)) : 0;
    const dailyMortPct = placed ? Number((((siteCum - prevCum) / placed) * 100).toFixed(3)) : 0;
    prevCum = siteCum;
    const wd = weighByDay.get(d);
    if (wd && wd.bSum) {
      const aw = wd.wSum / wd.bSum;
      const rW = rossAt(d).weightG;
      lastVsRoss = rW ? Math.round((aw / rW) * 100) : lastVsRoss;
      const rF = rossAt(d).fcr ?? rossFcr;
      lastFcr = aw ? Number((rF * (rW / aw)).toFixed(2)) : lastFcr;
    }
    trend.push({ day: d, cumPct, dailyMortPct, vsRossPct: lastVsRoss, fcr: lastFcr });
  }

  return {
    siteId: site.extId,
    name: site.name,
    farmCode: site.farmCode,
    cycleNo: batch.cycleNo,
    status,
    day,
    collectionDay,
    placed,
    remaining,
    epef,
    fcr,
    cumMortPct,
    weightG,
    vsRossPct,
    readyVsCollectionDays,
    level: growerLevel(vsRossPct),
    trend,
  };
}

/** Ranked grower performance for every farm the signed-in contractor owns. */
export const contractorGrowers = query({
  args: {},
  handler: async (ctx) => {
    const scope = await contractorScope(ctx);
    if (!scope) return null;

    const contractor = await ctx.db
      .query("contractors")
      .withIndex("by_extId", (q) => q.eq("extId", scope.contractorId))
      .first();
    const contractorName = contractor?.name || scope.org || "Your growers";

    const allSites = await ctx.db.query("sites").collect();
    const sites = allSites.filter((s) => (s.contractorIds ?? []).includes(scope.contractorId));

    const growers: ReturnType<typeof sitePerf>[] = [];
    const notReporting: { siteId: string; name: string; farmCode: string }[] = [];
    let maxDay = 1;
    for (const site of sites) {
      const farm = await loadFarm(ctx, site.extId);
      const perf = farm ? sitePerf(site, farm) : null;
      if (perf) {
        growers.push(perf);
        maxDay = Math.max(maxDay, perf.day);
      } else {
        notReporting.push({ siteId: site.extId, name: site.name, farmCode: site.farmCode });
      }
    }

    const ross = Array.from({ length: maxDay }, (_, i) => {
      const d = i + 1;
      const pt = rossAt(d);
      return { day: d, weightG: pt.weightG, fcr: pt.fcr };
    });

    return { contractorName, growers: growers.filter(Boolean), notReporting, ross, maxDay };
  },
});

/** Per-house drill-down for one of the contractor's farms (tenant-guarded). */
export const contractorGrowerDetail = query({
  args: { siteId: v.string() },
  handler: async (ctx, { siteId }) => {
    const scope = await contractorScope(ctx);
    if (!scope) return null;
    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first();
    if (!site || !(site.contractorIds ?? []).includes(scope.contractorId)) return null; // not yours
    const farm = await loadFarm(ctx, siteId);
    if (!farm) return null;
    const { batch, placements } = farm;

    let placed = 0;
    let remaining = 0;
    let cumMort = 0;
    let feedKg = 0;
    let weightNum = 0; // Σ avgWeight × birds (birds-weighted site weight)
    let weightDen = 0;
    const houses = [];
    for (const p of placements) {
      const house = await ctx.db.query("houses").withIndex("by_extId", (q) => q.eq("extId", p.houseId)).first();
      const latest = p.entries[p.entries.length - 1];
      const w = p.weights[p.weights.length - 1];
      const day = latest?.day ?? p.dayCount;
      const cumPct = latest?.cumPct ?? 0;
      const houseRemaining = latest?.birdsRemaining ?? p.placedCount;
      const avgWeightG = w?.avgWeightG ?? 0;
      const rossW = w ? rossAt(w.day).weightG : 0;
      const vsRossPct = w && rossW ? Math.round((w.avgWeightG / rossW) * 100) : 0;

      placed += p.placedCount;
      remaining += houseRemaining;
      cumMort += latest?.cumMort ?? 0;
      feedKg += p.entries.reduce((s, e) => s + e.feedAddedKg, 0);
      if (avgWeightG) {
        weightNum += avgWeightG * houseRemaining;
        weightDen += houseRemaining;
      }

      houses.push({
        houseId: p.houseId,
        houseName: house?.name ?? p.houseId,
        day,
        // Only assert a weight status once there's a weigh-in to judge against.
        status: avgWeightG
          ? {
              metric: "Weight",
              level: growerLevel(vsRossPct),
              actualVsTarget: `${vsRossPct}% of Ross weight, ${cumPct}% cumulative mortality`,
            }
          : undefined,
        cumPct,
        remaining: houseRemaining,
        avgWeightG,
        vsRossPct,
        mortSeries: p.entries.map((e) => e.mortality),
        cumPctSeries: p.entries.map((e) => e.cumPct),
      });
    }

    const mortPct = placed ? Number(((cumMort / placed) * 100).toFixed(2)) : 0;

    // Settlement (Phase 2): grower margin from the linked contract's prices.
    // Collected kg = real recorded collection weights if any, else a projection
    // (site avg weight × birds remaining). Chargeable chicks net the FOC%.
    const events = await ctx.db.query("catchingEvents").withIndex("by_batch", (q) => q.eq("batchId", batch.extId)).collect();
    const realKg = events.reduce((s, e) => s + (e.collectionWeightKg ?? 0), 0);
    const siteAvgWeightG = weightDen ? weightNum / weightDen : 0;
    const collectedKg = realKg > 0 ? realKg : (siteAvgWeightG / 1000) * remaining;
    const contract = batch.contractId
      ? await ctx.db.query("contracts").withIndex("by_extId", (q) => q.eq("extId", batch.contractId)).first()
      : null;
    const settlement = contract
      ? (() => {
          const chargeablePlaced = Math.round(placed * (1 - contract.focPct / 100));
          const revenue = collectedKg * contract.buyBackPerKg;
          const chickCost = chargeablePlaced * contract.chickPrice;
          const feedCost = feedKg * contract.feedPricePerKg;
          return {
            contractLinked: true as const,
            estimated: realKg === 0,
            focPct: contract.focPct,
            chargeablePlaced,
            collectedKg: Math.round(collectedKg),
            feedKg: Math.round(feedKg),
            buyBackPerKg: contract.buyBackPerKg,
            revenue: Math.round(revenue),
            chickCost: Math.round(chickCost),
            feedCost: Math.round(feedCost),
            margin: Math.round(revenue - chickCost - feedCost),
          };
        })()
      : { contractLinked: false as const };

    return {
      siteName: site.name,
      farmCode: site.farmCode,
      cycleNo: batch.cycleNo,
      breed: batch.breed,
      expectedCollectionDate: batch.expectedCollectionDate,
      rollup: { placed, remaining, cumMort, mortPct, houseCount: placements.length },
      houses,
      settlement,
      pastCycles: [], // no closed-cycle history for a live-onboarded farm yet
    };
  },
});
