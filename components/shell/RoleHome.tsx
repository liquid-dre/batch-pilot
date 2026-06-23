"use client";

import { useCurrentUser } from "@/lib/auth";
import type { PortfolioData, SupervisorCaptureData } from "@/lib/view";
import { GrowerDashboard, type GrowerDashboardData } from "@/components/flock/GrowerDashboard";
import { SupervisorHome } from "@/components/flock/SupervisorHome";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

/**
 * The `/app` home, chosen by role. Each profile has one obvious starting screen:
 * the supervisor's single minimal capture screen, the manager's consolidated
 * oversight Dashboard, or the contractor's rankings Overview.
 */
export function RoleHome({
  grower,
  supervisor,
  contractor,
}: {
  grower: GrowerDashboardData;
  supervisor: SupervisorCaptureData;
  contractor: { data: PortfolioData; siteId: string };
}) {
  const { role } = useCurrentUser();
  if (role === "contractor") return <PortfolioDashboard data={contractor.data} siteId={contractor.siteId} />;
  if (role === "supervisor") return <SupervisorHome data={supervisor} />;
  return <GrowerDashboard data={grower} />;
}
