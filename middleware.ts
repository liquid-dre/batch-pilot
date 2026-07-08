import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

/**
 * Auth boundary (ROADMAP §9). `/app/*` requires a signed-in user; visiting
 * `/signin` while already authenticated bounces to the app.
 *
 * Guarded: until a Convex deployment is connected (`NEXT_PUBLIC_CONVEX_URL`
 * unset), the app runs on the mock seam + demo role switcher, so the middleware
 * is a pass-through and `/app` stays open. Once the URL is set, gating is live.
 */
const isSignInPage = createRouteMatcher(["/signin"]);
const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

const authedMiddleware = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();
  if (isSignInPage(request) && isAuthed) {
    return nextjsMiddlewareRedirect(request, "/app");
  }
  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export default process.env.NEXT_PUBLIC_CONVEX_URL ? authedMiddleware : () => NextResponse.next();

export const config = {
  // Run on everything except static files and Next internals.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
