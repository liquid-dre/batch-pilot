"use client";

import type { Amount, TreatmentEntry } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { IconChevronDown, IconPlus, IconTrash, IconVaccine } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Shared "Treatments & additives" capture — the optional, collapsed-by-default
 * consumables (charcoal, vaccines, medications) on a daily entry. Controlled, so
 * both the supervisor capture screen and the daily-update form keep the value in
 * their own per-house draft. Vaccination days can highlight the vaccines block
 * (and pre-seed a row) so the supervisor sees exactly what to log.
 */

export interface TreatmentRow {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface TreatmentsValue {
  open: boolean;
  charcoalEnabled: boolean;
  charcoalKg: number;
  vaccines: TreatmentRow[];
  medications: TreatmentRow[];
}

let rowSeq = 0;
export const newTreatmentRow = (unit: string): TreatmentRow => ({ id: `tr${rowSeq++}`, name: "", amount: 0, unit });

export function emptyTreatments(open = false): TreatmentsValue {
  return { open, charcoalEnabled: false, charcoalKg: 0, vaccines: [], medications: [] };
}

/** Keep only rows the grower actually filled in (a name + a positive amount). */
export function cleanTreatments(rows: TreatmentRow[]): TreatmentEntry[] {
  return rows
    .filter((r) => r.name.trim() !== "" && r.amount > 0)
    .map((r) => ({ name: r.name.trim(), amount: r.amount, unit: r.unit.trim() || "unit" }));
}

/** The submit payload (charcoal/vaccines/medications) derived from a value. */
export function treatmentsPayload(v: TreatmentsValue): {
  charcoal?: Amount;
  vaccines: TreatmentEntry[];
  medications: TreatmentEntry[];
} {
  return {
    charcoal: v.charcoalEnabled && v.charcoalKg > 0 ? { amount: v.charcoalKg, unit: "kg" } : undefined,
    vaccines: cleanTreatments(v.vaccines),
    medications: cleanTreatments(v.medications),
  };
}

/** How many consumables are filled in (for the collapsed-state count badge). */
export function treatmentsCount(v: TreatmentsValue): number {
  return (
    (v.charcoalEnabled && v.charcoalKg > 0 ? 1 : 0) +
    v.vaccines.filter((r) => r.name.trim() && r.amount > 0).length +
    v.medications.filter((r) => r.name.trim() && r.amount > 0).length
  );
}

export function TreatmentsPanel({
  value,
  onChange,
  highlightVaccines = false,
}: {
  value: TreatmentsValue;
  onChange: (next: TreatmentsValue) => void;
  /** On a vaccination day, draw the eye to the vaccines block. */
  highlightVaccines?: boolean;
}) {
  const set = (partial: Partial<TreatmentsValue>) => onChange({ ...value, ...partial });
  const count = treatmentsCount(value);

  return (
    <div className="rounded-[var(--radius-control)] border border-divider">
      <button
        type="button"
        onClick={() => set({ open: !value.open })}
        aria-expanded={value.open}
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
        <IconChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            value.open ? "" : "-rotate-90",
          )}
        />
      </button>

      {value.open ? (
        <div className="space-y-6 border-t border-divider px-4 py-5">
          {/* Charcoal — amount + unit, no name. */}
          {value.charcoalEnabled ? (
            <Stepper label="Charcoal used" value={value.charcoalKg} onChange={(v) => set({ charcoalKg: v })} step={1} max={500} suffix="kg" />
          ) : (
            <button
              type="button"
              onClick={() => set({ charcoalEnabled: true, charcoalKg: 1 })}
              className="text-label font-medium text-brand-600 hover:text-brand-700"
            >
              + Add charcoal
            </button>
          )}

          <TreatmentList
            heading="Vaccines used"
            namePlaceholder="Vaccine name (e.g. Gumboro)"
            defaultUnit="doses"
            rows={value.vaccines}
            highlight={highlightVaccines}
            onChange={(rows) => set({ vaccines: rows })}
          />

          <TreatmentList
            heading="Medications used"
            namePlaceholder="Medication name"
            defaultUnit="mL"
            rows={value.medications}
            onChange={(rows) => set({ medications: rows })}
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
  highlight = false,
  onChange,
}: {
  heading: string;
  namePlaceholder: string;
  defaultUnit: string;
  rows: TreatmentRow[];
  highlight?: boolean;
  onChange: (rows: TreatmentRow[]) => void;
}) {
  const setRow = (id: string, partial: Partial<TreatmentRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  return (
    <div className={cn("space-y-3", highlight && "rounded-[var(--radius-control)] bg-brand-50 p-3 ring-1 ring-brand-100")}>
      <p className="flex items-center gap-1.5 text-label font-semibold text-slate">
        {highlight ? <IconVaccine className="size-4 text-brand-700" /> : null}
        {heading}
      </p>
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
              <Stepper label="Amount" value={row.amount} onChange={(v) => setRow(row.id, { amount: v })} step={1} max={100000} blankZero />
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
        onClick={() => onChange([...rows, newTreatmentRow(defaultUnit)])}
        className="inline-flex items-center gap-1.5 text-label font-medium text-brand-600 hover:text-brand-700"
      >
        <IconPlus className="size-4" />
        Add {heading.replace(" used", "").toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}
