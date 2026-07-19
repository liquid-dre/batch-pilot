import { getComparableBatches } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { CompareView } from "@/components/compare/CompareView";
import { CompareConvex } from "@/components/compare/CompareConvex";

export default async function ComparePage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <CompareConvex />
      </GrowerOnly>
    );
  }

  const data = await getComparableBatches();
  return (
    <GrowerOnly>
      <CompareView data={data} />
    </GrowerOnly>
  );
}
