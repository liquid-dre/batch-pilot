"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROSS_308_OVERLAY } from "@/lib/data/ross308";
import { DEFAULT_THRESHOLDS } from "@/lib/engine";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Contractor benchmark Tune wizard (ROADMAP §8 Phase 4 / Iteration 4). Pages the
 * benchmark into steps — target weight range → mortality band → uniformity
 * target → status thresholds → review — each with a short "what this changes"
 * description, so the contractor understands the effect before saving. Saving
 * (`setBenchmark`) reflows every grower's house statuses via `myDataset.benchmark`.
 */

const toPct = (frac: number) => String(Math.round(frac * 1000) / 10);
const fromPct = (s: string, fallback: number) => {
  const n = Number(s);
  return Number.isFinite(n) && s.trim() !== "" ? n / 100 : fallback;
};
const num = (s: string, fallback: number) => (s.trim() && Number(s) > 0 ? Math.round(Number(s)) : fallback);

const STEPS = [
  { id: "target", label: "Target weight" },
  { id: "mortality", label: "Mortality" },
  { id: "uniformity", label: "Uniformity" },
  { id: "thresholds", label: "Thresholds" },
  { id: "review", label: "Review" },
];

const DESC: Record<string, string> = {
  target: "The market-weight range cycles are grown to. Pre-fills each cycle you schedule and its Estimate-collection-date button.",
  mortality: "The maximum cumulative mortality your growers are allowed by day. Tightening a band turns amber/red sooner on mortality.",
  uniformity: "The minimum flock uniformity you expect by day. Raising it makes an uneven flock flag sooner.",
  thresholds: "Where each metric turns green → amber → red. Percentages of the objective (weight, uniformity) or over target (FCR, mortality band).",
  review: "Confirm and save. Changes apply to every farm the moment you save.",
};

export function BenchmarkWizard() {
  const bench = useQuery(api.benchmark.myBenchmark);
  const setBenchmark = useMutation(api.benchmark.setBenchmark);
  const [step, setStep] = useState("target");
  const [pending, setPending] = useState(false);

  // Seeded once the query resolves (keyed remount below guarantees fresh seed).
  const [state, setState] = useState<null | {
    tMin: string; tMax: string;
    mort: { day: number; v: string }[];
    unif: { day: number; v: string }[];
    th: Record<string, string>;
  }>(null);

  if (bench === undefined) return <ScreenLoading eyebrow="Benchmark" title="Tune benchmark" />;
  if (bench === null)
    return <ScreenEmpty eyebrow="Benchmark" title="Tune benchmark" heading="Contractor sign-in required" body="Sign in as a contractor to tune your benchmark." />;

  const overlay = bench.overlay ?? ROSS_308_OVERLAY;
  const thresholds = bench.thresholds ?? DEFAULT_THRESHOLDS;
  const s =
    state ?? {
      tMin: bench.targetWeightMinG != null ? String(bench.targetWeightMinG) : "1600",
      tMax: bench.targetWeightMaxG != null ? String(bench.targetWeightMaxG) : "1700",
      mort: overlay.mortalityBand.map((b) => ({ day: b.day, v: String(b.maxCumPct) })),
      unif: overlay.uniformityTarget.map((u) => ({ day: u.day, v: String(u.minPct) })),
      th: {
        weightGreen: toPct(thresholds.weight.green), weightAmber: toPct(thresholds.weight.amber),
        fcrGreen: toPct(thresholds.fcr.green), fcrAmber: toPct(thresholds.fcr.amber),
        feedRefill: toPct(thresholds.feedRefillRatio),
        mortAmber: toPct(thresholds.mortality.amber), mortRed: toPct(thresholds.mortality.red),
        unifGreen: toPct(thresholds.uniformity.green), unifAmber: toPct(thresholds.uniformity.amber),
      },
    };
  const set = (patch: Partial<typeof s>) => setState({ ...s, ...patch });

  async function save() {
    setPending(true);
    try {
      await notify.promise(
        setBenchmark({
          targetWeightMinG: num(s.tMin, 1600),
          targetWeightMaxG: num(s.tMax, 1700),
          overlay: {
            mortalityBand: s.mort.map((r) => ({ day: r.day, maxCumPct: Number(r.v) || 0 })),
            uniformityTarget: s.unif.map((r) => ({ day: r.day, minPct: Number(r.v) || 0 })),
          },
          thresholds: {
            weight: { green: fromPct(s.th.weightGreen, DEFAULT_THRESHOLDS.weight.green), amber: fromPct(s.th.weightAmber, DEFAULT_THRESHOLDS.weight.amber) },
            fcr: { green: fromPct(s.th.fcrGreen, DEFAULT_THRESHOLDS.fcr.green), amber: fromPct(s.th.fcrAmber, DEFAULT_THRESHOLDS.fcr.amber) },
            feedRefillRatio: fromPct(s.th.feedRefill, DEFAULT_THRESHOLDS.feedRefillRatio),
            mortality: { amber: fromPct(s.th.mortAmber, DEFAULT_THRESHOLDS.mortality.amber), red: fromPct(s.th.mortRed, DEFAULT_THRESHOLDS.mortality.red) },
            uniformity: { green: fromPct(s.th.unifGreen, DEFAULT_THRESHOLDS.uniformity.green), amber: fromPct(s.th.unifAmber, DEFAULT_THRESHOLDS.uniformity.amber) },
          },
        }),
        {
          loading: "Saving benchmark…",
          success: () => ({ title: "Benchmark saved", description: "Your growers score against these now." }),
          error: () => ({ title: "Couldn't save the benchmark", description: "Try again." }),
        },
      );
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  const idx = STEPS.findIndex((st) => st.id === step);
  const steps = STEPS.map((st, i) => ({ ...st, complete: i < idx }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Benchmark" title="Tune benchmark" back={{ href: "/app/benchmark", label: "Current" }} />
      <WizardSteps steps={steps} activeId={step} onSelect={setStep} ariaLabel="Benchmark steps" />
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div>
            <CardEyebrow>{STEPS[idx].label}</CardEyebrow>
            <p className="mt-1 text-label text-muted">{DESC[step]}</p>
          </div>

          {step === "target" && (
            <div className="flex items-center gap-2">
              <NumInput value={s.tMin} onChange={(v) => set({ tMin: v })} label="Min" />
              <span className="text-label text-muted">–</span>
              <NumInput value={s.tMax} onChange={(v) => set({ tMax: v })} label="Max" />
              <span className="text-label text-muted">g</span>
            </div>
          )}
          {step === "mortality" &&
            s.mort.map((r, i) => (
              <BandRow key={r.day} day={r.day} prefix="≤" value={r.v} onChange={(v) => set({ mort: s.mort.map((x, j) => (j === i ? { ...x, v } : x)) })} />
            ))}
          {step === "uniformity" &&
            s.unif.map((r, i) => (
              <BandRow key={r.day} day={r.day} prefix="≥" value={r.v} onChange={(v) => set({ unif: s.unif.map((x, j) => (j === i ? { ...x, v } : x)) })} />
            ))}
          {step === "thresholds" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Weight green ≥", "weightGreen"], ["Weight amber ≥", "weightAmber"],
                ["Uniformity green ≥", "unifGreen"], ["Uniformity amber ≥", "unifAmber"],
                ["FCR amber ≤ +", "fcrGreen"], ["FCR red ≤ +", "fcrAmber"],
                ["Mortality amber ≥", "mortAmber"], ["Mortality red ≥", "mortRed"],
                ["Feed refill flag ≥", "feedRefill"],
              ].map(([label, key]) => (
                <ThField key={key} label={label} value={s.th[key]} onChange={(v) => set({ th: { ...s.th, [key]: v } })} />
              ))}
            </div>
          )}
          {step === "review" && (
            <dl className="grid grid-cols-2 gap-y-1.5 text-label">
              <dt className="text-muted">Target weight</dt><dd className="text-right font-mono text-ink">{s.tMin}–{s.tMax} g</dd>
              <dt className="text-muted">Mortality bands</dt><dd className="text-right font-mono text-ink">{s.mort.length} days</dd>
              <dt className="text-muted">Uniformity targets</dt><dd className="text-right font-mono text-ink">{s.unif.length} days</dd>
              <dt className="text-muted">Weight green</dt><dd className="text-right font-mono text-ink">≥ {s.th.weightGreen}%</dd>
            </dl>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-divider pt-4">
            <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setStep(STEPS[Math.max(0, idx - 1)].id)}>
              Back
            </Button>
            {step === "review" ? (
              <Button size="sm" loading={pending} onClick={save}>Save benchmark</Button>
            ) : (
              <Button size="sm" onClick={() => setStep(STEPS[idx + 1].id)}>Next</Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function NumInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <input
      value={value}
      inputMode="numeric"
      aria-label={label}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      className="h-11 w-24 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
    />
  );
}

function BandRow({ day, prefix, value, onChange }: { day: number; prefix: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-body text-slate">Day {day}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-label text-muted">{prefix}</span>
        <NumInput value={value} onChange={onChange} label={`Day ${day}`} />
        <span className="text-label text-muted">%</span>
      </span>
    </label>
  );
}

function ThField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <NumInput value={value} onChange={onChange} label={label} />
        <span className="text-label text-muted">%</span>
      </span>
    </label>
  );
}
