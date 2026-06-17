"use client";

import { useState } from "react";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { CompareChart, type CompareSeries } from "@/components/compare/CompareChart";
import { cn } from "@/lib/cn";

/**
 * Per-house, per-day trends for the contractor drill-down — the same day-of-cycle
 * line view the grower sees in History, reusing CompareChart. Every grower has
 * a daily mortality and cumulative-mortality series per house, so this reaches
 * the same depth for all growers, not just the fully-instrumented reference site.
 */

export interface HouseTrendSeries {
  houseId: string;
  houseName: string;
  /** Daily deaths, indexed from day 1. */
  mortSeries: number[];
  /** Cumulative mortality %, indexed from day 1. */
  cumPctSeries: number[];
}

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

const METRICS = [
  { key: "cumPct", label: "Cumulative mortality %", unit: "%", decimals: 2, pick: (h: HouseTrendSeries) => h.cumPctSeries },
  { key: "daily", label: "Daily deaths", unit: "", decimals: 0, pick: (h: HouseTrendSeries) => h.mortSeries },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export function GrowerTrends({ houses }: { houses: HouseTrendSeries[] }) {
  const [metricKey, setMetricKey] = useState<MetricKey>("cumPct");
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const series: CompareSeries[] = houses.map((h, i) => ({
    id: h.houseId,
    name: h.houseName,
    color: PALETTE[i % PALETTE.length],
    points: metric.pick(h).map((value, d) => ({ day: d + 1, value })),
  }));

  return (
    <Card>
      <CardBody className="space-y-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardEyebrow>{metric.label} · by day of cycle</CardEyebrow>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a trend metric">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={metricKey === m.key}
                onClick={() => setMetricKey(m.key)}
                className={cn(
                  "whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  metricKey === m.key ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <CompareChart series={series} unit={metric.unit} decimals={metric.decimals} />
        <p className="text-label text-muted">Each line is a house, aligned by day of cycle.</p>
      </CardBody>
    </Card>
  );
}
