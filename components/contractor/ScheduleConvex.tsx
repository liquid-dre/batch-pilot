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
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Contractor Collection schedule (Phase 2). Pick a farm, then post its catching
 * schedule (nights + targets) and vehicle manifest; the live view shows what the
 * farm's supervisor has recorded (birds caught + collection weight per night) and
 * ticked off at the gate. The contractor posts; the supervisor records.
 */
export function ScheduleConvex() {
  const data = useQuery(api.growers.contractorGrowers);
  const [siteId, setSiteId] = useState<string | null>(null);

  if (data === undefined) return <ScreenLoading eyebrow="Collection" title="Collection schedule" />;
  if (data === null)
    return (
      <ScreenEmpty
        eyebrow="Collection"
        title="Collection schedule"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to plan collection across your farms."
      />
    );

  const farms = [
    ...(data.growers ?? []).filter((g): g is NonNullable<typeof g> => Boolean(g)).map((g) => ({ siteId: g.siteId, name: g.name })),
    ...(data.notReporting ?? []).map((f) => ({ siteId: f.siteId, name: f.name })),
  ];
  const current = siteId ?? farms[0]?.siteId ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Collection"
        title="Collection schedule"
        intro="Post each farm's catching nights and vehicle manifest. The farm records what's caught."
      />

      {farms.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-body text-slate">No farms yet.</CardBody>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a farm">
            {farms.map((f) => (
              <button
                key={f.siteId}
                type="button"
                aria-pressed={f.siteId === current}
                onClick={() => setSiteId(f.siteId)}
                className={cn(
                  "rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  f.siteId === current ? "bg-brand-700 text-white" : "bg-surface text-slate border border-border hover:border-brand-500",
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
          {current && <FarmSchedule siteId={current} />}
        </>
      )}
    </div>
  );
}

function FarmSchedule({ siteId }: { siteId: string }) {
  const view = useQuery(api.collection.contractorCatching, { siteId });

  if (view === undefined) {
    return (
      <Card>
        <CardBody className="py-12 text-center text-body text-muted" aria-busy="true">
          Loading…
        </CardBody>
      </Card>
    );
  }
  if (!view || !view.active) {
    return (
      <Card>
        <CardBody className="space-y-2 py-10 text-center">
          <p className="text-h3 text-ink">No active cycle</p>
          <p className="text-body text-slate">{view?.siteName ?? "This farm"} has no running cycle to collect.</p>
        </CardBody>
      </Card>
    );
  }

  const events = view.events ?? [];
  const scheduled = events.reduce((s: number, e: any) => s + (e.count ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Progress */}
      <Card>
        <CardBody className="grid grid-cols-3 gap-3 pt-5 text-center">
          <Stat label="On farm" value={num(view.onFarm)} />
          <Stat label="Collected" value={num(view.collected)} />
          <Stat label="Scheduled" value={num(scheduled)} />
        </CardBody>
      </Card>

      {/* Schedule + recorded actuals */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3">Catching nights</h2>
          <span className="text-label text-muted">Collection date {view.expectedCollectionDate}</span>
        </div>
        {events.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center text-body text-slate">
              No schedule posted yet — add the nights below.
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="divide-y divide-divider py-1">
              {events.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-body text-ink">{e.night}</span>
                  <span className="text-label text-muted">
                    target {num(e.count)}
                    {e.caughtCount != null ? (
                      <span className="ml-2 text-status-good">· caught {num(e.caughtCount)}{e.collectionWeightKg ? ` · ${num(e.collectionWeightKg)} kg` : ""}</span>
                    ) : (
                      <span className="ml-2 text-hint">· not recorded</span>
                    )}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </section>

      {/* Manifest */}
      {view.manifest && (view.manifest as any).vehicles?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-h3">Vehicle manifest</h2>
          <Card>
            <CardBody className="pt-5">
              <CardEyebrow>Holds {num((view.manifest as any).heldCount)} birds</CardEyebrow>
              <ul className="mt-3 divide-y divide-divider">
                {(view.manifest as any).vehicles.map((veh: any) => {
                  const verified = ((view.manifest as any).verifiedPlates ?? []).includes(veh.plate);
                  return (
                    <li key={veh.plate} className="flex items-center justify-between py-2">
                      <span className="font-mono text-label text-ink">{veh.plate}</span>
                      <span className="flex items-center gap-3 text-label text-slate">
                        {veh.driver}
                        <span className={verified ? "text-status-good" : "text-hint"}>{verified ? "✓ at gate" : "awaiting"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      <ScheduleForm siteId={siteId} initialNights={events.map((e: any) => ({ night: e.night, count: String(e.count) }))} manifest={view.manifest} />
    </div>
  );
}

interface NightRow {
  night: string;
  count: string;
}
interface VehicleRow {
  plate: string;
  driver: string;
}

function ScheduleForm({ siteId, initialNights, manifest }: { siteId: string; initialNights: NightRow[]; manifest: any }) {
  const post = useMutation(api.collection.postCatchingSchedule);
  const [open, setOpen] = useState(false);
  const [nights, setNights] = useState<NightRow[]>(() => (initialNights.length ? initialNights : [{ night: "", count: "" }]));
  const [vehicles, setVehicles] = useState<VehicleRow[]>(() =>
    manifest?.vehicles?.length ? manifest.vehicles.map((v: any) => ({ plate: v.plate, driver: v.driver })) : [{ plate: "", driver: "" }],
  );
  const [heldCount, setHeldCount] = useState(String(manifest?.heldCount ?? ""));
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await notify.promise(
        post({
          siteId,
          nights: nights.map((n) => ({ night: n.night, count: Number(n.count) || 0 })).filter((n) => n.night.trim() && n.count > 0),
          vehicles: vehicles.filter((v) => v.plate.trim()).map((v) => ({ plate: v.plate.trim(), driver: v.driver.trim() })),
          heldCount: Number(heldCount) || 0,
        }),
        {
          loading: "Posting schedule…",
          success: (r: { nights: number }) => ({ title: "Schedule posted", description: `${r.nights} catching night(s). The farm can now record catches.` }),
          error: () => ({ title: "Couldn't post the schedule", description: "Try again." }),
        },
      );
      setOpen(false);
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" block onClick={() => setOpen(true)}>
        {initialNights.length ? "Edit schedule & manifest" : "Post the catching schedule"}
      </Button>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-5 pt-5">
        <div>
          <h3 className="text-h3">Catching nights</h3>
          <div className="mt-3 space-y-2">
            {nights.map((n, i) => (
              <div key={i} className="flex gap-2">
                <Text placeholder="e.g. Sunday night" value={n.night} onChange={(v) => setNights((p) => p.map((r, j) => (j === i ? { ...r, night: v } : r)))} className="flex-1" />
                <Text placeholder="birds" value={n.count} numeric onChange={(v) => setNights((p) => p.map((r, j) => (j === i ? { ...r, count: v } : r)))} className="w-28" />
                <button type="button" aria-label="Remove night" onClick={() => setNights((p) => p.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-status-bad">×</button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setNights((p) => [...p, { night: "", count: "" }])} className="mt-2">
            Add night
          </Button>
        </div>

        <div>
          <h3 className="text-h3">Vehicle manifest</h3>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-label font-medium text-slate">Birds held this round</span>
            <Text placeholder="0" value={heldCount} numeric onChange={setHeldCount} className="w-40" />
          </label>
          <div className="mt-3 space-y-2">
            {vehicles.map((veh, i) => (
              <div key={i} className="flex gap-2">
                <Text placeholder="Plate" value={veh.plate} onChange={(v) => setVehicles((p) => p.map((r, j) => (j === i ? { ...r, plate: v } : r)))} className="w-36" />
                <Text placeholder="Driver" value={veh.driver} onChange={(v) => setVehicles((p) => p.map((r, j) => (j === i ? { ...r, driver: v } : r)))} className="flex-1" />
                <button type="button" aria-label="Remove vehicle" onClick={() => setVehicles((p) => p.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-status-bad">×</button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setVehicles((p) => [...p, { plate: "", driver: "" }])} className="mt-2">
            Add vehicle
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button loading={pending} onClick={submit}>Post schedule</Button>
        </div>
      </CardBody>
    </Card>
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

function Text({
  value,
  onChange,
  placeholder,
  numeric,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <input
      value={value}
      inputMode={numeric ? "numeric" : "text"}
      placeholder={placeholder}
      onChange={(e) => onChange(numeric ? e.target.value.replace(/[^0-9]/g, "") : e.target.value)}
      className={cn(
        "h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none placeholder:text-hint focus-visible:border-brand-500",
        className,
      )}
    />
  );
}
