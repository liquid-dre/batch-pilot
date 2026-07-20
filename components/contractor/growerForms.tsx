"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/cn";
import { addDays } from "@/lib/format";
import { ageAtWeight } from "@/lib/data/ross308";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";
import { IconCheck, IconSend } from "@/components/icons";

/**
 * Shared contractor onboarding forms, extracted from the old single-page
 * `Onboarding` so each now has its own home under the Growers nav group:
 * `AddFarmScreen` (create farm + invite managers) at `/app/growers/add`, and
 * `ScheduleCycleForm` at `/app/growers/schedule`. Cycles are contractor-owned
 * (ROADMAP §9); the manager places birds against the plan the contractor sets.
 */

export function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function StatusChip({ status }: { status: string }) {
  const joined = status === "accepted";
  return (
    <span
      className={cn(
        "rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.75rem] font-semibold",
        joined ? "bg-status-good-tint text-status-good" : "bg-brand-50 text-brand-600",
      )}
    >
      {joined ? "Joined" : "Invited"}
    </span>
  );
}

/**
 * One farm the contractor owns: its code + house count + manager roster, with an
 * inline "invite another manager" form. The farm name is set once at creation and
 * is read-only thereafter.
 */
export function ContractorFarmCard({ farm }: { farm: any }) {
  const inviteManagers = useMutation(api.tenancy.inviteManagers);
  const [newEmail, setNewEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setInviting(true);
    try {
      await inviteManagers({ siteId: farm.id, emails: splitEmails(newEmail) });
      setNewEmail("");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="min-w-0 truncate text-h3 text-ink">{farm.name}</h3>
        <span className="shrink-0 font-mono text-label text-muted">{farm.farmCode}</span>
      </div>
      <p className="mt-1 text-label text-muted">{farm.houseCount} house(s) set up</p>

      <p className="mt-4 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">Managers</p>
      {farm.managers.length === 0 ? (
        <p className="text-label text-muted">None invited yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {farm.managers.map((s: any) => (
            <li key={s.email} className="flex items-center justify-between text-label">
              <span className="text-ink">{s.email}</span>
              <StatusChip status={s.status} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={invite} className="mt-3 flex gap-2">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
          placeholder="Invite another manager"
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-label text-ink outline-none focus-visible:border-brand-500"
        />
        <Button type="submit" size="sm" affordance={IconSend} loading={inviting} className="shrink-0">
          Invite
        </Button>
      </form>
    </div>
  );
}

/**
 * Contractor: schedule a cycle for one of their farms. Sets the plan the manager
 * then places birds against: breed, start + collection dates, target weight range
 * (pre-filled from the benchmark default), total birds. The Estimate button fills
 * the collection date from the range midpoint via the breed curve. `initialSiteId`
 * pre-selects the farm (deep-linked from a grower card's "Schedule cycle").
 */
export function ScheduleCycleForm({ farms, initialSiteId }: { farms: any[]; initialSiteId?: string }) {
  const bench = useQuery(api.benchmark.myBenchmark);
  const scheduleCycle = useMutation(api.tenancy.scheduleCycle);
  const preset = initialSiteId && farms.some((f) => f.id === initialSiteId) ? initialSiteId : farms[0]?.id ?? "";
  const [siteId, setSiteId] = useState(preset);
  const [cycleNo, setCycleNo] = useState("1");
  const [breed, setBreed] = useState("Ross 308");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [minG, setMinG] = useState("");
  const [maxG, setMaxG] = useState("");
  const [total, setTotal] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill the weight range from the contractor's benchmark default once loaded.
  const defMin = bench?.targetWeightMinG ?? 1600;
  const defMax = bench?.targetWeightMaxG ?? 1700;
  const minVal = minG === "" ? String(defMin) : minG;
  const maxVal = maxG === "" ? String(defMax) : maxG;

  function estimateEnd() {
    if (!start) return;
    const mid = (Number(minVal) + Number(maxVal)) / 2;
    if (!(mid > 0)) return;
    setEnd(addDays(start, Math.round(ageAtWeight(mid))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!siteId) return setError("Pick a farm.");
    if (!start || !end) return setError("Enter the start and collection dates.");
    setPending(true);
    try {
      await notify.promise(
        scheduleCycle({
          siteId,
          cycleNo: Number(cycleNo) || 1,
          breed,
          placementDate: start,
          expectedCollectionDate: end,
          targetWeightMinG: Number(minVal) || undefined,
          targetWeightMaxG: Number(maxVal) || undefined,
          totalBirds: Number(total) || undefined,
        }),
        {
          loading: "Scheduling cycle…",
          success: () => ({ title: "Cycle scheduled", description: "The manager can now place birds for it." }),
          error: () => ({ title: "Couldn't schedule the cycle", description: "Check the cycle number isn't already used." }),
        },
      );
      setStart("");
      setEnd("");
      setTotal("");
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  const field = "h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500";

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <h3 className="text-h3">Schedule a cycle</h3>
      <p className="mt-1 text-label text-muted">Set the plan — the manager places the birds and captures against it.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Farm</span>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={field}>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Cycle no.</span>
          <input value={cycleNo} inputMode="numeric" onChange={(e) => setCycleNo(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} font-mono`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Breed</span>
          <input value={breed} onChange={(e) => setBreed(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Total birds</span>
          <input value={total} inputMode="numeric" placeholder="e.g. 22000" onChange={(e) => setTotal(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} font-mono`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Start date</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Collection date</span>
          <div className="flex gap-2">
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={`${field} flex-1`} />
            <Button type="button" variant="secondary" size="sm" onClick={estimateEnd} className="shrink-0">Estimate</Button>
          </div>
        </label>
      </div>
      <div className="mt-3">
        <span className="text-label font-medium text-slate">Target weight range (g)</span>
        <div className="mt-1.5 flex items-center gap-2">
          <input value={minVal} inputMode="numeric" aria-label="Min target weight" onChange={(e) => setMinG(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} w-28 text-right font-mono`} />
          <span className="text-label text-muted">–</span>
          <input value={maxVal} inputMode="numeric" aria-label="Max target weight" onChange={(e) => setMaxG(e.target.value.replace(/[^0-9]/g, ""))} className={`${field} w-28 text-right font-mono`} />
          <span className="text-label text-muted">g</span>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
      <Button type="submit" size="lg" block loading={pending} affordance={IconCheck} className="mt-4">
        Schedule cycle
      </Button>
    </form>
  );
}
