import type { EditRecord } from "@/lib/types";
import type { BatchArchiveRow, BatchHistory } from "@/lib/view";
import { shortDate } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";
import { HistoryView } from "@/components/history/HistoryView";
import { BatchHighlights } from "./BatchHighlights";

/**
 * Batch detail (opened from an archive row), three stacked sections:
 *   TITLE      — the batch number, with start–end dates as a subtitle.
 *   HIGHLIGHTS — a compact summary of the cycle's key results.
 *   DETAIL     — the full History & Charts view beneath, reused (not forked).
 * Closed batches are read-only; the live batch keeps the manager edit path.
 */
export function BatchDetailView({
  row,
  history,
  editLog,
}: {
  row: BatchArchiveRow;
  history: BatchHistory;
  editLog: EditRecord[];
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* TITLE */}
      <PageHeader
        back={{ href: "/app/batches", label: "Previous batches" }}
        eyebrow={`${row.status === "current" ? "Live batch" : "Closed batch"} · ${row.growOutDays} days`}
        title={row.title}
        intro={`${shortDate(row.placingDate)} – ${shortDate(row.killDate)}`}
      />

      {/* HIGHLIGHTS */}
      <BatchHighlights row={row} />

      {/* DETAIL — the full History & Charts view, reused */}
      <section className="space-y-4">
        <div>
          <h2 className="text-h2">History &amp; charts</h2>
          <p className="mt-1 max-w-prose text-body text-slate">
            The full cycle day by day — per house and batch level. Set a day range, pick houses, and jump to any day.
          </p>
        </div>
        <HistoryView data={history} editLog={editLog} embedded editable={row.status === "current"} />
      </section>
    </div>
  );
}
