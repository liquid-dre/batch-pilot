"use client";

import { useCurrentUser } from "@/lib/auth";
import type { PortfolioData } from "@/lib/view";
import { GrowerDashboard, type GrowerDashboardData } from "@/components/flock/GrowerDashboard";
import { SupervisorHome } from "@/components/flock/SupervisorHome";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

/**
 * The `/app` home, chosen by role. Each profile has one obvious starting screen:
 * the supervisor's capture-first round, the manager's consolidated oversight
 * Dashboard, or the contractor's rankings Overview.
 */
export function RoleHome({
  grower,
  contractor,
  today,
}: {
  grower: GrowerDashboardData;
  contractor: { data: PortfolioData; siteId: string };
  today: string;
}) {
  const { role } = useCurrentUser();
  if (role === "contractor") return <PortfolioDashboard data={contractor.data} siteId={contractor.siteId} />;
  if (role === "supervisor") return <SupervisorHome data={grower} today={today} />;
  return <GrowerDashboard data={grower} />;
}
