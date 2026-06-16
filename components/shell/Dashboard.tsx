"use client";

import type { DashboardData } from "@/lib/view";
import { useCurrentUser } from "@/lib/auth";
import { GrowerOverview } from "./GrowerOverview";
import { ContractorOverview } from "./ContractorOverview";

/**
 * Overview content for the home route. Chooses the register by role (ROADMAP
 * §6): the spacious Grower overview or the dense Contractor overview. The
 * TopBar / app frame is provided by the layout, so this renders content only.
 */
export function Dashboard({ data }: { data: DashboardData }) {
  const { role } = useCurrentUser();
  return role === "contractor" ? <ContractorOverview data={data} /> : <GrowerOverview data={data} />;
}
