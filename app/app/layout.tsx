import { AppShell } from "@/components/shell/AppShell";

/**
 * Layout for the signed-in app: a collapsible left sidebar (desktop) / off-canvas
 * drawer (mobile). The marketing landing at `/` sits outside this layout, so only
 * `/app/*` gets the sidebar + Grower/Contractor role switcher. (When Clerk lands,
 * this is the authenticated boundary.)
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
