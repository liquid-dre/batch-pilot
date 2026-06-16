"use client";

import type { DashboardData } from "@/lib/view";
import { num, pct, grams, kg } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";

function countdownLabel(days: number): string {
  if (days > 1) return `Collection in ${days} days`;
  if (days === 1) return "Collection tomorrow";
  if (days === 0) return "Collection target is today";
  return "Past collection target";
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-label text-muted">{label}</p>
      <p className="mt-1 text-data text-[1.5rem] font-medium text-ink">{value}</p>
      {sub ? <p className="text-[0.8125rem] text-muted">{sub}</p> : null}
    </div>
  );
}

export function GrowerOverview({ data }: { data: DashboardData }) {
  const { toast } = useToast();
  const { site, batch, rollup, houses, feed } = data;

  const delivery = feed[0];
  const nominalKg = delivery ? delivery.bagSizeKg * delivery.bagCount : 0;
  const shortfallKg = delivery ? nominalKg - delivery.netWeightKg : 0;
  const shortfallPct = delivery && nominalKg ? (shortfallKg / nominalKg) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* Greeting + the one clear action */}
      <section className="animate-rise">
        <CardEyebrow>
          {site.name} · Cycle {batch.cycleNo} · {batch.breed}
        </CardEyebrow>
        <h1 className="mt-2 text-display">Good morning, Tendai.</h1>
        <p className="mt-2 max-w-prose text-body-l text-slate">
          Day 26–27 across {rollup.houseCount} houses. {countdownLabel(data.killCountdownDays)}.
        </p>

        <Card className="mt-5">
          <CardBody className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-h3">Add today&apos;s numbers</p>
              <p className="mt-0.5 text-body text-muted">
                Mortality, culls and feed per house. We do the cumulative maths for you.
              </p>
            </div>
            <Button
              size="lg"
              block
              className="sm:w-auto"
              onClick={() =>
                toast("Daily update opens in Phase 1", {
                  tone: "info",
                  description: "The per-house form with echo-back confirmation is next.",
                })
              }
            >
              Add today&apos;s numbers
            </Button>
          </CardBody>
        </Card>
      </section>

      {/* Site rollup — the block growers hand-tally every morning */}
      <section>
        <Card>
          <CardBody className="pt-5">
            <CardEyebrow>Site average · today</CardEyebrow>
            <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat label="Birds placed" value={num(rollup.placed)} />
              <Stat label="On site" value={num(rollup.remaining)} />
              <Stat label="Losses" value={num(rollup.cumMort)} />
              <Stat label="Mortality" value={pct(rollup.mortPct)} sub="cumulative" />
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Feed reconciliation — real nominal-vs-net shortfall */}
      {delivery ? (
        <section>
          <Alert
            tone="warning"
            title={`Feed delivery is ${pct(shortfallPct, 1)} short`}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast("Feed log opens in Phase 1", { tone: "info" })}
              >
                Review
              </Button>
            }
          >
            {delivery.feedType}: {num(delivery.bagCount)} × {delivery.bagSizeKg}kg ={" "}
            {kg(nominalKg)} expected, {kg(delivery.netWeightKg)} weighed in ({kg(shortfallKg)} under).
          </Alert>
        </section>
      ) : null}

      {/* House health at a glance — full house screens arrive in Phase 1 */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h2">House health</h2>
          <span className="text-label text-muted">Tap a house for detail</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map(({ house, latest, weight, status, vsRossPct }) => (
            <Card key={house.id} interactive as="article">
              <button
                type="button"
                className="block w-full rounded-[var(--radius-card)] p-5 text-left"
                onClick={() => toast(`${house.name} detail opens in Phase 1`, { tone: "info" })}
              >
                <div className="flex items-center justify-between">
                  <CardEyebrow>
                    {house.name} · Day {latest?.day ?? "—"}
                  </CardEyebrow>
                  {status ? <StatusPill level={status.level} size="sm" /> : null}
                </div>
                {status ? <p className="mt-3 text-body text-slate">{status.actualVsTarget}.</p> : null}
                <dl className="mt-4 flex gap-6">
                  <div>
                    <dt className="text-[0.8125rem] text-muted">Mortality</dt>
                    <dd className="text-data text-ink">{latest ? pct(latest.cumPct) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.8125rem] text-muted">Latest weight</dt>
                    <dd className="text-data text-ink">
                      {weight ? grams(weight.avgWeightG) : "—"}
                      {vsRossPct ? <span className="ml-1 text-muted">· {vsRossPct}% of curve</span> : null}
                    </dd>
                  </div>
                </dl>
              </button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
