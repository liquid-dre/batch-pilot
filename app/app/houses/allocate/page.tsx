import { getHouses, getPlannedBatch, recommendAllocation } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { AllocationForm } from "@/components/forms/AllocationForm";

export default async function AllocatePage() {
  const [houses, planned] = await Promise.all([getHouses(), getPlannedBatch()]);
  const recommended = recommendAllocation(planned.totalPlaced, houses);
  return (
    <GrowerOnly>
      <AllocationForm planned={planned} houses={houses} recommended={recommended} />
    </GrowerOnly>
  );
}
