import {
  getActiveBatch,
  getAlerts,
  getCatchingEvents,
  getContractor,
  getFeedDeliveries,
  getHouseDiagnostics,
  getHouses,
  getHouseStatus,
  getLatestDailyEntry,
  getLatestWeight,
  getPlacementForHouse,
  getPlannedBatch,
  getPortfolio,
  getProjection,
  getSite,
  getSiteRollup,
  getWeightBandData,
  DEMO_TODAY,
} from "@/lib/data";
import { ross308At } from "@/lib/data/ross308";
import { daysBetween } from "@/lib/format";
import type { DashboardData, HouseView } from "@/lib/view";
import type { GrowerDashboardData } from "@/components/flock/GrowerDashboard";
import type { HouseEfficiency } from "@/components/flock/EfficiencyPanel";
import { RoleHome } from "@/components/shell/RoleHome";

export default async function Page() {
  // The home assembles both role bundles; RoleHome picks by the active role.
  const [site, contractor, batch, rollup, houses, feed, catching, projection, alerts, weightBand, plannedBatch, portfolio] =
    await Promise.all([
      getSite(),
      getContractor(),
      getActiveBatch(),
      getSiteRollup(),
      getHouses(),
      getFeedDeliveries(),
      getCatchingEvents(),
      getProjection(),
      getAlerts(),
      getWeightBandData(),
      getPlannedBatch(),
      getPortfolio(),
    ]);

  const houseViews: HouseView[] = await Promise.all(
    houses.map(async (house): Promise<HouseView> => {
      const [placement, latest, weight, status] = await Promise.all([
        getPlacementForHouse(house.id),
        getLatestDailyEntry(house.id),
        getLatestWeight(house.id),
        getHouseStatus(house.id),
      ]);
      const vsRossPct = weight ? Math.round((weight.avgWeightG / ross308At(weight.day).weightG) * 100) : undefined;
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

  const overview: DashboardData = {
    site,
    contractor,
    batch,
    rollup,
    houses: houseViews,
    feed,
    catching,
    killCountdownDays: daysBetween(DEMO_TODAY, batch.killDate),
  };

  const grower: GrowerDashboardData = { overview, projection, alerts, houseViews, weightBand, efficiency, plannedBatch };

  return <RoleHome grower={grower} contractor={{ data: portfolio, siteId: site.id }} today={DEMO_TODAY} />;
}
