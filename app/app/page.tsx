import { getDashboardView, getPlannedBatch, getPortfolio, getSite } from "@/lib/data";
import { RoleHome } from "@/components/shell/RoleHome";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default async function Page() {
  // When Convex is connected, the home is the multi-tenant onboarding hub
  // (real per-account data). The mock demo dashboards below only run in the
  // no-backend prototype.
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <Onboarding />;
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
