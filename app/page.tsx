import {
  getActiveBatch,
  getCatchingEvents,
  getContractor,
  getFeedDeliveries,
  getHouses,
  getHouseStatus,
  getLatestDailyEntry,
  getLatestWeight,
  getPlacementForHouse,
  getSite,
  getSiteRollup,
  DEMO_TODAY,
} from "@/lib/data";
import { ross308At } from "@/lib/data/ross308";
import { daysBetween } from "@/lib/format";
import type { DashboardData, HouseView } from "@/lib/view";
import { Dashboard } from "@/components/shell/Dashboard";

export default async function Page() {
  // Assemble everything through the data seam (these become Convex queries).
  const [site, contractor, batch, rollup, houses, feed, catching] = await Promise.all([
    getSite(),
    getContractor(),
    getActiveBatch(),
    getSiteRollup(),
    getHouses(),
    getFeedDeliveries(),
    getCatchingEvents(),
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

  const data: DashboardData = {
    site,
    contractor,
    batch,
    rollup,
    houses: houseViews,
    feed,
    catching,
    killCountdownDays: daysBetween(DEMO_TODAY, batch.killDate),
  };

  return <Dashboard data={data} />;
}
