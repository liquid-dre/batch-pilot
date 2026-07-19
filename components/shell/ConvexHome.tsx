"use client";

import { useCurrentUser } from "@/lib/auth";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { GrowerHomeConvex } from "@/components/flock/GrowerHomeConvex";

/**
 * The `/app` home when Convex is connected, split by role. The contractor gets
 * the farm-management hub ("Your growers"); a grower gets the Dashboard (or the
 * setup hub until their cycle starts). Both are reactive, per-tenant data.
 */
export function ConvexHome() {
  const { role } = useCurrentUser();
  if (role === "contractor") return <Onboarding />;
  return <GrowerHomeConvex />;
}
