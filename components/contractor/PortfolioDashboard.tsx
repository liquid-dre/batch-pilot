"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HouseMetrics, PortfolioData } from "@/lib/view";
import { num, pct, grams, shortDate, daysBetween } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";
import { rowActivation } from "@/lib/a11y";

type SortKey = "epef" | "day" | "remaining" | "livabilityPct" | "cumPct" | "avgWeightG" | "vsRossPct" | "fcr";

interface Column {
  key: SortKey;
  label: string;
  /** Lower is better (sort ascending puts best first). */
  lowerBetter?: boolean;
  /** FCR/EPEF are derived from feed delivered, not consumed — mark them. */
  estimated?: boolean;
  render: (r: HouseMetrics) => React.ReactNode;
}

const COLUMNS: Column[] = [
  { key: "day", label: "Day", render: (r) => r.day },
  { key: "remaining", label: "On site", render: (r) => num(r.remaining) },
  { key: "livabilityPct", label: "Livability", render: (r) => pct(r.livabilityPct, 1) },
  { key: "cumPct", label: "Cum mort", lowerBetter: true, render: (r) => pct(r.cumPct) },
  { key: "avgWeightG", label: "Weight", render: (r) => grams(r.avgWeightG) },
  { key: "vsRossPct", label: "vs Ross", render: (r) => `${r.vsRossPct}%` },
  { key: "fcr", label: "FCR", lowerBetter: true, estimated: true, render: (r) => r.fcr.toFixed(2) },
  { key: "epef", label: "EPEF", estimated: true, render: (r) => <span className="font-semibold text-ink">{r.epef}</span> },
];

function SummaryStat({ label, value, sub, estimated }: { label: string; value: string; sub?: string; estimated?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.8125rem] text-muted">{label}{estimated ? <EstTag /> : null}</p>
      <p className="mt-0.5 text-data text-[1.0625rem] text-ink">{value}</p>
      {sub ? <p className="text-[0.75rem] text-muted">{sub}</p> : null}
    </div>
  );
}

const SortArrow = ({ dir }: { dir: "asc" | "desc" }) => (
  <span className="ml-1 inline-block text-[0.625rem] align-middle">{dir === "asc" ? "▲" : "▼"}</span>
);

export function PortfolioDashboard({ data, siteId }: { data: PortfolioData; siteId: string }) {
  const router = useRouter();
  const { summary, rows } = data;

  // Rank is by EPEF (incoming rows arrive EPEF-sorted), held stable across re-sorts.
  const rankByHouse = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((r, i) => (m[r.houseId] = i + 1));
    return m;
  }, [rows]);

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "epef", dir: "desc" });

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => (a[sort.key] - b[sort.key]) * (sort.dir === "asc" ? 1 : -1));
    return out;
  }, [rows, sort]);

  function toggleSort(col: Column) {
    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: col.lowerBetter ? "asc" : "desc" },
    );
  }

  const readyVsKill = daysBetween(summary.expectedCollectionDate, summary.projectedReadyDate);
  const readyVerdict =
    readyVsKill > 0
      ? `Projected ready ${readyVsKill} day${readyVsKill === 1 ? "" : "s"} after the collection date`
      : "Projected ready on or before the collection date";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={`${summary.farmCode}/0${summary.cycleNo} · ${summary.siteName}`}
        title="Portfolio"
        intro="Active flocks ranked by production efficiency, measured against the contractor collection date."
      />

      {/* Batch summary + projected-ready vs collection */}
      <Card className="animate-rise">
        <CardBody className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <CardEyebrow>Cycle {summary.cycleNo} · {summary.houseCount} houses</CardEyebrow>
            <StatusPill level={summary.level} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryStat label="Birds on site" value={num(summary.birdsOnSite)} />
            <SummaryStat label="Avg mortality" value={pct(summary.avgMortPct)} />
            <SummaryStat label="Avg EPEF" value={String(summary.avgEpef)} estimated />
            <SummaryStat label="Projected avg" value={grams(summary.projectedAvgWeightG)} sub={`${summary.pctOfTarget}% of target`} />
            <SummaryStat label="Collection date" value={shortDate(summary.expectedCollectionDate)} sub={`${summary.daysToCollection === 0 ? "today" : `${summary.daysToCollection} days`}`} />
            <SummaryStat label="Projected ready" value={shortDate(summary.projectedReadyDate)} />
          </div>
          <div
            className={cn(
              "mt-4 rounded-[var(--radius-control)] p-3.5 text-body",
              readyVsKill > 0 ? "bg-status-warn-tint text-status-warn" : "bg-status-good-tint text-status-good",
            )}
          >
            {readyVerdict}.
          </div>
        </CardBody>
      </Card>

      {/* Ranked, sortable flock-overview table */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3">Flock ranking</h2>
          <span className="text-label text-muted">Tap a column to sort · tap a row for detail</span>
        </div>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH num>#</TH>
              <TH>House</TH>
              {COLUMNS.map((col) => (
                <TH key={col.key} num>
                  <button type="button" onClick={() => toggleSort(col)} className="inline-flex items-center hover:text-white">
                    {col.label}
                    {sort.key === col.key ? <SortArrow dir={sort.dir} /> : null}
                  </button>
                  {col.estimated ? <EstTag /> : null}
                </TH>
              ))}
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {sorted.map((r) => (
              <TR key={r.houseId} className="cursor-pointer" {...rowActivation(() => router.push(`/app/growers/${siteId}`))}>
                <TD num className="text-muted">{rankByHouse[r.houseId]}</TD>
                <TD className="font-medium text-ink">{r.houseName}</TD>
                {COLUMNS.map((col) => (
                  <TD key={col.key} num>
                    {col.render(r)}
                  </TD>
                ))}
                <TD><StatusPill level={r.level} size="sm" /></TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <EstFootnote />
      </section>
    </div>
  );
}
