"use client";

import { useMemo, useState } from "react";
import type { BatchDayRow, BatchHistory, HouseDayRow } from "@/lib/view";
import { num, pct, kg, grams, shortDate } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";
import { HistoryChart, type ChartDatum } from "./HistoryChart";

type MetricKey = "dailyMortPct" | "cumPct" | "feedAddedKg" | "weight" | "fcr";

interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  decimals: number;
  ross: boolean;
  band: boolean;
}

const METRICS: Metric[] = [
  { key: "dailyMortPct", label: "Daily mortality %", unit: "%", decimals: 2, ross: false, band: false },
  { key: "cumPct", label: "Cumulative mortality %", unit: "%", decimals: 2, ross: false, band: true },
  { key: "feedAddedKg", label: "Feed", unit: "kg", decimals: 0, ross: false, band: false },
  { key: "weight", label: "Weight vs Ross", unit: "g", decimals: 0, ross: true, band: false },
  { key: "fcr", label: "FCR", unit: "", decimals: 2, ross: true, band: false },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        active ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
      )}
    >
      {children}
    </button>
  );
}

export function HistoryView({ data }: { data: BatchHistory }) {
  const { maxDay, houses } = data;

  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(maxDay);
  const [houseSel, setHouseSel] = useState<Set<string>>(() => new Set(houses.map((h) => h.houseId)));
  const [seriesId, setSeriesId] = useState<string>("batch"); // "batch" | houseId
  const [metricKey, setMetricKey] = useState<MetricKey>("cumPct");

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const inRange = (day: number) => day >= from && day <= to;

  const toggleHouse = (id: string) =>
    setHouseSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Chart series options: Batch + the houses currently selected for tables.
  const selectedHouses = houses.filter((h) => houseSel.has(h.houseId));
  const effectiveSeriesId = seriesId !== "batch" && !houseSel.has(seriesId) ? "batch" : seriesId;

  const bandAt = useMemo(() => {
    const band = data.mortalityBand;
    return (day: number) => {
      if (day <= band[0].day) return band[0].maxCumPct;
      for (let i = 1; i < band.length; i++) {
        if (day <= band[i].day) {
          const a = band[i - 1];
          const b = band[i];
          const t = (day - a.day) / (b.day - a.day);
          return Number((a.maxCumPct + (b.maxCumPct - a.maxCumPct) * t).toFixed(2));
        }
      }
      return band[band.length - 1].maxCumPct;
    };
  }, [data.mortalityBand]);

  const rossByDay = useMemo(() => new Map(data.ross.map((r) => [r.day, r])), [data.ross]);

  const chartData: ChartDatum[] = useMemo(() => {
    const isBatch = effectiveSeriesId === "batch";
    const rows: (BatchDayRow | HouseDayRow)[] = isBatch
      ? data.batch
      : houses.find((h) => h.houseId === effectiveSeriesId)?.rows ?? [];

    const valueFor = (row: BatchDayRow | HouseDayRow): number | undefined => {
      switch (metric.key) {
        case "dailyMortPct":
          return row.dailyMortPct;
        case "cumPct":
          return row.cumPct;
        case "feedAddedKg":
          return row.feedAddedKg;
        case "weight":
          return isBatch ? (row as BatchDayRow).avgWeightG : (row as HouseDayRow).weigh?.avgWeightG;
        case "fcr":
          return isBatch ? (row as BatchDayRow).fcr : (row as HouseDayRow).weigh?.fcr;
      }
    };

    return rows
      .filter((r) => r.day >= from && r.day <= to)
      .map((r) => ({
        day: r.day,
        value: valueFor(r),
        ross: metric.ross ? (metric.key === "weight" ? rossByDay.get(r.day)?.weightG : rossByDay.get(r.day)?.fcr ?? undefined) : undefined,
        band: metric.band ? bandAt(r.day) : undefined,
      }));
  }, [effectiveSeriesId, metric, data.batch, houses, rossByDay, bandAt, from, to]);

  const seriesLabel =
    effectiveSeriesId === "batch" ? "Batch" : houses.find((h) => h.houseId === effectiveSeriesId)?.houseName ?? "Batch";

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="History"
        title="Batch history"
        intro="The full cycle, day by day. Set a day range and pick houses to filter every chart and table below."
      />

      {/* Filters */}
      <Card>
        <CardBody className="space-y-5 pt-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Stepper label="From day" value={from} min={1} max={to} onChange={setFrom} />
            <Stepper label="To day" value={to} min={from} max={maxDay} onChange={setTo} />
            <Button
              variant="ghost"
              className="h-14"
              onClick={() => {
                setFrom(1);
                setTo(maxDay);
              }}
            >
              All days
            </Button>
          </div>
          <div>
            <p className="mb-2 text-label text-slate">Houses</p>
            <div className="flex flex-wrap gap-2">
              {houses.map((h) => (
                <Chip key={h.houseId} active={houseSel.has(h.houseId)} onClick={() => toggleHouse(h.houseId)}>
                  {h.houseName}
                </Chip>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Chart */}
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardEyebrow>
              {metric.label} · {seriesLabel} · day {from}–{to}
            </CardEyebrow>
          </div>

          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <Chip key={m.key} active={metricKey === m.key} onClick={() => setMetricKey(m.key)}>
                {m.label}
                {m.key === "fcr" ? <EstTag /> : null}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label text-muted">Series:</span>
            <Chip active={effectiveSeriesId === "batch"} onClick={() => setSeriesId("batch")}>
              Batch
            </Chip>
            {selectedHouses.map((h) => (
              <Chip key={h.houseId} active={effectiveSeriesId === h.houseId} onClick={() => setSeriesId(h.houseId)}>
                {h.houseName}
              </Chip>
            ))}
          </div>

          <HistoryChart
            data={chartData}
            valueName={seriesLabel}
            unit={metric.unit}
            decimals={metric.decimals}
            showRoss={metric.ross}
            showBand={metric.band}
          />
          {metric.ross ? (
            <p className="text-label text-muted">Dashed line is the Ross 308 objective. Points are recorded weigh-ins.</p>
          ) : metric.band ? (
            <p className="text-label text-muted">Dashed red line is the contractor cumulative-mortality ceiling.</p>
          ) : null}
          {metric.key === "fcr" ? <EstFootnote /> : null}
        </CardBody>
      </Card>

      {/* Batch-level table */}
      <section className="space-y-3">
        <h2 className="text-h2">Batch totals · per day</h2>
        <BatchTable rows={data.batch.filter((r) => inRange(r.day))} />
      </section>

      {/* Per-house tables */}
      {selectedHouses.map((h) => (
        <section key={h.houseId} className="space-y-3">
          <h2 className="text-h2">
            {h.houseName} <span className="text-muted text-h3 font-normal">· {num(h.placedCount)} placed</span>
          </h2>
          <HouseTable rows={h.rows.filter((r) => inRange(r.day))} />
        </section>
      ))}
    </div>
  );
}

function BatchTable({ rows }: { rows: BatchDayRow[] }) {
  return (
    <Table>
      <THead>
        <TR className="bg-transparent hover:bg-transparent">
          <TH num>Day</TH>
          <TH>Date</TH>
          <TH num>Deaths</TH>
          <TH num>Culls</TH>
          <TH num>Cum mort</TH>
          <TH num>Cum %</TH>
          <TH num>Feed</TH>
          <TH num>Avg wt</TH>
          <TH num>vs Ross</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.day}>
            <TD num className="text-ink">{r.day}</TD>
            <TD>{shortDate(r.date)}</TD>
            <TD num>{num(r.mortality)}</TD>
            <TD num>{num(r.culls)}</TD>
            <TD num>{num(r.cumMort)}</TD>
            <TD num>{pct(r.cumPct)}</TD>
            <TD num>{kg(r.feedAddedKg)}</TD>
            <TD num>{r.avgWeightG ? grams(r.avgWeightG) : "—"}</TD>
            <TD num>{r.vsRossPct ? `${r.vsRossPct}%` : "—"}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function HouseTable({ rows }: { rows: HouseDayRow[] }) {
  return (
    <Table>
      <THead>
        <TR className="bg-transparent hover:bg-transparent">
          <TH num>Day</TH>
          <TH>Date</TH>
          <TH num>Deaths</TH>
          <TH num>Culls</TH>
          <TH num>Cum mort</TH>
          <TH num>Cum %</TH>
          <TH num>Feed</TH>
          <TH num>Temp</TH>
          <TH num>Wt</TH>
          <TH num>ADG</TH>
          <TH num>Unif</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.day}>
            <TD num className="text-ink">{r.day}</TD>
            <TD>{shortDate(r.date)}</TD>
            <TD num>{num(r.mortality)}</TD>
            <TD num>{num(r.culls)}</TD>
            <TD num>{num(r.cumMort)}</TD>
            <TD num>{pct(r.cumPct)}</TD>
            <TD num>{kg(r.feedAddedKg)}</TD>
            <TD num>{r.tempC !== undefined ? `${r.tempC}°` : "—"}</TD>
            <TD num>{r.weigh ? grams(r.weigh.avgWeightG) : "—"}</TD>
            <TD num>{r.weigh ? `${r.weigh.adgG} g` : "—"}</TD>
            <TD num>{r.weigh ? `${r.weigh.uniformityPct}%` : "—"}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
