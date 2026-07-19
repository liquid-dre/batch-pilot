"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconSend, IconPlus } from "@/components/icons";
import { ReviewPanel } from "./FarmData";

/**
 * Onboarding hub (stage 1 — the multi-tenant identity loop). Rendered as the
 * `/app` home when Convex is connected, replacing the demo dashboards:
 *   - Contractor: create farms + invite supervisors, see who's joined.
 *   - Supervisor: see their farm + invite managers.
 *   - Manager: see their farm.
 * Farm data (houses, cycle, capture) is stage 2 — noted inline.
 */

function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function Onboarding() {
  const workspace = useQuery(api.tenancy.myWorkspace);

  if (workspace === undefined) {
    return <div className="p-6 text-body text-muted">Loading your workspace…</div>;
  }
  if (workspace === null) {
    return <div className="p-6 text-body text-muted">You are not signed in.</div>;
  }

  if (workspace.role === "contractor") return <ContractorOnboarding workspace={workspace} />;
  if (workspace.role === "supervisor") return <SupervisorOnboarding workspace={workspace} />;
  if (workspace.role === "manager") return <ManagerOnboarding workspace={workspace} />;
  return <PendingState email={workspace.email} />;
}

/* ------------------------------------------------------------- Contractor -- */

function ContractorOnboarding({ workspace }: { workspace: any }) {
  const createFarm = useMutation(api.tenancy.createFarm);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const farms: any[] = workspace.farms ?? [];

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a farm name.");
      return;
    }
    setPending(true);
    try {
      await createFarm({ name: name.trim(), managerEmails: splitEmails(emails) });
      setName("");
      setEmails("");
    } catch {
      setError("Could not create the farm. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Your growers" subtitle={`Signed in as ${workspace.email} · contractor`}>
      {farms.length === 0 ? (
        <EmptyHint>Add your first grower&apos;s farm below, then invite the manager who runs it.</EmptyHint>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {farms.map((f) => (
            <ContractorFarmCard key={f.id} farm={f} />
          ))}
        </div>
      )}

      <form onSubmit={onCreate} className="mt-6 rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">Add a farm</h3>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Farm name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverside Broilers"
            className="h-[52px] rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
          />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Manager email(s)</span>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="manager@example.com, another@example.com"
            className="rounded-[var(--radius-control)] border border-border bg-surface p-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
          />
          <span className="text-[0.8125rem] text-muted">Separate multiple emails with commas or new lines. They join when they sign up with that email.</span>
        </label>
        {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
        <Button type="submit" size="lg" block loading={pending} affordance={IconCheck} className="mt-4">
          Create farm &amp; invite
        </Button>
      </form>
      {/* Co-admins moved to /app/account (the account Team panel) — one home for peer invites. */}
    </Shell>
  );
}

function ContractorFarmCard({ farm }: { farm: any }) {
  // The farm name is set once at creation and is read-only thereafter for the
  // contractor (there is no rename path — UI or mutation). Managers are the
  // contractor's to invite; the manager then brings in the foremen.
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

/* ------------------------------------------------------------- Supervisor -- */
// The foreman captures the daily numbers — they don't set the farm up. Before a
// cycle is running there's nothing for them to do but wait on the manager; once
// it starts, the home becomes the capture dashboard (GrowerHomeConvex).

function SupervisorOnboarding({ workspace }: { workspace: any }) {
  if (!workspace.farm) return <PendingState email={workspace.email} />;
  return (
    <Shell title={workspace.farm.name} subtitle={`Foreman · ${workspace.email}`}>
      <FarmCard farm={workspace.farm} />
      <div className="mt-6 rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">Waiting on the cycle</h3>
        <p className="mt-2 text-body text-slate">
          Your manager sets up the houses and starts the cycle. The moment it&apos;s running, this
          becomes your daily capture home — today&apos;s numbers, weigh-ins and feed.
        </p>
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------- Manager -- */
// The manager runs the farm: invites the foremen, sets up houses, starts the
// cycle, and reviews/corrects captured numbers.

function ManagerOnboarding({ workspace }: { workspace: any }) {
  const inviteSupervisors = useMutation(api.tenancy.inviteSupervisors);
  const [emails, setEmails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!workspace.farm) return <PendingState email={workspace.email} />;

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const list = splitEmails(emails);
    if (list.length === 0) {
      setError("Enter at least one email.");
      return;
    }
    setPending(true);
    try {
      await inviteSupervisors({ emails: list });
      setEmails("");
    } catch {
      setError("Could not send the invites. Try again.");
    } finally {
      setPending(false);
    }
  }

  const supervisors: any[] = workspace.supervisors ?? [];

  return (
    <Shell title={workspace.farm.name} subtitle={`Manager · ${workspace.email}`}>
      <FarmCard farm={workspace.farm} />

      <form onSubmit={onInvite} className="mt-6 rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">Invite your foreman(s)</h3>
        <p className="mt-1 text-label text-muted">Foremen capture the daily numbers, weigh-ins and feed on the ground.</p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Foreman email(s)</span>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="foreman@example.com"
            className="rounded-[var(--radius-control)] border border-border bg-surface p-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
          />
        </label>
        {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
        <Button type="submit" size="lg" block affordance={IconSend} loading={pending} className="mt-4">
          Send invite
        </Button>

        {supervisors.length > 0 && (
          <ul className="mt-5 flex flex-col gap-1 border-t border-divider pt-4">
            {supervisors.map((s) => (
              <li key={s.email} className="flex items-center justify-between text-label">
                <span className="text-ink">{s.email}</span>
                <StatusChip status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </form>

      <ReviewPanel />
      <FarmSetup workspace={workspace} />
      <NextStepNote>Your full dashboard — projections, benchmark curve and alerts — appears here the moment your cycle is running.</NextStepNote>
    </Shell>
  );
}

/* --------------------------------------------------------------- FarmSetup -- */
// Houses + growing cycle for the farm (grower-configured). The cycle form reads
// the *saved* houses, so houses must be saved before a cycle can start.

function FarmSetup({ workspace }: { workspace: any }) {
  const houses: any[] = workspace.houses ?? [];
  const cycle = workspace.cycle ?? null;
  return (
    <div className="mt-6 flex flex-col gap-6">
      <HousesEditor initial={houses} />
      <CycleSection houses={houses} cycle={cycle} />
    </div>
  );
}

function HousesEditor({ initial }: { initial: any[] }) {
  const setHouses = useMutation(api.tenancy.setHouses);
  const [rows, setRows] = useState<{ id?: string; name: string; capacity: string }[]>(
    initial.length
      ? initial.map((h) => ({ id: h.id, name: h.name, capacity: String(h.capacity) }))
      : [{ name: "House 1", capacity: "" }],
  );
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const total = rows.reduce((s, r) => s + (Number(r.capacity) || 0), 0);

  function update(i: number, patch: Partial<{ name: string; capacity: string }>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setSaved(false);
  }
  function add() {
    setRows([...rows, { name: `House ${rows.length + 1}`, capacity: "" }]);
    setSaved(false);
  }
  function remove(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  async function save() {
    setPending(true);
    try {
      await setHouses({
        houses: rows.map((r) => ({ id: r.id, name: r.name.trim(), capacity: Number(r.capacity) || 0 })),
      });
      setSaved(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-h3">Houses</h3>
        <span className="font-mono text-label text-muted">total {total.toLocaleString()}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Name"
              className="h-11 flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500"
            />
            <input
              value={r.capacity}
              onChange={(e) => update(i, { capacity: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder="Capacity"
              className="h-11 w-32 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${r.name || "house"}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-paper hover:text-status-bad"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" affordance={IconPlus} onClick={add}>
          Add house
        </Button>
        <Button type="button" affordance={IconCheck} loading={pending} onClick={save} className="ml-auto">
          {saved ? "Saved" : "Save houses"}
        </Button>
      </div>
    </div>
  );
}

function CycleSection({ houses, cycle }: { houses: any[]; cycle: any }) {
  const startCycle = useMutation(api.tenancy.startCycle);
  const [cycleNo, setCycleNo] = useState("1");
  const [breed, setBreed] = useState("Ross 308");
  const [placementDate, setPlacingDate] = useState("");
  const [expectedCollectionDate, setExpectedCollectionDate] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cycle) {
    return (
      <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">Cycle {cycle.cycleNo}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-label">
          <dt className="text-muted">Breed</dt><dd className="text-right font-mono text-ink">{cycle.breed}</dd>
          <dt className="text-muted">Placed</dt><dd className="text-right font-mono text-ink">{cycle.placed.toLocaleString()}</dd>
          <dt className="text-muted">Houses</dt><dd className="text-right font-mono text-ink">{cycle.houseCount}</dd>
          <dt className="text-muted">Placed on</dt><dd className="text-right font-mono text-ink">{cycle.placementDate}</dd>
          <dt className="text-muted">Kill date</dt><dd className="text-right font-mono text-ink">{cycle.expectedCollectionDate}</dd>
        </dl>
      </div>
    );
  }

  if (!houses.length) {
    return <EmptyHint>Add and save your houses first, then start a cycle.</EmptyHint>;
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!placementDate || !expectedCollectionDate) {
      setError("Enter the placing and collection dates.");
      return;
    }
    setPending(true);
    try {
      await startCycle({
        cycleNo: Number(cycleNo) || 1,
        breed,
        placementDate,
        expectedCollectionDate,
        houses: houses.map((h) => ({ houseId: h.id, placedCount: Number(counts[h.id]) || 0 })),
      });
    } catch {
      setError("Could not start the cycle. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={start} className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <h3 className="text-h3">Start a cycle</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Cycle no.</span>
          <input value={cycleNo} onChange={(e) => setCycleNo(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 font-mono text-body text-ink outline-none focus-visible:border-brand-500" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Breed</span>
          <input value={breed} onChange={(e) => setBreed(e.target.value)} className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Placement date</span>
          <input type="date" value={placementDate} onChange={(e) => setPlacingDate(e.target.value)} className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Kill date</span>
          <input type="date" value={expectedCollectionDate} onChange={(e) => setExpectedCollectionDate(e.target.value)} className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500" />
        </label>
      </div>

      <p className="mt-4 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">Birds placed per house</p>
      <div className="flex flex-col gap-2">
        {houses.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <span className="flex-1 text-label text-ink">{h.name}</span>
            <input
              value={counts[h.id] ?? ""}
              onChange={(e) => setCounts({ ...counts, [h.id]: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder={`max ${h.capacity.toLocaleString()}`}
              className="h-11 w-40 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
            />
          </div>
        ))}
      </div>

      {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
      <Button type="submit" size="lg" block affordance={IconCheck} loading={pending} className="mt-4">
        Start cycle
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------- primitives -- */

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-h1">{title}</h1>
      <p className="mt-1 text-body text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FarmCard({ farm }: { farm: any }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-h3">{farm.name}</h3>
        <span className="font-mono text-label text-muted">{farm.farmCode}</span>
      </div>
      <p className="mt-1 text-label text-muted">{farm.houseCount} house(s) set up · no data captured yet</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
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

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-paper p-5 text-body text-slate">{children}</div>;
}

function NextStepNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-label text-hint">{children}</p>;
}

function PendingState({ email }: { email: string }) {
  const claimInvite = useMutation(api.tenancy.claimInvite);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function join() {
    setPending(true);
    setMsg(null);
    try {
      const res: any = await claimInvite({});
      if (!res.claimed) setMsg(`No pending invite found for ${email} yet. Ask to be invited, then try again.`);
      // On success the workspace query re-fires and this screen is replaced.
    } catch {
      setMsg("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="No farm yet" subtitle={email}>
      <EmptyHint>
        You haven&apos;t been added to a farm yet. Ask your contractor or supervisor to invite <strong>{email}</strong>,
        then join below.
      </EmptyHint>
      <Button type="button" size="lg" affordance={IconCheck} loading={pending} onClick={join} className="mt-4">
        I&apos;ve been invited — join
      </Button>
      {msg && <p className="mt-3 text-label text-muted">{msg}</p>}
    </Shell>
  );
}
