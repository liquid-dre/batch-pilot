"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/cn";

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
      await createFarm({ name: name.trim(), supervisorEmails: splitEmails(emails) });
      setName("");
      setEmails("");
    } catch {
      setError("Could not create the farm. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Your farms" subtitle={`Signed in as ${workspace.email} · contractor`}>
      {farms.length === 0 ? (
        <EmptyHint>Add your first farm below, then invite the supervisor who runs it.</EmptyHint>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {farms.map((f) => (
            <div key={f.id} className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
              <div className="flex items-baseline justify-between">
                <h3 className="text-h3">{f.name}</h3>
                <span className="font-mono text-label text-muted">{f.farmCode}</span>
              </div>
              <p className="mt-1 text-label text-muted">{f.houseCount} house(s) set up</p>
              <p className="mt-4 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">Supervisors</p>
              {f.supervisors.length === 0 ? (
                <p className="text-label text-muted">None invited yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {f.supervisors.map((s: any) => (
                    <li key={s.email} className="flex items-center justify-between text-label">
                      <span className="text-ink">{s.email}</span>
                      <StatusChip status={s.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
          <span className="text-label font-medium text-slate">Supervisor email(s)</span>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="supervisor@example.com, another@example.com"
            className="rounded-[var(--radius-control)] border border-border bg-surface p-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
          />
          <span className="text-[0.8125rem] text-muted">Separate multiple emails with commas or new lines. They join when they sign up with that email.</span>
        </label>
        {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-[52px] items-center justify-center rounded-[var(--radius-control)] bg-brand-700 px-6 text-[1.0625rem] font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create farm & invite"}
        </button>
      </form>
    </Shell>
  );
}

/* ------------------------------------------------------------- Supervisor -- */

function SupervisorOnboarding({ workspace }: { workspace: any }) {
  const inviteManagers = useMutation(api.tenancy.inviteManagers);
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
      await inviteManagers({ emails: list });
      setEmails("");
    } catch {
      setError("Could not send the invites. Try again.");
    } finally {
      setPending(false);
    }
  }

  const managers: any[] = workspace.managers ?? [];

  return (
    <Shell title={workspace.farm.name} subtitle={`Supervisor · ${workspace.email}`}>
      <FarmCard farm={workspace.farm} />

      <form onSubmit={onInvite} className="mt-6 rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">Invite your manager(s)</h3>
        <p className="mt-1 text-label text-muted">Managers oversee performance and can correct captured numbers.</p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Manager email(s)</span>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="manager@example.com"
            className="rounded-[var(--radius-control)] border border-border bg-surface p-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
          />
        </label>
        {error && <p role="alert" className="mt-3 text-label text-status-bad">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-[52px] items-center justify-center rounded-[var(--radius-control)] bg-brand-700 px-6 text-[1.0625rem] font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Inviting…" : "Send invite"}
        </button>

        {managers.length > 0 && (
          <ul className="mt-5 flex flex-col gap-1 border-t border-divider pt-4">
            {managers.map((m) => (
              <li key={m.email} className="flex items-center justify-between text-label">
                <span className="text-ink">{m.email}</span>
                <StatusChip status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </form>

      <NextStepNote>Setting up houses and today's capture arrives next (stage 2).</NextStepNote>
    </Shell>
  );
}

/* ---------------------------------------------------------------- Manager -- */

function ManagerOnboarding({ workspace }: { workspace: any }) {
  if (!workspace.farm) return <PendingState email={workspace.email} />;
  return (
    <Shell title={workspace.farm.name} subtitle={`Manager · ${workspace.email}`}>
      <FarmCard farm={workspace.farm} />
      <NextStepNote>Dashboard, analytics and house setup for this farm arrive next (stage 2).</NextStepNote>
    </Shell>
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
        joined ? "bg-status-good-tint text-status-good" : "bg-brand-50 text-brand-700",
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
  return (
    <Shell title="No farm yet" subtitle={email}>
      <EmptyHint>
        You haven&apos;t been added to a farm yet. Ask your contractor or supervisor to invite <strong>{email}</strong>,
        then refresh — you&apos;ll be placed automatically.
      </EmptyHint>
    </Shell>
  );
}
