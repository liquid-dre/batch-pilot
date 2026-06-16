"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyEntry } from "@/lib/types";
import type { DailyFormData, FormHouse } from "@/lib/view";
import { submitDailyUpdate } from "@/lib/data";
import { num, pct, kg } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";

interface Draft {
  mortality: number;
  culls: number;
  feedAddedKg: number;
  tempEnabled: boolean;
  tempC: number;
}

function initialDrafts(houses: FormHouse[]): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  for (const h of houses) {
    out[h.id] = { mortality: 0, culls: 0, feedAddedKg: h.lastFeedKg, tempEnabled: false, tempC: 22 };
  }
  return out;
}

const CheckGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function DailyUpdateForm({ data }: { data: DailyFormData }) {
  const router = useRouter();
  const { toast } = useToast();
  const { houses, sitePlaced, siteCumMort } = data;

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => initialDrafts(houses));
  const [selectedId, setSelectedId] = useState(houses[0]?.id);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"entry" | "review">("entry");
  const [result, setResult] = useState<DailyEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const house = houses.find((h) => h.id === selectedId)!;
  const draft = drafts[selectedId];
  const allSaved = saved.size === houses.length;

  const update = (partial: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [selectedId]: { ...prev[selectedId], ...partial } }));

  // Site mortality recomputed with this house's new cumulative swapped in.
  const siteAfter = useMemo(() => {
    if (!result) return null;
    const cum = siteCumMort - house.priorCumMort + result.cumMort;
    return {
      cumMort: cum,
      remaining: sitePlaced - cum,
      pct: sitePlaced ? (cum / sitePlaced) * 100 : 0,
    };
  }, [result, siteCumMort, house.priorCumMort, sitePlaced]);

  async function handleReview() {
    setSubmitting(true);
    const r = await submitDailyUpdate({
      houseId: house.id,
      date: data.today,
      day: house.nextDay,
      mortality: draft.mortality,
      culls: draft.culls,
      feedAddedKg: draft.feedAddedKg,
      tempC: draft.tempEnabled ? draft.tempC : undefined,
    });
    setResult(r);
    setView("review");
    setSubmitting(false);
  }

  function handleConfirm() {
    const nextSaved = new Set(saved).add(house.id);
    setSaved(nextSaved);
    toast(`${house.name} saved`, { tone: "success", description: `Day ${house.nextDay} recorded.` });
    const nextPending = houses.find((h) => !nextSaved.has(h.id));
    if (nextPending) setSelectedId(nextPending.id);
    setResult(null);
    setView("entry");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Daily update"
        title="Today's numbers"
        intro="Pick a house and tap in mortality, culls and feed. We work out the cumulative totals and the site average for you."
      />

      {allSaved ? (
        <Alert tone="success" title="All houses recorded for today" action={<Button size="sm" variant="secondary" onClick={() => router.push("/app/houses")}>See status</Button>}>
          Every house has today&apos;s numbers in. Nice work.
        </Alert>
      ) : null}

      {/* House selector — shows progress through the morning round */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a house">
        {houses.map((h) => {
          const isSaved = saved.has(h.id);
          const isActive = h.id === selectedId;
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setSelectedId(h.id);
                setView("entry");
                setResult(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium",
                "transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                isActive
                  ? "bg-brand-700 text-white"
                  : isSaved
                    ? "bg-status-good-tint text-status-good"
                    : "bg-surface text-slate border border-border hover:border-brand-500",
              )}
            >
              {isSaved && !isActive ? <CheckGlyph /> : null}
              {h.name}
            </button>
          );
        })}
      </div>

      {view === "entry" ? (
        <Card key={`entry-${selectedId}`} className="animate-rise">
          <CardBody className="space-y-6 pt-5">
            <div className="flex items-center justify-between">
              <CardEyebrow>
                {house.name} · Day {house.nextDay}
              </CardEyebrow>
              <span className="text-label text-muted">{num(house.placedCount)} placed</span>
            </div>

            <Stepper label="Birds found dead" value={draft.mortality} onChange={(v) => update({ mortality: v })} max={2000} />
            <Stepper label="Culls" value={draft.culls} onChange={(v) => update({ culls: v })} max={2000} hint="Birds you removed yourself." />
            <Stepper label="Feed added" value={draft.feedAddedKg} onChange={(v) => update({ feedAddedKg: v })} step={25} max={6000} suffix="kg" hint="Hold + or − to move faster." />

            {draft.tempEnabled ? (
              <Stepper label="House temperature" value={draft.tempC} onChange={(v) => update({ tempC: v })} step={0.5} decimals={1} min={10} max={45} suffix="°C" />
            ) : (
              <button
                type="button"
                onClick={() => update({ tempEnabled: true })}
                className="text-label font-medium text-brand-600 hover:text-brand-700"
              >
                + Add temperature (optional)
              </button>
            )}

            <Button size="lg" block onClick={handleReview} disabled={submitting}>
              Review today&apos;s numbers
            </Button>
          </CardBody>
        </Card>
      ) : result && siteAfter ? (
        <Card key="review" className="animate-rise bg-brand-50">
          <CardBody className="space-y-5 pt-5">
            <div>
              <CardEyebrow>Check this is right</CardEyebrow>
              <h2 className="mt-2 text-h2">
                Got it — {house.name}, day {result.day}.
              </h2>
              <p className="mt-1.5 text-body-l text-slate">
                {num(result.mortality)} dead, {num(result.culls)} culls, {kg(result.feedAddedKg)} feed
                {result.tempC !== undefined ? `, ${result.tempC}°C` : ""}.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-control)] bg-surface p-4">
              <Computed label="Lost today" value={num(result.cullAndMort)} />
              <Computed label="Total losses" value={`${num(result.cumMort)} · ${pct(result.cumPct)}`} />
              <Computed label="Birds remaining" value={num(result.birdsRemaining)} />
              <Computed label="Site mortality now" value={pct(siteAfter.pct)} />
            </dl>

            <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
              <Button size="lg" block className="sm:flex-1" onClick={handleConfirm}>
                Confirm &amp; save
              </Button>
              <Button size="lg" variant="ghost" block className="sm:w-auto" onClick={() => setView("entry")}>
                Correct numbers
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function Computed({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label text-muted">{label}</dt>
      <dd className="mt-0.5 text-data text-[1.0625rem] text-ink">{value}</dd>
    </div>
  );
}
