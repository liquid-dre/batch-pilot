"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth";
import type { CaptureHouse, SupervisorCaptureData } from "@/lib/view";
import type { DailyEntry } from "@/lib/types";
import { submitDailyUpdate } from "@/lib/data";
import { grams, longDate, num, pct } from "@/lib/format";
import { dailySaved, savedLabels } from "@/lib/copy";
import { compareToStandard, type Standing } from "@/lib/standing";
import { useTodaysCaptures } from "@/lib/captureStore";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import {
  IconCheck,
  IconStatusGood,
  IconStatusWarn,
  IconStatusBad,
  IconVaccine,
  type IconComponent,
} from "@/components/icons";
import {
  TreatmentsPanel,
  type TreatmentsValue,
  emptyTreatments,
  newTreatmentRow,
  treatmentsPayload,
} from "@/components/forms/treatments";
import { cn } from "@/lib/cn";

/**
 * The supervisor / foreman home — a single, calm capture screen and nothing
 * else. The supervisor is not tech-savvy and must never feel overwhelmed, so
 * this screen carries only: orientation (date · cycle · day of cycle), the
 * handful of figures they fill for the day (mortality split, culls, feed, the
 * optional collapsed consumables), the day's Ross 308 guideline values written
 * as plain descriptions, one calm line on how today's losses sit against the
 * standard, and a single Save action with a simple confirmation. Vaccination
 * days are surfaced clearly and reveal the vaccines-used fields.
 */

interface Draft {
  dayMortality: number;
  nightMortality: number;
  culls: number;
  feedAddedKg: number;
  treatments: TreatmentsValue;
}

function initialDraft(house: CaptureHouse): Draft {
  // On a vaccination day, open the consumables and pre-seed the due vaccine so
  // logging it is one tap, not a hunt through a collapsed panel.
  const vaccines = house.vaccination
    ? house.vaccination.vaccines.map((name) => ({ ...newTreatmentRow("doses"), name }))
    : [];
  const treatments: TreatmentsValue = house.vaccination
    ? { ...emptyTreatments(true), vaccines }
    : emptyTreatments();
  return { dayMortality: 0, nightMortality: 0, culls: 0, feedAddedKg: house.lastFeedKg, treatments };
}

function initialDrafts(houses: CaptureHouse[]): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  for (const h of houses) out[h.id] = initialDraft(h);
  return out;
}

export function SupervisorHome({ data }: { data: SupervisorCaptureData }) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const firstName = user.name.split(" ")[0];
  const { houses } = data;

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => initialDrafts(houses));
  // Today's saved entries live in a session store so the Home dashboard sees the
  // round too (and it survives moving between the two screens).
  const [saved, setSaved] = useTodaysCaptures(data.today);
  const [selectedId, setSelectedId] = useState(houses[0]?.id);
  const [submitting, setSubmitting] = useState(false);

  const house = houses.find((h) => h.id === selectedId)!;
  const draft = drafts[selectedId];
  const result = saved[selectedId];
  const doneCount = Object.keys(saved).length;
  const allDone = doneCount === houses.length;

  const update = (partial: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [selectedId]: { ...prev[selectedId], ...partial } }));

  const totalMort = draft.dayMortality + draft.nightMortality;
  // Cumulative mortality (deaths + culls) once today's figures are added — the
  // figure the contractor band is measured against, matching the status engine.
  const newCumPct = house.placedCount
    ? Number((((house.priorCumMort + totalMort + draft.culls) / house.placedCount) * 100).toFixed(2))
    : 0;
  const standing = useMemo(() => compareToStandard(newCumPct, house.standardCumMortPct), [newCumPct, house.standardCumMortPct]);

  async function handleSave() {
    setSubmitting(true);
    const entry = await submitDailyUpdate({
      houseId: house.id,
      date: data.today,
      day: house.day,
      dayMortality: draft.dayMortality,
      nightMortality: draft.nightMortality,
      culls: draft.culls,
      feedAddedKg: draft.feedAddedKg,
      ...treatmentsPayload(draft.treatments),
    });
    setSaved({ ...saved, [house.id]: entry });
    const c = dailySaved({ houseName: house.name, ...entry });
    toast(c.toastTitle, { tone: "success", description: c.toastDescription });
    setSubmitting(false);
    // Move to the next house still to record, so the round flows on its own.
    const nextPending = houses.find((h) => h.id !== house.id && !saved[h.id]);
    if (nextPending) setSelectedId(nextPending.id);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-7 sm:px-6 sm:py-9">
      {/* Orientation — the only context the supervisor needs up top. */}
      <header className="animate-rise">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono">
          {data.siteName} · Cycle {data.cycleNo} · {data.breed}
        </p>
        <h1 className="mt-2 text-h1">{longDate(data.today)}</h1>
        <p className="mt-1.5 text-body-l text-slate">
          {allDone
            ? `All ${houses.length} houses recorded. Nice work, ${firstName}.`
            : `Today's round, ${firstName}. ${doneCount > 0 ? `${doneCount} of ${houses.length} done.` : `${houses.length} houses to record.`}`}
        </p>
      </header>

      {/* House selector — calm round progress; tap to switch. */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a house">
        {houses.map((h) => {
          const isSaved = Boolean(saved[h.id]);
          const isActive = h.id === selectedId;
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedId(h.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium",
                "transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                isActive
                  ? "bg-brand-700 text-white"
                  : isSaved
                    ? "bg-status-good-tint text-status-good"
                    : "border border-border bg-surface text-slate hover:border-brand-500",
              )}
            >
              {isSaved && !isActive ? <IconCheck className="size-3.5" /> : null}
              {h.vaccination && !isSaved ? <IconVaccine className={cn("size-3.5", isActive ? "text-brand-100" : "text-brand-600")} /> : null}
              {h.name}
            </button>
          );
        })}
      </div>

      {result ? (
        <SavedCard house={house} result={result} standing={compareToStandard(result.cumPct, house.standardCumMortPct)} allDone={allDone} />
      ) : (
        <Card key={`entry-${selectedId}`} className="animate-rise">
          <CardBody className="space-y-6 pt-5">
            {/* Which house + day — orientation tied to the selected house. */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h2">{house.name}</h2>
                <p className="text-label text-muted">Day {house.day} of the cycle · {num(house.placedCount)} placed</p>
              </div>
            </div>

            {/* Vaccination day — make it obvious and reveal the vaccines fields. */}
            {house.vaccination ? <VaccinationBanner vaccines={house.vaccination.vaccines} method={house.vaccination.method} /> : null}

            {/* The day's Ross 308 guide, as plain descriptions (never a chart). */}
            <GuidePanel house={house} />

            {/* Mortality, split day vs night — they sum to the day's total. */}
            <fieldset className="space-y-4 rounded-[var(--radius-control)] border border-divider p-4">
              <legend className="px-1 text-label font-semibold text-slate">Birds found dead</legend>
              <Stepper label="Day mortality" value={draft.dayMortality} onChange={(v) => update({ dayMortality: v })} max={2000} blankZero hint="Found dead during the day." />
              <Stepper label="Night mortality" value={draft.nightMortality} onChange={(v) => update({ nightMortality: v })} max={2000} blankZero hint="Found dead overnight." />
              <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-brand-50 px-3.5 py-2.5">
                <span className="text-label text-slate">Total today</span>
                <span className="text-data text-[1.0625rem] font-medium tabular-nums text-brand-700">{num(totalMort)}</span>
              </div>

              {/* The one calm line: how today's losses sit vs the standard. */}
              {totalMort > 0 ? <StandingLine standing={standing} /> : null}
            </fieldset>

            <Stepper label="Culls" value={draft.culls} onChange={(v) => update({ culls: v })} max={2000} blankZero hint="Birds you removed yourself." />
            <Stepper
              label="Feed added"
              value={draft.feedAddedKg}
              onChange={(v) => update({ feedAddedKg: v })}
              step={25}
              max={6000}
              suffix="kg"
              hint={house.rossIntakeG ? `Ross guide for day ${house.day}: about ${house.rossIntakeG} g a bird.` : "Hold + or − to move faster."}
            />

            {/* Optional consumables — collapsed unless it's a vaccination day. */}
            <TreatmentsPanel
              value={draft.treatments}
              onChange={(t) => update({ treatments: t })}
              highlightVaccines={Boolean(house.vaccination)}
            />

            <Button size="lg" block onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving…" : `Save ${house.name} · day ${house.day}`}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ pieces --- */

/** The vaccination-day prompt — clear, brand-blue, never alarming. */
function VaccinationBanner({ vaccines, method }: { vaccines: string[]; method: string }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-card)] bg-brand-100 p-4">
      <span className="mt-0.5 shrink-0 text-brand-700">
        <IconVaccine className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-h3 font-semibold text-brand-900">Vaccination day</p>
        <p className="mt-0.5 text-body text-brand-900/80">
          {vaccines.join(" · ")} — {method.toLowerCase()}. Record what you used below.
        </p>
      </div>
    </div>
  );
}

/** Plain-language Ross 308 guideline values for the day (no charts). */
function GuidePanel({ house }: { house: CaptureHouse }) {
  const expectedDeaths = Math.round((house.placedCount * house.standardCumMortPct) / 100);
  return (
    <dl className="space-y-2.5 rounded-[var(--radius-control)] bg-paper px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono">Ross 308 guide · day {house.day}</p>
      <GuideRow label="Target weight today" value={grams(house.rossTargetWeightG)} />
      <GuideRow
        label="Expected total deaths by today"
        value={`under ~${pct(house.standardCumMortPct)} (~${num(expectedDeaths)} birds)`}
      />
    </dl>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-body text-slate">{label}</dt>
      <dd className="text-data text-[0.9375rem] tabular-nums text-ink text-right">{value}</dd>
    </div>
  );
}

const STANDING_ICON: Record<Standing["level"], IconComponent> = {
  good: IconStatusGood,
  warn: IconStatusWarn,
  bad: IconStatusBad,
};
const STANDING_STYLE: Record<Standing["level"], string> = {
  good: "bg-status-good-tint text-status-good",
  warn: "bg-status-warn-tint text-status-warn",
  bad: "bg-status-bad-tint text-status-bad",
};

/** The single calm line comparing cumulative mortality to the day's standard. */
function StandingLine({ standing }: { standing: Standing }) {
  const Icon = STANDING_ICON[standing.level];
  return (
    <div className={cn("flex items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-2.5", STANDING_STYLE[standing.level])}>
      <Icon className="size-4 shrink-0" />
      <p className="text-body">
        <span className="font-semibold">{standing.word}</span>
        {standing.detail ? <span className="text-slate"> — {standing.detail}</span> : null}
      </p>
    </div>
  );
}

/** The confirmation after saving a house: what was recorded + the maths we did. */
function SavedCard({ house, result, standing, allDone }: { house: CaptureHouse; result: DailyEntry; standing: Standing; allDone: boolean }) {
  const c = dailySaved({ houseName: house.name, ...result });
  return (
    <Card key={`saved-${house.id}`} className="animate-rise bg-status-good-tint/40">
      <CardBody className="space-y-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-status-good">
            <IconStatusGood className="size-6" />
          </span>
          <div>
            <h2 className="text-h2">{c.headline}</h2>
            <p className="mt-1 text-body-l text-slate">{c.recorded}</p>
          </div>
        </div>

        {/* The wedge: the cumulative maths done for them. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-control)] bg-surface p-4">
          <Computed label={savedLabels.lostToday} value={num(result.cullAndMort)} />
          <Computed label={savedLabels.lostThisCycle} value={`${num(result.cumMort)} · ${pct(result.cumPct)}`} />
          <Computed label={savedLabels.stillGoing} value={num(result.birdsRemaining)} />
          <Computed label={savedLabels.vsStandard} value={standing.word} />
        </dl>

        <StandingLine standing={standing} />

        {allDone ? (
          <p className="text-body text-slate">That&apos;s every house in for today. You can close up.</p>
        ) : (
          <p className="text-body text-muted">Pick the next house above to keep going.</p>
        )}
      </CardBody>
    </Card>
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
