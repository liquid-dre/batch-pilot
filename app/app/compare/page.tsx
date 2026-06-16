import { getComparableBatches } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { CompareView } from "@/components/compare/CompareView";

export default async function ComparePage() {
  const data = await getComparableBatches();
  return (
    <GrowerOnly>
      <CompareView data={data} />
    </GrowerOnly>
  );
}
