"use client";

import { useState } from "react";
import type { EditableField, EditRecord } from "@/lib/types";
import type { HouseDayRow } from "@/lib/view";
import type { WeightCompareMode } from "@/lib/weightCompare";
import { compactGap, vsBenchmark } from "@/lib/weightCompare";
import { num, pct, kg, grams, shortDate } from "@/lib/format";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { IconEdit, IconUser } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface HouseHistoryTableProps {
  rows: HouseDayRow[];
  /** Ross objective weight by day, for the vs-target gap on weigh days. */
  rossByDay: Map<number, number>;
  compareMode: WeightCompareMode;
  /** Managers may correct captured values; supervisors/contractors see read-only. */
  canEdit: boolean;
  /** Audit records grouped by entry id (newest first within each). */
  editsByEntry: Map<string, EditRecord[]>;
  onSave: (entryId: string, changes: Partial<Record<EditableField, number | null>>) => Promise<void>;
}

interface Draft {
  dayMortality: number;
  nightMortality: number;
  culls: number;
  feedAddedKg: number;
  tempC: number;
}

/** ISO timestamp → "23 Jun 2026 · 10:30" (UTC-safe, matches our date helpers). */
function stamp(iso: string): string {
  return `${shortDate(iso.slice(0, 10))} · ${iso.slice(11, 16)}`;
}

const COL_COUNT_BASE = 11; // Day…Unif

/**
 * Per-house day-by-day table. For managers it adds the maker-checker edit path:
 * a deliberate, attributed correction of any captured value. Corrected entries
 * are marked "Edited" for everyone, and the change (who/when/old→new) is viewable
 * inline. Supervisors capture; managers correct.
 */
export function HouseHistoryTable({ rows, rossByDay, compareMode, canEdit, editsByEntry, onSave }: HouseHistoryTableProps) {
  const [openEditor, setOpenEditor] = useState<string | null>(null);
  const [openChanges, setOpenChanges] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const colCount = COL_COUNT_BASE + (canEdit ? 1 : 0);

  function startEdit(row: HouseDayRow) {
    if (!row.entryId) return;
    setOpenChanges(null);
    setOpenEditor(row.entryId);
    setDraft({
      dayMortality: row.dayMortality ?? 0,
      nightMortality: row.nightMortality ?? 0,
      culls: row.culls ?? 0,
      feedAddedKg: row.feedAddedKg ?? 0,
      tempC: row.tempC ?? 0,
    });
  }

  async function save(row: HouseDayRow) {
    if (!row.entryId || !draft) return;
    // Only send fields the manager actually changed (each becomes an audit record).
    const changes: Partial<Record<EditableField, number | null>> = {};
    if (draft.dayMortality !== (row.dayMortality ?? 0)) changes.dayMortality = draft.dayMortality;
    if (draft.nightMortality !== (row.nightMortality ?? 0)) changes.nightMortality = draft.nightMortality;
    if (draft.culls !== (row.culls ?? 0)) changes.culls = draft.culls;
    if (draft.feedAddedKg !== (row.feedAddedKg ?? 0)) changes.feedAddedKg = draft.feedAddedKg;
    // Temp: 0 in the stepper clears the optional reading.
    const nextTemp = draft.tempC > 0 ? draft.tempC : null;
    if (nextTemp !== (row.tempC ?? null)) changes.tempC = nextTemp;

    if (Object.keys(changes).length === 0) {
      setOpenEditor(null);
      setDraft(null);
      return;
    }
    setSaving(true);
    try {
      await onSave(row.entryId, changes);
      setOpenEditor(null);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Table>
      <THead>
        <TR className="bg-transparent hover:bg-transparent">
          <TH num>Day</TH>
          <TH>Date</TH>
          <TH num>Deaths</TH>
          <TH num>Culls</TH>
          <TH num>Cum mort</TH>
          <TH num>Cum %</TH>
          <TH num>Feed</TH>
          <TH num>Temp</TH>
          <TH num>Wt</TH>
          <TH num>ADG</TH>
          <TH num>Unif</TH>
          {canEdit ? <TH>{""}</TH> : null}
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => {
          const edits = r.entryId ? editsByEntry.get(r.entryId) : undefined;
          const isEdited = !!edits?.length;
          const target = r.weigh ? rossByDay.get(r.day) : undefined;
          return (
            <RowGroup key={r.day}>
              <TR>
                <TD num className="text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    {r.day}
                    {isEdited ? (
                      <EditedBadge
                        count={edits!.length}
                        open={openChanges === r.entryId}
                        onClick={() => {
                          setOpenEditor(null);
                          setOpenChanges((prev) => (prev === r.entryId ? null : r.entryId!));
                        }}
                      />
                    ) : null}
                  </span>
                </TD>
                <TD>{shortDate(r.date)}</TD>
                <TD num>{num(r.mortality)}</TD>
                <TD num>{num(r.culls)}</TD>
                <TD num>{num(r.cumMort)}</TD>
                <TD num>{pct(r.cumPct)}</TD>
                <TD num>{kg(r.feedAddedKg)}</TD>
                <TD num>{r.tempC !== undefined ? `${r.tempC}°` : "—"}</TD>
                <TD num>
                  {r.weigh ? (
                    <span className="inline-flex flex-col items-end">
                      <span>{grams(r.weigh.avgWeightG)}</span>
                      {target ? (
                        <span className="text-[0.6875rem] font-normal text-muted">
                          {compactGap(vsBenchmark(r.weigh.avgWeightG, target), compareMode)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD num>{r.weigh ? `${r.weigh.adgG} g` : "—"}</TD>
                <TD num>{r.weigh ? `${r.weigh.uniformityPct}%` : "—"}</TD>
                {canEdit ? (
                  <TD className="text-right">
                    {r.entryId ? (
                      <button
                        type="button"
                        onClick={() => (openEditor === r.entryId ? setOpenEditor(null) : startEdit(r))}
                        aria-label={`Correct day ${r.day}`}
                        aria-expanded={openEditor === r.entryId}
                        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-control)] text-slate transition-colors duration-[var(--dur-fast)] hover:bg-brand-50 hover:text-brand-700"
                      >
                        <IconEdit className="size-4" />
                      </button>
                    ) : null}
                  </TD>
                ) : null}
              </TR>

              {openEditor === r.entryId && draft ? (
                <ExpanderRow colCount={colCount}>
                  <EditPanel
                    day={r.day}
                    draft={draft}
                    saving={saving}
                    onChange={(partial) => setDraft((d) => (d ? { ...d, ...partial } : d))}
                    onCancel={() => {
                      setOpenEditor(null);
                      setDraft(null);
                    }}
                    onSave={() => save(r)}
                  />
                </ExpanderRow>
              ) : null}

              {openChanges === r.entryId && edits ? (
                <ExpanderRow colCount={colCount}>
                  <ChangeLog records={edits} />
                </ExpanderRow>
              ) : null}
            </RowGroup>
          );
        })}
      </TBody>
    </Table>
  );
}

/** Renders sibling rows without an extra DOM wrapper (rows live in <tbody>). */
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function ExpanderRow({ colCount, children }: { colCount: number; children: React.ReactNode }) {
  return (
    <tr className="bg-brand-50/40">
      <td colSpan={colCount} className="px-4 py-4">
        {children}
      </td>
    </tr>
  );
}

function EditedBadge({ count, open, onClick }: { count: number; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide",
        "bg-brand-100 text-brand-700 transition-colors duration-[var(--dur-fast)] hover:bg-brand-100/70",
      )}
      title="Edited by manager — view changes"
    >
      <IconEdit className="size-3" aria-hidden />
      Edited{count > 1 ? ` ×${count}` : ""}
    </button>
  );
}

function EditPanel({
  day,
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  day: number;
  draft: Draft;
  saving: boolean;
  onChange: (partial: Partial<Draft>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconEdit className="size-4 text-brand-700" aria-hidden />
        <p className="text-label font-semibold text-ink">Correct day {day}</p>
        <span className="text-label text-muted">Each change is recorded with your name and the old value.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stepper label="Day mortality" value={draft.dayMortality} min={0} max={9999} onChange={(v) => onChange({ dayMortality: v })} />
        <Stepper label="Night mortality" value={draft.nightMortality} min={0} max={9999} onChange={(v) => onChange({ nightMortality: v })} />
        <Stepper label="Culls" value={draft.culls} min={0} max={9999} onChange={(v) => onChange({ culls: v })} />
        <Stepper label="Feed added" value={draft.feedAddedKg} min={0} max={99999} step={5} suffix="kg" onChange={(v) => onChange({ feedAddedKg: v })} />
        <Stepper label="Temperature (0 = none)" value={draft.tempC} min={0} max={45} step={1} decimals={1} suffix="°C" onChange={(v) => onChange({ tempC: v })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="default" onClick={onSave} disabled={saving}>
          {saving ? "Saving correction…" : "Save correction"}
        </Button>
        <Button size="default" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ChangeLog({ records }: { records: EditRecord[] }) {
  return (
    <div className="space-y-3">
      <p className="text-label font-semibold text-ink">Change history</p>
      <ul className="space-y-2.5">
        {records.map((rec) => (
          <li key={rec.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-body">
            <span className="font-medium text-ink">{rec.fieldLabel}</span>
            <span className="font-mono tabular-nums text-slate">
              {rec.oldValue ?? "—"} <span className="text-muted">→</span> {rec.newValue ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1 text-label text-muted">
              <IconUser className="size-3.5" aria-hidden />
              {rec.editedByName} ({rec.editedByRole}) · {stamp(rec.editedAt)}
            </span>
            {rec.note ? <span className="basis-full text-label text-muted">“{rec.note}”</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
