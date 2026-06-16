import { getActiveBatch, getCatchingEvents, getManifest, getSite } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ScheduleView } from "@/components/contractor/ScheduleView";

export default async function SchedulePage() {
  const [events, manifest, site, batch] = await Promise.all([
    getCatchingEvents(),
    getManifest(),
    getSite(),
    getActiveBatch(),
  ]);
  return (
    <ContractorOnly>
      <ScheduleView events={events} manifest={manifest} siteName={site.name} cycleNo={batch.cycleNo} killDate={batch.killDate} />
    </ContractorOnly>
  );
}
