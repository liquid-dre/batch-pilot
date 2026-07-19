"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROSS_308_OVERLAY } from "@/lib/data/ross308";
import { DEFAULT_THRESHOLDS } from "@/lib/engine";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";

/**
 * Contractor benchmark tuning form (ROADMAP §8 Phase 4 — "Overlay bands + engine
 * thresholds", tuning form only). Edits the overlay the status engine scores the
 * contractor's growers against: the mortality ceiling + uniformity floor by day,
 * plus the engine's amber/red thresholds. Saving (`api.benchmark.setBenchmark`)
 * flows into every grower's `myDataset.benchmark`, so their house statuses and
 * alerts re-derive against the tuned bands on the next reactive tick.
 *
 * Day points are fixed here (value tuning only) — restructuring the curve/bands
 * is the deferred CSV-import path. Thresholds are presented as whole percentages
 * and converted to the engine's fractions on save.
 */

type Overlay = {
  mortalityBand: { day: number; maxCumPct: number }[];
  uniformityTarget: { day: number; minPct: number }[];
};
type Thresholds = typeof DEFAULT_THRESHOLDS;

// The engine stores fractions (0.97); the form edits whole percents (97). One
// place to convert each way so load and save stay in lockstep.
const toPct = (frac: number) => String(Math.round(frac * 1000) / 10);
const fromPct = (s: string, fallback: number) => {
  const n = Number(s);
  return Number.isFinite(n) && s.trim() !== "" ? n / 100 : fallback;
};

export function BenchmarkTuner({
  overlay,
  thresholds,
  isDefault,
}: {
  overlay: Overlay;
  thresholds: Thresholds;
  isDefault: boolean;
}) {
  const setBenchmark = useMutation(api.benchmark.setBenchmark);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Seed local edit state from the current set; re-seed if the query re-fires
  // while collapsed via the key on the mounted editor (below).
  return open ? (
    <TunerForm
      overlay={overlay}
      thresholds={thresholds}
      pending={pending}
      onCancel={() => setOpen(false)}
      onSave={async (nextOverlay, nextThresholds) => {
        setPending(true);
        try {
          await notify.promise(setBenchmark({ overlay: nextOverlay, thresholds: nextThresholds }), {
            loading: "Saving benchmark…",
            success: () => ({ title: "Benchmark saved", description: "Your growers' statuses now score against these bands." }),
            error: () => ({ title: "Couldn't save the benchmark", description: "Try again." }),
          });
          setOpen(false);
        } catch {
          /* toast shown */
        } finally {
          setPending(false);
        }
      }}
    />
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-label text-slate">
        <span
          className={`inline-block size-2.5 rounded-full ${isDefault ? "bg-slate/40" : "bg-brand-500"}`}
          aria-hidden
        />
        {isDefault ? "Using the Ross-308 default bands" : "Tuned for your org"}
      </span>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Tune benchmark
      </Button>
    </div>
  );
}

function TunerForm({
  overlay,
  thresholds,
  pending,
  onCancel,
  onSave,
}: {
  overlay: Overlay;
  thresholds: Thresholds;
  pending: boolean;
  onCancel: () => void;
  onSave: (overlay: Overlay, thresholds: Thresholds) => void;
}) {
  const [mort, setMort] = useState(() => overlay.mortalityBand.map((b) => ({ day: b.day, v: String(b.maxCumPct) })));
  const [unif, setUnif] = useState(() => overlay.uniformityTarget.map((u) => ({ day: u.day, v: String(u.minPct) })));
  const [th, setTh] = useState(() => ({
    weightGreen: toPct(thresholds.weight.green),
    weightAmber: toPct(thresholds.weight.amber),
    fcrGreen: toPct(thresholds.fcr.green),
    fcrAmber: toPct(thresholds.fcr.amber),
    feedRefill: toPct(thresholds.feedRefillRatio),
    mortAmber: toPct(thresholds.mortality.amber),
    mortRed: toPct(thresholds.mortality.red),
    unifGreen: toPct(thresholds.uniformity.green),
    unifAmber: toPct(thresholds.uniformity.amber),
  }));

  function resetToDefault() {
    setMort(ROSS_308_OVERLAY.mortalityBand.map((b) => ({ day: b.day, v: String(b.maxCumPct) })));
    setUnif(ROSS_308_OVERLAY.uniformityTarget.map((u) => ({ day: u.day, v: String(u.minPct) })));
    setTh({
      weightGreen: toPct(DEFAULT_THRESHOLDS.weight.green),
      weightAmber: toPct(DEFAULT_THRESHOLDS.weight.amber),
      fcrGreen: toPct(DEFAULT_THRESHOLDS.fcr.green),
      fcrAmber: toPct(DEFAULT_THRESHOLDS.fcr.amber),
      feedRefill: toPct(DEFAULT_THRESHOLDS.feedRefillRatio),
      mortAmber: toPct(DEFAULT_THRESHOLDS.mortality.amber),
      mortRed: toPct(DEFAULT_THRESHOLDS.mortality.red),
      unifGreen: toPct(DEFAULT_THRESHOLDS.uniformity.green),
      unifAmber: toPct(DEFAULT_THRESHOLDS.uniformity.amber),
    });
  }

  function submit() {
    const nextOverlay: Overlay = {
      mortalityBand: mort.map((r) => ({ day: r.day, maxCumPct: Number(r.v) || 0 })),
      uniformityTarget: unif.map((r) => ({ day: r.day, minPct: Number(r.v) || 0 })),
    };
    const nextThresholds: Thresholds = {
      weight: { green: fromPct(th.weightGreen, DEFAULT_THRESHOLDS.weight.green), amber: fromPct(th.weightAmber, DEFAULT_THRESHOLDS.weight.amber) },
      fcr: { green: fromPct(th.fcrGreen, DEFAULT_THRESHOLDS.fcr.green), amber: fromPct(th.fcrAmber, DEFAULT_THRESHOLDS.fcr.amber) },
      feedRefillRatio: fromPct(th.feedRefill, DEFAULT_THRESHOLDS.feedRefillRatio),
      mortality: { amber: fromPct(th.mortAmber, DEFAULT_THRESHOLDS.mortality.amber), red: fromPct(th.mortRed, DEFAULT_THRESHOLDS.mortality.red) },
      uniformity: { green: fromPct(th.unifGreen, DEFAULT_THRESHOLDS.uniformity.green), amber: fromPct(th.unifAmber, DEFAULT_THRESHOLDS.uniformity.amber) },
    };
    onSave(nextOverlay, nextThresholds);
  }

  return (
    <Card>
      <CardBody className="space-y-6 pt-5">
        <div>
          <h3 className="text-h3">Tune benchmark</h3>
          <p className="mt-1 text-label text-muted">
            The bands your growers are scored against. Changes apply to every farm the moment you save.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <CardEyebrow>Mortality band · max cumulative %</CardEyebrow>
            <div className="mt-3 space-y-2">
              {mort.map((r, i) => (
                <BandRow
                  key={r.day}
                  day={r.day}
                  prefix="≤"
                  suffix="%"
                  value={r.v}
                  onChange={(v) => setMort((rows) => rows.map((row, j) => (j === i ? { ...row, v } : row)))}
                />
              ))}
            </div>
          </section>
          <section>
            <CardEyebrow>Uniformity target · minimum %</CardEyebrow>
            <div className="mt-3 space-y-2">
              {unif.map((r, i) => (
                <BandRow
                  key={r.day}
                  day={r.day}
                  prefix="≥"
                  suffix="%"
                  value={r.v}
                  onChange={(v) => setUnif((rows) => rows.map((row, j) => (j === i ? { ...row, v } : row)))}
                />
              ))}
            </div>
          </section>
        </div>

        <section>
          <CardEyebrow>Status thresholds</CardEyebrow>
          <p className="mt-1 text-label text-muted">
            Where green turns amber turns red. Percentages of the objective (weight, uniformity) or over target (FCR, mortality band).
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ThField label="Weight · green ≥" value={th.weightGreen} onChange={(v) => setTh((s) => ({ ...s, weightGreen: v }))} />
            <ThField label="Weight · amber ≥" value={th.weightAmber} onChange={(v) => setTh((s) => ({ ...s, weightAmber: v }))} />
            <ThField label="Uniformity · green ≥" value={th.unifGreen} onChange={(v) => setTh((s) => ({ ...s, unifGreen: v }))} />
            <ThField label="Uniformity · amber ≥" value={th.unifAmber} onChange={(v) => setTh((s) => ({ ...s, unifAmber: v }))} />
            <ThField label="FCR · amber ≤ +" value={th.fcrGreen} onChange={(v) => setTh((s) => ({ ...s, fcrGreen: v }))} />
            <ThField label="FCR · red ≤ +" value={th.fcrAmber} onChange={(v) => setTh((s) => ({ ...s, fcrAmber: v }))} />
            <ThField label="Mortality · amber ≥" value={th.mortAmber} onChange={(v) => setTh((s) => ({ ...s, mortAmber: v }))} />
            <ThField label="Mortality · red ≥" value={th.mortRed} onChange={(v) => setTh((s) => ({ ...s, mortRed: v }))} />
            <ThField label="Feed refill flag ≥" value={th.feedRefill} onChange={(v) => setTh((s) => ({ ...s, feedRefill: v }))} />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={resetToDefault} disabled={pending}>
            Reset to Ross-308
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" loading={pending} onClick={submit}>
              Save benchmark
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function BandRow({
  day,
  prefix,
  suffix,
  value,
  onChange,
}: {
  day: number;
  prefix: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-body text-slate">Day {day}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-label text-muted">{prefix}</span>
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="h-10 w-20 rounded-[var(--radius-control)] border border-border bg-surface px-2.5 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
        />
        <span className="text-label text-muted">{suffix}</span>
      </span>
    </label>
  );
}

function ThField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
        />
        <span className="text-label text-muted">%</span>
      </span>
    </label>
  );
}
