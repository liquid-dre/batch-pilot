import Link from "next/link";
import type { BatchProjection, FlockAlert, PlannedBatch } from "@/lib/types";
import type { HouseView } from "@/lib/view";
import type { SiteRollup } from "@/lib/data";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProjectionCard } from "./ProjectionCard";
import { AlertsList } from "./AlertsList";
import { SiteRollupCard } from "./SiteRollupCard";
import { HouseStatusCard } from "./HouseStatusCard";

interface FlockStatusProps {
  rollup: SiteRollup;
  projection: BatchProjection;
  alerts: FlockAlert[];
  houses: HouseView[];
  /** A next cycle awaiting per-house allocation, if any. */
  plannedBatch?: PlannedBatch;
}

/** Grower flock-status screen: what now (projection + alerts) before the detail. */
export function FlockStatus({ rollup, projection, alerts, houses, plannedBatch }: FlockStatusProps) {
  const needsAllocation = plannedBatch && !plannedBatch.allocated;
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Flock status"
        title="How the flock is doing"
        intro="The headline first: will the birds hit target by the kill date, and which houses need a hand today."
        action={
          <Link
            href="/app/houses/setup"
            className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-brand-100 bg-brand-50 px-5 text-label font-semibold text-brand-700 transition-colors duration-[var(--dur-fast)] hover:bg-brand-100"
          >
            Manage houses
          </Link>
        }
      />

      {needsAllocation ? (
        <Alert
          tone="info"
          title={`Cycle ${plannedBatch!.cycleNo} is ready to allocate`}
          action={
            <Link href="/app/houses/allocate">
              <Button size="sm">Allocate</Button>
            </Link>
          }
        >
          {`${num(plannedBatch!.totalPlaced)} birds to split across the houses. We'll suggest a distribution.`}
        </Alert>
      ) : null}

      <ProjectionCard projection={projection} />

      <section className="space-y-3">
        <h2 className="text-h2">Needs attention</h2>
        <AlertsList alerts={alerts} />
      </section>

      <SiteRollupCard rollup={rollup} />

      <section className="space-y-4">
        <h2 className="text-h2">Every house</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((view) => (
            <HouseStatusCard key={view.house.id} view={view} />
          ))}
        </div>
      </section>
    </div>
  );
}
