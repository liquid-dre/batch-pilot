import type { BatchArchiveData } from "@/lib/view";
import { PageHeader } from "@/components/shell/PageHeader";
import { PreviousBatchesTable } from "./PreviousBatchesTable";

/** Previous Batches archive — the manager's interactive index of every cycle. */
export function BatchArchiveView({ data }: { data: BatchArchiveData }) {
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Archive"
        title="Previous batches"
        intro="Every cycle on this site. Filter any column, drag the headers to reorder them, and open a batch to see its full history. Your column order and filters are kept for this browser session."
      />
      <PreviousBatchesTable rows={data.rows} />
    </div>
  );
}
