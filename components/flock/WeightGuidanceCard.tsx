import type { WeightGuidance } from "@/lib/guidance";
import { formatGap, vsBenchmark, type WeightCompareMode } from "@/lib/weightCompare";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * Renders the constructive weight-gap framing (copy lives in lib/guidance.ts):
 * status + the gap + the likely cause + the next action. Calm by design — the
 * colour is carried by the pill, the card stays neutral, so a red metric reads
 * as guidance rather than an alarm. The precise gap is shown via the session
 * difference/percentage toggle ("89 g below target" ⇄ "6% below target").
 */
export function WeightGuidanceCard({
  guidance,
  actualG,
  targetG,
  compareMode = "difference",
}: {
  guidance: WeightGuidance;
  actualG: number;
  targetG: number;
  compareMode?: WeightCompareMode;
}) {
  const gapText = targetG ? formatGap(vsBenchmark(actualG, targetG), compareMode) : null;
  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-label font-semibold text-slate">What this means</p>
          <StatusPill level={guidance.level} label={guidance.status} size="sm" />
        </div>
        {gapText ? (
          <p className="mt-2.5 text-data text-[1.375rem] font-medium text-ink">{gapText}</p>
        ) : null}
        <p className="mt-1.5 max-w-prose text-body-l text-slate">{guidance.gap}</p>
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
