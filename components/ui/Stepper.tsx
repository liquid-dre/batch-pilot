"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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
  /**
   * Count fields (mortality, culls, treatment amounts) start blank with a "0"
   * placeholder instead of a literal 0: the first keystroke replaces (4 → 4,
   * never 40) and an empty field saves as 0. Leave off for seeded fields.
   */
  blankZero?: boolean;
}

import { IconMinus, IconPlus } from "@/components/icons";

const MinusIcon = () => <IconMinus className="size-6" />;
const PlusIcon = () => <IconPlus className="size-6" />;

/** True for a digit or a decimal point — the "significant" chars a caret tracks. */
const isSig = (ch: string) => (ch >= "0" && ch <= "9") || ch === ".";

/** Comma-group the integer part of a numeric string; keep sign + decimals verbatim. */
export function group(s: string): string {
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf(".");
  const intPart = dot === -1 ? body : body.slice(0, dot);
  const rest = dot === -1 ? "" : body.slice(dot); // includes the "."
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + grouped + rest;
}

/** Strip commas/letters to a clean numeric string (one leading sign, one dot). */
export function clean(raw: string): string {
  const sign = raw.trimStart().startsWith("-") ? "-" : "";
  let digits = raw.replace(/[^0-9.]/g, "");
  const fd = digits.indexOf(".");
  if (fd !== -1) digits = digits.slice(0, fd + 1) + digits.slice(fd + 1).replace(/\./g, "");
  return digits === "" ? "" : sign + digits;
}

/** Count significant chars (digits + dot) in the first `upto` chars of `s`. */
function countSig(s: string, upto: number): number {
  let c = 0;
  for (let i = 0; i < upto && i < s.length; i++) if (isSig(s[i])) c++;
  return c;
}

/** Index just after the `n`th significant char in `s` — for caret restoration. */
function caretForSig(s: string, n: number): number {
  if (n <= 0) return 0;
  let c = 0;
  for (let i = 0; i < s.length; i++) {
    if (isSig(s[i])) {
      c++;
      if (c === n) return i + 1;
    }
  }
  return s.length;
}

/**
 * Reformat a raw input string to its comma-grouped form and map the caret to the
 * matching position — pure, so the grouping/caret behaviour is unit-testable
 * without a DOM. Given the raw value and the caret offset the browser produced,
 * returns the grouped text and where the caret should sit after React re-renders.
 */
export function reformat(raw: string, caretPos: number): { text: string; caret: number } {
  const sig = countSig(raw, caretPos);
  const cleaned = clean(raw);
  const text = cleaned === "" || cleaned === "-" ? cleaned : group(cleaned);
  return { text, caret: caretForSig(text, sig) };
}

/**
 * Hybrid numeric control for grower screens (ROADMAP §6 + §8): tap +/- OR tap
 * the number and type it directly. The centre is a real <input> with
 * inputMode numeric/decimal, so phones show a number pad; the buttons still
 * give a no-keyboard path in the house (gloves, glare). 56px targets.
 *
 * Press-and-hold on +/- repeats with acceleration. Typing emits a clamped value
 * on each keystroke and normalises on blur; clearing then blurring keeps the
 * prior value (or 0 for a blankZero field) rather than snapping to min.
 *
 * Large numbers are comma-grouped as you type (4000 → 4,000) while the emitted
 * value stays numeric; the caret is preserved across the reformat so grouping
 * never fights the number pad.
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
  blankZero = false,
}: StepperProps) {
  const id = useId();
  const fmt = useCallback((n: number) => group(n.toFixed(decimals)), [decimals]);

  // A blankZero field shows nothing (just its placeholder) while it holds 0.
  const showBlank = blankZero && value === 0;

  // While focused the input shows the raw draft; otherwise the formatted value.
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const display = focused ? draft : showBlank ? "" : fmt(value);

  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  // After a reformat, drop the caret back where it was (by significant-char count).
  useLayoutEffect(() => {
    if (caretRef.current != null && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
    }
    caretRef.current = null;
  });

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

  const parse = (raw: string): number => Number(clean(raw));

  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const raw = el.value;
    const cleaned = clean(raw);
    const { text, caret } = reformat(raw, el.selectionStart ?? raw.length);
    setDraft(text);
    caretRef.current = caret;

    if (cleaned === "" || cleaned === "-" || cleaned === ".") {
      if (blankZero && cleaned === "") onChange(clamp(0)); // blank ⇒ 0
      return;
    }
    const n = Number(cleaned);
    if (!Number.isNaN(n)) onChange(clamp(round(n)));
  };

  const onBlur = () => {
    setFocused(false);
    const n = parse(draft);
    if (draft.trim() === "" || Number.isNaN(n)) onChange(blankZero ? clamp(0) : value);
    else onChange(clamp(round(n)));
  };

  /** Draft after a +/- keystroke — blank if a blankZero field lands back on 0. */
  const stepDraft = (n: number) => setDraft(blankZero && n === 0 ? "" : fmt(n));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); apply(1); stepDraft(clamp(round(value + step))); }
    else if (e.key === "ArrowDown") { e.preventDefault(); apply(-1); stepDraft(clamp(round(value - step))); }
  };

  const btn =
    "flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-control)] " +
    "bg-brand-50 text-brand-600 select-none touch-none " +
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
            ref={inputRef}
            type="text"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            aria-label={label}
            value={display}
            placeholder={blankZero ? "0" : undefined}
            onFocus={() => { setFocused(true); setDraft(showBlank ? "" : fmt(value)); }}
            onChange={onInput}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 bg-transparent text-center text-data text-[1.375rem] font-medium tabular-nums text-ink outline-none placeholder:text-hint placeholder:font-normal"
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
