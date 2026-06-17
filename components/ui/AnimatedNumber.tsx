"use client";

import { useEffect, useRef, useState } from "react";
import { num, pct, grams, kg } from "@/lib/format";

/** Format presets — a string (not a function) so server components can pass it. */
export type NumberFormat = "int" | "pct" | "grams" | "kg";

const FORMATTERS: Record<NumberFormat, (n: number) => string> = {
  int: (n) => num(Math.round(n)),
  pct: (n) => pct(n),
  grams: (n) => grams(Math.round(n)),
  kg: (n) => kg(Math.round(n)),
};

interface AnimatedNumberProps {
  value: number;
  format?: NumberFormat;
  durationMs?: number;
}

/**
 * Counts a hero figure up to its value once on mount (ease-out cubic). SSR and
 * the first render show the final value (no layout shift, works without JS);
 * `prefers-reduced-motion` skips the tween. Format is a preset string so this
 * client component can be used from server components.
 */
export function AnimatedNumber({ value, format = "int", durationMs = 650 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const done = useRef(false);
  const fmt = FORMATTERS[format];

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <span className="tabular-nums">{fmt(display)}</span>;
}
