/**
 * Convex Auth provider config. `CONVEX_SITE_URL` is set on the deployment by
 * `npx @convex-dev/auth` during setup (along with the JWT signing keys).
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
