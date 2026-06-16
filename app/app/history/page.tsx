import { getBatchHistory } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HistoryView } from "@/components/history/HistoryView";

export default async function HistoryPage() {
  const history = await getBatchHistory();
  return (
    <GrowerOnly>
      <HistoryView data={history} />
    </GrowerOnly>
  );
}
