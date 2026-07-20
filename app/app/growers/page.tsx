import { getContractorGrowers } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ContractorGrowersView } from "@/components/contractor/ContractorGrowersView";
import { ContractorGrowerCards } from "@/components/contractor/ContractorGrowerCards";

export default async function GrowersPage() {
  // Convex-connected: Growers is the contractor's list of onboarded farms — one
  // card each, with "Schedule cycle" (deep-links to /app/growers/schedule) and a
  // click-through to the drill-down. Adding a farm + scheduling live on their own
  // pages under the Growers nav group. No backend: the mock demo ranked view.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <ContractorGrowerCards />
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
