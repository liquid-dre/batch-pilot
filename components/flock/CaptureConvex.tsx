"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CapturePanel, WeightsPanel } from "@/components/onboarding/FarmData";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * The daily round on Convex — the supervisor's capture + weigh-in surface,
 * reusing the reactive `CapturePanel` / `WeightsPanel` (both already wired to
 * `writes.submitDailyUpdate` / `writes.submitWeights`). Shows a calm empty state
 * until the farm's cycle is running.
 */
export function CaptureConvex() {
  const data = useQuery(api.farm.farmData);

  return (
    <div className="mx-auto max-w-2xl space-y-2 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Today's round"
        title="Capture & weigh-in"
        intro="Enter what you counted this round. The cumulative maths is done for you."
      />
      {data === undefined ? (
        <Card>
          <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
            Loading…
          </CardBody>
        </Card>
      ) : !data || !data.cycle || data.houses.length === 0 ? (
        <Card>
          <CardBody className="space-y-2 py-12 text-center">
            <p className="text-h3 text-ink">No active cycle</p>
            <p className="mx-auto max-w-md text-body text-slate">
              Set up your houses and start a cycle from Home, then today&apos;s capture appears here.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <CapturePanel />
          <WeightsPanel />
        </>
      )}
    </div>
  );
}
