import { getDashboardView, getPlannedBatch, getPortfolio, getSite } from "@/lib/data";
import { RoleHome } from "@/components/shell/RoleHome";
import { ConvexHome } from "@/components/shell/ConvexHome";

export default async function Page() {
  // When Convex is connected, the home is per-tenant real data: the contractor's
  // farm-management hub, or the grower's Dashboard (setup hub until their cycle
  // starts). The mock demo dashboards below only run in the no-backend prototype.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexHome />;
  }

  // Both role dashboards render the one shared bundle; RoleHome picks by role.
  const [dashboard, plannedBatch, portfolio, site] = await Promise.all([
    getDashboardView(),
    getPlannedBatch(),
    getPortfolio(),
    getSite(),
  ]);

  return <RoleHome dashboard={dashboard} plannedBatch={plannedBatch} contractor={{ data: portfolio, siteId: site.id }} />;
}
