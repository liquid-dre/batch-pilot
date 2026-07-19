"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROSS_308_CURVE, ROSS_308_OVERLAY } from "@/lib/data/ross308";
import { pct } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { PageHeader } from "@/components/shell/PageHeader";
import { BenchmarkChart, type ActualMarker } from "./BenchmarkChart";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Contractor Benchmark on Convex: the static Ross 308 objective curve + overlay
 * bands (tenant-agnostic reference) with each of the contractor's OWN farms
 * plotted against it, reusing the already-scoped `contractorGrowers` data. The
 * single-site per-house overlays (getPortfolio/getWeightBandData) are dropped;
 * per-contractor tunable benchmarks are a later phase.
 */
function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block size-2.5 rounded-full ${className}`} />;
}

export function BenchmarkConvex() {
  const data = useQuery(api.growers.contractorGrowers);

  if (data === undefined) return <ScreenLoading eyebrow="Benchmark" title="Ross 308 objective" />;
  if (data === null)
    return (
      <ScreenEmpty
        eyebrow="Benchmark"
        title="Ross 308 objective"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to see your farms benchmarked against the breed curve."
      />
    );

  const growers = (data.growers ?? []).filter((g): g is NonNullable<typeof g> => Boolean(g));
  const markers: ActualMarker[] = growers
    .filter((g) => g.weightG > 0)
    .map((g) => ({ day: g.day, weightG: g.weightG, level: g.level, label: g.name }));
  const killDay = growers.length ? Math.max(...growers.map((g) => g.killDay)) : 35;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Benchmark"
        title="Ross 308 objective"
        intro="The breed weight curve with each of your farms plotted against it, plus the mortality and uniformity overlay bands."
      />

      <Card>
        <CardBody className="pt-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-slate">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-0.5 w-6 rounded-full bg-brand-700" /> Ross 308 target (g)
            </span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-good" /> on track</span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-warn" /> at risk</span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-bad" /> needs attention</span>
          </div>
          <BenchmarkChart curve={ROSS_308_CURVE} markers={markers} killDay={killDay} />
          <p className="mt-2 text-label text-muted">
            {markers.length
              ? "Each point is a farm's latest weigh-in against the objective — the gap to the line is the under-performance you're tracking."
              : "No weigh-ins captured yet — your farms plot here once they record weights."}
          </p>
        </CardBody>
      </Card>

      {/* Contractor overlay bands (the default Ross overlay; tunable in a later phase). */}
      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Mortality band · max cumulative</CardEyebrow>
            <ul className="mt-3 divide-y divide-divider">
              {ROSS_308_OVERLAY.mortalityBand.map((b) => (
                <li key={b.day} className="flex items-center justify-between py-2">
                  <span className="text-body text-slate">Day {b.day}</span>
                  <span className="text-data text-ink">≤ {pct(b.maxCumPct, 1)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Uniformity target · minimum</CardEyebrow>
            <ul className="mt-3 divide-y divide-divider">
              {ROSS_308_OVERLAY.uniformityTarget.map((u) => (
                <li key={u.day} className="flex items-center justify-between py-2">
                  <span className="text-body text-slate">Day {u.day}</span>
                  <span className="text-data text-ink">≥ {u.minPct}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
