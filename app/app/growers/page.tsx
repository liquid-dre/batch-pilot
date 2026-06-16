import { getContractorGrowers } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ContractorGrowersView } from "@/components/contractor/ContractorGrowersView";

export default async function GrowersPage() {
  // Scoped to the demo contractor (Irvine's). The seam enforces tenant
  // isolation — Drummonds' grower never appears here.
  const data = await getContractorGrowers();
  return (
    <ContractorOnly>
      <ContractorGrowersView data={data} />
    </ContractorOnly>
  );
}
