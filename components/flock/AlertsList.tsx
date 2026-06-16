import type { FlockAlert } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Alert } from "@/components/ui/Alert";

/** Houses needing attention, each with a plain-language cause and fix. */
export function AlertsList({ alerts }: { alerts: FlockAlert[] }) {
  if (alerts.length === 0) {
    return <Alert tone="success" title="Everything's on track">No houses need attention right now.</Alert>;
  }

  return (
    <div className="space-y-3">
      {alerts.map(({ houseId, houseName, status }) => (
        <Card key={houseId}>
          <CardBody className="space-y-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-h3">
                {houseName} · <span className="text-slate font-normal">{status.metric}</span>
              </p>
              <StatusPill level={status.level} size="sm" />
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
      ))}
    </div>
  );
}
