import type { SiteRollup } from "@/lib/data";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { AnimatedNumber, type NumberFormat } from "@/components/ui/AnimatedNumber";

function Stat({ label, value, format, sub }: { label: string; value: number; format: NumberFormat; sub?: string }) {
  return (
    <div>
      <p className="text-label text-muted">{label}</p>
      <p className="mt-1 text-data text-[1.5rem] font-medium text-ink">
        <AnimatedNumber value={value} format={format} />
      </p>
      {sub ? <p className="text-[0.8125rem] text-muted">{sub}</p> : null}
    </div>
  );
}

/** The site-average block growers hand-tally every morning, computed for them. */
export function SiteRollupCard({ rollup }: { rollup: SiteRollup }) {
  return (
    <Card>
      <CardBody className="pt-5">
        <CardEyebrow>Site average · {rollup.houseCount} houses</CardEyebrow>
        <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Birds placed" value={rollup.placed} format="int" />
          <Stat label="On site" value={rollup.remaining} format="int" />
          <Stat label="Losses" value={rollup.cumMort} format="int" />
          <Stat label="Mortality" value={rollup.mortPct} format="pct" sub="cumulative" />
        </div>
      </CardBody>
    </Card>
  );
}
