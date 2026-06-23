import { getBatchHistory, getEditLog } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HistoryView } from "@/components/history/HistoryView";

export default async function HistoryPage() {
  const [history, editLog] = await Promise.all([getBatchHistory(), getEditLog()]);
  return (
    <GrowerOnly>
      <HistoryView data={history} editLog={editLog} />
    </GrowerOnly>
  );
}
