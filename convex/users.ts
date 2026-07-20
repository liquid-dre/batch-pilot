import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * The signed-in user, shaped exactly like `lib/types` `User` so the auth seam
 * (`useCurrentUser`) can return it unchanged. `null` when no one is signed in.
 * This is the query the client auth provider subscribes to.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const u = await ctx.db.get(userId);
    if (!u) return null;
    return {
      id: u._id as string,
      name: u.name ?? "",
      role: (u.role as "supervisor" | "manager" | "contractor" | "platformAdmin") ?? "supervisor",
      org: u.org ?? "",
      siteId: u.siteId,
      contractorId: u.contractorId,
    };
  },
});
