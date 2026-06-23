"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyEntry, TreatmentEntry } from "@/lib/types";
import type { DailyFormData, FormHouse } from "@/lib/view";
import { submitDailyUpdate } from "@/lib/data";
import { num, pct, kg } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconCheck, IconChevronDown, IconPlus, IconTrash } from "@/components/icons";
import { cn } from "@/lib/cn";

/** A vaccine/medication row being captured (name + amount + unit). */
interface TreatmentRow {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface Draft {
  dayMortality: number;
  nightMortality: number;
  culls: number;
  feedAddedKg: number;
  tempEnabled: boolean;
  tempC: number;
  // optional consumables (collapsed by default)
  extrasOpen: boolean;
  charcoalEnabled: boolean;
  charcoalKg: number;
  vaccines: TreatmentRow[];
  medications: TreatmentRow[];
}

function initialDrafts(houses: FormHouse[]): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  for (const h of houses) {
    out[h.id] = {
      dayMortality: 0,
      nightMortality: 0,
      culls: 0,
      feedAddedKg: h.lastFeedKg,
      tempEnabled: false,
      tempC: 22,
      extrasOpen: false,
      charcoalEnabled: false,
      charcoalKg: 0,
      vaccines: [],
      medications: [],
    };
  }
  return out;
}

let rowSeq = 0;
const newRow = (unit: string): TreatmentRow => ({ id: `r${rowSeq++}`, name: "", amount: 0, unit });

/** Keep only the rows the grower actually filled in (a name + a positive amount). */
function cleanTreatments(rows: TreatmentRow[]): TreatmentEntry[] {
  return rows
    .filter((r) => r.name.trim() !== "" && r.amount > 0)
    .map((r) => ({ name: r.name.trim(), amount: r.amount, unit: r.unit.trim() || "unit" }));
}

const CheckGlyph = () => <IconCheck className="size-4" />;

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
  const totalMort = draft.dayMortality + draft.nightMortality;

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
      dayMortality: draft.dayMortality,
      nightMortality: draft.nightMortality,
      culls: draft.culls,
      feedAddedKg: draft.feedAddedKg,
      tempC: draft.tempEnabled ? draft.tempC : undefined,
      charcoal: draft.charcoalEnabled && draft.charcoalKg > 0 ? { amount: draft.charcoalKg, unit: "kg" } : undefined,
      vaccines: cleanTreatments(draft.vaccines),
      medications: cleanTreatments(draft.medications),
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

            {/* Mortality, split day vs night — they sum to the day's total. */}
            <fieldset className="space-y-4 rounded-[var(--radius-control)] border border-divider p-4">
              <legend className="flex items-center gap-2 px-1 text-label font-semibold text-slate">
                Mortality
              </legend>
              <Stepper label="Day mortality" value={draft.dayMortality} onChange={(v) => update({ dayMortality: v })} max={2000} hint="Found dead during the day." />
              <Stepper label="Night mortality" value={draft.nightMortality} onChange={(v) => update({ nightMortality: v })} max={2000} hint="Found dead overnight." />
              <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-brand-50 px-3.5 py-2.5">
                <span className="text-label text-slate">Total mortality</span>
                <span className="text-data text-[1.0625rem] font-medium tabular-nums text-brand-700">{num(totalMort)}</span>
              </div>
            </fieldset>

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

            {/* Optional consumables — collapsed by default to keep the round fast. */}
            <Extras draft={draft} update={update} />

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
                {num(result.mortality)} dead ({num(result.dayMortality)} day · {num(result.nightMortality)} night), {num(result.culls)} culls, {kg(result.feedAddedKg)} feed
                {result.tempC !== undefined ? `, ${result.tempC}°C` : ""}.
              </p>
              {result.charcoal || (result.vaccines && result.vaccines.length) || (result.medications && result.medications.length) ? (
                <p className="mt-1.5 text-body text-muted">{treatmentsSummary(result)}</p>
              ) : null}
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

/** One plain-language line summarising any optional consumables on an entry. */
function treatmentsSummary(e: DailyEntry): string {
  const parts: string[] = [];
  if (e.charcoal) parts.push(`${num(e.charcoal.amount)} ${e.charcoal.unit} charcoal`);
  for (const v of e.vaccines ?? []) parts.push(`${v.name} ${num(v.amount)} ${v.unit}`);
  for (const m of e.medications ?? []) parts.push(`${m.name} ${num(m.amount)} ${m.unit}`);
  return parts.join(" · ");
}

/* ----------------------------------------------------- Optional consumables --- */

function Extras({ draft, update }: { draft: Draft; update: (partial: Partial<Draft>) => void }) {
  const count =
    (draft.charcoalEnabled && draft.charcoalKg > 0 ? 1 : 0) +
    draft.vaccines.filter((r) => r.name.trim() && r.amount > 0).length +
    draft.medications.filter((r) => r.name.trim() && r.amount > 0).length;

  return (
    <div className="rounded-[var(--radius-control)] border border-divider">
      <button
        type="button"
        onClick={() => update({ extrasOpen: !draft.extrasOpen })}
        aria-expanded={draft.extrasOpen}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-label font-semibold text-slate"
      >
        <span className="flex items-center gap-2">
          Treatments &amp; additives
          <span className="text-label font-normal text-muted">optional</span>
          {count > 0 ? (
            <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-brand-100 px-2 py-0.5 text-[0.75rem] font-semibold text-brand-700">
              {count}
            </span>
          ) : null}
        </span>
        <IconChevronDown className={cn("size-4 shrink-0 text-muted transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]", draft.extrasOpen ? "" : "-rotate-90")} />
      </button>

      {draft.extrasOpen ? (
        <div className="space-y-6 border-t border-divider px-4 py-5">
          {/* Charcoal — amount + unit, no name. */}
          {draft.charcoalEnabled ? (
            <Stepper label="Charcoal used" value={draft.charcoalKg} onChange={(v) => update({ charcoalKg: v })} step={1} max={500} suffix="kg" />
          ) : (
            <button
              type="button"
              onClick={() => update({ charcoalEnabled: true, charcoalKg: 1 })}
              className="text-label font-medium text-brand-600 hover:text-brand-700"
            >
              + Add charcoal
            </button>
          )}

          <TreatmentList
            heading="Vaccines used"
            namePlaceholder="Vaccine name (e.g. Gumboro)"
            defaultUnit="doses"
            rows={draft.vaccines}
            onChange={(rows) => update({ vaccines: rows })}
          />

          <TreatmentList
            heading="Medications used"
            namePlaceholder="Medication name"
            defaultUnit="mL"
            rows={draft.medications}
            onChange={(rows) => update({ medications: rows })}
          />
        </div>
      ) : null}
    </div>
  );
}

function TreatmentList({
  heading,
  namePlaceholder,
  defaultUnit,
  rows,
  onChange,
}: {
  heading: string;
  namePlaceholder: string;
  defaultUnit: string;
  rows: TreatmentRow[];
  onChange: (rows: TreatmentRow[]) => void;
}) {
  const setRow = (id: string, partial: Partial<TreatmentRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  return (
    <div className="space-y-3">
      <p className="text-label font-semibold text-slate">{heading}</p>
      {rows.map((row) => (
        <div key={row.id} className="space-y-3 rounded-[var(--radius-control)] bg-paper p-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={`${heading} name`}
              placeholder={namePlaceholder}
              value={row.name}
              onChange={(e) => setRow(row.id, { name: e.target.value })}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label={`Remove ${row.name || "row"}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-status-bad-tint hover:text-status-bad"
            >
              <IconTrash className="size-5" />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Stepper label="Amount" value={row.amount} onChange={(v) => setRow(row.id, { amount: v })} step={1} max={100000} />
            </div>
            <Input
              aria-label={`${heading} unit`}
              value={row.unit}
              onChange={(e) => setRow(row.id, { unit: e.target.value })}
              className="w-24 text-center"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, newRow(defaultUnit)])}
        className="inline-flex items-center gap-1.5 text-label font-medium text-brand-600 hover:text-brand-700"
      >
        <IconPlus className="size-4" />
        Add {heading.replace(" used", "").toLowerCase().replace(/s$/, "")}
      </button>
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
