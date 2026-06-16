"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { House, PlannedBatch } from "@/lib/types";
import { confirmAllocation, type Allocation, type AllocatedHouse } from "@/lib/data";
import { num, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shell/PageHeader";
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
  const { toast } = useToast();

  const recMap = useMemo(() => Object.fromEntries(recommended.map((r) => [r.houseId, r.count])), [recommended]);
  const [counts, setCounts] = useState<Record<string, number>>(recMap);
  const [confirmed, setConfirmed] = useState<AllocatedHouse[] | null>(null);

  const sumCap = houses.reduce((s, h) => s + h.capacity, 0);
  const total = houses.reduce((s, h) => s + (counts[h.id] ?? 0), 0);
  const target = planned.totalPlaced;
  const diff = target - total;
  const overCapacity = target > sumCap;
  const balanced = diff === 0;

  async function handleConfirm() {
    const result = await confirmAllocation(houses.map((h) => ({ houseId: h.id, count: counts[h.id] ?? 0 })));
    setConfirmed(result);
    toast("Cycle allocated", { tone: "success", description: `${num(total)} birds across ${result.length} houses.` });
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader eyebrow={`Cycle ${planned.cycleNo}`} title="Allocation confirmed" />
        <Alert tone="success" title={`${num(total)} birds placed across ${confirmed.length} houses`}>
          Placed {shortDate(planned.placingDate)}. Each house now has its own day-count and is ready for daily updates.
        </Alert>
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Per-house allocation</CardEyebrow>
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
        <Button size="lg" block onClick={() => router.push("/app/houses")}>
          See flock status
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
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
        <Alert tone="warning" title={`${num(target - sumCap)} birds over site capacity`} action={<Button size="sm" variant="secondary" onClick={() => router.push("/app/houses/setup")}>Edit houses</Button>}>
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
            <Button size="lg" block className="sm:flex-1" onClick={handleConfirm} disabled={!balanced}>
              Confirm allocation
            </Button>
            <Button size="lg" variant="ghost" block className="sm:w-auto" onClick={() => setCounts(recMap)}>
              Use recommended
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
