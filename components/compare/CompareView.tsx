"use client";

import { useMemo, useState } from "react";
import type { ComparePoint, CompareData } from "@/lib/view";
import { pct, grams, shortDate } from "@/lib/format";
import { compactGap, vsBenchmarkFromPct } from "@/lib/weightCompare";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import { BenchmarkToggle, useWeightCompareMode } from "@/components/ui/BenchmarkToggle";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";
import { CompareChart, type CompareSeries } from "./CompareChart";

type MetricKey = "dailyMortPct" | "cumPct" | "weight" | "fcr";

interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  decimals: number;
  ross: boolean;
}

const METRICS: Metric[] = [
  { key: "dailyMortPct", label: "Daily mortality %", unit: "%", decimals: 2, ross: false },
  { key: "cumPct", label: "Cumulative mortality %", unit: "%", decimals: 2, ross: false },
  { key: "weight", label: "Average weight vs Ross", unit: "g", decimals: 0, ross: true },
  { key: "fcr", label: "FCR", unit: "", decimals: 2, ross: true },
];

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

function metricValue(p: ComparePoint, key: MetricKey): number | undefined {
  switch (key) {
    case "dailyMortPct":
      return p.dailyMortPct;
    case "cumPct":
      return p.cumPct;
    case "weight":
      return p.avgWeightG;
    case "fcr":
      return p.fcr;
  }
}

function collectionVerdict(days: number): { label: string; tone: string } {
  if (days <= -1) return { label: `${Math.abs(days)}d ahead of collection date`, tone: "text-status-good" };
  if (days === 0) return { label: "on the collection date", tone: "text-status-good" };
  if (days <= 3) return { label: `${days}d past collection date`, tone: "text-status-warn" };
  return { label: `${days}d past collection date`, tone: "text-status-bad" };
}

export function CompareView({ data }: { data: CompareData }) {
  const { batches } = data;

  // Stable colour per batch (current = chart-1), independent of selection.
  const colorByCycle = useMemo(() => {
    const m = new Map<number, string>();
    batches.forEach((b, i) => m.set(b.cycleNo, PALETTE[i % PALETTE.length]));
    return m;
  }, [batches]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(batches.slice(0, 3).map((b) => b.id)));
  const [metricKey, setMetricKey] = useState<MetricKey>("weight");
  const [compareMode] = useWeightCompareMode();
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedBatches = batches.filter((b) => selected.has(b.id));

  const chartSeries: CompareSeries[] = selectedBatches.map((b) => ({
    id: b.id,
    name: b.label,
    color: colorByCycle.get(b.cycleNo) ?? PALETTE[0],
    emphasis: b.status === "current",
    points: b.series.map((p) => ({ day: p.day, value: metricValue(p, metricKey) })),
  }));

  const rossOverlay = metric.ross
    ? data.ross
        .map((r) => ({ day: r.day, value: metric.key === "weight" ? r.weightG : r.fcr }))
        .filter((r): r is { day: number; value: number } => r.value != null)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Compare"
        title="Batch comparison"
        intro="Line up several batches by day of cycle, not by date, to see how this one is tracking against your past flocks."
      />

      {/* Batch picker (doubles as the chart legend) */}
      <Card>
        <CardBody className="pt-5">
          <p className="mb-2 text-label text-slate">Batches</p>
          <div className="flex flex-wrap gap-2">
            {batches.map((b) => {
              const active = selected.has(b.id);
              const color = colorByCycle.get(b.cycleNo);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(b.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                    active ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
                  )}
                >
                  <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
                  {b.label}
                  {b.status === "current" ? <span className={cn("text-[0.6875rem]", active ? "text-white/80" : "text-muted")}>· current</span> : null}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Overlay chart */}
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardEyebrow>{metric.label} · aligned by day of cycle</CardEyebrow>
            {metric.key === "weight" ? <BenchmarkToggle /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={metricKey === m.key}
                onClick={() => setMetricKey(m.key)}
                className={cn(
                  "whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  metricKey === m.key ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {chartSeries.length === 0 ? (
            <p className="py-16 text-center text-body text-muted">Pick at least one batch to plot.</p>
          ) : (
            <CompareChart series={chartSeries} ross={rossOverlay} unit={metric.unit} decimals={metric.decimals} />
          )}
          {metric.ross ? (
            <p className="text-label text-muted">Dashed line is the Ross 308 objective. The current batch is the thicker line.</p>
          ) : (
            <p className="text-label text-muted">The current batch is the thicker line.</p>
          )}
        </CardBody>
      </Card>

      {/* Summary table */}
      <section className="space-y-3">
        <h2 className="text-h2">Key results</h2>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH>Batch</TH>
              <TH num>Weight</TH>
              <TH num>vs target</TH>
              <TH num>Cum mort</TH>
              <TH num>FCR<EstTag /></TH>
              <TH num>Days to target</TH>
              <TH>vs collection</TH>
            </TR>
          </THead>
          <TBody>
            {selectedBatches.map((b) => {
              const v = collectionVerdict(b.readyVsCollectionDays);
              return (
                <TR key={b.id}>
                  <TD className="font-medium text-ink">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-2.5 rounded-full" style={{ background: colorByCycle.get(b.cycleNo) }} />
                      {b.label}
                      {b.status === "current" ? <span className="text-label font-normal text-muted">· current</span> : null}
                    </span>
                  </TD>
                  <TD num>{b.weightG ? grams(b.weightG) : "—"}</TD>
                  <TD num>{b.weightG && b.vsRossPct ? compactGap(vsBenchmarkFromPct(b.weightG, b.vsRossPct), compareMode) : "—"}</TD>
                  <TD num>{pct(b.cumMortPct)}</TD>
                  <TD num>{b.fcr ? b.fcr.toFixed(2) : "—"}</TD>
                  <TD num>{b.daysToTarget} d</TD>
                  <TD><span className={cn("text-label font-medium", v.tone)}>{v.label}</span></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        <p className="text-label text-muted">
          Weight is the final figure for closed batches and the latest weigh-in for the current one. Target is the Ross 308 weight at each batch&apos;s collection date ({selectedBatches.length ? shortDate(selectedBatches[0].expectedCollectionDate) : "—"} for the current cycle).
        </p>
        <EstFootnote />
      </section>
    </div>
  );
}
