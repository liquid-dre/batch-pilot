import type { BatchArchiveRow } from "@/lib/view";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { AnimatedNumber, type NumberFormat } from "@/components/ui/AnimatedNumber";
import { EstTag } from "@/components/ui/Estimated";
import { cn } from "@/lib/cn";

/** One scannable hero stat. A numeric `value` animates up on mount; a node renders as-is. */
function Stat({
  label,
  value,
  format,
  sub,
  est,
  tone,
}: {
  label: string;
  value: number | React.ReactNode;
  format?: NumberFormat;
  sub?: React.ReactNode;
  est?: boolean;
  tone?: string;
}) {
  return (
    <Card>
      <CardBody className="pt-5">
        <CardEyebrow className="flex items-center">
          {label}
          {est ? <EstTag /> : null}
        </CardEyebrow>
        <p className={cn("mt-2 font-mono text-[1.5rem] font-semibold leading-tight tabular-nums", tone ?? "text-ink")}>
          {typeof value === "number" ? <AnimatedNumber value={value} format={format} /> : value}
        </p>
        {sub ? <div className="mt-1 text-label text-muted">{sub}</div> : null}
      </CardBody>
    </Card>
  );
}

function collectionLabel(days: number): { label: string; tone: string } {
  if (days < 0) return { label: `${Math.abs(days)}d ahead`, tone: "text-status-good" };
  if (days === 0) return { label: "On the date", tone: "text-status-good" };
  if (days <= 3) return { label: `${days}d over`, tone: "text-status-warn" };
  return { label: `${days}d over`, tone: "text-status-bad" };
}

/**
 * The HIGHLIGHTS section of the batch detail page: a compact, scannable summary
 * of the cycle's key results above the full History & Charts detail.
 */
export function BatchHighlights({ row }: { row: BatchArchiveRow }) {
  const collection = collectionLabel(row.readyVsCollectionDays);
  const vsRossTone = row.level === "green" ? "text-status-good" : row.level === "amber" ? "text-status-warn" : "text-status-bad";

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Stat
        label="Total mortality"
        value={row.totalMortality}
        format="int"
        sub={<>{row.cumMortPct.toFixed(2)}% cumulative</>}
      />
      <Stat
        label="Final weight"
        value={row.finalWeightG}
        format="grams"
        sub={row.status === "current" ? "latest weigh-in" : "collected"}
      />
      <Stat label="FCR" value={row.fcr.toFixed(2)} est sub="feed conversion ratio" />
      <Stat label="EPEF" value={row.epef} format="int" est sub="production efficiency factor" />
      <Stat label="Feed used" value={row.feedUsedKg} format="kg" sub={<>over {row.growOutDays} days</>} />
      <Stat
        label="Vaccinations"
        value={row.vaccineCount}
        format="int"
        sub={row.vaccineNames.length ? row.vaccineNames.join(" · ") : "none recorded"}
      />
      <Stat
        label="vs Ross 308"
        value={`${row.vsRossPct}%`}
        tone={vsRossTone}
        // The live-trajectory pill (On track / At risk …) only fits a batch still
        // on the floor; a closed cycle just shows its final result.
        sub={row.status === "current" ? <StatusPill level={row.level} size="sm" /> : "of the Ross 308 target"}
      />
      <Stat
        label="vs collection"
        value={<span className={collection.tone}>{collection.label}</span>}
        sub="reached target weight"
      />
    </div>
  );
}
