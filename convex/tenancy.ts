import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { toApp } from "./lib";
import { rossAt } from "./ross";

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

/** Contractor: create a farm and invite its manager(s) by email. */
export const createFarm = mutation({
  args: { name: v.string(), managerEmails: v.array(v.string()) },
  handler: async (ctx, { name, managerEmails }) => {
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
    for (const raw of managerEmails) {
      const email = norm(raw);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "manager",
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

/** Manager: invite supervisor(s)/foreman to their own farm (they capture daily). */
export const inviteSupervisors = mutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "manager" || !user.siteId) {
      throw new Error("Only a manager can invite supervisors");
    }
    return inviteSameRolePeers(ctx, userId as string, user.siteId as string, "supervisor", emails);
  },
});

/**
 * Contractor: invite co-admin(s) to their own org (ROADMAP §9 — Contractor Org
 * Admin). A co-admin joins the whole contractor org (same `contractorId`, full
 * `contractor` rights) rather than a single farm, so an org can be run by a team
 * rather than one login. Any contractor in the org may invite more.
 */
export const inviteOrgAdmins = mutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "contractor" || !user.contractorId) {
      throw new Error("Only a contractor can invite co-admins");
    }
    const contractorId = user.contractorId as string;
    const existing = await ctx.db
      .query("invites")
      .withIndex("by_contractor", (q) => q.eq("contractorId", contractorId))
      .collect();
    const already = new Set(existing.map((i) => i.email));
    const createdAt = new Date().toISOString();
    const seen = new Set<string>();
    let invited = 0;
    for (const raw of emails) {
      const email = norm(raw);
      if (!email || seen.has(email) || already.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "contractor",
        contractorId,
        invitedByUserId: userId as string,
        status: "pending",
        createdAt,
      });
      invited += 1;
    }
    return { invited };
  },
});

// A farm's name is set once at creation (`createFarm`) and is intentionally
// immutable afterwards — there is deliberately no rename mutation, so a
// contractor can't change it from the UI or by a direct call.

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
    if (invite.contractorId) {
      // Org co-admin invite: join the whole contractor org as a contractor.
      const contractor = await ctx.db
        .query("contractors")
        .withIndex("by_extId", (q) => q.eq("extId", invite.contractorId!))
        .first();
      await ctx.db.patch(userId, { role: "contractor", contractorId: invite.contractorId, org: contractor?.name ?? "" });
      await ctx.db.patch(invite._id, { status: "accepted" });
      return { claimed: true as const, role: "contractor" };
    }
    const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", invite.siteId!)).first();
    await ctx.db.patch(userId, { role: invite.role, siteId: invite.siteId, org: site?.name ?? "" });
    await ctx.db.patch(invite._id, { status: "accepted" });
    return { claimed: true as const, role: invite.role };
  },
});

/** Contractor: invite more manager(s) to an existing farm they own. */
export const inviteManagers = mutation({
  args: { siteId: v.string(), emails: v.array(v.string()) },
  handler: async (ctx, { siteId, emails }) => {
    const { userId } = await requireOwnedFarm(ctx, siteId);
    const existing = await ctx.db.query("invites").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();
    const already = new Set(existing.filter((i) => i.role === "manager").map((i) => i.email));
    const createdAt = new Date().toISOString();
    const seen = new Set<string>();
    let invited = 0;
    for (const raw of emails) {
      const email = norm(raw);
      if (!email || seen.has(email) || already.has(email)) continue;
      seen.add(email);
      await ctx.db.insert("invites", {
        email,
        role: "manager",
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

/**
 * Supervisor: invite co-supervisor(s) — same-role peers on their own farm
 * (ROADMAP §9 — symmetric peer invites). Reuses the `invites` shape (role +
 * siteId), so the auth hook stamps the joiner as a supervisor on this site.
 */
export const inviteCoSupervisors = mutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "supervisor" || !user.siteId) {
      throw new Error("Only a supervisor can invite co-supervisors");
    }
    return inviteSameRolePeers(ctx, userId as string, user.siteId as string, "supervisor", emails);
  },
});

/**
 * Manager: invite co-manager(s) — same-role peers sharing oversight of their own
 * farm (ROADMAP §9 — symmetric peer invites).
 */
export const inviteCoManagers = mutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "manager" || !user.siteId) {
      throw new Error("Only a manager can invite co-managers");
    }
    return inviteSameRolePeers(ctx, userId as string, user.siteId as string, "manager", emails);
  },
});

/** Shared insert for a same-role peer invite on a farm (dedups within the site). */
async function inviteSameRolePeers(
  ctx: any,
  userId: string,
  siteId: string,
  role: "supervisor" | "manager",
  emails: string[],
) {
  const existing = await ctx.db.query("invites").withIndex("by_site", (q: any) => q.eq("siteId", siteId)).collect();
  const already = new Set(existing.filter((i: any) => i.role === role).map((i: any) => i.email));
  const createdAt = new Date().toISOString();
  const seen = new Set<string>();
  let invited = 0;
  for (const raw of emails) {
    const email = norm(raw);
    if (!email || seen.has(email) || already.has(email)) continue;
    seen.add(email);
    await ctx.db.insert("invites", { email, role, siteId, invitedByUserId: userId, status: "pending", createdAt });
    invited += 1;
  }
  return { invited };
}

/**
 * The manager/foreman's cycles for their farm — upcoming + ongoing, read-only.
 * Cycles are contractor-owned; this is the grower's window onto the plan (who
 * set it up, the dates, the target weight range, delivery/collection nights).
 */
export const myCycles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const role = (user?.role as string) ?? "";
    if (!user || !user.siteId || (role !== "manager" && role !== "supervisor")) return null;
    const siteId = user.siteId as string;
    const today = new Date().toISOString().slice(0, 10);

    const batches = (
      await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect()
    ).filter((b) => !b.closedAt);

    const rows = [];
    for (const b of batches) {
      const contractor = b.contractorId
        ? await ctx.db.query("contractors").withIndex("by_extId", (q) => q.eq("extId", b.contractorId)).first()
        : null;
      const placements = await ctx.db.query("placements").withIndex("by_batch", (q) => q.eq("batchId", b.extId)).collect();
      const nights = (
        await ctx.db.query("catchingEvents").withIndex("by_batch", (q) => q.eq("batchId", b.extId)).collect()
      ).map((e) => e.night);
      const start = (b.placementDate as string | undefined) ?? "";
      rows.push({
        cycleNo: b.cycleNo,
        breed: b.breed,
        status: start && start <= today ? ("ongoing" as const) : ("upcoming" as const),
        placementDate: start,
        expectedCollectionDate: b.expectedCollectionDate,
        targetWeightMinG: b.targetWeightMinG ?? null,
        targetWeightMaxG: b.targetWeightMaxG ?? null,
        totalBirds: b.totalBirds ?? null,
        placed: placements.reduce((s, p) => s + p.placedCount, 0),
        contractorName: contractor?.name ?? "",
        deliveryDates: nights,
      });
    }
    rows.sort((a, b) => (a.placementDate || "z").localeCompare(b.placementDate || "z"));
    return { farmName: (await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first())?.name ?? "", cycles: rows };
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
          managers: invites
            .filter((i) => i.role === "manager")
            .map((i) => ({ email: i.email, status: i.status })),
        });
      }
      // Co-admins invited into this org (the Contractor Org Admin team).
      const orgInvites = contractorId
        ? await ctx.db.query("invites").withIndex("by_contractor", (q) => q.eq("contractorId", contractorId)).collect()
        : [];
      const coAdmins = orgInvites.map((i) => ({ email: i.email, status: i.status }));
      return { role, name, email, org: (user.org as string) ?? "", farms, coAdmins };
    }

    if (role === "supervisor" || role === "manager") {
      const siteId = user.siteId as string | undefined;
      const site = siteId
        ? await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first()
        : null;
      let supervisors: { email: string; status: string }[] = [];
      let houses: { id: string; name: string; capacity: number }[] = [];
      let cycle:
        | {
            cycleNo: number;
            breed: string;
            status: "upcoming" | "ongoing";
            placementDate: string;
            expectedCollectionDate: string;
            targetWeightMinG: number | null;
            targetWeightMaxG: number | null;
            totalBirds: number | null;
            placed: number;
            houseCount: number;
            contractorName: string;
            placements: { houseId: string; placedCount: number }[];
          }
        | null = null;
      if (site) {
        const invites = await ctx.db
          .query("invites")
          .withIndex("by_site", (q) => q.eq("siteId", site.extId))
          .collect();
        supervisors = invites.filter((i) => i.role === "supervisor").map((i) => ({ email: i.email, status: i.status }));

        const houseRows = await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", site.extId)).collect();
        const byId = new Map(houseRows.map((h) => [h.extId, h]));
        // Preserve the site's house order.
        houses = (site.houseIds ?? [])
          .map((hid) => byId.get(hid))
          .filter((h): h is NonNullable<typeof h> => Boolean(h))
          .map((h) => ({ id: h.extId, name: h.name, capacity: h.capacity }));

        const batch = await currentBatch(ctx, site.extId);
        if (batch) {
          const placements = await ctx.db
            .query("placements")
            .withIndex("by_batch", (q) => q.eq("batchId", batch.extId))
            .collect();
          const today = new Date().toISOString().slice(0, 10);
          const start = (batch.placementDate as string | undefined) ?? "";
          const contractor = batch.contractorId
            ? await ctx.db.query("contractors").withIndex("by_extId", (q) => q.eq("extId", batch.contractorId)).first()
            : null;
          cycle = {
            cycleNo: batch.cycleNo,
            breed: batch.breed,
            status: start && start <= today ? "ongoing" : "upcoming",
            placementDate: start,
            expectedCollectionDate: batch.expectedCollectionDate,
            targetWeightMinG: batch.targetWeightMinG ?? null,
            targetWeightMaxG: batch.targetWeightMaxG ?? null,
            totalBirds: batch.totalBirds ?? null,
            placed: placements.reduce((s, p) => s + p.placedCount, 0),
            houseCount: placements.length,
            contractorName: contractor?.name ?? "",
            placements: placements.map((p) => ({ houseId: p.houseId, placedCount: p.placedCount })),
          };
        }
      }
      return {
        role,
        name,
        email,
        farm: site ? { id: site.extId, name: site.name, farmCode: site.farmCode, houseCount: houses.length } : null,
        supervisors,
        houses,
        cycle,
      };
    }

    // Invited but not yet matched to a farm.
    return { role, name, email, farm: null, supervisors: [] };
  },
});

/** Whole days from ISO `a` to ISO `b` (b − a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * The signed-in **manager** + their farm, or throws. Houses/capacities and
 * starting a cycle are the manager's job alone; the supervisor/foreman only
 * captures (ROADMAP §9 — role hierarchy).
 */
async function requireManager(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "manager" || !user.siteId) {
    throw new Error("Only the farm's manager can set this up");
  }
  const site = await ctx.db.query("sites").withIndex("by_extId", (q: any) => q.eq("extId", user.siteId)).first();
  if (!site) throw new Error("Farm not found");
  return { userId, user, site, siteId: user.siteId as string };
}

/** Manager: replace the farm's house list (house extIds are farm-scoped/unique). */
export const setHouses = mutation({
  args: { houses: v.array(v.object({ id: v.optional(v.string()), name: v.string(), capacity: v.number() })) },
  handler: async (ctx, { houses }) => {
    const { site, siteId } = await requireManager(ctx);
    const existing = await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect();

    const valid = houses.filter((h) => h.name.trim() !== "" && Number.isFinite(h.capacity) && h.capacity > 0);
    const keepIds = new Set(valid.map((h) => h.id).filter(Boolean));
    const toDelete = existing.filter((h) => !keepIds.has(h.extId));
    // Guard: a house with placements belongs to a running cycle — removing it
    // would orphan its placement + daily entries. Block it (end the cycle first).
    for (const h of toDelete) {
      const placement = await ctx.db.query("placements").withIndex("by_house", (q) => q.eq("houseId", h.extId)).first();
      if (placement) throw new Error(`Can't remove ${h.name} — it has a running cycle. End the cycle before changing houses.`);
    }
    await Promise.all(toDelete.map((h) => ctx.db.delete(h._id)));

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

    // Return the resulting houses (ordered) so the caller can re-sync its rows
    // with the server-assigned ids for freshly added houses.
    const byId = new Map(
      (await ctx.db.query("houses").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect()).map((h) => [h.extId, h]),
    );
    const rows = orderedIds
      .map((hid) => byId.get(hid))
      .filter((h): h is NonNullable<typeof h> => Boolean(h))
      .map((h) => toApp(h));
    return { count: orderedIds.length, houses: rows };
  },
});

/** Grower: start the farm's growing cycle (one active cycle per farm for now). */
/**
 * The farm's current non-closed batch — the ongoing one if started, else the
 * soonest upcoming. A batch with no start date (legacy/seed) counts as started.
 */
async function currentBatch(ctx: any, siteId: string) {
  const open = (
    await ctx.db.query("batches").withIndex("by_site", (q: any) => q.eq("siteId", siteId)).collect()
  ).filter((b: any) => !b.closedAt);
  if (open.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const started = (b: any) => !b.placementDate || (b.placementDate as string) <= today;
  const ongoing = open
    .filter(started)
    .sort((a: any, b: any) => (b.placementDate ?? "").localeCompare(a.placementDate ?? ""));
  if (ongoing.length) return ongoing[0];
  return open.sort((a: any, b: any) => (a.placementDate ?? "").localeCompare(b.placementDate ?? ""))[0];
}

/**
 * Contractor: schedule a cycle for a farm they own (ROADMAP §9 — cycles are
 * contractor-owned). Sets the plan — start + collection dates, target weight
 * range, total birds — the manager then places birds against. The cycle is
 * *upcoming* until its start date, then *ongoing*.
 */
export const scheduleCycle = mutation({
  args: {
    siteId: v.string(),
    cycleNo: v.number(),
    breed: v.string(),
    placementDate: v.string(),
    expectedCollectionDate: v.string(),
    targetWeightMinG: v.optional(v.number()),
    targetWeightMaxG: v.optional(v.number()),
    totalBirds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, site } = await requireOwnedFarm(ctx, args.siteId);
    const contractorId = site.contractorIds?.[0] ?? "";
    if (!args.placementDate || !args.expectedCollectionDate) throw new Error("Start and collection dates are required");
    const clash = (
      await ctx.db.query("batches").withIndex("by_site", (q) => q.eq("siteId", args.siteId)).collect()
    ).find((b) => !b.closedAt && b.cycleNo === args.cycleNo);
    if (clash) throw new Error(`Cycle ${args.cycleNo} is already scheduled on this farm`);

    const batchExtId = `${args.siteId}_b${args.cycleNo}`;
    await ctx.db.insert("batches", {
      extId: batchExtId,
      siteId: args.siteId,
      contractorId: contractorId || (userId as string),
      cycleNo: args.cycleNo,
      breed: args.breed || "Ross 308",
      placementDate: args.placementDate,
      expectedCollectionDate: args.expectedCollectionDate,
      targetWeightMinG: args.targetWeightMinG,
      targetWeightMaxG: args.targetWeightMaxG,
      totalBirds: args.totalBirds,
      focPct: 0,
      contractId: "",
    });
    return { batchId: batchExtId };
  },
});

/**
 * The farm's non-closed batch for a specific `cycleNo`, or null. Lets a caller
 * target one cycle when a farm holds a concurrent ongoing + upcoming batch
 * (otherwise `currentBatch` prefers the ongoing one).
 */
async function batchByCycleNo(ctx: any, siteId: string, cycleNo: number) {
  return (
    await ctx.db.query("batches").withIndex("by_site", (q: any) => q.eq("siteId", siteId)).collect()
  ).find((b: any) => !b.closedAt && b.cycleNo === cycleNo) ?? null;
}

/**
 * Contractor: edit a scheduled/ongoing cycle's plan (dates, weight range, breed).
 * Managers are read-only on these. Changing the start date re-syncs every
 * placement's `placementDate` + `dayCount`. Pass `cycleNo` to target a specific
 * cycle (e.g. an upcoming one on a farm that also has an ongoing cycle);
 * otherwise the farm's current batch is edited.
 */
export const editCycle = mutation({
  args: {
    siteId: v.string(),
    cycleNo: v.optional(v.number()),
    placementDate: v.optional(v.string()),
    expectedCollectionDate: v.optional(v.string()),
    targetWeightMinG: v.optional(v.number()),
    targetWeightMaxG: v.optional(v.number()),
    breed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedFarm(ctx, args.siteId);
    const batch =
      args.cycleNo !== undefined
        ? await batchByCycleNo(ctx, args.siteId, args.cycleNo)
        : await currentBatch(ctx, args.siteId);
    if (!batch) throw new Error("No cycle to edit on this farm");
    const patch: Record<string, unknown> = {};
    if (args.placementDate) patch.placementDate = args.placementDate;
    if (args.expectedCollectionDate) patch.expectedCollectionDate = args.expectedCollectionDate;
    if (args.targetWeightMinG !== undefined) patch.targetWeightMinG = args.targetWeightMinG;
    if (args.targetWeightMaxG !== undefined) patch.targetWeightMaxG = args.targetWeightMaxG;
    if (args.breed) patch.breed = args.breed;
    await ctx.db.patch(batch._id, patch);

    if (args.placementDate) {
      const today = new Date().toISOString().slice(0, 10);
      const dayCount = Math.max(0, daysBetween(args.placementDate, today));
      const placements = await ctx.db
        .query("placements")
        .withIndex("by_batch", (q) => q.eq("batchId", batch.extId))
        .collect();
      for (const p of placements) await ctx.db.patch(p._id, { placementDate: args.placementDate, dayCount });
    }
    return { batchId: batch.extId };
  },
});

/**
 * Manager: place birds into houses for the farm's current cycle. Can run before
 * the start date (load-balancing in advance) — the cycle still becomes ongoing
 * on the contractor's start date. Upserts one `placements` row per house.
 */
export const placeBirds = mutation({
  args: { houses: v.array(v.object({ houseId: v.string(), placedCount: v.number() })) },
  handler: async (ctx, { houses }) => {
    const { siteId } = await requireManager(ctx);
    const batch = await currentBatch(ctx, siteId);
    if (!batch) throw new Error("No cycle scheduled yet — ask your contractor to schedule one");
    const start = batch.placementDate ?? new Date().toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const dayCount = Math.max(0, daysBetween(start, today));

    const existing = await ctx.db
      .query("placements")
      .withIndex("by_batch", (q) => q.eq("batchId", batch.extId))
      .collect();
    const byHouse = new Map(existing.map((p) => [p.houseId, p]));
    let n = existing.length;
    for (const h of houses) {
      if (!h.houseId) continue;
      const count = Math.max(0, Math.round(h.placedCount));
      const row = byHouse.get(h.houseId);
      if (row) {
        if (count <= 0) await ctx.db.delete(row._id);
        else await ctx.db.patch(row._id, { placedCount: count, placementDate: start, dayCount });
      } else if (count > 0) {
        n += 1;
        await ctx.db.insert("placements", {
          extId: `${batch.extId}_p${n}`,
          batchId: batch.extId,
          houseId: h.houseId,
          placedCount: count,
          placementDate: start,
          dayCount,
        });
      }
    }
    return { batchId: batch.extId };
  },
});

/**
 * Contractor: close a grower's active cycle. Snapshots the cycle's finals into
 * `historicalBatches` (scoped to the site, so the grower's Batches/Compare show
 * real closed cycles) and stamps the batch `closedAt` — which frees the farm to
 * start the next cycle. Guarded by `requireOwnedFarm`, so only the contractor
 * who owns the farm can close it (ROADMAP §9 — contractor-driven lifecycle).
 */
export const closeCycle = mutation({
  args: { siteId: v.string() },
  handler: async (ctx, { siteId }) => {
    await requireOwnedFarm(ctx, siteId);
    const batch = await ctx.db
      .query("batches")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .filter((q) => q.eq(q.field("closedAt"), undefined))
      .first();
    if (!batch) throw new Error("This farm has no active cycle to close");

    const placements = await ctx.db
      .query("placements")
      .withIndex("by_batch", (q) => q.eq("batchId", batch.extId))
      .collect();

    let placed = 0;
    let remaining = 0;
    let day = 0;
    let weightNum = 0; // Σ avgWeight × birds
    let weightDen = 0;
    let placementDate = "";
    for (const p of placements) {
      placed += p.placedCount;
      if (!placementDate || p.placementDate < placementDate) placementDate = p.placementDate;
      const daily = (
        await ctx.db.query("dailyEntries").withIndex("by_placement", (q) => q.eq("placementId", p.extId)).collect()
      ).sort((a, b) => a.day - b.day);
      const latest = daily[daily.length - 1];
      const birds = latest?.birdsRemaining ?? p.placedCount;
      remaining += birds;
      if (latest) day = Math.max(day, latest.day);
      const weights = (
        await ctx.db.query("weightEntries").withIndex("by_placement", (q) => q.eq("placementId", p.extId)).collect()
      ).sort((a, b) => a.day - b.day);
      const w = weights[weights.length - 1];
      if (w) {
        weightNum += w.avgWeightG * birds;
        weightDen += birds;
      }
    }

    const finalDay = day || Math.max(0, ...placements.map((p) => p.dayCount));
    const livability = placed ? (remaining / placed) * 100 : 0;
    const finalCumMortPct = placed ? Number((((placed - remaining) / placed) * 100).toFixed(2)) : 0;
    const rossW = rossAt(finalDay).weightG;
    const rossFcr = rossAt(finalDay).fcr ?? 1.3;
    const finalWeightG = weightDen ? Math.round(weightNum / weightDen) : 0;
    const finalFcr = finalWeightG ? Number((rossFcr * (rossW / finalWeightG)).toFixed(2)) : rossFcr;
    const epef = finalWeightG && finalDay ? Math.round(((livability * (finalWeightG / 1000)) / (finalDay * finalFcr)) * 100) : 0;

    await ctx.db.insert("historicalBatches", {
      siteId,
      cycleNo: batch.cycleNo,
      placementDate: placementDate || batch.expectedCollectionDate,
      expectedCollectionDate: batch.expectedCollectionDate,
      finalDay,
      finalCumMortPct,
      finalWeightG,
      finalFcr,
      epef,
    });
    await ctx.db.patch(batch._id, { closedAt: new Date().toISOString() });
    return { cycleNo: batch.cycleNo, finalWeightG, finalCumMortPct, epef };
  },
});

/**
 * Contractor: set the contract terms (prices + FOC%) for a farm's active cycle.
 * Creates/updates a `contracts` row and links it to the batch, which unblocks the
 * grower-margin settlement (a real cycle otherwise has no prices). The contract
 * is per-batch and contractor-owned (BRD §7).
 */
export const setContract = mutation({
  args: {
    siteId: v.string(),
    chickPrice: v.number(),
    feedPricePerKg: v.number(),
    buyBackPerKg: v.number(),
    focPct: v.number(),
  },
  handler: async (ctx, { siteId, chickPrice, feedPricePerKg, buyBackPerKg, focPct }) => {
    await requireOwnedFarm(ctx, siteId);
    const batch = await ctx.db
      .query("batches")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .filter((q) => q.eq(q.field("closedAt"), undefined))
      .first();
    if (!batch) throw new Error("This farm has no active cycle");

    const extId = `contract_${batch.extId}`;
    const prices = { chickPrice, feedPricePerKg, buyBackPerKg, focPct };
    const existing = await ctx.db.query("contracts").withIndex("by_extId", (q) => q.eq("extId", extId)).first();
    if (existing) await ctx.db.patch(existing._id, prices);
    else await ctx.db.insert("contracts", { extId, ...prices });
    await ctx.db.patch(batch._id, { contractId: extId, focPct });
    return { ok: true as const };
  },
});
