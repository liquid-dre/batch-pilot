"use client";

import { useCallback, useEffect, useId, useRef } from "react";

interface StepperProps {
  label?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places to display (e.g. 1 for growth ratio). */
  decimals?: number;
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
 *
 * Press-and-hold repeats with acceleration so large values (feed kg) take a few
 * seconds, not dozens of taps. The value box is a focusable spinbutton with
 * full arrow / Page / Home-End keyboard support.
 */
export function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  decimals = 0,
  suffix,
}: StepperProps) {
  const id = useId();

  // Latest values for use inside the hold interval's stale closure. Synced in
  // effects (not during render) so the repeat loop always sees current values.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const round = useCallback(
    (n: number) => {
      const factor = 10 ** decimals;
      return Math.round(n * factor) / factor;
    },
    [decimals],
  );

  const apply = useCallback(
    (dir: 1 | -1, mult = 1) => {
      const next = round(Math.min(max, Math.max(min, valueRef.current + dir * step * mult)));
      if (next !== valueRef.current) {
        valueRef.current = next;
        onChangeRef.current(next);
      }
    },
    [round, max, min, step],
  );

  const stopHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startHold = useCallback(
    (dir: 1 | -1) => {
      apply(dir); // immediate feedback on press
      let ticks = 0;
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          ticks += 1;
          const mult = ticks > 45 ? 25 : ticks > 22 ? 5 : 1; // accelerate while held
          apply(dir, mult);
        }, 55);
      }, 380);
    },
    [apply],
  );

  useEffect(() => stopHold, [stopHold]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        e.preventDefault();
        apply(1);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        e.preventDefault();
        apply(-1);
        break;
      case "PageUp":
        e.preventDefault();
        apply(1, 10);
        break;
      case "PageDown":
        e.preventDefault();
        apply(-1, 10);
        break;
      case "Home":
        e.preventDefault();
        onChange(min);
        break;
      case "End":
        e.preventDefault();
        onChange(max);
        break;
    }
  };

  const display = value.toFixed(decimals);
  const btn =
    "flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-control)] " +
    "bg-brand-50 text-brand-700 select-none touch-none " +
    "transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "hover:bg-brand-100 active:scale-95 disabled:bg-divider disabled:text-hint disabled:active:scale-100";

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span id={id} className="text-label text-slate">
          {label}
        </span>
      ) : null}
      <div role="group" aria-labelledby={label ? id : undefined} className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          disabled={value <= min}
          aria-label={`Decrease ${label ?? "value"}`}
          tabIndex={-1}
        >
          <MinusIcon />
        </button>
        <div
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={suffix ? `${display} ${suffix}` : display}
          onKeyDown={onKeyDown}
          className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3"
        >
          <span className="text-data text-ink text-[1.375rem] font-medium tabular-nums">{display}</span>
          {suffix ? <span className="text-label text-muted font-mono">{suffix}</span> : null}
        </div>
        <button
          type="button"
          className={btn}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          disabled={value >= max}
          aria-label={`Increase ${label ?? "value"}`}
          tabIndex={-1}
        >
          <PlusIcon />
        </button>
      </div>
      {hint ? <p className="text-label text-muted">{hint}</p> : null}
    </div>
  );
}
