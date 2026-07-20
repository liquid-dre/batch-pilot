"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Account self-service (`/app/account`, ROADMAP §9) — one screen for every
 * signed-in role. Edit your display name, change your password (current password
 * required; other sessions untouched), and — for roles with peers — invite
 * same-role co-workers. Read-only identity (email, role, farm/org) sits up top.
 * The Team panel is the single home for the co-admin / co-supervisor / co-manager
 * invites; platform admins have no peers, so it doesn't render for them.
 */

const ROLE_LABEL: Record<string, string> = {
  supervisor: "Supervisor / Foreman",
  manager: "Manager",
  contractor: "Contractor",
  platformAdmin: "Platform admin",
};

function initials(name: string, email: string): string {
  const src = name.trim() || email;
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

export function AccountScreen() {
  const account = useQuery(api.account.myAccount);

  if (account === undefined) return <ScreenLoading eyebrow="Account" title="Your account" />;
  if (account === null)
    return (
      <ScreenEmpty
        eyebrow="Account"
        title="Your account"
        heading="Sign in required"
        body="Sign in to manage your account."
      />
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Account" title="Your account" intro="Your details, password and team." />
      <IdentityCard account={account} />
      <NameForm initialName={account.name} />
      <PasswordForm />
      <TeamPanel />
    </div>
  );
}

function IdentityCard({ account }: { account: { name: string; email: string; role: string; org: string } }) {
  const roleLabel = ROLE_LABEL[account.role] ?? account.role;
  return (
    <Card>
      <CardBody className="flex items-center gap-4 pt-5">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-50 font-mono text-body font-semibold text-brand-700"
          aria-hidden
        >
          {initials(account.name, account.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-h3 text-ink">{account.name || account.email}</p>
          <p className="truncate text-label text-muted">
            {account.email}
            {account.org ? <> · {account.org}</> : null} · {roleLabel}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function NameForm({ initialName }: { initialName: string }) {
  const updateName = useMutation(api.account.updateName);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const dirty = name.trim() !== initialName.trim();
  const valid = name.trim().length > 0;

  async function save() {
    setPending(true);
    try {
      await notify.promise(updateName({ name }), {
        loading: "Saving…",
        success: () => ({ title: "Name updated" }),
        error: () => ({ title: "Couldn’t save your name", description: "Try again." }),
      });
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4 pt-5">
        <CardEyebrow>Display name</CardEyebrow>
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-slate">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500"
          />
        </label>
        <div className="flex justify-end">
          <Button size="sm" loading={pending} disabled={!dirty || !valid} onClick={save}>
            Save name
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function PasswordForm() {
  const changePassword = useAction(api.account.changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const ready = current.length > 0 && next.length >= 8 && next === confirm;

  async function save() {
    setError(null);
    if (!ready) return;
    setPending(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      notify.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      // Surface the action's own message (e.g. wrong current password).
      setError(/current password/i.test(msg) ? "That current password is incorrect." : "Couldn’t change your password. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4 pt-5">
        <CardEyebrow>Password</CardEyebrow>
        <div className="grid gap-3">
          <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordField
            label="New password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            hint={tooShort ? "At least 8 characters." : undefined}
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            hint={mismatch ? "Passwords don’t match." : undefined}
          />
        </div>
        {error && <p role="alert" className="text-label text-status-bad">{error}</p>}
        <div className="flex justify-end">
          <Button size="sm" loading={pending} disabled={!ready} onClick={save}>
            Change password
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500"
      />
      {hint && <span className="text-label text-status-bad">{hint}</span>}
    </label>
  );
}

const TEAM_COPY: Record<"coAdmin" | "supervisor" | "manager", { title: string; blurb: string; placeholder: string }> = {
  coAdmin: {
    title: "Co-admins",
    blurb: "Colleagues who help run your org — the same access you have across every farm, benchmark and schedule.",
    placeholder: "colleague@example.com",
  },
  supervisor: {
    title: "Co-supervisors",
    blurb: "Other foremen who capture the daily numbers on your farm.",
    placeholder: "foreman@example.com",
  },
  manager: {
    title: "Co-managers",
    blurb: "Other managers who share oversight of your farm.",
    placeholder: "manager@example.com",
  },
};

function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

function TeamPanel() {
  const team = useQuery(api.account.myTeam);
  const inviteOrgAdmins = useMutation(api.tenancy.inviteOrgAdmins);
  const inviteCoSupervisors = useMutation(api.tenancy.inviteCoSupervisors);
  const inviteCoManagers = useMutation(api.tenancy.inviteCoManagers);
  const inviteSupervisors = useMutation(api.tenancy.inviteSupervisors);

  if (team === undefined || team === null || team.kind === "none") return null;
  const copy = TEAM_COPY[team.kind];
  const peerInvite =
    team.kind === "coAdmin" ? inviteOrgAdmins : team.kind === "supervisor" ? inviteCoSupervisors : inviteCoManagers;

  return (
    <>
      <InviteSection
        title={copy.title}
        blurb={copy.blurb}
        placeholder={copy.placeholder}
        members={team.members}
        onInvite={(emails) => peerInvite({ emails })}
      />
      {/* A manager also invites the farm's foremen from here (off the dashboard). */}
      {team.kind === "manager" && (
        <InviteSection
          title="Foremen"
          blurb="Foremen capture the daily numbers, weigh-ins and feed on the ground."
          placeholder="foreman@example.com"
          members={team.foremen ?? []}
          onInvite={(emails) => inviteSupervisors({ emails })}
        />
      )}
    </>
  );
}

function InviteSection({
  title,
  blurb,
  placeholder,
  members,
  onInvite,
}: {
  title: string;
  blurb: string;
  placeholder: string;
  members: { email: string; status: string }[];
  onInvite: (emails: string[]) => Promise<unknown>;
}) {
  const [emails, setEmails] = useState("");
  const [pending, setPending] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const list = splitEmails(emails);
    if (list.length === 0) return;
    setPending(true);
    try {
      await notify.promise(onInvite(list), {
        loading: "Sending invite…",
        success: () => ({ title: "Invite sent", description: "They join when they sign up with that email." }),
        error: () => ({ title: "Couldn’t send the invite", description: "Try again." }),
      });
      setEmails("");
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4 pt-5">
        <div>
          <CardEyebrow>{title}</CardEyebrow>
          <p className="mt-1 text-label text-muted">{blurb}</p>
        </div>

        {members.length === 0 ? (
          <p className="text-label text-muted">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-divider">
            {members.map((m) => (
              <li key={m.email} className="flex items-center justify-between py-2 text-label">
                <span className="min-w-0 truncate text-ink">{m.email}</span>
                <MemberChip status={m.status} />
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={invite} className="flex gap-2">
          <input
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={placeholder}
            className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-brand-500"
          />
          <Button type="submit" size="sm" loading={pending} className="shrink-0">
            Invite
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

/** Status is colour + word + shape (never colour alone). */
function MemberChip({ status }: { status: string }) {
  const joined = status === "accepted";
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-label">
      <span
        className={`inline-block size-1.5 rounded-full ${joined ? "bg-status-good" : "bg-slate/40"}`}
        aria-hidden
      />
      <span className={joined ? "text-slate" : "text-muted"}>{joined ? "Joined" : "Invited"}</span>
    </span>
  );
}
