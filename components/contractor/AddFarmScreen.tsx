"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";
import { ContractorFarmCard, splitEmails } from "./growerForms";

/**
 * Add-a-farm page (`/app/growers/add`). Create a farm + invite its manager(s),
 * and manage managers on the farms you already own. Cycles are scheduled from
 * `/app/growers/schedule`; this page is onboarding only.
 */
export function AddFarmScreen() {
  const workspace = useQuery(api.tenancy.myWorkspace);
  const createFarm = useMutation(api.tenancy.createFarm);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (workspace === undefined) return <ScreenLoading eyebrow="Growers" title="Add a farm" />;
  if (workspace === null || workspace.role !== "contractor")
    return (
      <ScreenEmpty
        eyebrow="Growers"
        title="Add a farm"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to add a farm."
      />
    );

  const farms: any[] = workspace.farms ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Growers"
        title="Add a farm"
        intro="Onboard a grower's farm, then invite the manager who runs it. They join when they sign up with that email."
        back={{ href: "/app/growers", label: "Growers" }}
      />

      <form onSubmit={onCreate} className="rounded-[var(--radius-card)] bg-surface p-5 shadow-card">
        <h3 className="text-h3">New farm</h3>
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

      {farms.length > 0 && (
        <section className="space-y-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">Your farms</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {farms.map((f) => (
              <ContractorFarmCard key={f.id} farm={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
