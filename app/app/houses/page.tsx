import { getHouses } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HouseSetupForm } from "@/components/forms/HouseSetupForm";
import { HousesConvex } from "@/components/flock/HousesConvex";

/** Setup → Houses: the site's houses + capacities (the old flock-status content
 *  now lives on the Dashboard at /app). */
export default async function HousesPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <HousesConvex />
      </GrowerOnly>
    );
  }

  const houses = await getHouses();
  return (
    <GrowerOnly>
      <HouseSetupForm houses={houses} />
    </GrowerOnly>
  );
}
