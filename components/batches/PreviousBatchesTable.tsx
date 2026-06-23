"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { BatchArchiveRow } from "@/lib/view";
import { num, pct, grams, kg, shortDate } from "@/lib/format";
import { useSessionPersisted } from "@/lib/usePersisted";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import {
  IconFilter,
  IconDrag,
  IconSortNone,
  IconSortAsc,
  IconSortDesc,
  IconClose,
  IconView,
  IconEmpty,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Column model — each column declares its type (which drives the filter shape),
// a `raw` accessor (sort + filter) and a `cell` renderer (display).
// ---------------------------------------------------------------------------

type ColType = "text" | "number" | "date";

interface Column {
  key: string;
  label: string;
  type: ColType;
  /** Marks FCR / EPEF as estimated. */
  est?: boolean;
  /** Comparable value for sorting + number/date filtering (string for text/date). */
  raw: (r: BatchArchiveRow) => number | string;
  /** Display cell. */
  cell: (r: BatchArchiveRow) => ReactNode;
}

function KillCell({ days }: { days: number }) {
  const tone = days <= 0 ? "text-status-good" : days <= 3 ? "text-status-warn" : "text-status-bad";
  const label = days < 0 ? `${Math.abs(days)}d ahead` : days === 0 ? "on date" : `${days}d over`;
  return <span className={cn("font-medium", tone)}>{label}</span>;
}

const COLUMNS: Column[] = [
  { key: "batch", label: "Batch", type: "text", raw: (r) => r.title, cell: (r) => <BatchCell row={r} /> },
  { key: "placed", label: "Placed", type: "number", raw: (r) => r.placed, cell: (r) => num(r.placed) },
  { key: "placingDate", label: "Start", type: "date", raw: (r) => r.placingDate, cell: (r) => shortDate(r.placingDate) },
  { key: "killDate", label: "End", type: "date", raw: (r) => r.killDate, cell: (r) => shortDate(r.killDate) },
  { key: "growOutDays", label: "Days", type: "number", raw: (r) => r.growOutDays, cell: (r) => `${r.growOutDays} d` },
  { key: "totalMortality", label: "Mortality", type: "number", raw: (r) => r.totalMortality, cell: (r) => num(r.totalMortality) },
  { key: "cumMortPct", label: "Cum %", type: "number", raw: (r) => r.cumMortPct, cell: (r) => pct(r.cumMortPct) },
  { key: "finalWeightG", label: "Final wt", type: "number", raw: (r) => r.finalWeightG, cell: (r) => grams(r.finalWeightG) },
  { key: "vsRossPct", label: "vs Ross", type: "number", raw: (r) => r.vsRossPct, cell: (r) => `${r.vsRossPct}%` },
  { key: "fcr", label: "FCR", type: "number", est: true, raw: (r) => r.fcr, cell: (r) => r.fcr.toFixed(2) },
  { key: "epef", label: "EPEF", type: "number", est: true, raw: (r) => r.epef, cell: (r) => num(r.epef) },
  { key: "feedUsedKg", label: "Feed", type: "number", raw: (r) => r.feedUsedKg, cell: (r) => kg(r.feedUsedKg) },
  { key: "vaccineCount", label: "Vaccines", type: "number", raw: (r) => r.vaccineCount, cell: (r) => num(r.vaccineCount) },
  { key: "readyVsKillDays", label: "vs kill date", type: "number", raw: (r) => r.readyVsKillDays, cell: (r) => <KillCell days={r.readyVsKillDays} /> },
];

const COL_BY_KEY: Record<string, Column> = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));
const DEFAULT_ORDER = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Filter + grid state (persisted for the browser session)
// ---------------------------------------------------------------------------

type SortDir = "asc" | "desc";
interface SortState { key: string; dir: SortDir }

type FilterValue =
  | { kind: "text"; q: string }
  | { kind: "number"; min: string; max: string }
  | { kind: "date"; from: string; to: string };

type Filters = Record<string, FilterValue>;

interface GridState {
  order: string[];
  sort: SortState;
  filters: Filters;
}

const DEFAULT_STATE: GridState = {
  order: DEFAULT_ORDER,
  sort: { key: "placingDate", dir: "desc" },
  filters: {},
};

function emptyFilter(type: ColType): FilterValue {
  if (type === "text") return { kind: "text", q: "" };
  if (type === "number") return { kind: "number", min: "", max: "" };
  return { kind: "date", from: "", to: "" };
}

function isActive(f: FilterValue | undefined): boolean {
  if (!f) return false;
  if (f.kind === "text") return f.q.trim() !== "";
  if (f.kind === "number") return f.min !== "" || f.max !== "";
  return f.from !== "" || f.to !== "";
}

function passes(col: Column, r: BatchArchiveRow, f: FilterValue | undefined): boolean {
  if (!isActive(f)) return true;
  if (f!.kind === "text") {
    return String(col.raw(r)).toLowerCase().includes(f!.q.trim().toLowerCase());
  }
  if (f!.kind === "number") {
    const v = Number(col.raw(r));
    if (f!.min !== "" && v < Number(f!.min)) return false;
    if (f!.max !== "" && v > Number(f!.max)) return false;
    return true;
  }
  const v = String(col.raw(r)); // ISO yyyy-mm-dd sorts/compares lexically
  if (f!.from !== "" && v < f!.from) return false;
  if (f!.to !== "" && v > f!.to) return false;
  return true;
}

/** Human-readable chips for the active-filters affordance. */
interface ChipDef { id: string; label: string; clear: () => void }

// ---------------------------------------------------------------------------

export function PreviousBatchesTable({ rows }: { rows: BatchArchiveRow[] }) {
  const router = useRouter();
  const [state, setState] = useSessionPersisted<GridState>("bp:batches-grid:v1", DEFAULT_STATE);
  const { order, sort, filters } = state;

  // Guard against a stale/incompatible persisted order (e.g. columns changed).
  const safeOrder = useMemo(() => {
    const known = order.filter((k) => COL_BY_KEY[k]);
    const missing = DEFAULT_ORDER.filter((k) => !known.includes(k));
    return [...known, ...missing];
  }, [order]);

  const cols = safeOrder.map((k) => COL_BY_KEY[k]);

  const anyActive = COLUMNS.some((c) => isActive(filters[c.key]));
  const layoutChanged = safeOrder.join() !== DEFAULT_ORDER.join();

  // Filter row defaults open when filters are active (e.g. restored from the
  // session); an explicit toggle overrides that. No effect needed — derived.
  const [override, setOverride] = useState<boolean | null>(null);
  const showFilters = override ?? anyActive;

  // Drag-reorder transient state (not persisted).
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  // --- state setters -------------------------------------------------------
  const setFilter = (key: string, next: FilterValue) =>
    setState({ ...state, filters: { ...filters, [key]: next } });

  const clearAll = () => setState({ ...state, filters: {} });

  const toggleSort = (col: Column) =>
    setState({
      ...state,
      sort:
        sort.key === col.key
          ? { key: col.key, dir: sort.dir === "asc" ? "desc" : "asc" }
          : { key: col.key, dir: col.type === "text" ? "asc" : "desc" },
    });

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    const next = safeOrder.filter((k) => k !== from);
    const at = next.indexOf(to);
    next.splice(at, 0, from);
    setState({ ...state, order: next });
  };

  const nudge = (key: string, dir: -1 | 1) => {
    const i = safeOrder.indexOf(key);
    const j = i + dir;
    if (j < 0 || j >= safeOrder.length) return;
    const next = [...safeOrder];
    [next[i], next[j]] = [next[j], next[i]];
    setState({ ...state, order: next });
  };

  // --- derive rows ---------------------------------------------------------
  const filtered = useMemo(() => {
    const kept = rows.filter((r) => COLUMNS.every((c) => passes(c, r, filters[c.key])));
    const col = COL_BY_KEY[sort.key] ?? COL_BY_KEY.placingDate;
    const sorted = [...kept].sort((a, b) => {
      const av = col.raw(a);
      const bv = col.raw(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, filters, sort]);

  // --- active-filter chips -------------------------------------------------
  const chips: ChipDef[] = [];
  for (const c of COLUMNS) {
    const f = filters[c.key];
    if (!isActive(f)) continue;
    if (f!.kind === "text") {
      chips.push({ id: `${c.key}-q`, label: `${c.label}: “${f!.q.trim()}”`, clear: () => setFilter(c.key, emptyFilter("text")) });
    } else if (f!.kind === "number") {
      if (f!.min !== "") chips.push({ id: `${c.key}-min`, label: `${c.label} ≥ ${f!.min}`, clear: () => setFilter(c.key, { kind: "number", min: "", max: f!.max }) });
      if (f!.max !== "") chips.push({ id: `${c.key}-max`, label: `${c.label} ≤ ${f!.max}`, clear: () => setFilter(c.key, { kind: "number", min: f!.min, max: "" }) });
    } else {
      if (f!.from !== "") chips.push({ id: `${c.key}-from`, label: `${c.label} from ${shortDate(f!.from)}`, clear: () => setFilter(c.key, { kind: "date", from: "", to: f!.to }) });
      if (f!.to !== "") chips.push({ id: `${c.key}-to`, label: `${c.label} to ${shortDate(f!.to)}`, clear: () => setFilter(c.key, { kind: "date", from: f!.from, to: "" }) });
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label text-muted" aria-live="polite">
          {filtered.length === rows.length
            ? `${rows.length} ${rows.length === 1 ? "batch" : "batches"}`
            : `Showing ${filtered.length} of ${rows.length} batches`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {layoutChanged ? (
            <Button size="sm" variant="ghost" onClick={() => setState({ ...state, order: DEFAULT_ORDER })}>
              Reset columns
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={showFilters ? "secondary" : "ghost"}
            icon={<IconFilter />}
            aria-pressed={showFilters}
            aria-expanded={showFilters}
            onClick={() => setOverride(!showFilters)}
          >
            Filters
            {anyActive ? (
              <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-brand-700 px-1.5 text-[0.6875rem] font-semibold text-white tabular-nums">
                {chips.length}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      {/* Active-filter chips + clear all */}
      {anyActive ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label font-medium text-slate">Filters active:</span>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.clear}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-brand-100 bg-brand-50 px-2.5 py-1 text-label font-medium text-brand-700 transition-colors duration-[var(--dur-fast)] hover:bg-brand-100"
            >
              {chip.label}
              <IconClose className="size-3.5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-label font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {/* Grid — horizontal + vertical scroll region so the header stays sticky */}
      <div className="max-h-[34rem] overflow-auto rounded-[var(--radius-card)] border border-divider">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10">
            {/* Label / sort / reorder row */}
            <tr className="bg-brand-900 text-[0.75rem] uppercase tracking-[0.04em] text-brand-100">
              {cols.map((col) => {
                const active = sort.key === col.key;
                const SortIcon = !active ? IconSortNone : sort.dir === "asc" ? IconSortAsc : IconSortDesc;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    onDragOver={(e) => {
                      if (dragKey) {
                        e.preventDefault();
                        setOverKey(col.key);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragKey) reorder(dragKey, col.key);
                      setDragKey(null);
                      setOverKey(null);
                    }}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 font-semibold align-bottom",
                      col.type === "number" && "text-right",
                      overKey === col.key && dragKey && dragKey !== col.key && "border-l-2 border-brand-500",
                    )}
                  >
                    <div className={cn("flex items-center gap-1.5", col.type === "number" && "justify-end")}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          setDragKey(col.key);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", col.key);
                        }}
                        onDragEnd={() => {
                          setDragKey(null);
                          setOverKey(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            nudge(col.key, -1);
                          } else if (e.key === "ArrowRight") {
                            e.preventDefault();
                            nudge(col.key, 1);
                          }
                        }}
                        aria-label={`Reorder ${col.label} column — drag, or use the left and right arrow keys`}
                        title="Drag to reorder, or focus and use ← →"
                        className="-ml-1 cursor-grab rounded-[6px] p-1 text-brand-100/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 active:cursor-grabbing"
                      >
                        <IconDrag className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        aria-label={`Sort by ${col.label}`}
                        className="inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 transition-colors hover:text-white focus-visible:text-white"
                      >
                        <span>{col.label}</span>
                        {col.est ? <EstTag className="border-current/40" /> : null}
                        <SortIcon className={cn("size-3.5 shrink-0", active ? "text-white" : "text-brand-100/50")} aria-hidden />
                      </button>
                    </div>
                  </th>
                );
              })}
              {/* Sticky action column — stays put while the grid scrolls sideways */}
              <th scope="col" className="sticky right-0 z-20 bg-brand-900 px-2 py-2.5">
                <span className="sr-only">View batch</span>
              </th>
            </tr>

            {/* Per-column filter row */}
            {showFilters ? (
              <tr className="bg-brand-700">
                {cols.map((col) => (
                  <th key={col.key} scope="col" className="px-2 py-2 align-top font-normal normal-case tracking-normal">
                    <FilterField col={col} value={filters[col.key]} onChange={(v) => setFilter(col.key, v)} />
                  </th>
                ))}
                <th scope="col" aria-hidden className="sticky right-0 z-20 bg-brand-700 px-2 py-2" />
              </tr>
            ) : null}
          </thead>

          <tbody className="divide-y divide-divider">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="group bg-surface transition-colors duration-[var(--dur-fast)] hover:bg-brand-50/60"
              >
                {cols.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-3 text-body text-slate",
                      col.type !== "text" && "font-mono tabular-nums text-ink",
                      col.type === "number" && "text-right",
                    )}
                  >
                    {col.cell(r)}
                  </td>
                ))}
                <td className="sticky right-0 bg-surface px-2 py-2 text-right shadow-[-8px_0_8px_-8px_rgba(11,42,74,0.12)] transition-colors duration-[var(--dur-fast)] group-hover:bg-brand-50/60">
                  <button
                    type="button"
                    onClick={() => router.push(`/app/batches/${r.id}`)}
                    aria-label={`View ${r.title}`}
                    title={`View ${r.title}`}
                    className="inline-flex size-9 items-center justify-center rounded-[var(--radius-control)] text-slate transition-colors duration-[var(--dur-fast)] hover:bg-brand-100 hover:text-brand-700 focus-visible:bg-brand-100 focus-visible:text-brand-700"
                  >
                    <IconView className="size-5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 ? (
          <EmptyState
            className="rounded-none border-0 border-t border-divider"
            icon={<IconEmpty />}
            title="No batches match these filters"
            body="Loosen or clear a filter to see your previous batches again."
            action={
              <Button size="sm" variant="secondary" onClick={clearAll}>
                Clear all filters
              </Button>
            }
          />
        ) : null}
      </div>

      <EstFootnote />
    </div>
  );
}

// ---------------------------------------------------------------------------

function BatchCell({ row }: { row: BatchArchiveRow }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="font-display font-semibold text-ink">{row.title}</span>
      {/* The live-trajectory status (On track / At risk …) only applies to the
          batch still on the floor; a closed cycle is a finished result. */}
      {row.status === "current" ? (
        <>
          <span className="rounded-[var(--radius-pill)] bg-brand-100 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-700">
            Live
          </span>
          <StatusPill level={row.level} size="sm" />
        </>
      ) : null}
    </span>
  );
}

const inputCls =
  "h-8 w-full min-w-0 rounded-[8px] border border-border bg-surface px-2 text-[0.8125rem] text-ink tabular-nums placeholder:text-hint focus:border-brand-500 focus:outline-none";

function FilterField({ col, value, onChange }: { col: Column; value: FilterValue | undefined; onChange: (v: FilterValue) => void }) {
  if (col.type === "text") {
    const v = value && value.kind === "text" ? value : { kind: "text" as const, q: "" };
    return (
      <input
        type="search"
        inputMode="search"
        value={v.q}
        placeholder="Search"
        aria-label={`Filter ${col.label}`}
        onChange={(e) => onChange({ kind: "text", q: e.target.value })}
        className={cn(inputCls, "w-32")}
      />
    );
  }
  if (col.type === "number") {
    const v = value && value.kind === "number" ? value : { kind: "number" as const, min: "", max: "" };
    return (
      <div className="flex w-24 flex-col gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={v.min}
          placeholder="Min"
          aria-label={`Minimum ${col.label}`}
          onChange={(e) => onChange({ kind: "number", min: e.target.value, max: v.max })}
          className={inputCls}
        />
        <input
          type="number"
          inputMode="decimal"
          value={v.max}
          placeholder="Max"
          aria-label={`Maximum ${col.label}`}
          onChange={(e) => onChange({ kind: "number", min: v.min, max: e.target.value })}
          className={inputCls}
        />
      </div>
    );
  }
  const v = value && value.kind === "date" ? value : { kind: "date" as const, from: "", to: "" };
  return (
    <div className="flex w-36 flex-col gap-1">
      <input
        type="date"
        value={v.from}
        aria-label={`${col.label} from`}
        onChange={(e) => onChange({ kind: "date", from: e.target.value, to: v.to })}
        className={inputCls}
      />
      <input
        type="date"
        value={v.to}
        aria-label={`${col.label} to`}
        onChange={(e) => onChange({ kind: "date", from: v.from, to: e.target.value })}
        className={inputCls}
      />
    </div>
  );
}
