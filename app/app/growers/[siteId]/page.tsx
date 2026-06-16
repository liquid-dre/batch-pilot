import { getGrowerDetailById } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { GrowerDetail } from "@/components/contractor/GrowerDetail";

// Next 16 dynamic params are async. Murray Downs returns real per-house data;
// the other growers are generated from their profile (same view shape).
export default async function GrowerDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const detail = await getGrowerDetailById(siteId);
  return (
    <ContractorOnly>
      <GrowerDetail data={detail} />
    </ContractorOnly>
  );
}
