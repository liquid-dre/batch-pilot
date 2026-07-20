"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ContractorGrowers } from "@/lib/view";
import { ContractorGrowersView } from "./ContractorGrowersView";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";
import { IconChevronDown } from "@/components/icons";

/**
 * Contractor Overview (`/app`) — the portfolio dashboard. Reuses the
 * cross-grower current-cycles view (summary highlight cards + ranked table +
 * not-reporting) and adds an Upcoming cycles section from the scheduled batches.
 * Each upcoming card expands in place to the full plan and an inline edit.
 * Farm management + scheduling live under the Growers nav group.
 */

type Upcoming = {
  siteId: string;
  farmName: string;
  cycleNo: number;
  breed: string;
  placementDate: string;
  expectedCollectionDate: string;
  targetWeightMinG: number | null;
  targetWeightMaxG: number | null;
  totalBirds: number | null;
};

export function ContractorOverview() {
  const data = useQuery(api.growers.contractorGrowers);
  const upcoming = useQuery(api.growers.contractorUpcomingCycles);

  if (data === undefined) return <ScreenLoading eyebrow="Overview" title="Your growers" />;
  if (data === null)
    return (
      <ScreenEmpty
        eyebrow="Overview"
        title="Your growers"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to see your portfolio."
      />
    );

  return (
    <div className="space-y-8 pb-8">
      <ContractorGrowersView data={data as ContractorGrowers} />

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <CardEyebrow>Upcoming cycles</CardEyebrow>
          <Link href="/app/growers/schedule">
            <Button variant="secondary" size="sm">Schedule a cycle →</Button>
          </Link>
        </div>
        {!upcoming || upcoming.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center text-body text-muted">
              No upcoming cycles scheduled. Schedule one from Growers.
            </CardBody>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(upcoming as Upcoming[]).map((c) => (
              <li key={`${c.siteId}_${c.cycleNo}`}>
                <UpcomingCycleCard cycle={c} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const field =
  "h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500";

function rangeLabel(min: number | null, max: number | null) {
  return min && max ? `${(min / 1000).toFixed(2)}–${(max / 1000).toFixed(2)} kg` : "—";
}

/** One upcoming cycle — collapsed summary, expanding to the plan + inline edit. */
function UpcomingCycleCard({ cycle: c }: { cycle: Upcoming }) {
  const editCycle = useMutation(api.tenancy.editCycle);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [start, setStart] = useState(c.placementDate ?? "");
  const [end, setEnd] = useState(c.expectedCollectionDate ?? "");
  const [minG, setMinG] = useState(c.targetWeightMinG ? String(c.targetWeightMinG) : "");
  const [maxG, setMaxG] = useState(c.targetWeightMaxG ? String(c.targetWeightMaxG) : "");

  async function save() {
    setPending(true);
    try {
      await notify.promise(
        editCycle({
          siteId: c.siteId,
          cycleNo: c.cycleNo,
          placementDate: start || undefined,
          expectedCollectionDate: end || undefined,
          targetWeightMinG: minG ? Number(minG) : undefined,
          targetWeightMaxG: maxG ? Number(maxG) : undefined,
        }),
        {
          loading: "Updating cycle…",
          success: () => ({ title: "Cycle updated" }),
          error: () => ({ title: "Couldn't update the cycle", description: "Try again." }),
        },
      );
      setEditing(false);
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-2 text-left"
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="truncate text-h3">{c.farmName}</h3>
              <span className="shrink-0 font-mono text-label text-muted">cycle {c.cycleNo}</span>
            </div>
            <p className="mt-1 text-label text-muted">
              {c.breed} · places {c.placementDate || "—"}
              {c.totalBirds ? ` · ${c.totalBirds.toLocaleString()} birds` : ""}
            </p>
          </div>
          <IconChevronDown
            className={`mt-1 size-5 shrink-0 text-hint transition-transform duration-[var(--dur-fast)] ${open ? "" : "-rotate-90"}`}
          />
        </button>

        {open && (
          <div className="mt-4 border-t border-divider pt-4">
            <dl className="grid grid-cols-2 gap-y-2 text-label">
              <dt className="text-muted">Breed</dt><dd className="text-right font-mono text-ink">{c.breed}</dd>
              <dt className="text-muted">Start date</dt><dd className="text-right font-mono text-ink">{c.placementDate || "—"}</dd>
              <dt className="text-muted">Collection date</dt><dd className="text-right font-mono text-ink">{c.expectedCollectionDate || "—"}</dd>
              <dt className="text-muted">Target weight</dt><dd className="text-right font-mono text-ink">{rangeLabel(c.targetWeightMinG, c.targetWeightMaxG)}</dd>
              <dt className="text-muted">Total birds</dt><dd className="text-right font-mono text-ink">{c.totalBirds ? c.totalBirds.toLocaleString() : "—"}</dd>
            </dl>

            {editing ? (
              <div className="mt-4 space-y-3">
                <p className="text-label text-muted">Only fields you fill in are changed.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5"><span className="text-label font-medium text-slate">Start date</span>
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-label font-medium text-slate">Collection date</span>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={field} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-label font-medium text-slate">Target min (g)</span>
                    <input value={minG} inputMode="numeric" onChange={(e) => setMinG(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} text-right font-mono`} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-label font-medium text-slate">Target max (g)</span>
                    <input value={maxG} inputMode="numeric" onChange={(e) => setMaxG(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} text-right font-mono`} /></label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={pending}>Cancel</Button>
                  <Button size="sm" loading={pending} onClick={save}>Save cycle</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit cycle</Button>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
