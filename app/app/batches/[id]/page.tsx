import { notFound } from "next/navigation";
import { getArchivedBatchHistory, getBatchArchiveRow, getEditLog } from "@/lib/data";
import { ManagerOnly } from "@/components/shell/ManagerOnly";
import { BatchDetailView } from "@/components/batches/BatchDetailView";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, history, editLog] = await Promise.all([
    getBatchArchiveRow(id),
    getArchivedBatchHistory(id),
    getEditLog(),
  ]);
  if (!row || !history) notFound();
  return (
    <ManagerOnly>
      <BatchDetailView row={row} history={history} editLog={editLog} />
    </ManagerOnly>
  );
}
