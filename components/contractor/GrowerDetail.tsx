import type { GrowerDetailData, SettlementView } from "@/lib/view";
import { num, pct, grams, shortDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { EstTag, EstFootnote } from "@/components/ui/Estimated";
import { PageHeader } from "@/components/shell/PageHeader";
import { SiteRollupCard } from "@/components/flock/SiteRollupCard";
import { GrowerTrends } from "./GrowerTrends";
import { Sparkline } from "./Sparkline";

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className="mt-0.5 text-data text-ink">
        {value}
        {sub ? <span className="ml-1 text-muted">{sub}</span> : null}
      </p>
    </div>
  );
}

const money = (n?: number) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

/** Grower margin from the linked contract (revenue − chick & feed inputs, FOC-aware). */
function SettlementCard({ s }: { s: SettlementView }) {
  return (
    <Card>
      <CardBody className="space-y-4 pt-5">
        <div className="flex items-center justify-between">
          <CardEyebrow>Settlement{s.estimated ? " · projected" : ""}</CardEyebrow>
          <span className="text-label text-muted">{s.focPct}% FOC</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label text-muted">Grower margin</p>
            <p className={cn("text-data text-[1.75rem] font-medium", (s.margin ?? 0) >= 0 ? "text-status-good" : "text-status-bad")}>
              {money(s.margin)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-label sm:grid-cols-4">
            <Metric label="Collected" value={`${num(s.collectedKg ?? 0)} kg`} />
            <Metric label="Revenue" value={money(s.revenue)} />
            <Metric label="Chicks" value={`−${money(s.chickCost)}`} />
            <Metric label="Feed" value={`−${money(s.feedCost)}`} />
          </dl>
        </div>
        {s.estimated ? (
          <p className="text-label text-muted">
            Projected from current weight × birds remaining; finalises once collection weights are recorded.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function GrowerDetail({ data }: { data: GrowerDetailData }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        back={{ href: "/app/growers", label: "Growers" }}
        eyebrow={`${data.farmCode}/0${data.cycleNo} · ${data.breed}`}
        title={data.siteName}
        intro={`Per-house detail and trends for cycle ${data.cycleNo}, against a collection date of ${shortDate(data.expectedCollectionDate)}.`}
      />

      <SiteRollupCard rollup={data.rollup} />

      {data.settlement?.contractLinked ? <SettlementCard s={data.settlement} /> : null}

      {/* Per-house detail + trends */}
      <section className="space-y-4">
        <h2 className="text-h2">Houses</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.houses.map((h) => (
            <Card key={h.houseId} as="article">
              <CardBody className="space-y-4 pt-5">
                <div className="flex items-center justify-between">
                  <CardEyebrow>{h.houseName} · Day {h.day}</CardEyebrow>
                  {h.status ? <StatusPill level={h.status.level} size="sm" /> : null}
                </div>
                <dl className="grid grid-cols-3 gap-3">
                  <Metric label="On site" value={num(h.remaining)} />
                  <Metric label="Mortality" value={pct(h.cumPct)} />
                  <Metric label="Weight" value={h.avgWeightG ? grams(h.avgWeightG) : "—"} sub={h.vsRossPct ? `${h.vsRossPct}%` : undefined} />
                </dl>
                <div className="flex items-end justify-between gap-4 rounded-[var(--radius-control)] bg-paper p-3">
                  <div>
                    <p className="text-label text-muted">Daily mortality</p>
                    <p className="text-[0.75rem] text-hint">last {h.mortSeries.length} days</p>
                  </div>
                  <Sparkline values={h.mortSeries} className="text-status-warn" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Per-day trends across the houses (same depth for every grower) */}
      <section className="space-y-3">
        <h2 className="text-h2">Trends</h2>
        <GrowerTrends houses={data.houses} />
      </section>

      {/* Track record — closed cycles on this site */}
      <section className="space-y-3">
        <h2 className="text-h2">Track record</h2>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH>Cycle</TH>
              <TH>Closed</TH>
              <TH num>Final weight</TH>
              <TH num>Mortality</TH>
              <TH num>EPEF<EstTag /></TH>
            </TR>
          </THead>
          <TBody>
            {data.pastCycles.map((c) => (
              <TR key={c.cycleNo}>
                <TD className="font-medium text-ink">Cycle {c.cycleNo}</TD>
                <TD>{shortDate(c.expectedCollectionDate)}</TD>
                <TD num>{grams(c.finalAvgWeightG)}</TD>
                <TD num>{pct(c.mortalityPct)}</TD>
                <TD num className="font-semibold text-ink">{c.epef}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <EstFootnote />
      </section>
    </div>
  );
}
