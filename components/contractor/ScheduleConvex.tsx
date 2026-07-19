"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Contractor Collection schedule on Convex. The real catching/collection capture
 * (per-farm nights, bird drawdown, vehicle manifest) is a dedicated Phase-2
 * build — no mutation writes catching/manifest data yet, so for a real
 * contractor there is nothing to show. Rather than leak the demo Murray Downs
 * schedule, this shows an honest "coming soon" state scoped to the contractor's
 * own farms (via the already-scoped contractorGrowers query).
 *
 * Phase-2 seam: a farm picker + postCatchingSchedule/recordCatch mutations + a
 * contractor-scoped catching/manifest query replace this placeholder.
 */
export function ScheduleConvex() {
  const data = useQuery(api.growers.contractorGrowers);

  if (data === undefined) return <ScreenLoading eyebrow="Collection" title="Collection schedule" />;
  if (data === null)
    return (
      <ScreenEmpty
        eyebrow="Collection"
        title="Collection schedule"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to plan collection across your farms."
      />
    );

  const farms = [
    ...(data.growers ?? [])
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .map((g) => ({ siteId: g.siteId, name: g.name, farmCode: g.farmCode })),
    ...(data.notReporting ?? []),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Collection"
        title="Collection schedule"
        intro="Plan catching nights and collection vehicles per farm, and track birds collected."
      />

      <Card>
        <CardBody className="space-y-2 py-10 text-center">
          <p className="text-h3 text-ink">Collection scheduling is coming soon</p>
          <p className="mx-auto max-w-lg text-body text-slate">
            Per-farm catching nights, bird drawdown and the vehicle manifest will live here. It&apos;ll
            cover the farms you supply, listed below.
          </p>
        </CardBody>
      </Card>

      {farms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-h3">Your farms</h2>
          <Card>
            <CardBody className="divide-y divide-divider py-1">
              {farms.map((f) => (
                <div key={f.siteId} className="flex items-center justify-between py-3">
                  <span className="text-body text-ink">{f.name}</span>
                  <span className="font-mono text-label text-muted">{f.farmCode}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </section>
      )}
    </div>
  );
}
