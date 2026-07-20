import { getContractorGrowers } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ContractorGrowersView } from "@/components/contractor/ContractorGrowersView";
import { ContractorGrowersConvex } from "@/components/contractor/ContractorGrowersConvex";

export default async function GrowersPage() {
  // Convex-connected: the ranked view reads the signed-in contractor's own farms
  // (scoped by `growers.contractorGrowers`). No backend: the mock demo seam,
  // gated by the demo role switcher — same convention as `app/app/page.tsx`.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <ContractorGrowersConvex />
      </ContractorOnly>
    );
  }

  const data = await getContractorGrowers();
  return (
    <ContractorOnly>
      <ContractorGrowersView data={data} />
    </ContractorOnly>
  );
}
