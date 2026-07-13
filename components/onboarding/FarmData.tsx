"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dailySaved } from "@/lib/copy";

/**
 * Stage 2b — the capture → review loop, both on the reactive `farm.farmData`
 * query. A supervisor's saved daily update re-fires the query, so the manager's
 * review panel (and any other open screen) updates live for the same farm.
 */

/* --------------------------------------------------------- Supervisor: capture -- */

export function CapturePanel() {
  const data = useQuery(api.farm.farmData);
  if (!data || !data.cycle || data.houses.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="text-h3">Today&apos;s capture</h3>
      <p className="mt-1 text-label text-muted">Enter what you counted this round. The cumulative maths is done for you.</p>
      <div className="mt-4 flex flex-col gap-3">
        {data.houses.map((h: any) => (
          <CaptureHouseCard key={h.houseId} house={h} today={data.today} />
        ))}
      </div>
    </div>
  );
}

function CaptureHouseCard({ house, today }: { house: any; today: string }) {
  const submit = useMutation(api.writes.submitDailyUpdate);
  const [dayM, setDayM] = useState("");
  const [nightM, setNightM] = useState("");
  const [culls, setCulls] = useState("");
  const [feed, setFeed] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = (Number(dayM) || 0) + (Number(nightM) || 0);

  async function save() {
    setPending(true);
    setSaved(null);
    setError(null);
    try {
      const res: any = await submit({
        houseId: house.houseId,
        date: today,
        day: house.dayToRecord,
        dayMortality: Number(dayM) || 0,
        nightMortality: Number(nightM) || 0,
        culls: Number(culls) || 0,
        feedAddedKg: Number(feed) || 0,
      });
      setSaved(
        dailySaved({
          houseName: house.name,
          day: res.day,
          mortality: (Number(dayM) || 0) + (Number(nightM) || 0),
          dayMortality: Number(dayM) || 0,
          nightMortality: Number(nightM) || 0,
          culls: Number(culls) || 0,
          feedAddedKg: Number(feed) || 0,
          cumMort: res.cumMort,
          cumPct: res.cumPct ?? 0,
          birdsRemaining: res.birdsRemaining,
        }).banner,
      );
      setDayM("");
      setNightM("");
      setCulls("");
      setFeed("");
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h4 className="text-h3">{house.name}</h4>
        <span className="text-label text-muted">Recording day {house.dayToRecord}</span>
      </div>
      <p className="mt-0.5 text-label text-muted">
        {house.remaining.toLocaleString()} birds on the floor · {house.priorCumPct}% cumulative so far
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={`Day mortality`} value={dayM} onChange={setDayM} />
        <Field label={`Night mortality`} value={nightM} onChange={setNightM} />
        <Field label="Culls" value={culls} onChange={setCulls} />
        <Field label="Feed added (kg)" value={feed} onChange={setFeed} decimal />
      </div>
      <p className="mt-2 text-label text-muted">Deaths this round: <span className="font-mono text-ink">{total}</span></p>

      {saved && <p className="mt-3 rounded-[var(--radius-control)] bg-status-good-tint px-3 py-2 text-label text-status-good">{saved}</p>}
      {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 inline-flex h-[52px] items-center justify-center rounded-[var(--radius-control)] bg-brand-700 px-6 text-[1.0625rem] font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : `Save ${house.name}`}
      </button>
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

/* ------------------------------------------------------------ Manager: review -- */

export function ReviewPanel() {
  const data = useQuery(api.farm.farmData);
  if (!data || !data.cycle) return null;
  const anyData = data.houses.some((h: any) => h.latest);

  return (
    <div className="mt-6">
      <h3 className="text-h3">Captured so far</h3>
      {!anyData ? (
        <p className="mt-2 rounded-[var(--radius-card)] border border-dashed border-border bg-paper p-5 text-body text-slate">
          No daily numbers captured yet. They&apos;ll appear here live as the supervisor records each round.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {data.houses.map((h: any) => (
            <HouseReview key={h.houseId} house={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HouseReview({ house }: { house: any }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h4 className="text-h3">{house.name}</h4>
        <span className="text-label text-muted">
          {house.latest ? `day ${house.latest.day}` : "no data"}
        </span>
      </div>
      {house.latest ? (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-label sm:grid-cols-4">
            <Stat label="Cum. deaths" value={house.latest.cumMort.toLocaleString()} />
            <Stat label="Cum. %" value={`${house.latest.cumPct}%`} />
            <Stat label="Remaining" value={house.latest.birdsRemaining.toLocaleString()} />
            <Stat label="Feed today" value={`${house.latest.feedAddedKg} kg`} />
          </dl>
          {house.recentDays.length > 1 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-label">
                <thead>
                  <tr className="text-hint">
                    <th className="py-1 text-left font-medium">Day</th>
                    <th className="py-1 text-right font-medium">Deaths</th>
                    <th className="py-1 text-right font-medium">Culls</th>
                    <th className="py-1 text-right font-medium">Cum %</th>
                    <th className="py-1 text-right font-medium">Remaining</th>
                    <th className="py-1 text-right font-medium">Feed kg</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-ink">
                  {house.recentDays.map((d: any) => (
                    <tr key={d.day} className="border-t border-divider">
                      <td className="py-1 text-left">{d.day}</td>
                      <td className="py-1 text-right">{d.mortality}</td>
                      <td className="py-1 text-right">{d.culls}</td>
                      <td className="py-1 text-right">{d.cumPct}%</td>
                      <td className="py-1 text-right">{d.birdsRemaining.toLocaleString()}</td>
                      <td className="py-1 text-right">{d.feedAddedKg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-label text-muted">No data captured for this house yet.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">{label}</dt>
      <dd className="font-mono text-body text-ink">{value}</dd>
    </div>
  );
}
