"use client";

import { useCurrentUser } from "@/lib/auth";
import { GrowerHomeConvex } from "@/components/flock/GrowerHomeConvex";
import { PlatformAdminHome } from "@/components/admin/PlatformAdminHome";
import { ContractorOverview } from "@/components/contractor/ContractorOverview";

/**
 * The `/app` home when Convex is connected, split by role. The platform admin
 * gets the contractor-org / theming console; the contractor gets the
 * farm-management hub ("Your growers"); a grower gets the Dashboard (or the
 * setup hub until their cycle starts). All reactive, per-tenant data.
 */
export function ConvexHome() {
  const { role } = useCurrentUser();
  if (role === "platformAdmin") return <PlatformAdminHome />;
  if (role === "contractor") return <ContractorOverview />;
  return <GrowerHomeConvex />;
}
