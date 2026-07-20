import { getGrowerDetailById } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { GrowerDetail } from "@/components/contractor/GrowerDetail";
import { GrowerDetailConvex } from "@/components/contractor/GrowerDetailConvex";

// Next 16 dynamic params are async. Convex-connected: the drill-down reads the
// contractor's own farm (tenant-guarded by `growers.contractorGrowerDetail`).
// No backend: the mock seam — Murray Downs real data, others generated.
export default async function GrowerDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <GrowerDetailConvex siteId={siteId} />
      </ContractorOnly>
    );
  }

  const detail = await getGrowerDetailById(siteId);
  return (
    <ContractorOnly>
      <GrowerDetail data={detail} />
    </ContractorOnly>
  );
}
