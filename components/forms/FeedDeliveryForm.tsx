"use client";

import { useState } from "react";
import type { FeedDelivery } from "@/lib/types";
import { submitFeedDelivery } from "@/lib/data";
import { kg, num, pct, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";

const FEED_TYPES = ["Broiler Starter Crumble", "Broiler Grower Pellet", "Broiler Finisher Pellet"];
const BAG_SIZES = [25, 50];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        active ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
      )}
    >
      {children}
    </button>
  );
}

export function FeedDeliveryForm({ deliveries, today }: { deliveries: FeedDelivery[]; today: string }) {
  const { toast } = useToast();

  const [feedType, setFeedType] = useState(FEED_TYPES[2]);
  const [bagSizeKg, setBagSizeKg] = useState(50);
  const [bagCount, setBagCount] = useState(300);
  const [netTouched, setNetTouched] = useState(false);
  const [netVal, setNetVal] = useState(0);
  const [log, setLog] = useState<FeedDelivery[]>(deliveries);
  const [saving, setSaving] = useState(false);

  const nominalKg = bagSizeKg * bagCount;
  const netWeightKg = netTouched ? netVal : nominalKg;
  const diffKg = nominalKg - netWeightKg;
  const diffPct = nominalKg ? (diffKg / nominalKg) * 100 : 0;
  const flagged = Math.abs(diffPct) >= 1;

  async function handleSave() {
    setSaving(true);
    await submitFeedDelivery({ date: today, feedType, bagSizeKg, bagCount, netWeightKg });
    setLog((prev) => [
      { id: `local-${prev.length}`, siteId: "site_nhunge", date: today, feedType, bagSizeKg, bagCount, netWeightKg },
      ...prev,
    ]);
    toast("Delivery logged", {
      tone: flagged ? "info" : "success",
      description: flagged ? `${kg(Math.abs(diffKg))} ${diffKg > 0 ? "short" : "over"} flagged.` : "Matched the order.",
    });
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Feed delivery"
        title="Log a delivery"
        intro="Weigh the load on arrival. We compare the weighbridge figure to what was ordered and flag any shortfall."
      />

      <Card className="animate-rise">
        <CardBody className="space-y-6 pt-5">
          <div className="space-y-2">
            <span className="text-label text-slate">Feed type</span>
            <div className="flex flex-wrap gap-2">
              {FEED_TYPES.map((t) => (
                <Chip key={t} active={feedType === t} onClick={() => setFeedType(t)}>
                  {t.replace("Broiler ", "")}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-label text-slate">Bag size</span>
            <div className="flex gap-2">
              {BAG_SIZES.map((s) => (
                <Chip key={s} active={bagSizeKg === s} onClick={() => setBagSizeKg(s)}>
                  {s} kg
                </Chip>
              ))}
            </div>
          </div>

          <Stepper label="Number of bags" value={bagCount} onChange={setBagCount} max={2000} hint="Hold + or − to move faster." />
          <Stepper
            label="Weighed net (on the scale)"
            value={netWeightKg}
            onChange={(v) => {
              setNetTouched(true);
              setNetVal(v);
            }}
            step={10}
            max={120000}
            suffix="kg"
            hint="Starts at the ordered weight — adjust to the weighbridge reading."
          />

          <Alert
            tone={flagged ? "warning" : "success"}
            title={
              flagged
                ? `${kg(Math.abs(diffKg))} ${diffKg > 0 ? "short" : "over"} (${pct(Math.abs(diffPct), 1)})`
                : "Matches the order"
            }
          >
            {num(bagCount)} × {bagSizeKg} kg = {kg(nominalKg)} ordered · {kg(netWeightKg)} weighed in.
            {flagged ? " Flag this with the driver before they leave." : " Within tolerance."}
          </Alert>

          <Button size="lg" block onClick={handleSave} disabled={saving}>
            Save delivery
          </Button>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <h2 className="text-h3">Recent deliveries</h2>
        {log.length === 0 ? (
          <EmptyState title="No deliveries logged yet" body="Weigh the next load on arrival and save it here to track feed against intake." />
        ) : (
          <div className="space-y-2">
            {log.map((d) => {
              const nom = d.bagSizeKg * d.bagCount;
              const short = nom - d.netWeightKg;
              const shortPct = nom ? (short / nom) * 100 : 0;
              const isFlagged = Math.abs(shortPct) >= 1;
              return (
                <Card key={d.id}>
                  <CardBody className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-ink">{d.feedType}</p>
                      <p className="text-label text-muted">{shortDate(d.date)} · {num(d.bagCount)} × {d.bagSizeKg} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-data text-ink">{kg(d.netWeightKg)}</p>
                      <p className={cn("text-label", isFlagged ? "text-status-warn" : "text-status-good")}>
                        {isFlagged ? `${pct(Math.abs(shortPct), 1)} ${short > 0 ? "short" : "over"}` : "matched"}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
