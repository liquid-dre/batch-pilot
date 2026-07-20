import type { BatchProjection } from "@/lib/types";
import { grams, shortDate } from "@/lib/format";
import { compactGap, vsBenchmark, type WeightCompareMode } from "@/lib/weightCompare";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

function countdown(days: number): { big: string; small: string } {
  if (days > 1) return { big: `${days} days`, small: "until the collection date" };
  if (days === 1) return { big: "Tomorrow", small: "is the collection date" };
  if (days === 0) return { big: "Today", small: "is the collection date" };
  return { big: `${Math.abs(days)} days ago`, small: "collection date has passed" };
}

/** Projection vs the contractor collection date: countdown + plain-language verdict. */
export function ProjectionCard({
  projection,
  compareMode = "difference",
}: {
  projection: BatchProjection;
  compareMode?: WeightCompareMode;
}) {
  const c = countdown(projection.daysToCollection);
  const gap = compactGap(vsBenchmark(projection.projectedAvgWeightG, projection.targetAvgWeightG), compareMode);
  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardEyebrow>Collection · {shortDate(projection.expectedCollectionDate)}</CardEyebrow>
            <p className="mt-2 text-display leading-none">{c.big}</p>
            <p className="mt-1 text-body text-muted">{c.small}</p>
          </div>
          <StatusPill level={projection.level} />
        </div>

        <p className="mt-4 text-body-l text-slate">{projection.verdict}</p>

        <div className="mt-4 flex items-center justify-between rounded-[var(--radius-control)] bg-paper p-4">
          <div>
            <p className="text-label text-muted">Projected average</p>
            <p className="mt-0.5 text-data text-[1.0625rem] text-ink">{grams(projection.projectedAvgWeightG)}</p>
          </div>
          <div className="text-right">
            <p className="text-label text-muted">Ross target</p>
            <p className="mt-0.5 text-data text-[1.0625rem] text-ink">{grams(projection.targetAvgWeightG)}</p>
            <p className="mt-0.5 text-label text-muted">{gap}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
