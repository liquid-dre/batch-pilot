import { getBatchArchive } from "@/lib/data";
import { ManagerOnly } from "@/components/shell/ManagerOnly";
import { BatchArchiveView } from "@/components/batches/BatchArchiveView";

export default async function BatchesPage() {
  const data = await getBatchArchive();
  return (
    <ManagerOnly>
      <BatchArchiveView data={data} />
    </ManagerOnly>
  );
}
