import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Convex Auth (ROADMAP §9) — email + password, multi-tenant onboarding.
 *
 * Identity model:
 *  - **Contractor** signs up self-serve → the hook creates their own contractor
 *    org and assigns it.
 *  - **Supervisor / Manager** are invite-only. They sign up with an email a
 *    contractor (supervisor) or supervisor (manager) invited; the hook matches
 *    the `invites` row and stamps their role + farm (`siteId`), then marks the
 *    invite accepted.
 *  - An invited-but-unmatched sign-up stays "pending" with no tenant — the
 *    onboarding screen tells them to ask to be invited.
 *
 * No demo tenant is assigned any more — a fresh account is genuinely empty.
 */

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // Store only what the form provides; the tenant (role/site/contractor) is
      // resolved in the hook below. `role` here is the *requested* kind:
      // "contractor" (self-serve) or "pending" (invited — real role from invite).
      profile(params) {
        const requestedRole = (params.role as string) || "pending";
        const name = (params.name as string) || "";
        const org = (params.org as string) || "";
        return {
          email: params.email as string,
          role: requestedRole,
          ...(name ? { name } : {}),
          ...(org ? { org } : {}),
        };
      },
    }),
  ],
  callbacks: {
    // Runs once, right after a new user row is created (before token issue).
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return; // only on first creation
      const user = await ctx.db.get(userId);
      if (!user) return;

      const email = ((user.email as string | undefined) ?? "").toLowerCase();
      const invite = email
        ? await ctx.db
            .query("invites")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first()
        : null;

      if (invite) {
        const site = await ctx.db
          .query("sites")
          .withIndex("by_extId", (q) => q.eq("extId", invite.siteId))
          .first();
        await ctx.db.patch(userId, {
          role: invite.role,
          siteId: invite.siteId,
          org: site?.name ?? "",
        });
        await ctx.db.patch(invite._id, { status: "accepted" });
        return;
      }

      if ((user.role as string) === "contractor") {
        const contractorExtId = `ct_${userId}`;
        await ctx.db.insert("contractors", {
          extId: contractorExtId,
          name: (user.org as string) || (user.name as string) || "My company",
        });
        await ctx.db.patch(userId, { contractorId: contractorExtId });
        return;
      }
      // Invited-but-unmatched: leave role "pending", no tenant.
    },
  },
});
