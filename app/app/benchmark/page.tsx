import { getActiveBatch, getBenchmark, getPlacements, getPortfolio, getWeightBandData } from "@/lib/data";
import { daysBetween } from "@/lib/format";
import type { ActualMarker } from "@/components/contractor/BenchmarkChart";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { BenchmarkView } from "@/components/contractor/BenchmarkView";
import { BenchmarkConvex } from "@/components/contractor/BenchmarkConvex";

export default async function BenchmarkPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ContractorOnly>
        <BenchmarkConvex />
      </ContractorOnly>
    );
  }

  const [benchmark, batch, placements, portfolio, weightBand] = await Promise.all([
    getBenchmark(),
    getActiveBatch(),
    getPlacements(),
    getPortfolio(),
    getWeightBandData(),
  ]);

  const collectionDay = placements[0] ? daysBetween(placements[0].placementDate, batch.expectedCollectionDate) : 31;
  const markers: ActualMarker[] = portfolio.rows
    .filter((r) => r.avgWeightG > 0)
    .map((r) => ({ day: r.day, weightG: r.avgWeightG, level: r.level, label: r.houseName }));

  return (
    <ContractorOnly>
      <BenchmarkView breed={batch.breed} curve={benchmark.curve} overlay={benchmark.overlay} markers={markers} collectionDay={collectionDay} weightBand={weightBand} />
    </ContractorOnly>
  );
}
