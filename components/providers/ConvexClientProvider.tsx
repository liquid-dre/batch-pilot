"use client";

/**
 * Convex client + auth provider (ROADMAP §5 / §9 — Convex owns the backend).
 *
 * `ConvexAuthNextjsProvider` gives client components both realtime data hooks
 * (`useQuery`/`useMutation`) and the auth actions (`useAuthActions`), all backed
 * by Convex — no third-party auth service.
 *
 * Guarded on purpose: until `NEXT_PUBLIC_CONVEX_URL` is set (before the first
 * local `npx convex dev`), this is a transparent pass-through so the app keeps
 * running on the mock seam + demo role switcher. The moment the URL is present,
 * data and auth both go live.
 */
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  if (!convex) return <>{children}</>;
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}
