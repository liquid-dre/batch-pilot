"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface StepperProps {
  label?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places (e.g. 1 for growth ratio). 0 → integer entry. */
  decimals?: number;
  /** Trailing unit shown next to the number, e.g. "kg". */
  suffix?: string;
}

import { IconMinus, IconPlus } from "@/components/icons";

const MinusIcon = () => <IconMinus className="size-6" />;
const PlusIcon = () => <IconPlus className="size-6" />;

/**
 * Hybrid numeric control for grower screens (ROADMAP §6 + §8): tap +/- OR tap
 * the number and type it directly. The centre is a real <input> with
 * inputMode numeric/decimal, so phones show a number pad; the buttons still
 * give a no-keyboard path in the house (gloves, glare). 56px targets.
 *
 * Press-and-hold on +/- repeats with acceleration. Typing emits a clamped value
 * on each keystroke and normalises on blur; clearing then blurring keeps the
 * prior value rather than snapping to min.
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
  const fmt = useCallback((n: number) => n.toFixed(decimals), [decimals]);

  // While focused the input shows the raw draft; otherwise the formatted value.
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const display = focused ? draft : fmt(value);

  const round = useCallback((n: number) => {
    const f = 10 ** decimals;
    return Math.round(n * f) / f;
  }, [decimals]);
  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);

  // Latest value/onChange for the hold-repeat interval's stale closure.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apply = useCallback(
    (dir: 1 | -1, mult = 1) => {
      const next = round(clamp(valueRef.current + dir * step * mult));
      if (next !== valueRef.current) {
        valueRef.current = next;
        onChangeRef.current(next);
      }
    },
    [round, clamp, step],
  );

  const stopHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startHold = useCallback(
    (dir: 1 | -1) => {
      apply(dir);
      let ticks = 0;
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          ticks += 1;
          const mult = ticks > 45 ? 25 : ticks > 22 ? 5 : 1;
          apply(dir, mult);
        }, 55);
      }, 380);
    },
    [apply],
  );

  useEffect(() => stopHold, [stopHold]);

  const parse = (raw: string): number => Number(raw.replace(/[^0-9.\-]/g, ""));

  const onInput = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === "" || raw === "-" || raw === ".") return; // mid-typing
    const n = parse(raw);
    if (!Number.isNaN(n)) onChange(clamp(round(n)));
  };

  const onBlur = () => {
    setFocused(false);
    const n = parse(draft);
    onChange(Number.isNaN(n) || draft.trim() === "" ? value : clamp(round(n)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); apply(1); setDraft(fmt(clamp(round(value + step)))); }
    else if (e.key === "ArrowDown") { e.preventDefault(); apply(-1); setDraft(fmt(clamp(round(value - step)))); }
  };

  const btn =
    "flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-control)] " +
    "bg-brand-50 text-brand-700 select-none touch-none " +
    "transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "hover:bg-brand-100 active:scale-95 disabled:bg-divider disabled:text-hint disabled:active:scale-100";

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-label text-slate">
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-3">
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

        <div className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 transition-colors duration-[var(--dur-fast)] focus-within:border-brand-500">
          <input
            id={id}
            type="text"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            aria-label={label}
            value={display}
            onFocus={() => { setFocused(true); setDraft(fmt(value)); }}
            onChange={(e) => onInput(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 bg-transparent text-center text-data text-[1.375rem] font-medium tabular-nums text-ink outline-none"
          />
          {suffix ? <span className="shrink-0 text-label text-muted font-mono">{suffix}</span> : null}
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
