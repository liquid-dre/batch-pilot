"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractorGrowers, GrowerPerf } from "@/lib/view";
import { num, pct, grams } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";
import { rowActivation } from "@/lib/a11y";
import { CompareChart, type CompareSeries } from "@/components/compare/CompareChart";

type MetricKey = "epef" | "fcr" | "cumMortPct" | "vsRossPct" | "readyVsKillDays";
type TrendKey = "vsRossPct" | "fcr" | "cumPct";

interface Metric {
  key: MetricKey;
  label: string;
  higherBetter: boolean;
  value: (g: GrowerPerf) => number;
  format: (g: GrowerPerf) => string;
  /** Which per-day trend field the position chart plots for this metric. */
  trend: TrendKey;
  unit: string;
  decimals: number;
  ross: boolean;
}

function killText(days: number): string {
  if (days <= -1) return `${Math.abs(days)}d early`;
  if (days === 0) return "on time";
  return `${days}d late`;
}

const METRICS: Metric[] = [
  { key: "epef", label: "EPEF", higherBetter: true, value: (g) => g.epef, format: (g) => String(g.epef), trend: "vsRossPct", unit: "%", decimals: 0, ross: false },
  { key: "fcr", label: "FCR", higherBetter: false, value: (g) => g.fcr, format: (g) => g.fcr.toFixed(2), trend: "fcr", unit: "", decimals: 2, ross: true },
  { key: "cumMortPct", label: "Cumulative mortality", higherBetter: false, value: (g) => g.cumMortPct, format: (g) => pct(g.cumMortPct), trend: "cumPct", unit: "%", decimals: 2, ross: false },
  { key: "vsRossPct", label: "Weight vs target", higherBetter: true, value: (g) => g.vsRossPct, format: (g) => `${g.vsRossPct}%`, trend: "vsRossPct", unit: "%", decimals: 0, ross: false },
  { key: "readyVsKillDays", label: "On-time to kill date", higherBetter: false, value: (g) => g.readyVsKillDays, format: (g) => killText(g.readyVsKillDays), trend: "vsRossPct", unit: "%", decimals: 0, ross: false },
];

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

export function ContractorGrowersView({ data }: { data: ContractorGrowers }) {
  const router = useRouter();
  const { growers } = data;
  const [metricKey, setMetricKey] = useState<MetricKey>("epef");
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const colorBySite = useMemo(() => {
    const m = new Map<string, string>();
    growers.forEach((g, i) => m.set(g.siteId, PALETTE[i % PALETTE.length]));
    return m;
  }, [growers]);

  const ranked = useMemo(() => {
    const arr = [...growers];
    arr.sort((a, b) => (metric.higherBetter ? metric.value(b) - metric.value(a) : metric.value(a) - metric.value(b)));
    return arr;
  }, [growers, metric]);

  // 0..1 "goodness" score for the visual ranking bar.
  const values = growers.map(metric.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const score = (g: GrowerPerf) => {
    if (max === min) return 1;
    const t = (metric.value(g) - min) / (max - min);
    return metric.higherBetter ? t : 1 - t;
  };

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  const chartSeries: CompareSeries[] = growers.map((g) => ({
    id: g.siteId,
    name: g.name,
    color: colorBySite.get(g.siteId) ?? PALETTE[0],
    emphasis: g.siteId === best?.siteId,
    points: g.trend.map((p) => ({ day: p.day, value: p[metric.trend] })),
  }));
  const rossOverlay = metric.ross
    ? data.ross.map((r) => ({ day: r.day, value: r.fcr })).filter((r): r is { day: number; value: number } => r.value != null)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={`${data.contractorName} · Growers`}
        title="Grower performance"
        intro="Every grower you supply, ranked on the metric you choose. Tap a grower for the per-house detail."
      />

      {/* Metric selector */}
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

      {/* Top / worst highlight */}
      <div className="grid gap-4 sm:grid-cols-2">
        <HighlightCard label="Top performer" grower={best} metric={metric} tone="good" />
        <HighlightCard label="Needs attention" grower={worst} metric={metric} tone="bad" />
      </div>

      {/* Ranked, sortable table */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3">Ranked by {metric.label.toLowerCase()}</h2>
          <span className="text-label text-muted">Tap a row for the grower detail</span>
        </div>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH num>#</TH>
              <TH>Grower</TH>
              <TH num>EPEF</TH>
              <TH num>FCR</TH>
              <TH num>Cum mort</TH>
              <TH num>Weight</TH>
              <TH num>On-time</TH>
              <TH>Ranking</TH>
            </TR>
          </THead>
          <TBody>
            {ranked.map((g, i) => (
              <TR key={g.siteId} className="cursor-pointer" {...rowActivation(() => router.push(`/app/growers/${g.siteId}`))}>
                <TD num className="text-muted">{i + 1}</TD>
                <TD className="font-medium text-ink">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: colorBySite.get(g.siteId) }} />
                    {g.name}
                    <span className="text-label font-normal text-muted">· C{g.cycleNo}{g.status === "completed" ? " · done" : ""}</span>
                    <StatusPill level={g.level} size="sm" />
                  </span>
                </TD>
                <Cell active={metric.key === "epef"}>{g.epef}</Cell>
                <Cell active={metric.key === "fcr"}>{g.fcr.toFixed(2)}</Cell>
                <Cell active={metric.key === "cumMortPct"}>{pct(g.cumMortPct)}</Cell>
                <Cell active={metric.key === "vsRossPct"}>{g.vsRossPct}%</Cell>
                <Cell active={metric.key === "readyVsKillDays"}>{killText(g.readyVsKillDays)}</Cell>
                <TD>
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-divider">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round(score(g) * 100)}%` }} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>

      {/* Position across the days */}
      <section className="space-y-3">
        <h2 className="text-h3">General position across the days</h2>
        <Card>
          <CardBody className="space-y-3 pt-5">
            <CardEyebrow>
              {metric.trend === "cumPct" ? "Cumulative mortality %" : metric.trend === "fcr" ? "FCR" : "Weight vs Ross %"} · by day of cycle
            </CardEyebrow>
            <CompareChart series={chartSeries} ross={rossOverlay} unit={metric.unit} decimals={metric.decimals} />
            <p className="text-label text-muted">
              Each line is a grower aligned by day of cycle; completed cycles end at their final day. The leader on this metric is the thicker line.
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function Cell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <TD num className={active ? "font-semibold text-ink" : undefined}>{children}</TD>;
}

function HighlightCard({ label, grower, metric, tone }: { label: string; grower?: GrowerPerf; metric: Metric; tone: "good" | "bad" }) {
  if (!grower) return null;
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4 pt-5">
        <div>
          <CardEyebrow>{label}</CardEyebrow>
          <p className="mt-1.5 text-h3">{grower.name}</p>
          <p className="text-label text-muted">
            Cycle {grower.cycleNo} · {grower.status === "completed" ? "completed" : `day ${grower.day}`} · {grams(grower.weightG)} · {num(grower.remaining)} birds
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-data text-[1.5rem] font-medium", tone === "good" ? "text-status-good" : "text-status-bad")}>{metric.format(grower)}</p>
          <p className="text-label text-muted">{metric.label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
