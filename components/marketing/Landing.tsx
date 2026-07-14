"use client";

import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import type { WeightBandData } from "@/lib/view";
import { useCurrentUser } from "@/lib/auth";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { HeroEggpit } from "./HeroEggpit";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconLogin } from "@/components/icons";
import { hero, footer } from "@/lib/landingCopy";
import { Problem, Wedge, WhoItsFor, CatchItEarly, HowItWorks, Trust, Faq, FinalCta } from "./landing/sections";

/**
 * Marketing landing at `/`. No real auth in the demo: the CTAs set a demo
 * session role via the AuthProvider stub, then navigate into `/app`. When a
 * Convex deployment is connected they go to real sign-in/sign-up (role as
 * `intent`). All copy lives in `lib/landingCopy.ts`. The chart is fed a plain
 * `WeightBandData` fetched server-side in `app/page.tsx` (no Convex needed).
 */
export function Landing({ benchmarkData }: { benchmarkData: WeightBandData }) {
  const router = useRouter();
  const { setRole } = useCurrentUser();
  const connected = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  const enter = (role: Role) => {
    if (connected) router.push(`/signin?intent=${role}`);
    else {
      setRole(role);
      router.push("/app");
    }
  };

  const login = () => {
    if (connected) router.push("/signin");
    else {
      setRole("manager");
      router.push("/app");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Hero onEnter={enter} onLogin={login} />
      <Problem />
      <Wedge />
      <WhoItsFor onEnter={enter} />
      <CatchItEarly data={benchmarkData} />
      <HowItWorks />
      <Trust />
      <Faq />
      <FinalCta onEnter={enter} onLogin={login} />
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
        <LogoMark className="animate-float absolute -bottom-16 -right-10 h-[26rem] w-auto text-white/[0.05]" />
      </div>
      {/* Scrim: keeps the white headline/CTAs AA-legible if a pale egg drifts behind. */}
      <div className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-br from-brand-900/55 via-transparent to-brand-900/45" />

      {/* top nav */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-6 w-7 text-white" />
          <span className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em]">BatchPilot</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ThemeToggle onDark />
          <Button type="button" variant="ghost" inverse size="sm" affordance={IconLogin} onClick={onLogin}>
            {hero.secondaryCta}
          </Button>
        </span>
      </nav>

      {/* hero content */}
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center px-4 pb-24 pt-10 [text-shadow:0_1px_14px_rgba(12,9,13,0.55)] sm:px-6 sm:pb-32 sm:pt-16">
        <p
          className="animate-rise inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-label font-medium text-on-invert-dim"
          style={{ animationDelay: "0ms" }}
        >
          {hero.eyebrow}
        </p>

        <h1
          className="animate-rise mt-5 max-w-3xl font-display font-extrabold leading-[1.04] tracking-[-0.03em] text-white text-[clamp(2.35rem,6vw,3.75rem)] [text-wrap:balance]"
          style={{ animationDelay: "70ms" }}
        >
          {hero.headline}
        </h1>

        <p
          className="animate-rise mt-5 max-w-2xl text-body-l text-on-invert-dim [text-wrap:pretty] sm:text-[1.25rem] sm:leading-relaxed"
          style={{ animationDelay: "140ms" }}
        >
          {hero.subhead}
        </p>

        <div className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "210ms" }}>
          <Button type="button" variant="primary" inverse size="lg" onClick={() => onEnter("supervisor")}>
            {hero.primaryCta}
          </Button>
          <Button type="button" variant="ghost" inverse size="lg" affordance={IconLogin} onClick={onLogin}>
            {hero.secondaryCta}
          </Button>
        </div>

        <p className="animate-rise mt-8 text-label text-on-invert-dim" style={{ animationDelay: "300ms" }}>
          {hero.trustLine}
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Footer ---- */

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
      <span className="inline-flex items-center gap-2 text-muted">
        <LogoMark className="h-5 w-6 text-brand-600" />
        <span className="font-display text-label font-bold text-ink">BatchPilot</span>
      </span>
      <p className="text-label text-muted">{footer.tagline}</p>
    </footer>
  );
}
