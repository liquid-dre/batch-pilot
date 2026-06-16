import type { HouseView } from "@/lib/view";
import { grams, num, pct } from "@/lib/format";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

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

/** Full house status card: colour + icon + word + shape, key metrics, cause & fix. */
export function HouseStatusCard({ view }: { view: HouseView }) {
  const { house, latest, weight, status, vsRossPct } = view;
  return (
    <Card as="article" className="h-full">
      <CardBody className="flex h-full flex-col gap-4 pt-5">
        <div className="flex items-center justify-between">
          <CardEyebrow>
            {house.name} · Day {latest?.day ?? "—"}
          </CardEyebrow>
          {status ? <StatusPill level={status.level} /> : null}
        </div>

        {status ? <p className="text-body-l text-slate">{status.actualVsTarget}.</p> : null}

        <dl className="grid grid-cols-3 gap-3">
          <Metric label="Mortality" value={latest ? pct(latest.cumPct) : "—"} />
          <Metric label="On site" value={latest ? num(latest.birdsRemaining) : "—"} />
          <Metric label="Weight" value={weight ? grams(weight.avgWeightG) : "—"} sub={vsRossPct ? `${vsRossPct}%` : undefined} />
        </dl>

        {status && (status.cause || status.fix) ? (
          <div className="mt-auto space-y-2 rounded-[var(--radius-control)] bg-paper p-3.5">
            {status.cause ? (
              <p className="text-body text-slate">
                <span className="font-semibold text-ink">Likely cause: </span>
                {status.cause}
              </p>
            ) : null}
            {status.fix ? (
              <p className="text-body text-slate">
                <span className="font-semibold text-ink">Do this: </span>
                {status.fix}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
