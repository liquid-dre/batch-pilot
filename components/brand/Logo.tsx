import { cn } from "@/lib/cn";

/**
 * BatchPilot identity (brand-guidelines §2): two ascending chevrons — a rising
 * trajectory and a roofline at once. Purely geometric (no bird/leaf/tractor),
 * one flat colour so it themes and stays sharp at 16px. Drawn in currentColor.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 24" className={className} fill="none" aria-hidden role="presentation">
      <path
        d="M3 16.5 10 9.5 17 16.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 13 18 6 25 13"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps {
  /** Hide the wordmark (icon-only lockup for tight spaces). */
  iconOnly?: boolean;
  className?: string;
}

export function Logo({ iconOnly, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-brand-600", className)}>
      <LogoMark className="h-6 w-7" />
      {!iconOnly ? (
        <span className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em] text-ink">
          BatchPilot
        </span>
      ) : null}
    </span>
  );
}
