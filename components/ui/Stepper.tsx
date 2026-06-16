"use client";

import { useId } from "react";

interface StepperProps {
  label?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Trailing unit shown next to the number, e.g. "kg". */
  suffix?: string;
}

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
  </svg>
);

/**
 * Big +/− stepper for numeric entry on grower screens — not a raw keyboard
 * (low-literacy, gloved, in bright sun; ROADMAP §6, brand-guidelines §6).
 * 56px controls clear the tap minimum; the value is mono with tabular figures.
 */
export function Stepper({ label, hint, value, onChange, min = 0, max = 9999, step = 1, suffix }: StepperProps) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  const btn =
    "flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-control)] " +
    "bg-brand-50 text-brand-700 transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "hover:bg-brand-100 active:scale-95 disabled:bg-divider disabled:text-hint disabled:active:scale-100";

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span id={id} className="text-label text-slate">
          {label}
        </span>
      ) : null}
      <div role="group" aria-labelledby={label ? id : undefined} className="flex items-center gap-3">
        <button type="button" className={btn} onClick={dec} disabled={value <= min} aria-label={`Decrease ${label ?? "value"}`}>
          <MinusIcon />
        </button>
        <div
          aria-live="polite"
          className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3"
        >
          <span className="text-data text-ink text-[1.375rem] font-medium tabular-nums">{value}</span>
          {suffix ? <span className="text-label text-muted font-mono">{suffix}</span> : null}
        </div>
        <button type="button" className={btn} onClick={inc} disabled={value >= max} aria-label={`Increase ${label ?? "value"}`}>
          <PlusIcon />
        </button>
      </div>
      {hint ? <p className="text-label text-muted">{hint}</p> : null}
    </div>
  );
}
