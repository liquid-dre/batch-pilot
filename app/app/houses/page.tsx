import {
  getAlerts,
  getHouseDiagnostics,
  getHouses,
  getHouseStatus,
  getLatestDailyEntry,
  getLatestWeight,
  getPlacementForHouse,
  getPlannedBatch,
  getProjection,
  getSiteRollup,
  getWeightBandData,
} from "@/lib/data";
import { ross308At } from "@/lib/data/ross308";
import type { HouseView } from "@/lib/view";
import type { HouseEfficiency } from "@/components/flock/EfficiencyPanel";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { FlockStatus } from "@/components/flock/FlockStatus";

export default async function HousesPage() {
  const [houses, rollup, projection, alerts, plannedBatch, weightBand] = await Promise.all([
    getHouses(),
    getSiteRollup(),
    getProjection(),
    getAlerts(),
    getPlannedBatch(),
    getWeightBandData(),
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

  const efficiency: HouseEfficiency[] = await Promise.all(
    houses.map(async (house): Promise<HouseEfficiency> => {
      const { metrics } = await getHouseDiagnostics(house.id);
      return {
        houseId: house.id,
        houseName: house.name,
        fcr: metrics.find((m) => m.key === "fcr"),
        feed: metrics.find((m) => m.key === "feed"),
      };
    }),
  );

  return (
    <GrowerOnly>
      <FlockStatus
        rollup={rollup}
        projection={projection}
        alerts={alerts}
        houses={houseViews}
        weightBand={weightBand}
        efficiency={efficiency}
        plannedBatch={plannedBatch}
      />
    </GrowerOnly>
  );
}
