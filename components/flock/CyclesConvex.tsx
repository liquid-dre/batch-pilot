"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * The grower's Cycles view (`/app/cycles`) — upcoming + ongoing cycles for their
 * farm, read-only. Cycles are contractor-owned (dates, delivery, target weight
 * range); this is the manager/foreman's window onto the plan set for them.
 */
export function CyclesConvex() {
  const data = useQuery(api.tenancy.myCycles);

  if (data === undefined) return <ScreenLoading eyebrow="Cycles" title="Your cycles" />;
  if (data === null)
    return <ScreenEmpty eyebrow="Cycles" title="Your cycles" heading="Grower sign-in required" body="Sign in as a manager or foreman to see your farm's cycles." />;

  const range = (min: number | null, max: number | null) =>
    min && max ? `${(min / 1000).toFixed(2)}–${(max / 1000).toFixed(2)} kg` : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Cycles" title="Your cycles" intro="Upcoming and ongoing cycles your contractor has scheduled for this farm." />
      {data.cycles.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center text-body text-muted">
            No cycles scheduled yet. Your contractor schedules them — they&apos;ll appear here.
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-4">
          {data.cycles.map((c) => (
            <li key={c.cycleNo}>
              <Card>
                <CardBody className="pt-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-h3">Cycle {c.cycleNo}</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 text-label ${c.status === "ongoing" ? "text-status-good" : "text-slate"}`}
                    >
                      <span className={`inline-block size-1.5 rounded-full ${c.status === "ongoing" ? "bg-status-good" : "bg-slate/40"}`} aria-hidden />
                      {c.status === "ongoing" ? "Ongoing" : "Upcoming"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-label sm:grid-cols-3">
                    <Row label="Set up by" value={c.contractorName || "—"} />
                    <Row label="Breed" value={c.breed} mono />
                    <Row label="Target weight" value={range(c.targetWeightMinG, c.targetWeightMaxG)} mono />
                    <Row label="Start date" value={c.placementDate || "—"} mono />
                    <Row label="Collection date" value={c.expectedCollectionDate || "—"} mono />
                    <Row label="Total birds" value={c.totalBirds ? c.totalBirds.toLocaleString() : "—"} mono />
                    <Row label="Placed so far" value={c.placed ? c.placed.toLocaleString() : "—"} mono />
                    <Row label="Delivery nights" value={c.deliveryDates.length ? c.deliveryDates.join(", ") : "—"} />
                  </dl>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={`text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
