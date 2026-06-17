import type { MetricStatus } from "@/lib/engine";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { EstTag, ESTIMATED_NOTE } from "@/components/ui/Estimated";

export interface HouseEfficiency {
  houseId: string;
  houseName: string;
  fcr?: MetricStatus;
  feed?: MetricStatus;
}

/** FCR / efficiency + feed-added-vs-consumed indicators per house (Phase 3). */
export function EfficiencyPanel({ houses }: { houses: HouseEfficiency[] }) {
  const anyRefill = houses.some((h) => h.feed?.level !== "green");
  return (
    <div className="space-y-3">
      <Table>
        <THead>
          <TR className="bg-transparent hover:bg-transparent">
            <TH>House</TH>
            <TH>FCR<EstTag /></TH>
            <TH>vs target</TH>
            <TH>Feed added vs consumed</TH>
          </TR>
        </THead>
        <TBody>
          {houses.map((h) => (
            <TR key={h.houseId}>
              <TD className="font-medium text-ink">{h.houseName}</TD>
              <TD>{h.fcr ? <StatusPill level={h.fcr.level} size="sm" /> : "—"}</TD>
              <TD className="font-mono tabular-nums text-slate">{h.fcr?.actualVsTarget ?? "—"}</TD>
              <TD>
                {h.feed ? (
                  h.feed.level === "green" ? (
                    <span className="text-body text-muted">Intake on track</span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <StatusPill level="amber" size="sm" label="Bin refill" />
                      <span className="text-label text-muted">{h.feed.actualVsTarget}</span>
                    </span>
                  )
                ) : (
                  "—"
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {anyRefill ? (
        <p className="text-label text-muted">
          A &ldquo;bin refill&rdquo; flag means feed <em>added</em> ran well above expected intake that day — log it as a delivery so FCR stays accurate.
        </p>
      ) : null}
      <p className="text-label text-muted">{ESTIMATED_NOTE}</p>
    </div>
  );
}
