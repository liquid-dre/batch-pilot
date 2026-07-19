import Link from "next/link";
import type { FlockAlert } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Alert } from "@/components/ui/Alert";

interface AlertsListProps {
  alerts: FlockAlert[];
  /** Show only the first N (the rest are summarised with a link). */
  limit?: number;
  /** Where "see all" points (the dedicated Alerts screen). */
  moreHref?: string;
  /** When provided, each alert gets a "Turn off" control that dismisses it. */
  onDismiss?: (alert: FlockAlert) => void;
}

/** Houses needing attention, each with a plain-language cause and fix. */
export function AlertsList({ alerts, limit, moreHref, onDismiss }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <Alert tone="success" title="Everything's on track">
        No houses need attention right now. New flags appear here the moment a metric crosses a band.
      </Alert>
    );
  }

  const shown = limit ? alerts.slice(0, limit) : alerts;
  const hidden = alerts.length - shown.length;

  return (
    <div className="space-y-3">
      {shown.map((alert) => {
        const { houseId, houseName, status } = alert;
        return (
        <Card key={houseId}>
          <CardBody className="space-y-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-h3">
                {houseName} · <span className="text-slate font-normal">{status.metric}</span>
              </p>
              <div className="flex items-center gap-2">
                <StatusPill level={status.level} size="sm" />
                {onDismiss ? (
                  <button
                    type="button"
                    onClick={() => onDismiss(alert)}
                    className="rounded-[var(--radius-pill)] border border-border px-2.5 py-1 text-label font-medium text-muted transition-colors duration-[var(--dur-fast)] hover:border-brand-500 hover:text-ink"
                  >
                    Turn off
                  </button>
                ) : null}
              </div>
            </div>
            <p className="text-body text-slate">{status.actualVsTarget}.</p>
            {status.fix ? (
              <p className="text-body">
                <span className="font-semibold text-ink">Do this: </span>
                <span className="text-slate">{status.fix}</span>
                {status.cause ? <span className="block text-label text-muted">Because: {status.cause}</span> : null}
              </p>
            ) : null}
          </CardBody>
        </Card>
        );
      })}
      {hidden > 0 && moreHref ? (
        <Link href={moreHref} className="inline-flex text-label font-semibold text-brand-600 underline-offset-4 hover:text-brand-600 hover:underline">
          See all {alerts.length} alerts →
        </Link>
      ) : null}
    </div>
  );
}
