import { getHouses, getLatestWeight, getPlacementForHouse } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { WeightsForm, type WeightFormHouse } from "@/components/forms/WeightsForm";
import { WeighConvex } from "@/components/flock/CaptureConvex";

export default async function WeightsPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <WeighConvex />
      </GrowerOnly>
    );
  }

  const houses = await getHouses();
  const formHouses: WeightFormHouse[] = await Promise.all(
    houses.map(async (house): Promise<WeightFormHouse> => {
      const [placement, weight] = await Promise.all([
        getPlacementForHouse(house.id),
        getLatestWeight(house.id),
      ]);
      return {
        id: house.id,
        name: house.name,
        day: placement?.dayCount ?? 0,
        lastWeightG: weight?.avgWeightG ?? 0,
      };
    }),
  );

  return (
    <GrowerOnly>
      <WeightsForm houses={formHouses} />
    </GrowerOnly>
  );
}
