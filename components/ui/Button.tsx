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
   use `lg`). All pill-shaped now. Colours come from tokens, never hardcoded. */
const SIZE: Record<Size, { pill: string; dot: string; icon: string; only: string }> = {
  lg: { pill: "h-[52px] px-6 text-[1.0625rem] gap-2.5", dot: "size-7", icon: "size-4", only: "size-[52px]" },
  default: { pill: "h-11 px-5 text-[0.9375rem] gap-2", dot: "size-6", icon: "size-3.5", only: "size-11" },
  sm: { pill: "h-9 px-3.5 text-[0.875rem] gap-1.5", dot: "size-5", icon: "size-3", only: "size-9" },
};

/* Per-variant pill / dot / revealed-icon colours — all semantic tokens. The
   secondary + danger variants invert light→dark on hover (the reference move);
   primary deepens; ghost washes in. */
const VARIANT: Record<Variant, { pill: string; dot: string; icon: string }> = {
  primary: {
    pill: "bg-brand-700 text-white hover:bg-brand-900 shadow-card",
    dot: "bg-white group-disabled:bg-hint",
    icon: "text-brand-700",
  },
  secondary: {
    pill: "bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-700 hover:text-white hover:border-brand-700",
    dot: "bg-brand-700 group-hover:bg-white group-disabled:bg-hint",
    icon: "text-brand-700",
  },
  ghost: {
    pill: "bg-transparent text-slate hover:bg-brand-50 hover:text-brand-700",
    dot: "bg-brand-100 group-hover:bg-brand-600 group-disabled:bg-divider",
    icon: "text-brand-700 group-hover:text-white",
  },
  danger: {
    pill: "bg-status-bad-tint text-status-bad border border-status-bad/20 hover:bg-status-bad hover:text-white hover:border-status-bad",
    dot: "bg-status-bad group-hover:bg-white group-disabled:bg-hint",
    icon: "text-status-bad",
  },
};

/* On-dark counterparts (marketing hero on brand-900 / brand-700). White-with-
   alpha is the glass idiom the landing already uses; there is no semantic token
   for translucency. `primary` becomes the filled light pill (the prominent CTA),
   `secondary` an outline, `ghost` a subtle text button. */
const INVERSE: Record<Variant, { pill: string; dot: string; icon: string }> = {
  primary: {
    pill: "bg-surface text-brand-700 hover:bg-brand-50 shadow-card",
    dot: "bg-brand-700 group-disabled:bg-hint",
    icon: "text-white",
  },
  secondary: {
    pill: "bg-white/10 text-white border border-white/25 hover:bg-white/20",
    dot: "bg-white/90 group-disabled:bg-hint",
    icon: "text-brand-700",
  },
  ghost: {
    pill: "bg-transparent text-brand-100 hover:bg-white/10 hover:text-white",
    dot: "bg-white/15 group-hover:bg-white/90 group-disabled:bg-white/10",
    icon: "text-brand-100 group-hover:text-brand-700",
  },
  danger: {
    pill: "bg-status-bad text-white hover:brightness-110 shadow-card",
    dot: "bg-white group-disabled:bg-hint",
    icon: "text-status-bad",
  },
};

const BASE = cn(
  "group relative inline-flex items-center justify-center font-medium select-none rounded-pill",
  "transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--dur)] ease-[var(--ease-out)]",
  "active:scale-[0.98] focus-visible:rounded-pill",
  "disabled:pointer-events-none disabled:bg-divider disabled:text-hint disabled:shadow-none disabled:border-transparent",
);

/** The leading dot that reveals its glyph on hover. */
function Dot({ size, dotClass, iconClass, Icon }: { size: Size; dotClass: string; iconClass: string; Icon: IconComponent }) {
  const s = SIZE[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full group-hover:scale-110",
        "transition-[background-color,transform] duration-[var(--dur)] ease-[var(--ease-out)]",
        s.dot,
        dotClass,
      )}
    >
      <Icon
        className={cn(
          s.icon,
          iconClass,
          "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
          "transition-[opacity,transform] duration-[var(--dur)] ease-[var(--ease-out)]",
        )}
      />
    </span>
  );
}

function Spinner({ size }: { size: Size }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent", SIZE[size].dot)}
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
