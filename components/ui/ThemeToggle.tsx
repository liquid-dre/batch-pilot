"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTheme, type Theme } from "@/lib/useTheme";
import { IconSun, IconMoon, type IconComponent } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Light/dark toggle. Two shapes from one component:
 * - default: a labelled segmented slider (Light · Dark) with an azure pill that
 *   slides behind the active side — the app's segmented-control house style
 *   (`bg-brand-700` active), so it stays inside the monochrome + azure system.
 * - `compact`: the single 36px icon button (shows the mode you'd switch TO) —
 *   used in the collapsed sidebar rail where the labelled slider can't fit.
 * `onDark` swaps to the on-dark-chrome treatment for the always-dark hero.
 * Wired to `useTheme` (persists `bp.theme`, broadcasts `bp:theme`), never local
 * state. Icons come from the central module. The slide is reduced-motion aware.
 */

const SEGMENTS: { value: Theme; label: string; Icon: IconComponent }[] = [
  { value: "light", label: "Light", Icon: IconSun },
  { value: "dark", label: "Dark", Icon: IconMoon },
];

export function ThemeToggle({ className, onDark, compact }: { className?: string; onDark?: boolean; compact?: boolean }) {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";
  const reduce = useReducedMotion();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        aria-pressed={dark}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors duration-[var(--dur-fast)] active:scale-[0.96]",
          onDark ? "text-on-invert-dim hover:bg-white/10 hover:text-on-invert" : "text-muted hover:bg-wash hover:text-ink",
          className,
        )}
      >
        {dark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        "relative inline-grid shrink-0 grid-cols-2 items-center rounded-[var(--radius-pill)] border p-0.5",
        onDark ? "border-white/20 bg-white/10" : "border-border bg-paper",
        className,
      )}
    >
      {/* Sliding active pill — behind the labels; equal grid columns keep the
          half-width pill flush with the active segment. */}
      <span aria-hidden className={cn("pointer-events-none absolute inset-0.5 z-0 flex", dark ? "justify-end" : "justify-start")}>
        <motion.span
          layout
          transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-1/2 rounded-[var(--radius-pill)] bg-brand-700 shadow-card"
        />
      </span>

      {SEGMENTS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              active ? "text-white" : onDark ? "text-on-invert-dim hover:text-on-invert" : "text-slate hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
