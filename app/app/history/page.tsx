import { getBatchHistory, getEditLog } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HistoryView } from "@/components/history/HistoryView";
import { HistoryConvex } from "@/components/history/HistoryConvex";

export default async function HistoryPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <HistoryConvex />
      </GrowerOnly>
    );
  }

  const [history, editLog] = await Promise.all([getBatchHistory(), getEditLog()]);
  return (
    <GrowerOnly>
      <HistoryView data={history} editLog={editLog} />
    </GrowerOnly>
  );
}
