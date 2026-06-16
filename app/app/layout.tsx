import { AppFrame } from "@/components/shell/AppFrame";

/**
 * Layout for the signed-in app. The marketing landing at `/` deliberately sits
 * outside this layout, so only `/app/*` gets the TopBar + Grower/Contractor
 * role switcher. (When Clerk lands, this is the authenticated boundary.)
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
