"use client";

import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { HeroEggpit } from "./HeroEggpit";
import { IconLogin } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Marketing landing at `/` — also the (stub) login screen. No real auth: the
 * CTAs call the AuthProvider stub to set a demo session role, then navigate into
 * `/app`. The grower app offers TWO profiles — "Supervisor / Foreman" (the data
 * capturer) and "Manager" (oversight) — and "for contractors" sets the
 * contractor role. This is the Clerk seam — when auth lands, these calls become
 * sign-in / sign-up against the chosen role.
 */
export function Landing() {
  const router = useRouter();
  const { setRole } = useCurrentUser();

  // When a Convex deployment is connected, the CTAs go to real sign-up/sign-in
  // (the role rides along as `intent`). Before that, they set the demo role and
  // jump straight into the app — the no-backend prototype flow.
  const connected = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  const enter = (role: Role) => {
    if (connected) {
      router.push(`/signin?intent=${role}`);
    } else {
      setRole(role);
      router.push("/app");
    }
  };

  const login = () => {
    if (connected) {
      router.push("/signin");
    } else {
      setRole("manager");
      router.push("/app");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Hero onEnter={enter} onLogin={login} />
      <ValueProps />
      <Registers onEnter={enter} />
      <ClosingBand onEnter={enter} />
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- Hero ---- */

function Hero({ onEnter, onLogin }: { onEnter: (r: Role) => void; onLogin: () => void }) {
  return (
    <section className="relative isolate flex min-h-[38rem] flex-col overflow-hidden bg-brand-900 text-white sm:min-h-[42rem]">
      {/* soft depth + oversized chevron motif — also the static fallback when the
          WebGL eggs are gated off (mobile / low-power / reduced-motion). */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-700/40 blur-3xl" />
        {/* Decorative floating eggs (client-only, capability-gated, disposes on unmount). */}
        <HeroEggpit />
        <LogoMark className="animate-float absolute -bottom-16 -right-10 h-[26rem] w-auto text-brand-100/[0.06]" />
      </div>
      {/* Scrim: keeps the white headline/CTAs AA-legible if a pale egg drifts behind. */}
      <div className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-br from-brand-900/55 via-transparent to-brand-900/45" />

      {/* top nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-6 w-7 text-white" />
          <span className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em]">BatchPilot</span>
        </span>
        <Button type="button" variant="ghost" inverse size="sm" affordance={IconLogin} onClick={onLogin}>
          Log in
        </Button>
      </nav>

      {/* hero content */}
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 [text-shadow:0_1px_14px_rgba(12,9,13,0.55)] sm:px-6 sm:pb-32 sm:pt-20">
        <p
          className="animate-rise inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-label font-medium text-brand-100"
          style={{ animationDelay: "0ms" }}
        >
          WhatsApp-native ops for broiler farms
        </p>

        <h1
          className="animate-rise mt-5 max-w-3xl font-display font-bold leading-[1.04] tracking-[-0.03em] text-white text-[clamp(2.5rem,6vw,3.75rem)] [text-wrap:balance]"
          style={{ animationDelay: "70ms" }}
        >
          Run the flock by the numbers, not by feel.
        </h1>

        <p
          className="animate-rise mt-5 max-w-2xl text-body-l text-brand-100/90 [text-wrap:pretty] sm:text-[1.25rem] sm:leading-relaxed"
          style={{ animationDelay: "140ms" }}
        >
          BatchPilot turns each day&apos;s hand-tallied mortality and feed into cumulatives, a clear
          green-amber-red status per house, and a projection against the contractor&apos;s kill date.
        </p>

        <div className="animate-rise mt-8" style={{ animationDelay: "210ms" }}>
          <p className="mb-2.5 text-label font-medium text-brand-100/80">Sign in to the grower app</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="primary" inverse size="lg" onClick={() => onEnter("supervisor")}>
              Supervisor / Foreman
            </Button>
            <Button type="button" variant="secondary" inverse size="lg" onClick={() => onEnter("manager")}>
              Manager
            </Button>
          </div>
          <p className="mt-2.5 text-label text-brand-100/70">
            Supervisor captures the daily numbers · Manager oversees performance.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          inverse
          size="sm"
          onClick={() => onEnter("contractor")}
          className="animate-rise mt-5"
          style={{ animationDelay: "280ms" }}
        >
          Seeing this for a contractor? View the portfolio
        </Button>

        <p className="animate-rise mt-10 text-label text-brand-100/70" style={{ animationDelay: "340ms" }}>
          Grounded in real Ross 308 field data.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Value props ---- */

const POINTS = [
  {
    title: "The maths, done",
    body: "Cull and mort, cumulative %, birds remaining and the site average — computed the moment you type the raw count.",
  },
  {
    title: "Status you can read in glare",
    body: "Green, amber or red per house, with an icon, a word and a shape, so it survives bright sun and colour-blindness.",
  },
  {
    title: "Ahead of the kill date",
    body: "A projected final weight against the contractor's collection date, so you act while it still changes the outcome.",
  },
];

function ValueProps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <h2 className="max-w-2xl text-h1 [text-wrap:balance]">Less work than typing the WhatsApp message.</h2>
      <p className="mt-3 max-w-xl text-body-l text-muted">
        The supervisor types only the raw count. BatchPilot does the rest, the same way every morning.
      </p>

      <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-divider sm:grid-cols-3">
        {POINTS.map((p, i) => (
          <div key={p.title} className="bg-paper p-6 sm:p-7">
            <span className="font-mono text-label font-semibold text-brand-500">0{i + 1}</span>
            <h3 className="mt-3 text-h3">{p.title}</h3>
            <p className="mt-2 text-body text-slate">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Registers ---- */

function Registers({ onEnter }: { onEnter: (r: Role) => void }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="grid gap-5 lg:grid-cols-2">
        <RegisterCard
          eyebrow="For growers"
          title="Spacious, one-thumb screens for the house."
          body="Two profiles on one site: the supervisor captures the daily numbers on big steppers — no keyboard, no maths — while the manager watches performance, projections and the breed curve."
          actions={[
            { label: "Supervisor / Foreman", onClick: () => onEnter("supervisor") },
            { label: "Manager", onClick: () => onEnter("manager") },
          ]}
        />
        <RegisterCard
          eyebrow="For contractors"
          title="A live portfolio of every flock you supply."
          body="Rank houses by EPEF, drill into any grower, plan the catch, and compare the whole network to the breed curve."
          actions={[{ label: "Open the contractor view", onClick: () => onEnter("contractor") }]}
        />
      </div>
    </section>
  );
}

function RegisterCard({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-col rounded-[var(--radius-card)] bg-surface p-7 shadow-card sm:p-8">
      <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-brand-500">{eyebrow}</p>
      <h3 className="mt-3 text-h2 [text-wrap:balance]">{title}</h3>
      <p className="mt-3 flex-1 text-body-l text-slate">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map((a) => (
          <Button key={a.label} type="button" variant="ghost" size="sm" onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Closing band ---- */

function ClosingBand({ onEnter }: { onEnter: (r: Role) => void }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-700 text-white">
      <LogoMark className="pointer-events-none absolute -right-8 top-1/2 h-48 w-auto -translate-y-1/2 text-white/[0.07]" />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-h1 text-white [text-wrap:balance]">See it on real numbers.</h2>
          <p className="mt-2 max-w-md text-body-l text-brand-100/90">
            The demo runs on a real cycle. No sign-up — jump straight in.
          </p>
        </div>
        <Button type="button" variant="primary" inverse size="lg" onClick={() => onEnter("supervisor")} className="shrink-0">
          Get started
        </Button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Footer ---- */

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
      <span className={cn("inline-flex items-center gap-2 text-muted")}>
        <LogoMark className="h-5 w-6 text-brand-700" />
        <span className="font-display text-label font-bold text-ink">BatchPilot</span>
      </span>
      <p className="text-label text-muted">A clear, calm view of every flock. Demo build.</p>
    </footer>
  );
}
