import type { BenchmarkOverlay, BenchmarkPoint } from "@/lib/types";
import type { WeightBandData } from "@/lib/view";
import { pct } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { PageHeader } from "@/components/shell/PageHeader";
import { WeightBandChart } from "@/components/charts/WeightBandChart";
import { BenchmarkChart, type ActualMarker } from "./BenchmarkChart";

interface BenchmarkViewProps {
  breed: string;
  curve: BenchmarkPoint[];
  overlay: BenchmarkOverlay;
  markers: ActualMarker[];
  killDay: number;
  weightBand: WeightBandData;
}

function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block size-2.5 rounded-full ${className}`} />;
}

export function BenchmarkView({ breed, curve, overlay, markers, killDay, weightBand }: BenchmarkViewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Benchmark"
        title={`${breed} objective`}
        intro="The breed weight curve with every house plotted against it, plus the contractor mortality and uniformity overlay."
      />

      {/* Hero: actual weight per house vs Ross, with the green/amber/red status band */}
      <Card>
        <CardBody className="pt-5">
          <CardEyebrow>Weight vs the status band</CardEyebrow>
          <p className="mt-2 mb-4 text-label text-muted">
            Shaded zones are the rule-based status bands (≥97% green · 90–97% amber · &lt;90% red of the Ross objective).
          </p>
          <WeightBandChart data={weightBand} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="pt-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-slate">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-0.5 w-6 rounded-full bg-brand-700" /> {breed} target (g)
            </span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-good" /> on track</span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-warn" /> at risk</span>
            <span className="inline-flex items-center gap-2"><LegendDot className="bg-status-bad" /> needs attention</span>
          </div>
          <BenchmarkChart curve={curve} markers={markers} killDay={killDay} />
          <p className="mt-2 text-label text-muted">
            Every house sits below the objective — the gap to the line is the under-performance the contractor is tracking.
          </p>
        </CardBody>
      </Card>

      {/* Contractor overlay bands */}
      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Mortality band · max cumulative</CardEyebrow>
            <ul className="mt-3 divide-y divide-divider">
              {overlay.mortalityBand.map((b) => (
                <li key={b.day} className="flex items-center justify-between py-2">
                  <span className="text-body text-slate">Day {b.day}</span>
                  <span className="text-data text-ink">≤ {pct(b.maxCumPct, 1)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Uniformity target · minimum</CardEyebrow>
            <ul className="mt-3 divide-y divide-divider">
              {overlay.uniformityTarget.map((u) => (
                <li key={u.day} className="flex items-center justify-between py-2">
                  <span className="text-body text-slate">Day {u.day}</span>
                  <span className="text-data text-ink">≥ {u.minPct}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
