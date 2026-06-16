import type { SiteRollup } from "@/lib/data";
import { num, pct } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-label text-muted">{label}</p>
      <p className="mt-1 text-data text-[1.5rem] font-medium text-ink">{value}</p>
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
          <Stat label="Birds placed" value={num(rollup.placed)} />
          <Stat label="On site" value={num(rollup.remaining)} />
          <Stat label="Losses" value={num(rollup.cumMort)} />
          <Stat label="Mortality" value={pct(rollup.mortPct)} sub="cumulative" />
        </div>
      </CardBody>
    </Card>
  );
}
