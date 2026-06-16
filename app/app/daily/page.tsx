import {
  DEMO_TODAY,
  getHouses,
  getLatestDailyEntry,
  getPlacementForHouse,
  getSiteRollup,
} from "@/lib/data";
import type { DailyFormData, FormHouse } from "@/lib/view";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { DailyUpdateForm } from "@/components/forms/DailyUpdateForm";

export default async function DailyPage() {
  const [houses, rollup] = await Promise.all([getHouses(), getSiteRollup()]);

  const formHouses: FormHouse[] = await Promise.all(
    houses.map(async (house): Promise<FormHouse> => {
      const [placement, latest] = await Promise.all([
        getPlacementForHouse(house.id),
        getLatestDailyEntry(house.id),
      ]);
      return {
        id: house.id,
        name: house.name,
        placedCount: placement?.placedCount ?? 0,
        nextDay: (latest?.day ?? 0) + 1,
        priorCumMort: latest?.cumMort ?? 0,
        lastFeedKg: latest?.feedAddedKg ?? 0,
      };
    }),
  );

  const data: DailyFormData = {
    houses: formHouses,
    sitePlaced: rollup.placed,
    siteCumMort: rollup.cumMort,
    today: DEMO_TODAY,
  };

  return (
    <GrowerOnly>
      <DailyUpdateForm data={data} />
    </GrowerOnly>
  );
}
