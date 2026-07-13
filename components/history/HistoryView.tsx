"use client";

import { useMemo, useState } from "react";
import type { EditableField, EditRecord } from "@/lib/types";
import type { BatchDayRow, BatchHistory, HouseDayRow } from "@/lib/view";
import { getBatchHistory, getEditLog, submitManagerEdit } from "@/lib/data";
import { useCurrentUser } from "@/lib/auth";
import { num, pct, kg, grams, shortDate } from "@/lib/format";
import { compactGap, vsBenchmark } from "@/lib/weightCompare";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import { BenchmarkToggle, useWeightCompareMode } from "@/components/ui/BenchmarkToggle";
import { notify } from "@/components/ui/notify";
import { correctionSavedToast, SAVING, saveFailedToast } from "@/lib/copy";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconRefresh } from "@/components/icons";
import { cn } from "@/lib/cn";
import { HistoryChart, type ChartDatum } from "./HistoryChart";
import { HouseHistoryTable } from "./HouseHistoryTable";

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

export function HistoryView({
  data,
  editLog,
  embedded = false,
  editable = true,
}: {
  data: BatchHistory;
  editLog: EditRecord[];
  /** Render without the page chrome (header + container), for the batch-detail section. */
  embedded?: boolean;
  /** Closed/archived batches are read-only — no maker-checker pencil. */
  editable?: boolean;
}) {
  const { user } = useCurrentUser();
  const isManager = user.role === "manager";
  const canEdit = isManager && editable;
  const [compareMode] = useWeightCompareMode();

  // History + audit trail are held in state so a manager's correction (which
  // mutates the seam's module memory) re-derives and re-renders in place.
  const [history, setHistory] = useState<BatchHistory>(data);
  const [edits, setEdits] = useState<EditRecord[]>(editLog);
  const { maxDay, houses } = history;

  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(maxDay);
  const [houseSel, setHouseSel] = useState<Set<string>>(() => new Set(data.houses.map((h) => h.houseId)));
  const [seriesId, setSeriesId] = useState<string>("batch"); // "batch" | houseId
  const [metricKey, setMetricKey] = useState<MetricKey>("cumPct");
  const [flashDay, setFlashDay] = useState<number | null>(null);

  // Sticky jump-to-day: scroll the batch table's matching row into view and
  // flash it briefly. Honours reduced-motion (instant jump, no smooth scroll).
  const jumpTo = (day: number) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`bphist-day-${day}`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    setFlashDay(day);
    window.setTimeout(() => setFlashDay((d) => (d === day ? null : d)), 1400);
  };

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const isWeight = metric.key === "weight";
  const inRange = (day: number) => day >= from && day <= to;

  const editsByEntry = useMemo(() => {
    const m = new Map<string, EditRecord[]>();
    for (const e of edits) {
      const list = m.get(e.entityId) ?? [];
      list.push(e);
      m.set(e.entityId, list);
    }
    return m;
  }, [edits]);

  async function handleSave(entryId: string, changes: Partial<Record<EditableField, number | null>>) {
    try {
      // One toast covers the write + the two re-fetches (history + audit log).
      const { h, log } = await notify.promise(
        (async () => {
          const { records } = await submitManagerEdit({
            entityId: entryId,
            editor: { id: user.id, name: user.name, role: user.role },
            changes,
          });
          const [h, log] = await Promise.all([getBatchHistory(), getEditLog()]);
          return { records, h, log };
        })(),
        {
          loading: SAVING,
          success: (r) => correctionSavedToast(r.records.length),
          error: saveFailedToast,
        },
      );
      setHistory(h);
      setEdits(log);
    } catch {
      /* error toast already shown */
    }
  }

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
    const band = history.mortalityBand;
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
  }, [history.mortalityBand]);

  const rossByDay = useMemo(() => new Map(history.ross.map((r) => [r.day, r.weightG])), [history.ross]);
  const rossPointByDay = useMemo(() => new Map(history.ross.map((r) => [r.day, r])), [history.ross]);

  const chartData: ChartDatum[] = useMemo(() => {
    const isBatch = effectiveSeriesId === "batch";
    const rows: (BatchDayRow | HouseDayRow)[] = isBatch
      ? history.batch
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
        ross: metric.ross ? (metric.key === "weight" ? rossPointByDay.get(r.day)?.weightG : rossPointByDay.get(r.day)?.fcr ?? undefined) : undefined,
        band: metric.band ? bandAt(r.day) : undefined,
      }));
  }, [effectiveSeriesId, metric, history.batch, houses, rossPointByDay, bandAt, from, to]);

  const seriesLabel =
    effectiveSeriesId === "batch" ? "Batch" : houses.find((h) => h.houseId === effectiveSeriesId)?.houseName ?? "Batch";

  return (
    <div className={embedded ? "space-y-7" : "mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10"}>
      {embedded ? null : (
        <PageHeader
          eyebrow="History"
          title="Batch history"
          intro={
            canEdit
              ? "The full cycle, day by day. Set a day range and pick houses to filter every chart and table. As manager you can correct any captured value — each correction is recorded and the entry stays marked."
              : "The full cycle, day by day. Set a day range and pick houses to filter every chart and table below."
          }
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody className="space-y-5 pt-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Stepper label="From day" value={from} min={1} max={to} onChange={setFrom} />
            <Stepper label="To day" value={to} min={from} max={maxDay} onChange={setTo} />
            <Button
              variant="ghost"
              affordance={IconRefresh}
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
            {isWeight ? <BenchmarkToggle /> : null}
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
            gapMode={isWeight ? compareMode : undefined}
          />
          {metric.ross ? (
            <p className="text-label text-muted">
              Dashed line is the Ross 308 objective. Points are recorded weigh-ins.
              {isWeight ? " The tooltip shows each day's gap to target." : ""}
            </p>
          ) : metric.band ? (
            <p className="text-label text-muted">Dashed red line is the contractor cumulative-mortality ceiling.</p>
          ) : null}
          {metric.key === "fcr" ? <EstFootnote /> : null}
        </CardBody>
      </Card>

      {/* Day-by-day tables, with a sticky jump-to-day control over them */}
      <div className="space-y-7">
        <JumpToDay from={from} to={to} onJump={jumpTo} />

        <section className="space-y-3">
          <h2 className="text-h2">Batch totals · per day</h2>
          <BatchTable
            rows={history.batch.filter((r) => inRange(r.day))}
            rossByDay={rossByDay}
            compareMode={compareMode}
            flashDay={flashDay}
          />
        </section>

        {/* Per-house tables (manager: editable, with audit trail) */}
        {selectedHouses.map((h) => (
          <section key={h.houseId} className="space-y-3">
            <h2 className="text-h2">
              {h.houseName} <span className="text-muted text-h3 font-normal">· {num(h.placedCount)} placed</span>
            </h2>
            <HouseHistoryTable
              rows={h.rows.filter((r) => inRange(r.day))}
              rossByDay={rossByDay}
              compareMode={compareMode}
              canEdit={canEdit}
              editsByEntry={editsByEntry}
              onSave={handleSave}
            />
          </section>
        ))}
      </div>
    </div>
  );
}

/**
 * Sticky control that scrolls the day-by-day tables to a chosen day of cycle.
 * A labelled native select (keyboard-operable) constrained to the active day
 * range, plus an explicit "Go" so screen-reader/keyboard users aren't scrolled
 * on every arrow keystroke.
 */
function JumpToDay({ from, to, onJump }: { from: number; to: number; onJump: (day: number) => void }) {
  const [day, setDay] = useState(from);
  const clamped = Math.min(Math.max(day, from), to);
  const days: number[] = [];
  for (let d = from; d <= to; d++) days.push(d);
  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-pill)] border border-divider bg-surface/90 px-4 py-2.5 shadow-card backdrop-blur-md">
      <label htmlFor="bphist-jump" className="text-label font-medium text-slate">
        Jump to day
      </label>
      <select
        id="bphist-jump"
        value={clamped}
        onChange={(e) => setDay(Number(e.target.value))}
        className="h-9 rounded-[var(--radius-control)] border border-border bg-surface px-2.5 font-mono text-label tabular-nums text-ink transition-colors duration-[var(--dur-fast)] focus:border-brand-500"
      >
        {days.map((d) => (
          <option key={d} value={d}>
            Day {d}
          </option>
        ))}
      </select>
      <Button size="sm" variant="secondary" onClick={() => onJump(clamped)}>
        Go
      </Button>
      <span className="ml-auto text-label text-muted">
        Showing days {from}–{to}
      </span>
    </div>
  );
}

function BatchTable({
  rows,
  rossByDay,
  compareMode,
  flashDay,
}: {
  rows: BatchDayRow[];
  rossByDay: Map<number, number>;
  compareMode: ReturnType<typeof useWeightCompareMode>[0];
  /** Day to briefly highlight after a jump-to-day. */
  flashDay?: number | null;
}) {
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
          <TH num>vs target</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => {
          const target = r.avgWeightG ? rossByDay.get(r.day) : undefined;
          return (
            <TR
              key={r.day}
              id={`bphist-day-${r.day}`}
              className={cn(
                "scroll-mt-24 transition-colors duration-[var(--dur)]",
                flashDay === r.day && "bg-brand-50",
              )}
            >
              <TD num className="text-ink">{r.day}</TD>
              <TD>{shortDate(r.date)}</TD>
              <TD num>{num(r.mortality)}</TD>
              <TD num>{num(r.culls)}</TD>
              <TD num>{num(r.cumMort)}</TD>
              <TD num>{pct(r.cumPct)}</TD>
              <TD num>{kg(r.feedAddedKg)}</TD>
              <TD num>{r.avgWeightG ? grams(r.avgWeightG) : "—"}</TD>
              <TD num>{r.avgWeightG && target ? compactGap(vsBenchmark(r.avgWeightG, target), compareMode) : "—"}</TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
