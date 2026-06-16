import { getHouses } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { HouseSetupForm } from "@/components/forms/HouseSetupForm";

export default async function HouseSetupPage() {
  const houses = await getHouses();
  return (
    <GrowerOnly>
      <HouseSetupForm houses={houses} />
    </GrowerOnly>
  );
}
