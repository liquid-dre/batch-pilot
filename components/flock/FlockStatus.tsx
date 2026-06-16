import type { BatchProjection, FlockAlert } from "@/lib/types";
import type { HouseView } from "@/lib/view";
import type { SiteRollup } from "@/lib/data";
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
}

/** Grower flock-status screen: what now (projection + alerts) before the detail. */
export function FlockStatus({ rollup, projection, alerts, houses }: FlockStatusProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Flock status"
        title="How the flock is doing"
        intro="The headline first: will the birds hit target by the kill date, and which houses need a hand today."
      />

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
