import { getHouses } from "@/lib/data";
import { ManagerOnly } from "@/components/shell/ManagerOnly";
import { HouseSetupForm } from "@/components/forms/HouseSetupForm";
import { CycleSetupConvex } from "@/components/flock/CycleSetupConvex";

/** Setup → Set up cycle: houses + capacities and placing birds against the
 *  contractor's cycle, on one page. Manager-only — the foreman captures, the
 *  manager provisions the farm (the flock-status content lives on the Dashboard
 *  at /app). */
export default async function HousesPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ManagerOnly>
        <CycleSetupConvex />
      </ManagerOnly>
    );
  }

  const houses = await getHouses();
  return (
    <ManagerOnly>
      <HouseSetupForm houses={houses} />
    </ManagerOnly>
  );
}
