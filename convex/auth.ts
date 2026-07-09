import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Convex Auth (ROADMAP §9 — replaces the Clerk plan; auth runs inside Convex).
 *
 * Email + password only, per the chosen setup. The sign-up form passes the role
 * the user picked (grower Supervisor/Manager or Contractor) plus their name; the
 * `profile` callback writes those onto the `users` row and scopes the account to
 * the demo tenant so a fresh account immediately sees real data:
 *   - growers   → the seeded site (Murray Downs)
 *   - contractor→ the seeded contractor (Irvine's)
 * When multi-tenant sign-up lands, this is where an invite code would resolve
 * the real site/contractor instead of the demo defaults.
 */

const DEMO_SITE_ID = "site_nhunge";
const DEMO_CONTRACTOR_ID = "ct_irvines";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const role = (params.role as string) || "supervisor";
        const isContractor = role === "contractor";
        const name = (params.name as string) || "";
        // Convex `Value` has no `undefined`, so only include keys we actually
        // have. Optional users fields simply stay absent for the other role.
        return {
          email: params.email as string,
          role,
          org: (params.org as string) || (isContractor ? "Irvine's" : "Murray Downs"),
          ...(name ? { name } : {}),
          ...(isContractor ? { contractorId: DEMO_CONTRACTOR_ID } : { siteId: DEMO_SITE_ID }),
        };
      },
    }),
  ],
});
