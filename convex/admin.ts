import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Platform Admin — the BatchPilot operator tier (ROADMAP §9 / BRD §4). Its one
 * above-tenant capability today is **white-label theming**: editing any
 * contractor org's brand colours, which every user under that org then renders
 * with at runtime (`myTheme` + the client ThemeProvider).
 *
 * Every function here is guarded by `requirePlatformAdmin` — the role is only
 * ever granted via the `PLATFORM_ADMIN_EMAILS` allowlist in `convex/auth.ts`, so
 * this is a genuine super-user boundary, not a self-serve one.
 */

const brandThemeArg = v.object({
  brand700: v.string(),
  brand500: v.string(),
  dark: v.optional(v.object({ brand700: v.string(), brand500: v.string() })),
});

/** Throws unless the caller is a Platform Admin. */
async function requirePlatformAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user || (user.role as string) !== "platformAdmin") {
    throw new Error("Platform admin only");
  }
  return { userId };
}

/** Every contractor org (Platform Admin org list + theming). */
export const listContractors = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || (user.role as string) !== "platformAdmin") return null;

    const contractors = await ctx.db.query("contractors").collect();
    const sites = await ctx.db.query("sites").collect();
    // Farm count per org so the admin sees the size of each tenant.
    return contractors
      .map((c) => ({
        id: c.extId,
        name: c.name,
        brandTheme: c.brandTheme ?? null,
        farmCount: sites.filter((s) => (s.contractorIds ?? []).includes(c.extId)).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Platform Admin: set (or clear) a contractor org's white-label brand. Passing
 * `brandTheme: null` reverts the org to the default palette (`globals.css`).
 */
export const setContractorTheme = mutation({
  args: { contractorId: v.string(), brandTheme: v.union(brandThemeArg, v.null()) },
  handler: async (ctx, { contractorId, brandTheme }) => {
    await requirePlatformAdmin(ctx);
    const contractor = await ctx.db
      .query("contractors")
      .withIndex("by_extId", (q) => q.eq("extId", contractorId))
      .first();
    if (!contractor) throw new Error("Contractor not found");
    await ctx.db.patch(contractor._id, { brandTheme: brandTheme ?? undefined });
    return { contractorId };
  },
});

/**
 * The signed-in user's tenant brand, for the runtime ThemeProvider. Resolves the
 * caller's contractor org — their own (contractor / co-admin) or their site's
 * (grower) — and returns its `brandTheme`, or null when none is set / the caller
 * is a Platform Admin (who themes others, not themselves).
 */
export const myTheme = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const role = (user.role as string) ?? "";

    let contractorId: string | undefined;
    if (role === "contractor") {
      contractorId = user.contractorId as string | undefined;
    } else if (role === "supervisor" || role === "manager") {
      const siteId = user.siteId as string | undefined;
      if (siteId) {
        const site = await ctx.db.query("sites").withIndex("by_extId", (q) => q.eq("extId", siteId)).first();
        contractorId = (site?.contractorIds ?? [])[0];
      }
    }
    if (!contractorId) return null;

    const contractor = await ctx.db
      .query("contractors")
      .withIndex("by_extId", (q) => q.eq("extId", contractorId))
      .first();
    return contractor?.brandTheme ?? null;
  },
});
