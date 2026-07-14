"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight, type IconComponent } from "@/components/icons";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "default" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  /** Dark-surface treatment (e.g. the brand-900 marketing hero) — swaps the
   *  variant's colours for on-dark equivalents so contrast stays AA. */
  inverse?: boolean;
  /** Busy state — a spinner in the dot slot, disabled + aria-busy. */
  loading?: boolean;
  /**
   * The glyph the leading dot expands into on hover — pick the one that fits the
   * action (arrow-right = go, check = save, plus = add, arrow-left = back,
   * refresh = redo…). Defaults to arrow-right; pass `null` for a plain pill.
   */
  affordance?: IconComponent | null;
  /** A static leading glyph (used only when `affordance` is null, e.g. a filter icon). */
  icon?: React.ReactNode;
  /** Circular icon-only button (requires aria-label). No dot-expand affordance. */
  iconOnly?: React.ReactNode;
}

/* Heights match the brand spec: Large 52 / Default 44 / Small 36 (grower screens
   use `lg`). All pill-shaped now. Colours come from tokens, never hardcoded.
   The left padding is tighter than the right (the dot hugs the edge) and pulls
   in further on hover — the reference's "lean". `dotPad` is the padding the
   reveal dot wraps its glyph in (so the dot grows with the glyph); `dotSize` is
   the fixed footprint used by the loading spinner. */
const SIZE: Record<Size, { pill: string; dotPad: string; dotSize: string; icon: string; only: string }> = {
  lg: { pill: "h-[52px] pl-4 pr-6 hover:pl-3 text-[1.0625rem] gap-2.5", dotPad: "p-1.5", dotSize: "size-7", icon: "group-hover:size-4", only: "size-[52px]" },
  default: { pill: "h-11 pl-3.5 pr-5 hover:pl-2.5 text-[0.9375rem] gap-2", dotPad: "p-1", dotSize: "size-6", icon: "group-hover:size-3.5", only: "size-11" },
  sm: { pill: "h-9 pl-3 pr-3.5 hover:pl-2 text-[0.875rem] gap-1.5", dotPad: "p-1", dotSize: "size-5", icon: "group-hover:size-3", only: "size-9" },
};

/* Per-variant pill / dot / revealed-icon colours — all semantic tokens. Only
   `primary` (the major CTA) carries the azure accent; `secondary` + `ghost` are
   monochrome (greyscale) so colour stays reserved for CTAs; `danger` = status. */
const VARIANT: Record<Variant, { pill: string; dot: string; icon: string }> = {
  primary: {
    pill: "bg-brand-700 text-white hover:bg-brand-800 shadow-card",
    dot: "bg-white group-disabled:bg-hint",
    icon: "text-brand-700",
  },
  secondary: {
    pill: "bg-surface text-ink border border-border hover:border-ink hover:bg-wash",
    dot: "bg-ink group-disabled:bg-hint",
    icon: "text-surface",
  },
  ghost: {
    pill: "bg-transparent text-slate hover:bg-wash hover:text-ink",
    dot: "bg-divider group-hover:bg-slate group-disabled:bg-divider",
    icon: "text-slate group-hover:text-surface",
  },
  danger: {
    pill: "bg-status-bad-tint text-status-bad border border-status-bad/20 hover:bg-status-bad hover:text-white hover:border-status-bad",
    dot: "bg-status-bad group-hover:bg-white group-disabled:bg-hint",
    icon: "text-status-bad",
  },
};

/* On-dark counterparts for chrome that stays dark in BOTH themes (the marketing
   hero on `--canvas-invert`). `primary` keeps the azure accent CTA (the one spot
   of colour); `secondary`/`ghost` are monochrome on-dark (white-with-alpha is the
   glass idiom for translucency — there is no semantic token for it); `danger` =
   status. The revealed glyph sits on the light dot, so it takes the dark base. */
const INVERSE: Record<Variant, { pill: string; dot: string; icon: string }> = {
  primary: {
    pill: "bg-brand-700 text-white hover:bg-brand-800 shadow-card",
    dot: "bg-white group-disabled:bg-white/40",
    icon: "text-brand-700",
  },
  secondary: {
    pill: "bg-white/10 text-on-invert border border-white/25 hover:bg-white/20",
    dot: "bg-white/90 group-disabled:bg-white/30",
    icon: "text-canvas-invert",
  },
  ghost: {
    pill: "bg-transparent text-on-invert-dim hover:bg-white/10 hover:text-on-invert",
    dot: "bg-white/15 group-hover:bg-white/90 group-disabled:bg-white/10",
    icon: "text-on-invert group-hover:text-canvas-invert",
  },
  danger: {
    pill: "bg-status-bad text-white hover:brightness-110 shadow-card",
    dot: "bg-white group-disabled:bg-white/40",
    icon: "text-status-bad",
  },
};

const BASE = cn(
  "group relative inline-flex items-center justify-center font-medium select-none rounded-pill",
  "transition-[background-color,color,border-color,box-shadow,transform,padding] duration-[var(--dur)] ease-[var(--ease-out)]",
  "active:scale-[0.98] focus-visible:rounded-pill",
  "disabled:pointer-events-none disabled:bg-divider disabled:text-hint disabled:shadow-none disabled:border-transparent",
);

/**
 * The leading dot that EXPANDS into its glyph on hover (the reference move): at
 * rest a small filled circle (padding around a zero-size glyph); on hover the
 * glyph grows from nothing, slides in and fades up — so the dot grows into an
 * arrow-circle and nudges the label. The glyph rotates -45° on press. Reduced
 * motion snaps to the end-state (still legible) via the global reset.
 */
function Dot({ size, dotClass, iconClass, Icon }: { size: Size; dotClass: string; iconClass: string; Icon: IconComponent }) {
  const s = SIZE[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "transition-[background-color] duration-[var(--dur)] ease-[var(--ease-out)]",
        s.dotPad,
        dotClass,
      )}
    >
      <Icon
        className={cn(
          "size-0 -translate-x-2 opacity-0",
          s.icon,
          "group-hover:translate-x-0 group-hover:opacity-100 group-active:-rotate-45",
          "transition-[width,height,transform,opacity] duration-[var(--dur)] ease-[var(--ease-out)]",
          iconClass,
        )}
      />
    </span>
  );
}

function Spinner({ size }: { size: Size }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent", SIZE[size].dotSize)}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "default", block, inverse, loading, affordance = IconArrowRight, icon, iconOnly, className, children, disabled, ...props },
  ref,
) {
  const v = inverse ? INVERSE[variant] : VARIANT[variant];

  if (iconOnly) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(BASE, "shrink-0 p-0 [&_svg]:size-5", SIZE[size].only, v.pill, className)}
        {...props}
      >
        {loading ? <Spinner size={size} /> : <span aria-hidden>{iconOnly}</span>}
      </button>
    );
  }

  const Affordance = affordance;
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, SIZE[size].pill, v.pill, block && "w-full", className)}
      {...props}
    >
      {loading ? (
        <Spinner size={size} />
      ) : Affordance ? (
        <Dot size={size} dotClass={v.dot} iconClass={v.icon} Icon={Affordance} />
      ) : icon ? (
        <span aria-hidden className="shrink-0 [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});
