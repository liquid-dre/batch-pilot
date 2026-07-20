"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";
import { FarmSetup } from "@/components/onboarding/Onboarding";

/**
 * Manager "Set up cycle" page (`/app/houses`) — one place to do both physical
 * jobs: set up houses & capacities, then place birds against the contractor's
 * scheduled cycle. This is the combined flow the manager reaches from the Cycles
 * card and the Setup nav, so there's an obvious home for it once a cycle is
 * scheduled (ROADMAP §9 — managers place, contractors plan). Reuses the same
 * `FarmSetup` body the onboarding home shows, over the reactive `myWorkspace`.
 */
export function CycleSetupConvex() {
  const workspace = useQuery(api.tenancy.myWorkspace);

  if (workspace === undefined) return <ScreenLoading eyebrow="Setup" title="Set up cycle" />;
  if (workspace === null || workspace.role !== "manager" || !workspace.farm)
    return (
      <ScreenEmpty
        eyebrow="Setup"
        title="Set up cycle"
        heading="Manager sign-in required"
        body="Only the farm's manager sets up houses and places birds."
      />
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Setup"
        title="Set up cycle"
        intro="Set up your houses & capacities, then place birds against the cycle your contractor scheduled."
      />
      <FarmSetup workspace={workspace} />
    </div>
  );
}
