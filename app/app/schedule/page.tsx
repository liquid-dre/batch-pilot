import { getActiveBatch, getCatchingEvents, getManifest, getSite } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ScheduleView } from "@/components/contractor/ScheduleView";
import { ScheduleConvex } from "@/components/contractor/ScheduleConvex";

export default async function SchedulePage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <ScheduleConvex />
      </ContractorOnly>
    );
  }

  const [events, manifest, site, batch] = await Promise.all([
    getCatchingEvents(),
    getManifest(),
    getSite(),
    getActiveBatch(),
  ]);
  return (
    <ContractorOnly>
      <ScheduleView events={events} manifest={manifest} siteName={site.name} cycleNo={batch.cycleNo} expectedCollectionDate={batch.expectedCollectionDate} />
    </ContractorOnly>
  );
}
