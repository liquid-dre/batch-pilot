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
      if (site) {
        const invites = await ctx.db
          .query("invites")
          .withIndex("by_site", (q) => q.eq("siteId", site.extId))
          .collect();
        managers = invites.filter((i) => i.role === "manager").map((i) => ({ email: i.email, status: i.status }));
      }
      return {
        role,
        name,
        email,
        farm: site ? { id: site.extId, name: site.name, farmCode: site.farmCode, houseCount: (site.houseIds ?? []).length } : null,
        managers,
      };
    }

    // Invited but not yet matched to a farm.
    return { role, name, email, farm: null, managers: [] };
  },
});
