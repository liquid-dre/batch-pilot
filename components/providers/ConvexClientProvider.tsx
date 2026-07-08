"use client";

/**
 * Convex realtime provider (ROADMAP §5 / §9 — the database seam).
 *
 * Wraps the app in a `ConvexProvider` so client components can subscribe to
 * reactive queries (`useQuery`) and call mutations (`useMutation`). The client
 * is created once from `NEXT_PUBLIC_CONVEX_URL`.
 *
 * Guarded on purpose: until the deployment env var is set (i.e. before
 * `npx convex dev` has run locally), this is a transparent pass-through, so the
 * app keeps running on the `lib/data/` mock during the migration. The moment the
 * URL is present, every Convex hook goes live — no other change needed.
 */
import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);

  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
