"use client";

import { useRouter } from "next/navigation";
import type { DashboardView } from "@/lib/view";
import type { PlannedBatch } from "@/lib/types";
import { useConfirmedAllocation } from "@/lib/allocationStore";
import { num, shortDate } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CycleInfo } from "@/components/dashboard/CycleInfo";
import { OnTrackCards } from "@/components/dashboard/OnTrackCards";
import { PreviousDayEntries } from "@/components/dashboard/PreviousDayEntries";
import { ProjectionChart } from "@/components/dashboard/ProjectionChart";

/**
 * The manager's oversight dashboard — the shared structure at full depth: cycle
 * info → on-track cards (with the engine's cause + fix and drill-down links) →
 * yesterday's entries (with a correction jump) → weight projection (with a
 * per-house toggle). No capture CTA — the manager reviews, the supervisor
 * captures. A new-cycle allocation prompt sits at the top when one is pending.
 */
export function GrowerDashboard({ data, plannedBatch }: { data: DashboardView; plannedBatch?: PlannedBatch }) {
  const router = useRouter();
  const [confirmed] = useConfirmedAllocation(plannedBatch?.id ?? "none");
  const needsAllocation = Boolean(plannedBatch && !plannedBatch.allocated && !confirmed);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      {needsAllocation && plannedBatch ? (
        <Alert
          tone="info"
          title="A new cycle is ready to place"
          action={
            <Button size="sm" variant="secondary" onClick={() => router.push("/app/houses/allocate")}>
              Allocate
            </Button>
          }
        >
          Cycle {plannedBatch.cycleNo} · {num(plannedBatch.totalPlaced)} birds, placed {shortDate(plannedBatch.placementDate)}. Split them across the houses to start daily capture.
        </Alert>
      ) : null}

      <CycleInfo cycle={data.cycle} />
      <OnTrackCards metrics={data.metrics} variant="manager" />
      <PreviousDayEntries entries={data.yesterday} variant="manager" />
      <ProjectionChart projection={data.projection} variant="manager" />
    </div>
  );
}
