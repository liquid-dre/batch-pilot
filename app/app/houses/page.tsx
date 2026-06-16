import {
  getAlerts,
  getHouses,
  getHouseStatus,
  getLatestDailyEntry,
  getLatestWeight,
  getPlacementForHouse,
  getPlannedBatch,
  getProjection,
  getSiteRollup,
} from "@/lib/data";
import { ross308At } from "@/lib/data/ross308";
import type { HouseView } from "@/lib/view";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { FlockStatus } from "@/components/flock/FlockStatus";

export default async function HousesPage() {
  const [houses, rollup, projection, alerts, plannedBatch] = await Promise.all([
    getHouses(),
    getSiteRollup(),
    getProjection(),
    getAlerts(),
    getPlannedBatch(),
  ]);

  const houseViews: HouseView[] = await Promise.all(
    houses.map(async (house): Promise<HouseView> => {
      const [placement, latest, weight, status] = await Promise.all([
        getPlacementForHouse(house.id),
        getLatestDailyEntry(house.id),
        getLatestWeight(house.id),
        getHouseStatus(house.id),
      ]);
      const vsRossPct = weight
        ? Math.round((weight.avgWeightG / ross308At(weight.day).weightG) * 100)
        : undefined;
      return { house, placement: placement!, latest, weight, status, vsRossPct };
    }),
  );

  return (
    <GrowerOnly>
      <FlockStatus rollup={rollup} projection={projection} alerts={alerts} houses={houseViews} plannedBatch={plannedBatch} />
    </GrowerOnly>
  );
}
