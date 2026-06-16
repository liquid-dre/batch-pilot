import type { CatchingEvent, Manifest } from "@/lib/types";
import { num, shortDate } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { PageHeader } from "@/components/shell/PageHeader";

interface ScheduleViewProps {
  events: CatchingEvent[];
  manifest: Manifest;
  siteName: string;
  cycleNo: number;
  killDate: string;
}

export function ScheduleView({ events, manifest, siteName, cycleNo, killDate }: ScheduleViewProps) {
  const total = events.reduce((s, e) => s + e.count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={`${siteName} · Cycle ${cycleNo}`}
        title="Collection"
        intro={`Phased night catching around the kill date (${shortDate(killDate)}), and the authorised vehicles for the round.`}
      />

      {/* Catching schedule */}
      <section className="space-y-3">
        <h2 className="text-h2">Catching schedule</h2>
        <Card>
          <CardBody className="pt-5">
            <ul className="divide-y divide-divider">
              {events.map((e) => {
                const widthPct = total ? Math.round((e.count / total) * 100) : 0;
                return (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-body-l text-ink">{e.night}</span>
                      <span className="text-data text-ink">{num(e.count)} birds</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${widthPct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-divider pt-3">
              <span className="text-label text-muted">Total over {events.length} nights</span>
              <span className="text-data text-[1.0625rem] text-ink">{num(total)} birds</span>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Vehicle manifest / gate checklist */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h2">Vehicle manifest</h2>
          <span className="text-label text-muted">Holds {num(manifest.heldCount)} birds</span>
        </div>
        <p className="text-body text-slate">
          Authorised trucks and drivers for this round. Check each plate at the gate before loading.
        </p>
        <Table>
          <THead>
            <TR className="bg-transparent hover:bg-transparent">
              <TH num>#</TH>
              <TH>Number plate</TH>
              <TH>Driver</TH>
            </TR>
          </THead>
          <TBody>
            {manifest.vehicles.map((v, i) => (
              <TR key={v.plate}>
                <TD num className="text-muted">{i + 1}</TD>
                <TD className="font-mono tabular-nums text-ink">{v.plate}</TD>
                <TD className="text-ink">{v.driver}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
