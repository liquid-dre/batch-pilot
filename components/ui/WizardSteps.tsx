"use client";

import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";

export interface WizardStep {
  id: string;
  label: string;
  /** Rendered with a check instead of its number when done. */
  complete?: boolean;
}

/**
 * Horizontal, click-to-jump step navigation (numbered circles + connectors +
 * labels), themed to the brand tokens. Used to page a per-house capture/weigh
 * flow one house at a time instead of a long vertical scroll — each house is a
 * step; the current step is highlighted, saved steps show a check.
 */
export function WizardSteps({
  steps,
  activeId,
  onSelect,
  ariaLabel = "Steps",
}: {
  steps: WizardStep[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const active = step.id === activeId;
        return (
          <div key={step.id} className="flex min-w-0 shrink-0 items-center">
            <button
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${step.label}${step.complete ? " (done)" : ""}`}
              onClick={() => onSelect(step.id)}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-pill)] px-2.5 py-1.5 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                active
                  ? "bg-brand-700 text-white"
                  : "text-slate hover:bg-surface hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-semibold tabular-nums",
                  active
                    ? "bg-white/20 text-white"
                    : step.complete
                      ? "bg-status-good-tint text-status-good"
                      : "border border-border bg-surface text-muted",
                )}
              >
                {step.complete && !active ? <IconCheck className="size-3.5" /> : i + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </button>
            {i < steps.length - 1 && <span aria-hidden className="mx-0.5 h-px w-4 shrink-0 bg-divider" />}
          </div>
        );
      })}
    </div>
  );
}
