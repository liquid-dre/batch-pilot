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
            <div className="space-y-3">
              <CardEyebrow>Preview</CardEyebrow>
              <p className="text-label text-muted">How the sidebar looks for this org&apos;s users — light and dark, no guessing.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <SidebarPreview mode="light" b700={b700} b500={b500} />
                <SidebarPreview mode="dark" b700={d700} b500={d500} />
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

/**
 * A static mock of the app sidebar in a fixed mode (light or dark), painted with
 * the chosen brand pair so the platform admin sees the real active-row treatment
 * — brand fill tint + brand text/marks — instead of guessing from two swatches.
 * The neutral chrome is hardcoded per mode (not theme tokens) so both modes render
 * at once regardless of the admin's own theme; the only brand-coloured pieces are
 * the two values being previewed.
 */
const PREVIEW_ROWS = ["Overview", "Growers", "Benchmarks", "Account"];

function SidebarPreview({ mode, b700, b500 }: { mode: "light" | "dark"; b700: string; b500: string }) {
  const brand700 = HEX.test(b700) ? b700 : mode === "dark" ? DEFAULT_D700 : DEFAULT_700;
  const brand500 = HEX.test(b500) ? b500 : mode === "dark" ? DEFAULT_D500 : DEFAULT_500;
  const dark = mode === "dark";
  const c = dark
    ? { bg: "#0f172a", border: "#1f2937", ink: "#e2e8f0", muted: "#94a3b8", activeText: brand500 }
    : { bg: "#ffffff", border: "#e5e7eb", ink: "#0f172a", muted: "#64748b", activeText: brand700 };

  return (
    <figure className="space-y-1.5">
      <div className="overflow-hidden rounded-[var(--radius-card)] border" style={{ borderColor: c.border, background: c.bg }}>
        {/* Brand row */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: c.border }}>
          <span className="size-5 rounded-[6px]" style={{ background: brand700 }} aria-hidden />
          <span className="text-label font-bold" style={{ color: c.ink }}>BatchPilot</span>
        </div>
        {/* Nav rows — the first is active. */}
        <ul className="space-y-1 p-2">
          {PREVIEW_ROWS.map((label, i) => {
            const active = i === 0;
            return (
              <li
                key={label}
                className="flex items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-1.5"
                style={active ? { background: `${brand700}22` } : undefined}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: active ? brand500 : c.muted, opacity: active ? 1 : 0.5 }}
                  aria-hidden
                />
                <span
                  className="text-[0.8125rem]"
                  style={{ color: active ? c.activeText : c.muted, fontWeight: active ? 600 : 500 }}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <figcaption className="text-center text-[0.6875rem] uppercase tracking-[0.08em] text-hint">{dark ? "Dark" : "Light"}</figcaption>
    </figure>
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
