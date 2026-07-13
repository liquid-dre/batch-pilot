import { Landing } from "@/components/marketing/Landing";
import { getWeightBandData } from "@/lib/data";

export default async function HomePage() {
  // Plain mock data (no Convex) for the landing's "catch it early" chart.
  const benchmarkData = await getWeightBandData();
  return <Landing benchmarkData={benchmarkData} />;
}
