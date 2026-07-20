import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId, retrieveAccount, modifyAccountCredentials } from "@convex-dev/auth/server";

/**
 * Account self-service (ROADMAP §9). Every signed-in user gets an `/app/account`
 * screen to edit their display name and change their password, plus — for the
 * roles that have peers — invite same-role co-workers (the Team panel reads
 * `myTeam`; the invites themselves are the `tenancy.*` mutations).
 *
 * Password change runs in an **action** because Convex Auth's credential helpers
 * (`retrieveAccount` to verify the current secret, `modifyAccountCredentials` to
 * set the new one) need an action context. It requires the current password and
 * does not touch other sessions — a routine change, not a breach response.
 */

const MIN_PASSWORD_LENGTH = 8;

/** The caller's identity for the read-only account header. */
export const myAccount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const u = await ctx.db.get(userId);
    if (!u) return null;
    return {
      name: (u.name as string) ?? "",
      email: (u.email as string) ?? "",
      role: (u.role as string) ?? "",
      org: (u.org as string) ?? "",
    };
  },
});

/** Edit the signed-in user's display name (the only free-text profile field). */
export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Name can’t be empty");
    await ctx.db.patch(userId, { name: trimmed });
    return { name: trimmed };
  },
});

/**
 * The caller's email — internal, for the password-change action (actions have no
 * db). Returned verbatim: Convex Auth's Password provider keys the account on the
 * exact `email` from sign-up (not lowercased), and `retrieveAccount` /
 * `modifyAccountCredentials` match it exactly, so normalising here would break
 * the lookup for anyone who signed up with a capitalised email.
 */
export const callerEmail = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const u = await ctx.db.get(userId);
    return (u?.email as string | undefined) ?? null;
  },
});

/**
 * Change the signed-in user's password. Verifies the current password first
 * (via `retrieveAccount`, which throws on a mismatch) then writes the new secret.
 * Other sessions are left signed in.
 */
export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const email = await ctx.runQuery(internal.account.callerEmail, {});
    if (!email) throw new Error("No email on this account");

    // Verify the current password — retrieveAccount throws if the secret is wrong.
    try {
      await retrieveAccount(ctx, { provider: "password", account: { id: email, secret: currentPassword } });
    } catch {
      throw new Error("Current password is incorrect");
    }
    await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: newPassword } });
    return { ok: true as const };
  },
});

/**
 * The caller's same-role peer roster for the account Team panel — pending +
 * accepted invites in their own scope. `kind` tells the UI which peer type it
 * is; `null`/`none` means the role has no peer-invite surface (platform admin,
 * or an unassigned account).
 */
export const myTeam = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const role = (user.role as string) ?? "";

    if (role === "contractor") {
      const contractorId = user.contractorId as string | undefined;
      const invites = contractorId
        ? await ctx.db.query("invites").withIndex("by_contractor", (q) => q.eq("contractorId", contractorId)).collect()
        : [];
      return { kind: "coAdmin" as const, members: invites.map((i) => ({ email: i.email, status: i.status })), foremen: [] as { email: string; status: string }[] };
    }

    if (role === "supervisor" || role === "manager") {
      const siteId = user.siteId as string | undefined;
      const invites = siteId
        ? await ctx.db.query("invites").withIndex("by_site", (q) => q.eq("siteId", siteId)).collect()
        : [];
      const map = (r: string) => invites.filter((i) => i.role === r).map((i) => ({ email: i.email, status: i.status }));
      const peers = map(role);
      // A manager also manages the farm's foremen (a down-invite, homed here).
      const foremen = role === "manager" ? map("supervisor") : [];
      return { kind: role as "supervisor" | "manager", members: peers, foremen };
    }

    return { kind: "none" as const, members: [], foremen: [] };
  },
});
