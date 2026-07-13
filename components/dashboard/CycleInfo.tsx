import type { DashboardCycleInfo } from "@/lib/view";
import { shortDate } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Cycle info at the top of both dashboards: cycle number + breed, the current
 * day of cycle (a per-house range while placings are staggered), and the key
 * dates with a plain countdown to the kill date. Pure/presentational.
 */
function countdown(days: number): string {
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  return `${-days} day${days === -1 ? "" : "s"} ago`;
}

export function CycleInfo({ cycle }: { cycle: DashboardCycleInfo }) {
  const dayLabel = cycle.dayLow === cycle.dayHigh ? `Day ${cycle.dayLow}` : `Day ${cycle.dayLow}–${cycle.dayHigh}`;
  return (
    <Card className="animate-rise">
      <CardBody className="space-y-4 pt-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono">
          {cycle.siteName} · Cycle {cycle.cycleNo} · {cycle.breed}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-display leading-none">{dayLabel}</span>
          <span className="text-body text-muted">of the cycle</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-divider pt-4">
          <div>
            <dt className="text-label text-muted">Placed</dt>
            <dd className="mt-0.5 text-data text-[0.9375rem] tabular-nums text-ink">{shortDate(cycle.placingDate)}</dd>
          </div>
          <div>
            <dt className="text-label text-muted">Kill date</dt>
            <dd className="mt-0.5 text-data text-[0.9375rem] tabular-nums text-ink">
              {shortDate(cycle.killDate)} · <span className="text-slate">{countdown(cycle.daysToKill)}</span>
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
