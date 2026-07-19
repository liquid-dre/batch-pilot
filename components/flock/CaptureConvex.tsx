"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CapturePanel, WeightsPanel } from "@/components/onboarding/FarmData";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * The two supervisor data-entry surfaces on Convex, reusing the reactive,
 * wizard-stepped `CapturePanel` / `WeightsPanel` (both wired to
 * `writes.submitDailyUpdate` / `writes.submitWeights`). Split into two screens so
 * "Today's capture" can expose Daily capture and Weigh-ins as sub-routes.
 */
function CaptureShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const data = useQuery(api.farm.farmData);
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
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
              Set up your houses and start a cycle from Home, then this appears here.
            </p>
          </CardBody>
        </Card>
      ) : (
        children
      )}
    </div>
  );
}

export function CaptureConvex() {
  return (
    <CaptureShell
      eyebrow="Today's round"
      title="Daily capture"
      intro="Enter what you counted this round, one house at a time. The cumulative maths is done for you."
    >
      <CapturePanel />
    </CaptureShell>
  );
}

export function WeighConvex() {
  return (
    <CaptureShell
      eyebrow="Today's round"
      title="Weigh-ins"
      intro="Enter the average weight per house. We compare each one to the Ross 308 target for its age."
    >
      <WeightsPanel />
    </CaptureShell>
  );
}
