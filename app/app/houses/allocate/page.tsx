import { getHouses, getPlannedBatch, recommendAllocation } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { AllocationForm } from "@/components/forms/AllocationForm";
import { ScreenEmpty } from "@/components/shell/ScreenState";

export default async function AllocatePage() {
  // No Convex analog: a cycle is allocated per-house when it's started from the
  // setup flow (tenancy.startCycle), so there's no separate planned-batch step.
  // Kept reachable by URL with an honest pointer rather than the demo data.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <ScreenEmpty
          eyebrow="Setup"
          title="Allocate a cycle"
          heading="Cycles are started from your farm setup"
          body="Set your houses on the Houses screen, then start the cycle with per-house bird counts from Home — there's no separate allocation step."
        />
      </GrowerOnly>
    );
  }

  const [houses, planned] = await Promise.all([getHouses(), getPlannedBatch()]);
  const recommended = recommendAllocation(planned.totalPlaced, houses);
  return (
    <GrowerOnly>
      <AllocationForm planned={planned} houses={houses} recommended={recommended} />
    </GrowerOnly>
  );
}
