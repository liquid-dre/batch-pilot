"use client";

import type { DashboardData } from "@/lib/view";
import { num, pct, grams, kg } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className="mt-0.5 text-data text-[1.0625rem] text-ink">{value}</p>
    </div>
  );
}

function countdownLabel(days: number): string {
  if (days > 1) return `${days} days`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return `${Math.abs(days)}d ago`;
}

export function ContractorOverview({ data }: { data: DashboardData }) {
  const { toast } = useToast();
  const { site, contractor, rollup, houses, feed, catching } = data;

  const delivery = feed[0];
  const nominalKg = delivery ? delivery.bagSizeKg * delivery.bagCount : 0;
  const shortfallKg = delivery ? nominalKg - delivery.netWeightKg : 0;
  const shortfallPct = delivery && nominalKg ? (shortfallKg / nominalKg) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Header + dense summary strip */}
      <section className="animate-rise">
        <CardEyebrow>{contractor.name} · Portfolio</CardEyebrow>
        <h1 className="mt-2 text-h1">Active flocks</h1>
        <Card className="mt-4">
          <CardBody className="grid grid-cols-2 gap-5 pt-5 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryStat label="Active batches" value="1" />
            <SummaryStat label="Houses" value={String(rollup.houseCount)} />
            <SummaryStat label="Birds on site" value={num(rollup.remaining)} />
            <SummaryStat label="Avg mortality" value={pct(rollup.mortPct)} />
            <SummaryStat label="To kill date" value={countdownLabel(data.killCountdownDays)} />
          </CardBody>
        </Card>
      </section>

      {/* Flock overview table — the dense, data-forward register */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3">{site.name} · Cycle {data.batch.cycleNo}</h2>
          <span className="text-label text-muted">Ranking &amp; drill-down in Phase 2</span>
        </div>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH>House</TH>
              <TH num>Day</TH>
              <TH num>Placed</TH>
              <TH num>On site</TH>
              <TH num>Cum mort</TH>
              <TH num>Cum %</TH>
              <TH num>Weight</TH>
              <TH num>vs Ross</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {houses.map(({ house, placement, latest, weight, status, vsRossPct }) => (
              <TR key={house.id}>
                <TD className="font-medium text-ink">{house.name}</TD>
                <TD num>{latest?.day ?? "—"}</TD>
                <TD num>{num(placement.placedCount)}</TD>
                <TD num>{latest ? num(latest.birdsRemaining) : "—"}</TD>
                <TD num>{latest ? num(latest.cumMort) : "—"}</TD>
                <TD num>{latest ? pct(latest.cumPct) : "—"}</TD>
                <TD num>{weight ? grams(weight.avgWeightG) : "—"}</TD>
                <TD num>{vsRossPct ? `${vsRossPct}%` : "—"}</TD>
                <TD>{status ? <StatusPill level={status.level} size="sm" /> : "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>

      {/* Catching schedule + feed reconciliation */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Catching schedule</CardEyebrow>
            <ul className="mt-3 divide-y divide-divider">
              {catching.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-body text-slate">{c.night}</span>
                  <span className="text-data text-ink">{num(c.count)} birds</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {delivery ? (
            <Alert
              tone="warning"
              title={`Feed delivery ${pct(shortfallPct, 1)} under nominal`}
              action={
                <Button size="sm" variant="secondary" onClick={() => toast("Feed reconciliation in Phase 2", { tone: "info" })}>
                  Details
                </Button>
              }
            >
              {delivery.feedType}: {kg(nominalKg)} expected vs {kg(delivery.netWeightKg)} weighed ({kg(shortfallKg)} short).
            </Alert>
          ) : null}
          <Alert tone="info" title="Benchmark overlay ready">
            Ross 308 as-hatched curve plus the contractor band is wired through the data seam. The
            comparison chart arrives in Phase 2.
          </Alert>
        </div>
      </section>
    </div>
  );
}
