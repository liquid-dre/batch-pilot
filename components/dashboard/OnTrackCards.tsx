"use client";

import Link from "next/link";
import type { DashboardMetric } from "@/lib/view";
import { num } from "@/lib/format";
import { metricGap, formatMetricGap, signedMetricGap, type GapUnit } from "@/lib/metricGap";
import { BenchmarkToggle, useWeightCompareMode } from "@/components/ui/BenchmarkToggle";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EstTag } from "@/components/ui/Estimated";
import { IconArrowRight } from "@/components/icons";

/**
 * The on-track cards — one per measurable stat (weight, mortality, feed, FCR),
 * each saying whether the flock is ahead or behind the Ross 308 guideline and BY
 * HOW MUCH, through the shared numerical⇄percentage toggle. Status is the engine
 * level shown as a StatusPill (colour + icon + word + shape). The manager variant
 * adds the engine's cause + fix and a drill-down link; the supervisor gets a
 * single calm "what it means" line.
 */
export function OnTrackCards({
  metrics,
  variant,
  historyHref = "/app/history",
}: {
  metrics: DashboardMetric[];
  variant: "supervisor" | "manager";
  historyHref?: string;
}) {
  const [mode] = useWeightCompareMode();
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-h3">Against the Ross 308 guideline</h2>
        <BenchmarkToggle />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} mode={mode} variant={variant} historyHref={historyHref} />
        ))}
      </div>
    </section>
  );
}

function fmtVal(v: number, unit: GapUnit): string {
  switch (unit) {
    case "g":
      return `${num(Math.round(v))} g`;
    case "gPerBird":
      return `${num(Math.round(v))} g/bird`;
    case "pp":
      return `${v.toFixed(2)}%`;
    case "ratio":
      return v.toFixed(2);
  }
}

/** A short, calm "what it means" line for the supervisor. */
function plainLine(m: DashboardMetric): string {
  const behind = m.level !== "green";
  switch (m.key) {
    case "weight":
      return behind ? "The birds are behind the growth curve for their age." : "The birds are tracking the growth curve.";
    case "mortality":
      return behind ? "Losses are running above the day's standard." : "Losses are within the day's standard.";
    case "feed":
      return behind ? "Feed is off the Ross intake guide — worth a check." : "Feed is tracking the Ross intake guide.";
    case "fcr":
      return behind ? "Feed is converting to weight slower than the target." : "Feed is converting to weight on target.";
  }
}

function MetricCard({
  metric,
  mode,
  variant,
  historyHref,
}: {
  metric: DashboardMetric;
  mode: "difference" | "percentage";
  variant: "supervisor" | "manager";
  historyHref: string;
}) {
  const gap = metricGap(metric.actual, metric.target);
  return (
    <Card>
      <CardBody className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-label text-muted">
              {metric.label}
              {metric.estimated ? <EstTag /> : null}
            </p>
            <p className="mt-0.5 text-h2 tabular-nums text-ink">{signedMetricGap(gap, mode, metric.unit)}</p>
          </div>
          <StatusPill level={metric.level} size="sm" />
        </div>
        <p className="text-body text-slate">
          {formatMetricGap(gap, mode, metric.unit, metric.targetWord)} · Ross {metric.targetWord}{" "}
          <span className="tabular-nums text-ink">{fmtVal(metric.target, metric.unit)}</span>
        </p>

        {variant === "manager" && metric.cause ? (
          <div className="space-y-1 border-t border-divider pt-2">
            <p className="text-label text-slate">
              <span className="font-semibold">Likely:</span> {metric.cause}
            </p>
            {metric.fix ? (
              <p className="text-label text-slate">
                <span className="font-semibold">Do:</span> {metric.fix}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-label text-muted">{plainLine(metric)}</p>
        )}

        {variant === "manager" ? (
          <Link
            href={historyHref}
            className="inline-flex items-center gap-1 text-label font-medium text-brand-600 hover:text-brand-600"
          >
            See the day-by-day
            <IconArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </CardBody>
    </Card>
  );
}
