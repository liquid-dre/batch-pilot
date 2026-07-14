import Link from "next/link";
import type { YesterdayEntry } from "@/lib/view";
import { kg, num } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArrowRight } from "@/components/icons";

/**
 * Previous day's entries — a clear, read-only review of what was captured
 * yesterday, one row per house. The manager variant adds a "Correct →" jump to
 * the maker-checker edit in History; the supervisor's rows are read-only.
 */
export function PreviousDayEntries({
  entries,
  variant,
  historyHref = "/app/history",
}: {
  entries: YesterdayEntry[];
  variant: "supervisor" | "manager";
  historyHref?: string;
}) {
  const dayLow = entries.length ? Math.min(...entries.map((e) => e.day)) : 0;
  const dayHigh = entries.length ? Math.max(...entries.map((e) => e.day)) : 0;
  const dayLabel = dayLow === dayHigh ? `day ${dayLow}` : `day ${dayLow}–${dayHigh}`;

  return (
    <section className="space-y-3">
      <h2 className="text-h3">Yesterday&apos;s entries {entries.length ? <span className="text-body text-muted">· {dayLabel}</span> : null}</h2>
      {entries.length === 0 ? (
        <EmptyState title="No entries yet" body="Once a round has been recorded, yesterday's numbers show here per house." />
      ) : (
        <Card>
          <CardBody className="divide-y divide-divider p-0">
            {entries.map((e) => (
              <div key={e.houseId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink">{e.houseName}</p>
                  <p className="text-label text-slate tabular-nums">
                    {num(e.mortality)} lost · {num(e.culls)} culls · {kg(e.feedAddedKg)} feed
                  </p>
                </div>
                {variant === "manager" ? (
                  <Link
                    href={historyHref}
                    className="inline-flex shrink-0 items-center gap-1 text-label font-medium text-brand-600 hover:text-brand-600"
                  >
                    Correct
                    <IconArrowRight className="size-3.5" />
                  </Link>
                ) : (
                  <span className="shrink-0 text-label text-muted tabular-nums">{num(e.birdsRemaining)} left</span>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </section>
  );
}
