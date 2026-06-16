import { getGrowerDetail } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { GrowerDetail } from "@/components/contractor/GrowerDetail";

// In Next 16, dynamic route params are async. Only one site exists in the mock,
// so the id is accepted but the seam returns that grower's detail.
export default async function GrowerDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  await params;
  const detail = await getGrowerDetail();
  return (
    <ContractorOnly>
      <GrowerDetail data={detail} />
    </ContractorOnly>
  );
}
