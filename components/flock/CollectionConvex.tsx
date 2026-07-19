"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { num } from "@/lib/format";
import { notify } from "@/components/ui/notify";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Supervisor collection (Phase 2). The contractor posts the schedule + manifest;
 * here the farm's supervisor records birds caught + collection weight per night
 * (recordCatch) and ticks arriving trucks off at the gate (verifyVehicle).
 */
export function CollectionConvex() {
  const view = useQuery(api.collection.growerCatching);

  if (view === undefined) return <ScreenLoading eyebrow="Collection" title="Tonight's catch" />;
  if (view === null)
    return (
      <ScreenEmpty
        eyebrow="Collection"
        title="Tonight's catch"
        heading="Grower sign-in required"
        body="Sign in on a farm to record collection."
      />
    );
  if (!view.active)
    return (
      <ScreenEmpty
        eyebrow="Collection"
        title="Tonight's catch"
        heading="No active cycle"
        body="Collection appears here once a cycle is running and your contractor posts the catching schedule."
      />
    );

  const events = view.events ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Collection"
        title="Tonight's catch"
        intro="Record the birds caught and the collection weight for each night, and tick trucks off at the gate."
      />

      <Card>
        <CardBody className="grid grid-cols-2 gap-3 pt-5 text-center">
          <Stat label="Birds on farm" value={num(view.onFarm)} />
          <Stat label="Collected so far" value={num(view.collected)} />
        </CardBody>
      </Card>

      {events.length === 0 ? (
        <Card>
          <CardBody className="space-y-2 py-10 text-center">
            <p className="text-h3 text-ink">No schedule yet</p>
            <p className="text-body text-slate">Your contractor hasn&apos;t posted the catching schedule for this cycle.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((e: any) => (
            <NightCard key={e.id} event={e} />
          ))}
        </div>
      )}

      {view.manifest && ((view.manifest as any).vehicles?.length ?? 0) > 0 && (
        <Manifest manifest={view.manifest} />
      )}
    </div>
  );
}

function NightCard({ event }: { event: any }) {
  const record = useMutation(api.collection.recordCatch);
  const [caught, setCaught] = useState(event.caughtCount != null ? String(event.caughtCount) : "");
  const [kg, setKg] = useState(event.collectionWeightKg != null ? String(event.collectionWeightKg) : "");
  const [pending, setPending] = useState(false);
  const done = event.caughtCount != null;

  async function save() {
    setPending(true);
    try {
      await notify.promise(
        record({ eventId: event.id, caughtCount: Number(caught) || 0, collectionWeightKg: Number(kg) || 0 }),
        {
          loading: "Saving…",
          success: () => ({ title: `${event.night} recorded`, description: `${num(Number(caught) || 0)} birds · ${num(Number(kg) || 0)} kg` }),
          error: () => ({ title: "Couldn't save", description: "Try again." }),
        },
      );
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-h3">{event.night}</h3>
        <span className={cn("text-label", done ? "text-status-good" : "text-muted")}>
          {done ? "recorded" : `target ${num(event.count)}`}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Birds caught" value={caught} onChange={setCaught} />
        <Field label="Collection weight (kg)" value={kg} onChange={setKg} decimal />
      </div>
      <Button type="button" block loading={pending} affordance={IconCheck} onClick={save} className="mt-4">
        {done ? "Update" : "Record"} {event.night}
      </Button>
    </div>
  );
}

function Manifest({ manifest }: { manifest: any }) {
  const verify = useMutation(api.collection.verifyVehicle);
  const verified: string[] = manifest.verifiedPlates ?? [];
  return (
    <section className="space-y-3">
      <h2 className="text-h3">Gate check</h2>
      <Card>
        <CardBody className="pt-5">
          <CardEyebrow>Holds {num(manifest.heldCount)} birds · tick trucks as they arrive</CardEyebrow>
          <ul className="mt-3 divide-y divide-divider">
            {manifest.vehicles.map((veh: any) => {
              const isVerified = verified.includes(veh.plate);
              return (
                <li key={veh.plate} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="font-mono text-label text-ink">{veh.plate}</span>
                    <span className="ml-2 text-label text-muted">{veh.driver}</span>
                  </span>
                  <button
                    type="button"
                    aria-pressed={isVerified}
                    onClick={() => void verify({ plate: veh.plate, verified: !isVerified })}
                    className={cn(
                      "rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium transition-colors duration-[var(--dur-fast)]",
                      isVerified ? "bg-status-good-tint text-status-good" : "border border-border bg-surface text-slate hover:border-brand-500",
                    )}
                  >
                    {isVerified ? "✓ at gate" : "Mark arrived"}
                  </button>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label text-muted">{label}</p>
      <p className="mt-0.5 text-data text-[1.25rem] tabular-nums text-ink">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, decimal }: { label: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <input
        value={value}
        inputMode={decimal ? "decimal" : "numeric"}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, ""))}
        className="h-14 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-right font-mono text-body-l text-ink outline-none placeholder:text-hint focus-visible:border-brand-500"
      />
    </label>
  );
}
