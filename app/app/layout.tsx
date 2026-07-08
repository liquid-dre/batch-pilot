import { AppShell } from "@/components/shell/AppShell";

/**
 * Layout for the signed-in app: a collapsible left sidebar (desktop) / off-canvas
 * drawer (mobile). The marketing landing at `/` sits outside this layout, so only
 * `/app/*` gets the sidebar + role switcher.
 *
 * This is the authenticated boundary: `middleware.ts` redirects unauthenticated
 * visitors to `/signin` once a Convex deployment is connected (before that, the
 * demo runs open). The Convex client + auth providers live at the root layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
