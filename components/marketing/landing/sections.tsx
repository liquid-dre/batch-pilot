"use client";

import type { Role } from "@/lib/types";
import type { WeightBandData } from "@/lib/view";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { WeightBandChart } from "@/components/charts/WeightBandChart";
import { LogoMark } from "@/components/brand/Logo";
import { IconCheck, IconLogin } from "@/components/icons";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import {
  problem,
  wedge,
  rolesIntro,
  roles,
  catchItEarly,
  howItWorks,
  trust,
  faq,
  finalCta,
} from "@/lib/landingCopy";

/* ------------------------------------------------------------- helpers ---- */

function Eyebrow({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={cn("font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em]", onDark ? "text-on-invert-dim" : "text-brand-600")}>
      {children}
    </p>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((b) => (
        <li key={b} className="flex gap-2.5 text-body text-slate">
          <IconCheck className="mt-[3px] size-4 shrink-0 text-brand-600" aria-hidden />
          <span className="[text-wrap:pretty]">{b}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- Problem ---- */

export function Problem() {
  return (
    <section aria-labelledby="problem-h" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>{problem.eyebrow}</Eyebrow>
        <h2 id="problem-h" className="mt-3 text-h1 [text-wrap:balance]">
          {problem.heading}
        </h2>
        <p className="mt-4 text-body-l text-slate [text-wrap:pretty]">{problem.body}</p>
        <p className="mt-4 text-body-l font-medium text-ink [text-wrap:pretty]">{problem.kicker}</p>
      </Reveal>

      <Reveal className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-divider sm:grid-cols-3" delay={80}>
        {problem.stats.map((s) => (
          <div key={s.label} className="bg-paper p-6">
            <p className="font-display text-[2rem] font-extrabold tracking-[-0.03em] text-brand-600">{s.value}</p>
            <p className="mt-1 text-label text-muted">{s.label}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Wedge ---- */

export function Wedge() {
  return (
    <section aria-labelledby="wedge-h" className="bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="max-w-2xl">
          <Eyebrow>{wedge.eyebrow}</Eyebrow>
          <h2 id="wedge-h" className="mt-3 text-h1 [text-wrap:balance]">
            {wedge.heading}
          </h2>
          <p className="mt-4 text-body-l text-slate [text-wrap:pretty]">{wedge.body}</p>
        </Reveal>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-2">
          {/* The WhatsApp message, as-is */}
          <Reveal className="flex flex-col rounded-[var(--radius-card)] border border-divider bg-paper p-5 sm:p-6">
            <p className="text-label font-semibold text-muted">{wedge.whatsapp.title}</p>
            <div className="mt-3 flex-1 rounded-[var(--radius-control)] bg-surface p-3 shadow-card">
              <p className="text-[0.75rem] font-semibold text-slate">{wedge.whatsapp.header}</p>
              <div className="mt-2 space-y-1 overflow-x-auto">
                {wedge.whatsapp.rows.map((r) => (
                  <p key={r} className="whitespace-pre font-mono text-[0.6875rem] leading-relaxed text-slate">
                    {r}
                  </p>
                ))}
              </div>
            </div>
            <p className="mt-3 text-label text-muted [text-wrap:pretty]">{wedge.whatsapp.caption}</p>
          </Reveal>

          {/* What BatchPilot does with it */}
          <Reveal className="flex flex-col rounded-[var(--radius-card)] bg-canvas-invert p-5 text-on-invert sm:p-6" delay={90}>
            <p className="text-label font-semibold text-on-invert">{wedge.batchpilot.title}</p>
            <div className="mt-4">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-on-invert-dim">{wedge.batchpilot.typedLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {wedge.batchpilot.typed.map((t) => (
                  <span key={t} className="rounded-[var(--radius-pill)] bg-white/10 px-2.5 py-1 font-mono text-[0.75rem] text-on-invert">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-on-invert-dim">{wedge.batchpilot.computedLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {wedge.batchpilot.computed.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-brand-700 px-2.5 py-1 font-mono text-[0.75rem] text-white">
                    <IconCheck className="size-3.5" aria-hidden />
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-auto pt-5 text-label text-on-invert-dim [text-wrap:pretty]">{wedge.batchpilot.caption}</p>
          </Reveal>
        </div>

        {/* Honest WhatsApp-native framing */}
        <Reveal className="mt-6 rounded-[var(--radius-card)] bg-brand-50 p-5 sm:p-6" delay={60}>
          <h3 className="text-h3 text-brand-600">{wedge.whatsappNative.heading}</h3>
          <p className="mt-2 max-w-3xl text-body text-slate [text-wrap:pretty]">{wedge.whatsappNative.body}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Who it's for -- */

function RoleVisual({ role }: { role: Role }) {
  if (role === "manager") {
    return (
      <div className="flex flex-wrap gap-2">
        <StatusPill level="green" size="sm" />
        <StatusPill level="amber" size="sm" />
        <StatusPill level="red" size="sm" />
      </div>
    );
  }
  if (role === "supervisor") {
    return (
      <div className="inline-flex items-center gap-3 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2">
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-brand-50 text-h3 font-bold text-brand-600">−</span>
        <span className="font-mono text-h2 tabular-nums text-ink">17</span>
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-brand-700 text-h3 font-bold text-white">+</span>
      </div>
    );
  }
  // contractor — a tiny ranked list
  const rows = [
    { name: "Chinamora", epef: 412 },
    { name: "Nhunge", epef: 331 },
    { name: "Seke", epef: 289 },
  ];
  return (
    <div className="w-full max-w-xs rounded-[var(--radius-control)] border border-divider bg-surface p-3">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-3 py-1 text-label">
          <span className="font-mono text-muted">{i + 1}</span>
          <span className="text-ink">{r.name}</span>
          <span className="ml-auto font-mono tabular-nums text-brand-600">{r.epef}</span>
        </div>
      ))}
      <p className="mt-1 text-[0.6875rem] text-hint">EPEF, this cycle</p>
    </div>
  );
}

export function WhoItsFor({ onEnter }: { onEnter: (r: Role) => void }) {
  return (
    <section aria-labelledby="roles-h" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>{rolesIntro.eyebrow}</Eyebrow>
        <h2 id="roles-h" className="mt-3 text-h1 [text-wrap:balance]">
          {rolesIntro.heading}
        </h2>
        <p className="mt-4 text-body-l text-slate [text-wrap:pretty]">{rolesIntro.body}</p>
      </Reveal>

      <div className="mt-12 space-y-5">
        {roles.map((r, i) => (
          <Reveal
            key={r.key}
            className={cn(
              "flex flex-col gap-6 rounded-[var(--radius-card)] bg-surface p-6 shadow-card sm:p-8 lg:flex-row lg:items-center lg:gap-10",
              i % 2 === 1 && "lg:flex-row-reverse",
            )}
          >
            <div className="lg:flex-1">
              <Eyebrow>{r.eyebrow}</Eyebrow>
              <h3 className="mt-2 text-h2 [text-wrap:balance]">{r.heading}</h3>
              <Bullets items={r.bullets} />
              <Button type="button" variant="secondary" size="lg" onClick={() => onEnter(r.role)} className="mt-6">
                {r.cta}
              </Button>
            </div>
            <div className="flex shrink-0 items-center justify-center lg:w-64">
              <RoleVisual role={r.role} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Catch it early --- */

export function CatchItEarly({ data }: { data: WeightBandData }) {
  return (
    <section aria-labelledby="early-h" className="bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="max-w-2xl">
          <Eyebrow>{catchItEarly.eyebrow}</Eyebrow>
          <h2 id="early-h" className="mt-3 text-h1 [text-wrap:balance]">
            {catchItEarly.heading}
          </h2>
          <p className="mt-4 text-body-l text-slate [text-wrap:pretty]">{catchItEarly.body}</p>
        </Reveal>

        <Reveal className="mt-10 rounded-[var(--radius-card)] border border-divider bg-paper p-5 sm:p-6" delay={70}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-[var(--radius-pill)] bg-brand-100 px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-brand-600">
              {catchItEarly.exampleLabel}
            </span>
            <StatusPill level="amber" label={catchItEarly.statusLabel} size="sm" />
          </div>
          <p className="mb-5 max-w-2xl text-body text-slate [text-wrap:pretty]">{catchItEarly.exampleBody}</p>
          <WeightBandChart data={data} />
          <p className="mt-3 text-label text-muted [text-wrap:pretty]">{catchItEarly.chartNote}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- How it works --- */

export function HowItWorks() {
  return (
    <section aria-labelledby="how-h" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>{howItWorks.eyebrow}</Eyebrow>
        <h2 id="how-h" className="mt-3 text-h1 [text-wrap:balance]">
          {howItWorks.heading}
        </h2>
      </Reveal>

      <Reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" delay={60}>
        {howItWorks.steps.map((s) => (
          <div key={s.n} className="rounded-[var(--radius-card)] bg-surface p-6 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-brand-50 font-display text-h3 font-extrabold text-brand-600">
              {s.n}
            </span>
            <h3 className="mt-4 text-h3">{s.title}</h3>
            <p className="mt-1.5 text-body text-slate [text-wrap:pretty]">{s.body}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Trust ---- */

export function Trust() {
  return (
    <section aria-labelledby="trust-h" className="bg-brand-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal>
            <Eyebrow>{trust.eyebrow}</Eyebrow>
            <h2 id="trust-h" className="mt-3 text-h1 [text-wrap:balance]">
              {trust.heading}
            </h2>
            <p className="mt-4 text-body-l text-slate [text-wrap:pretty]">{trust.body}</p>
            <p className="mt-4 text-label text-muted">{trust.disclaimer}</p>
          </Reveal>
          <Reveal className="rounded-[var(--radius-card)] bg-surface p-6 shadow-card sm:p-8" delay={80}>
            <LogoMark className="h-8 w-9 text-brand-600" />
            <ul className="mt-5 space-y-3">
              {trust.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-body text-slate">
                  <IconCheck className="mt-[3px] size-4 shrink-0 text-brand-600" aria-hidden />
                  <span className="[text-wrap:pretty]">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ ---- */

export function Faq() {
  return (
    <section aria-labelledby="faq-h" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal>
        <Eyebrow>{faq.eyebrow}</Eyebrow>
        <h2 id="faq-h" className="mt-3 text-h1 [text-wrap:balance]">
          {faq.heading}
        </h2>
      </Reveal>
      <Reveal className="mt-8 divide-y divide-divider border-y border-divider" delay={50}>
        {faq.items.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-h3 [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="shrink-0 text-brand-600 transition-transform duration-[var(--dur-fast)] group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-2 text-body text-slate [text-wrap:pretty]">{item.a}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------ Final CTA ---- */

export function FinalCta({ onEnter, onLogin }: { onEnter: (r: Role) => void; onLogin: () => void }) {
  return (
    <section aria-labelledby="final-h" className="relative isolate overflow-hidden bg-canvas-invert text-on-invert">
      <LogoMark className="pointer-events-none absolute -right-8 top-1/2 h-48 w-auto -translate-y-1/2 text-white/[0.07]" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <h2 id="final-h" className="text-h1 text-on-invert [text-wrap:balance]">
            {finalCta.heading}
          </h2>
          <p className="mt-2 text-body-l text-on-invert-dim [text-wrap:pretty]">{finalCta.body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" variant="primary" inverse size="lg" onClick={() => onEnter("supervisor")}>
            {finalCta.cta}
          </Button>
          <Button type="button" variant="ghost" inverse size="lg" affordance={IconLogin} onClick={onLogin}>
            {finalCta.secondaryCta}
          </Button>
        </div>
      </div>
    </section>
  );
}
