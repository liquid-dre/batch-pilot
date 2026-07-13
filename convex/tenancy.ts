import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Onboarding / multi-tenant (stage 1 — the identity loop).
 *
 *  - a Contractor creates a farm + invites supervisor(s)
 *  - a Supervisor invites manager(s) to their farm
 *  - `myWorkspace` is the reactive per-role view the onboarding UI renders
 *
 * Farm/cycle *data* (houses, placements, capture) is stage 2; this file only
 * covers who belongs to which farm.
 */

function norm(email: string): string {
  return email.trim().toLowerCase();
}

/** Contractor: create a farm and invite its supervisor(s) by email. */
export const createFarm = mutation({
  args: { name: v.string(), supervisorEmails: v.array(v.string()) },
  handler: async (ctx, { name, supervisorEmails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "contractor" || !user.contractorId) {
      throw new Error("Only a contractor can create a farm");
    }
    const farmName = name.trim();
    if (!farmName) throw new Error("Farm name is required");

    const siteExtId = `site_${user.contractorId}_${Date.now().toString(36)}`;
    const farmCode = (farmName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "FARM");
    await ctx.db.insert("sites", {
      extId: siteExtId,
      name: farmName,
      farmCode,
      location: { lat: 0, lng: 0 },
      contractorIds: [user.contractorId as string],
      houseIds: [],
    });

    const createdAt = new Date().toISOString();
    const seen = new Set<string>();
    for (const raw of supervisorEmails) {
      const email = norm(raw);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "supervisor",
        siteId: siteExtId,
        invitedByUserId: userId as string,
        status: "pending",
        createdAt,
      });
    }
    return { siteId: siteExtId };
  },
});

/** The signed-in contractor + a farm they own, or throws. */
async function requireOwnedFarm(ctx: any, siteId: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "contractor" || !user.contractorId) {
    throw new Error("Only a contractor can manage a farm");
  }
  const site = await ctx.db.query("sites").withIndex("by_extId", (q: any) => q.eq("extId", siteId)).first();
  if (!site || !(site.contractorIds ?? []).includes(user.contractorId)) throw new Error("Farm not found");
  return { userId, user, site };
}

/** Contractor: invite more supervisor(s) to an existing farm they own. */
export const inviteSupervisors = mutation({
  args: { siteId: v.string(), emails: v.array(v.string()) },
  handler: async (ctx, { siteId, emails }) => {
    const { userId } = await requireOwnedFarm(ctx, siteId);
    const existing = await ctx.db.query("invites").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();
    const already = new Set(existing.filter((i) => i.role === "supervisor").map((i) => i.email));
    const createdAt = new Date().toISOString();
    const seen = new Set<string>();
    let invited = 0;
    for (const raw of emails) {
      const email = norm(raw);
      if (!email || seen.has(email) || already.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "supervisor",
        siteId,
        invitedByUserId: userId as string,
        status: "pending",
        createdAt,
      });
      invited += 1;
    }
    return { invited };
  },
});

/** Contractor: rename a farm they own. */
export const renameFarm = mutation({
  args: { siteId: v.string(), name: v.string() },
  handler: async (ctx, { siteId, name }) => {
    const { site } = await requireOwnedFarm(ctx, siteId);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Farm name is required");
    await ctx.db.patch(site._id, { name: trimmed });
    return { ok: true };
  },
});

/**
 * Claim a pending invite for the signed-in user's email. The auto-match in
 * auth.ts only runs when an account is first created; this lets an existing
 * account (e.g. one that was orphaned by a data reset, or invited after signing
 * up) join a farm without re-registering.
 */
export const claimInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Not signed in");
    const email = ((user.email as string | undefined) ?? "").toLowerCase();
    if (!email) return { claimed: false as const };
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (!invite) return { claimed: false as const };
    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", invite.siteId)).first();
    await ctx.db.patch(userId, { role: invite.role, siteId: invite.siteId, org: site?.name ?? "" });
    await ctx.db.patch(invite._id, { status: "accepted" });
    return { claimed: true as const, role: invite.role };
  },
});

/** Supervisor: invite manager(s) to their own farm. */
export const inviteManagers = mutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "supervisor" || !user.siteId) {
      throw new Error("Only a supervisor can invite managers");
    }
    const createdAt = new Date().toISOString();
    const seen = new Set<string>();
    let invited = 0;
    for (const raw of emails) {
      const email = norm(raw);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "manager",
        siteId: user.siteId as string,
        invitedByUserId: userId as string,
        status: "pending",
        createdAt,
      });
      invited += 1;
    }
    return { invited };
  },
});

/** The signed-in user's onboarding view, shaped by role. Reactive. */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const role = (user.role as string) ?? "pending";
    const name = (user.name as string) ?? "";
    const email = (user.email as string) ?? "";

    if (role === "contractor") {
      const contractorId = user.contractorId as string | undefined;
      const allSites = await ctx.db.query("sites").collect();
      const sites = contractorId ? allSites.filter((s) => (s.contractorIds ?? []).includes(contractorId)) : [];
      const farms = [];
      for (const s of sites) {
        const invites = await ctx.db
          .query("invites")
          .withIndex("by_site", (q) => q.eq("siteId", s.extId))
          .collect();
        farms.push({
          id: s.extId,
          name: s.name,
          farmCode: s.farmCode,
          houseCount: (s.houseIds ?? []).length,
          supervisors: invites
            .filter((i) => i.role === "supervisor")
            .map((i) => ({ email: i.email, status: i.status })),
        });
      }
      return { role, name, email, org: (user.org as string) ?? "", farms };
    }

    if (role === "supervisor" || role === "manager") {
      const siteId = user.siteId as string | undefined;
      const site = siteId
        ? await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first()
        : null;
      let managers: { email: string; status: string }[] = [];
      let houses: { id: string; name: string; capacity: number }[] = [];
      let cycle: { cycleNo: number; breed: string; placingDate: string; killDate: string; placed: number; houseCount: number } | null = null;
      if (site) {
        const invites = await ctx.db
          .query("invites")
          .withIndex("by_site", (q) => q.eq("siteId", site.extId))
          .collect();
        managers = invites.filter((i) => i.role === "manager").map((i) => ({ email: i.email, status: i.status }));

        const houseRows = await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", site.extId)).collect();
        const byId = new Map(houseRows.map((h) => [h.extId, h]));
        // Preserve the site's house order.
        houses = (site.houseIds ?? [])
          .map((hid) => byId.get(hid))
          .filter((h): h is NonNullable<typeof h> => Boolean(h))
          .map((h) => ({ id: h.extId, name: h.name, capacity: h.capacity }));

        const batch = await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", site.extId)).first();
        if (batch) {
          const placements = await ctx.db
            .query("placements")
            .withIndex("by_batch", (q) => q.eq("batchId", batch.extId))
            .collect();
          cycle = {
            cycleNo: batch.cycleNo,
            breed: batch.breed,
            killDate: batch.killDate,
            placingDate: placements[0]?.placingDate ?? "",
            placed: placements.reduce((s, p) => s + p.placedCount, 0),
            houseCount: placements.length,
          };
        }
      }
      return {
        role,
        name,
        email,
        farm: site ? { id: site.extId, name: site.name, farmCode: site.farmCode, houseCount: houses.length } : null,
        managers,
        houses,
        cycle,
      };
    }

    // Invited but not yet matched to a farm.
    return { role, name, email, farm: null, managers: [] };
  },
});

/** Whole days from ISO `a` to ISO `b` (b − a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** The signed-in grower + their farm id, or throws. Houses/cycle are grower-set. */
async function requireFarm(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  const role = user?.role as string;
  if (!user || !user.siteId || (role !== "supervisor" && role !== "manager")) {
    throw new Error("Only a farm's grower can configure it");
  }
  const site = await ctx.db.query("sites").withIndex("by_extId", (q: any) => q.eq("extId", user.siteId)).first();
  if (!site) throw new Error("Farm not found");
  return { userId, user, site, siteId: user.siteId as string };
}

/** Grower: replace the farm's house list (house extIds are farm-scoped/unique). */
export const setHouses = mutation({
  args: { houses: v.array(v.object({ id: v.optional(v.string()), name: v.string(), capacity: v.number() })) },
  handler: async (ctx, { houses }) => {
    const { site, siteId } = await requireFarm(ctx);
    const existing = await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();

    const valid = houses.filter((h) => h.name.trim() !== "" && Number.isFinite(h.capacity) && h.capacity > 0);
    const keepIds = new Set(valid.map((h) => h.id).filter(Boolean));
    await Promise.all(existing.filter((h) => !keepIds.has(h.extId)).map((h) => ctx.db.delete(h._id)));

    // Monotonic per-farm suffix; the full extId is `${siteId}_h${n}` so it's
    // globally unique across farms.
    let seq = existing.reduce((m, h) => {
      const n = parseInt(h.extId.split("_h")[1] ?? "", 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);

    const orderedIds: string[] = [];
    for (const h of valid) {
      const name = h.name.trim();
      const capacity = Math.round(h.capacity);
      if (h.id) {
        const row = existing.find((e) => e.extId === h.id);
        if (row) await ctx.db.patch(row._id, { name, capacity });
        else await ctx.db.insert("houses", { extId: h.id, siteId, name, capacity });
        orderedIds.push(h.id);
      } else {
        seq += 1;
        const extId = `${siteId}_h${seq}`;
        await ctx.db.insert("houses", { extId, siteId, name, capacity });
        orderedIds.push(extId);
      }
    }
    await ctx.db.patch(site._id, { houseIds: orderedIds });
    return { count: orderedIds.length };
  },
});

/** Grower: start the farm's growing cycle (one active cycle per farm for now). */
export const startCycle = mutation({
  args: {
    cycleNo: v.number(),
    breed: v.string(),
    placingDate: v.string(),
    killDate: v.string(),
    houses: v.array(v.object({ houseId: v.string(), placedCount: v.number() })),
  },
  handler: async (ctx, args) => {
    const { site, siteId } = await requireFarm(ctx);
    const contractorId = (site.contractorIds ?? [])[0] ?? "";

    const existing = await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", siteId)).first();
    if (existing) throw new Error("This farm already has a cycle");
    if (!args.placingDate || !args.killDate) throw new Error("Placing and kill dates are required");

    const batchExtId = `${siteId}_b${args.cycleNo}`;
    await ctx.db.insert("batches", {
      extId: batchExtId,
      siteId,
      contractorId,
      cycleNo: args.cycleNo,
      breed: args.breed || "Ross 308",
      killDate: args.killDate,
      focPct: 0,
      contractId: "",
    });

    const today = new Date().toISOString().slice(0, 10);
    const dayCount = Math.max(0, daysBetween(args.placingDate, today));
    let n = 0;
    for (const h of args.houses) {
      if (!h.houseId || h.placedCount <= 0) continue;
      n += 1;
      await ctx.db.insert("placements", {
        extId: `${batchExtId}_p${n}`,
        batchId: batchExtId,
        houseId: h.houseId,
        placedCount: Math.round(h.placedCount),
        placingDate: args.placingDate,
        dayCount,
      });
    }
    return { batchId: batchExtId, placements: n };
  },
});
