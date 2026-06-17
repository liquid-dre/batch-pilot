import type { WeightGuidance } from "@/lib/guidance";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * Renders the constructive weight-gap framing (copy lives in lib/guidance.ts):
 * status + the gap in plain words + the likely cause + the next action. Calm by
 * design — the colour is carried by the pill, the card stays neutral, so a red
 * metric reads as guidance rather than an alarm.
 */
export function WeightGuidanceCard({ guidance }: { guidance: WeightGuidance }) {
  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-label font-semibold text-slate">What this means</p>
          <StatusPill level={guidance.level} label={guidance.status} size="sm" />
        </div>
        <p className="mt-2.5 max-w-prose text-body-l text-ink">{guidance.gap}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-label font-medium text-muted">Likely cause</dt>
            <dd className="mt-1 text-body text-slate">{guidance.cause}</dd>
          </div>
          <div>
            <dt className="text-label font-medium text-muted">Do this</dt>
            <dd className="mt-1 text-body text-slate">{guidance.action}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
