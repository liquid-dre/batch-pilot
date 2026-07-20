import { getContractorGrowers } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ContractorGrowersView } from "@/components/contractor/ContractorGrowersView";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default async function GrowersPage() {
  // Convex-connected: Growers is the contractor's management screen — add farms,
  // invite managers, schedule cycles (the ranked performance view is now the
  // Overview at /app). No backend: the mock demo ranked view.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <Onboarding />
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
