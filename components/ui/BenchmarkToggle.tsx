"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { WeightCompareMode } from "@/lib/weightCompare";
import { cn } from "@/lib/cn";

/**
 * The weight-vs-benchmark toggle and the session-scoped store behind it.
 *
 * The chosen mode (numerical difference vs percentage) is remembered for the
 * browser session via sessionStorage and shared across every surface that shows
 * a weight gap — flip it on the dashboard and the history tables/charts follow.
 * useSyncExternalStore keeps SSR returning the default (no hydration mismatch);
 * a custom event syncs all subscribers within the tab after a write. Defaults to
 * the numerical difference per the spec.
 */
const KEY = "bp:weight-compare-mode";
const EVENT = "bp:weight-compare-mode";
const DEFAULT: WeightCompareMode = "difference";

function read(): WeightCompareMode {
  try {
    const v = window.sessionStorage.getItem(KEY);
    return v === "percentage" || v === "difference" ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useWeightCompareMode(): [WeightCompareMode, (mode: WeightCompareMode) => void] {
  const mode = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    read,
    () => DEFAULT,
  );
  const set = useCallback((next: WeightCompareMode) => {
    try {
      window.sessionStorage.setItem(KEY, next);
    } catch {
      /* ignore private-mode/quota errors */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [mode, set];
}

const OPTIONS: { value: WeightCompareMode; label: string }[] = [
  { value: "difference", label: "Difference" },
  { value: "percentage", label: "Percentage" },
];

/**
 * Segmented control for the gap mode. Label-able ("vs target:") and accessible
 * (a labelled group of pressed toggles). Brand tokens only.
 */
export function BenchmarkToggle({ label = "Show gap as", className }: { label?: string; className?: string }) {
  const [mode, setMode] = useWeightCompareMode();
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {label ? <span className="text-label text-muted">{label}</span> : null}
      <div
        role="group"
        aria-label="Show weight gap against the Ross 308 target as a numerical difference or a percentage"
        className="inline-flex rounded-[var(--radius-pill)] border border-border bg-surface p-0.5"
      >
        {OPTIONS.map((o) => {
          const active = mode === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(o.value)}
              className={cn(
                "rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                active ? "bg-brand-700 text-white" : "text-slate hover:text-ink",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
