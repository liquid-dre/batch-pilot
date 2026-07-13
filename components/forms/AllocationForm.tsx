"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { House, PlannedBatch } from "@/lib/types";
import { confirmAllocation, type Allocation } from "@/lib/data";
import { useConfirmedAllocation } from "@/lib/allocationStore";
import { num, shortDate } from "@/lib/format";
import { allocationSavedToast, SAVING, saveFailedToast } from "@/lib/copy";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Alert } from "@/components/ui/Alert";
import { notify } from "@/components/ui/notify";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconStatusGood, IconCheck, IconRefresh } from "@/components/icons";
import { cn } from "@/lib/cn";

interface AllocationFormProps {
  planned: PlannedBatch;
  houses: House[];
  recommended: Allocation[];
}

function Summary({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className="mt-0.5 text-data text-[1.0625rem] text-ink">{value}</p>
      {sub ? <p className="text-[0.75rem] text-muted">{sub}</p> : null}
    </div>
  );
}

export function AllocationForm({ planned, houses, recommended }: AllocationFormProps) {
  const router = useRouter();

  const recMap = useMemo(() => Object.fromEntries(recommended.map((r) => [r.houseId, r.count])), [recommended]);
  const [counts, setCounts] = useState<Record<string, number>>(recMap);
  // Persisted client-side so the locked-in done-state survives navigation/refresh.
  const [confirmed, setConfirmed] = useConfirmedAllocation(planned.id);

  const sumCap = houses.reduce((s, h) => s + h.capacity, 0);
  const total = houses.reduce((s, h) => s + (counts[h.id] ?? 0), 0);
  const target = planned.totalPlaced;
  const diff = target - total;
  const overCapacity = target > sumCap;
  const balanced = diff === 0;

  async function handleConfirm() {
    try {
      const result = await notify.promise(
        confirmAllocation(houses.map((h) => ({ houseId: h.id, count: counts[h.id] ?? 0 }))),
        {
          loading: SAVING,
          success: (r) => allocationSavedToast(total, r.length),
          error: saveFailedToast,
        },
      );
      setConfirmed(result);
    } catch {
      /* error toast already shown */
    }
  }

  if (confirmed) {
    const confirmedTotal = confirmed.reduce((s, h) => s + h.count, 0);
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          back={{ href: "/app", label: "Dashboard" }}
          eyebrow={`Cycle ${planned.cycleNo} · ${planned.breed}`}
          title="Cycle allocated"
        />
        <Alert tone="success" title={`${num(confirmedTotal)} birds placed across ${confirmed.length} houses`}>
          Placed {shortDate(planned.placingDate)}. Each house has its own day-count and is ready for daily updates. This step is done.
        </Alert>
        <Card>
          <CardBody className="pt-5">
            <div className="flex items-center justify-between">
              <CardEyebrow>Locked-in split</CardEyebrow>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-status-good-tint px-2.5 py-1 text-label font-medium text-status-good">
                <IconStatusGood className="size-3.5" />
                Allocated
              </span>
            </div>
            <ul className="mt-3 divide-y divide-divider">
              {confirmed.map((h) => (
                <li key={h.houseId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-body-l text-ink">{h.houseName}</p>
                    <p className="text-label text-muted">Day {h.dayCount} · placed {shortDate(planned.placingDate)}</p>
                  </div>
                  <span className="text-data text-[1.0625rem] text-ink">{num(h.count)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button size="lg" block className="sm:flex-1" onClick={() => router.push("/app/daily")}>
            Add today&apos;s numbers
          </Button>
          <Button
            size="lg"
            variant="ghost"
            block
            className="sm:w-auto"
            affordance={IconRefresh}
            onClick={() => {
              setCounts(Object.fromEntries(confirmed.map((h) => [h.houseId, h.count])));
              setConfirmed(null);
            }}
          >
            Re-allocate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        back={{ href: "/app/houses", label: "Setup · Houses" }}
        eyebrow={`Cycle ${planned.cycleNo} · ${planned.breed}`}
        title="Allocate the houses"
        intro="We've suggested a split proportional to each house's capacity. Accept it, or adjust any house before you confirm."
      />

      <Card>
        <CardBody className="grid grid-cols-2 gap-5 pt-5 sm:grid-cols-4">
          <Summary label="To place" value={num(target)} />
          <Summary label="Placing" value={shortDate(planned.placingDate)} />
          <Summary label="Kill date" value={shortDate(planned.killDate)} />
          <Summary label="Site capacity" value={num(sumCap)} />
        </CardBody>
      </Card>

      {overCapacity ? (
        <Alert tone="warning" title={`${num(target - sumCap)} birds over site capacity`} action={<Button size="sm" variant="secondary" onClick={() => router.push("/app/houses")}>Edit houses</Button>}>
          The cycle won&apos;t fit in the current houses. Raise a capacity or add a house, then come back.
        </Alert>
      ) : null}

      <Card>
        <CardBody className="space-y-6 pt-5">
          {houses.map((h) => (
            <Stepper
              key={h.id}
              label={h.name}
              value={counts[h.id] ?? 0}
              onChange={(v) => setCounts((prev) => ({ ...prev, [h.id]: v }))}
              min={0}
              max={h.capacity}
              step={100}
              hint={`Capacity ${num(h.capacity)}${(counts[h.id] ?? 0) >= h.capacity ? " · full" : ""}`}
            />
          ))}
        </CardBody>
      </Card>

      {/* Running total vs target */}
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label text-muted">Allocated</p>
              <p className="mt-0.5 text-data text-[1.5rem] font-medium text-ink">
                {num(total)} <span className="text-[1rem] text-muted">/ {num(target)}</span>
              </p>
            </div>
            <span
              className={cn(
                "rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium",
                balanced ? "bg-status-good-tint text-status-good" : "bg-status-warn-tint text-status-warn",
              )}
            >
              {balanced ? "Balanced" : diff > 0 ? `${num(diff)} still to place` : `${num(-diff)} over`}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
            <Button size="lg" block affordance={IconCheck} className="sm:flex-1" onClick={handleConfirm} disabled={!balanced}>
              Confirm allocation
            </Button>
            <Button size="lg" variant="ghost" block affordance={IconRefresh} className="sm:w-auto" onClick={() => setCounts(recMap)}>
              Use recommended
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
