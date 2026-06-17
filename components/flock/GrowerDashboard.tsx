"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import { useConfirmedAllocation } from "@/lib/allocationStore";
import type { BatchProjection, FlockAlert, PlannedBatch } from "@/lib/types";
import type { DashboardData, HouseView, WeightBandData } from "@/lib/view";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/shell/PageHeader";
import { WeightBandChart } from "@/components/charts/WeightBandChart";
import { weightGuidance } from "@/lib/guidance";
import { WeightGuidanceCard } from "./WeightGuidanceCard";
import { ProjectionCard } from "./ProjectionCard";
import { AlertsList } from "./AlertsList";
import { SiteRollupCard } from "./SiteRollupCard";
import { HouseStatusCard } from "./HouseStatusCard";
import { EfficiencyPanel, type HouseEfficiency } from "./EfficiencyPanel";

export interface GrowerDashboardData {
  overview: DashboardData;
  projection: BatchProjection;
  alerts: FlockAlert[];
  houseViews: HouseView[];
  weightBand: WeightBandData;
  efficiency: HouseEfficiency[];
  plannedBatch?: PlannedBatch;
}

function countdownLabel(days: number): string {
  if (days > 1) return `Collection in ${days} days`;
  if (days === 1) return "Collection tomorrow";
  if (days === 0) return "Collection target is today";
  return "Past collection target";
}

/**
 * The grower's one home (Dashboard): "what now?" first — greeting + the single
 * clear action, then the projection verdict, top alerts, the weight-vs-Ross
 * hero, efficiency, the site rollup and per-house status. Consolidates the old
 * overview + flock-status screens so there's a single starting point.
 */
export function GrowerDashboard({ data }: { data: GrowerDashboardData }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const firstName = user.name.split(" ")[0];
  const { overview, projection, alerts, houseViews, weightBand, efficiency, plannedBatch } = data;
  const { site, batch, rollup } = overview;
  // Hide the banner once the grower has confirmed the split (persisted client-side,
  // so it stays cleared across navigation even though the seam write is in-browser).
  const [allocation] = useConfirmedAllocation(plannedBatch?.id ?? "");
  const needsAllocation = plannedBatch && !plannedBatch.allocated && !allocation;

  // Constructive framing for the weight gap (copy in lib/guidance.ts). Inputs
  // come from existing dashboard data: average weight vs Ross, the latest weigh
  // day, and whether the birds are eating yet under-converting (FCR off target).
  const vsRoss = houseViews.map((v) => v.vsRossPct).filter((p): p is number => p != null);
  const avgVsRossPct = vsRoss.length ? Math.round(vsRoss.reduce((s, p) => s + p, 0) / vsRoss.length) : 100;
  const weighDay = Math.max(0, ...houseViews.map((v) => v.weight?.day ?? 0));
  const eatingAtOrAboveTarget = efficiency.some((h) => h.fcr && h.fcr.level !== "green");
  const guidance = weightGuidance({ vsRossPct: avgVsRossPct, day: weighDay, eatingAtOrAboveTarget });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow={`${site.name} · Cycle ${batch.cycleNo} · ${batch.breed}`}
        title={`Good morning, ${firstName}.`}
        intro={`Day 26–27 across ${rollup.houseCount} houses. ${countdownLabel(overview.killCountdownDays)}.`}
        action={
          <Button size="lg" onClick={() => router.push("/app/daily")}>
            Add today&apos;s numbers
          </Button>
        }
      />

      {needsAllocation ? (
        <Alert
          tone="info"
          title={`Cycle ${plannedBatch!.cycleNo} is ready to allocate`}
          action={
            <Link href="/app/houses/allocate">
              <Button size="sm">Allocate</Button>
            </Link>
          }
        >
          {`${num(plannedBatch!.totalPlaced)} birds to split across the houses. We'll suggest a distribution.`}
        </Alert>
      ) : null}

      <ProjectionCard projection={projection} />

      {/* Hero: actual weight per house vs the Ross curve, with the green/amber/red band */}
      <section className="space-y-3">
        <h2 className="text-h2">Weight against the Ross curve</h2>
        {guidance ? <WeightGuidanceCard guidance={guidance} /> : null}
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Every house · day of cycle</CardEyebrow>
            <p className="mt-2 mb-4 max-w-prose text-body text-slate">
              Each line is a house against the Ross 308 objective; the shaded bands are on track, at risk and behind.
            </p>
            <WeightBandChart data={weightBand} />
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h2">Needs attention</h2>
          <Link href="/app/alerts" className="text-label font-semibold text-brand-700 underline-offset-4 hover:text-brand-600 hover:underline">
            All alerts →
          </Link>
        </div>
        <AlertsList alerts={alerts} limit={2} moreHref="/app/alerts" />
      </section>

      <SiteRollupCard rollup={rollup} />

      <section className="space-y-3">
        <h2 className="text-h2">Efficiency &amp; feed</h2>
        <EfficiencyPanel houses={efficiency} />
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Every house</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houseViews.map((view) => (
            <HouseStatusCard key={view.house.id} view={view} />
          ))}
        </div>
      </section>
    </div>
  );
}
