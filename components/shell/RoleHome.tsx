"use client";

import { useCurrentUser } from "@/lib/auth";
import type { PortfolioData, SupervisorCaptureData } from "@/lib/view";
import { GrowerDashboard, type GrowerDashboardData } from "@/components/flock/GrowerDashboard";
import { SupervisorDashboard } from "@/components/flock/SupervisorDashboard";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

/**
 * The `/app` home, chosen by role. Each profile has one obvious starting screen:
 * the supervisor's calm Home dashboard (today's status + a capture CTA), the
 * manager's consolidated oversight Dashboard, or the contractor's rankings
 * Overview.
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
  if (role === "supervisor") return <SupervisorDashboard data={supervisor} />;
  return <GrowerDashboard data={grower} />;
}
