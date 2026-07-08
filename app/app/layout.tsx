import { AppShell } from "@/components/shell/AppShell";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

/**
 * Layout for the signed-in app: a collapsible left sidebar (desktop) / off-canvas
 * drawer (mobile). The marketing landing at `/` sits outside this layout, so only
 * `/app/*` gets the sidebar + Grower/Contractor role switcher. (When Clerk lands,
 * this is the authenticated boundary.)
 *
 * `ConvexClientProvider` wraps the shell so `/app/*` client components can use
 * Convex realtime hooks (ROADMAP §5). It is a no-op until NEXT_PUBLIC_CONVEX_URL
 * is set, so the app runs on the mock seam until the deployment is connected.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <AppShell>{children}</AppShell>
    </ConvexClientProvider>
  );
}
