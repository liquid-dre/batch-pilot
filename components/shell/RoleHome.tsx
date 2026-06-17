"use client";

import { useCurrentUser } from "@/lib/auth";
import type { PortfolioData } from "@/lib/view";
import { GrowerDashboard, type GrowerDashboardData } from "@/components/flock/GrowerDashboard";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

/**
 * The `/app` home, chosen by role: the grower's consolidated Dashboard, or the
 * contractor's rankings Overview. Each role has one obvious starting screen.
 */
export function RoleHome({ grower, contractor }: { grower: GrowerDashboardData; contractor: { data: PortfolioData; siteId: string } }) {
  const { role } = useCurrentUser();
  return role === "contractor" ? <PortfolioDashboard data={contractor.data} siteId={contractor.siteId} /> : <GrowerDashboard data={grower} />;
}
