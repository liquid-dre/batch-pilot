import { getBatchArchive } from "@/lib/data";
import { ManagerOnly } from "@/components/shell/ManagerOnly";
import { BatchArchiveView } from "@/components/batches/BatchArchiveView";
import { BatchArchiveConvex } from "@/components/batches/BatchArchiveConvex";

export default async function BatchesPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ManagerOnly>
        <BatchArchiveConvex />
      </ManagerOnly>
    );
  }

  const data = await getBatchArchive();
  return (
    <ManagerOnly>
      <BatchArchiveView data={data} />
    </ManagerOnly>
  );
}
