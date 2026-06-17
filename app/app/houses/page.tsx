import { getHouses } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HouseSetupForm } from "@/components/forms/HouseSetupForm";

/** Setup → Houses: the site's houses + capacities (the old flock-status content
 *  now lives on the Dashboard at /app). */
export default async function HousesPage() {
  const houses = await getHouses();
  return (
    <GrowerOnly>
      <HouseSetupForm houses={houses} />
    </GrowerOnly>
  );
}
