"use client";

import { useCurrentUser } from "@/lib/auth";
import type { DashboardView, PortfolioData } from "@/lib/view";
import type { PlannedBatch } from "@/lib/types";
import { GrowerDashboard } from "@/components/flock/GrowerDashboard";
import { SupervisorDashboard } from "@/components/flock/SupervisorDashboard";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

/**
 * The `/app` home, chosen by role. The supervisor and manager render the SAME
 * dashboard structure (`DashboardView`) at different depths — plain for the
 * supervisor (led by a capture CTA), full for the manager. The contractor gets
 * its rankings Overview.
 */
export function RoleHome({
  dashboard,
  plannedBatch,
  contractor,
}: {
  dashboard: DashboardView;
  plannedBatch?: PlannedBatch;
  contractor: { data: PortfolioData; siteId: string };
}) {
  const { role } = useCurrentUser();
  if (role === "contractor") return <PortfolioDashboard data={contractor.data} siteId={contractor.siteId} />;
  if (role === "supervisor") return <SupervisorDashboard data={dashboard} />;
  return <GrowerDashboard data={dashboard} plannedBatch={plannedBatch} />;
}
