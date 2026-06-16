"use client";

import type { DashboardData } from "@/lib/view";
import { useCurrentUser } from "@/lib/auth";
import { TopBar } from "./TopBar";
import { GrowerOverview } from "./GrowerOverview";
import { ContractorOverview } from "./ContractorOverview";

/**
 * App shell. Chooses the register by role (ROADMAP §6): the spacious Grower
 * overview or the dense, data-forward Contractor overview. Both read the same
 * Nhunge data, assembled once on the server and passed down as props.
 */
export function Dashboard({ data }: { data: DashboardData }) {
  const { role } = useCurrentUser();
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <main className="flex-1">
        {role === "contractor" ? <ContractorOverview data={data} /> : <GrowerOverview data={data} />}
      </main>
    </div>
  );
}
