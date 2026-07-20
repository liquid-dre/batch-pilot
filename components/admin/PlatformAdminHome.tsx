"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Platform Admin home (ROADMAP §9 / BRD §4 · §12-P) — the BatchPilot operator's
 * one above-tenant surface: white-label theming across every contractor org.
 * Each org's brand is edited inline; saving flows to every user under that org
 * via `admin.myTheme` + `TenantThemeProvider`. The role is allowlist-only
 * (`PLATFORM_ADMIN_EMAILS`), so a non-admin never reaches this (query → null).
 */

type Org = {
  id: string;
  name: string;
  brandTheme: { brand700: string; brand500: string; dark?: { brand700: string; brand500: string } } | null;
  farmCount: number;
};

export function PlatformAdminHome() {
  const orgs = useQuery(api.admin.listContractors);

  if (orgs === undefined) return <ScreenLoading eyebrow="Platform" title="Contractor orgs" />;
  if (orgs === null)
    return (
      <ScreenEmpty
        eyebrow="Platform"
        title="Contractor orgs"
        heading="Platform admin only"
        body="This area is for the BatchPilot team. Your account isn't a platform admin."
      />
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Platform"
        title="Contractor orgs"
        intro="White-label branding is configuration, not code. Set an org's brand and every one of its users renders with it."
      />
      {orgs.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center text-body text-muted">
            No contractor orgs yet — they appear here as contractors sign up.
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-4">
          {orgs.map((org) => (
            <li key={org.id}>
              <OrgThemeCard org={org} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DEFAULT_700 = "#0c62b0";
const DEFAULT_500 = "#0ea5e9";
const HEX = /^#[0-9a-fA-F]{6}$/;

// Dark-mode brand defaults (the brighter azure the design uses on dark).
const DEFAULT_D700 = "#0c62b0";
const DEFAULT_D500 = "#38bdf8";

function OrgThemeCard({ org }: { org: Org }) {
  const setTheme = useMutation(api.admin.setContractorTheme);
  const [editing, setEditing] = useState(false);
  const [b700, setB700] = useState(org.brandTheme?.brand700 ?? DEFAULT_700);
  const [b500, setB500] = useState(org.brandTheme?.brand500 ?? DEFAULT_500);
  const [d700, setD700] = useState(org.brandTheme?.dark?.brand700 ?? DEFAULT_D700);
  const [d500, setD500] = useState(org.brandTheme?.dark?.brand500 ?? DEFAULT_D500);
  const [pending, setPending] = useState(false);

  const valid = [b700, b500, d700, d500].every((c) => HEX.test(c));
  const branded = Boolean(org.brandTheme);

  async function save(
    brandTheme: { brand700: string; brand500: string; dark: { brand700: string; brand500: string } } | null,
  ) {
    setPending(true);
    try {
      await notify.promise(setTheme({ contractorId: org.id, brandTheme }), {
        loading: "Saving brand…",
        success: () => ({ title: "Brand saved", description: `${org.name} now renders with this palette.` }),
        error: () => ({ title: "Couldn't save the brand", description: "Try again." }),
      });
      if (!brandTheme) {
        setB700(DEFAULT_700);
        setB500(DEFAULT_500);
        setD700(DEFAULT_D700);
        setD500(DEFAULT_D500);
      }
      setEditing(false);
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex overflow-hidden rounded-full border border-border" aria-hidden>
              <span className="size-6" style={{ background: branded ? org.brandTheme!.brand700 : DEFAULT_700 }} />
              <span className="size-6" style={{ background: branded ? org.brandTheme!.brand500 : DEFAULT_500 }} />
            </span>
            <div>
              <h3 className="text-h3">{org.name}</h3>
              <p className="text-label text-muted">
                {org.farmCount} {org.farmCount === 1 ? "farm" : "farms"} ·{" "}
                {branded ? "custom brand" : "default palette"}
              </p>
            </div>
          </div>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              {branded ? "Edit brand" : "Set brand"}
            </Button>
          )}
        </div>

        {editing && (
          <div className="mt-5 space-y-5 border-t border-divider pt-5">
            <div className="space-y-3">
              <CardEyebrow>Light mode</CardEyebrow>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="CTA / active fill (brand-700)" value={b700} onChange={setB700} />
                <ColorField label="Accent / marks (brand-500)" value={b500} onChange={setB500} />
              </div>
            </div>
            <div className="space-y-3">
              <CardEyebrow>Dark mode</CardEyebrow>
              <p className="text-label text-muted">Applied only in dark mode. Leave as-is to reuse the light colours.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="CTA / active fill (brand-700)" value={d700} onChange={setD700} />
                <ColorField label="Accent / marks (brand-500)" value={d500} onChange={setD500} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {branded ? (
                <Button variant="ghost" size="sm" onClick={() => save(null)} disabled={pending}>
                  Reset to default
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={pending}
                  disabled={!valid}
                  onClick={() => save({ brand700: b700, brand500: b500, dark: { brand700: d700, brand500: d500 } })}
                >
                  Save brand
                </Button>
              </div>
            </div>
            {!valid && <p className="text-label text-status-bad">All colours must be 6-digit hex (e.g. #0c62b0).</p>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = HEX.test(value) ? value : "#000000";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <span className="inline-flex items-center gap-2.5">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
          aria-label={`${label} swatch`}
        />
        <input
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 font-mono text-body text-ink outline-none focus-visible:border-brand-500"
        />
      </span>
    </label>
  );
}
