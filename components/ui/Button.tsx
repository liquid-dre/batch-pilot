"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "default" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Optional leading glyph (keep it a node, not a raw colour). */
  icon?: React.ReactNode;
  block?: boolean;
}

/* Heights match the brand component spec: Large 52 / Default 44 / Small 36.
   Grower screens use `lg` only — clears the 44px tap minimum with room for
   gloves (brand-guidelines §6). Colours come from tokens, never hardcoded. */
const SIZES: Record<Size, string> = {
  lg: "h-[52px] px-6 text-[1.0625rem] rounded-[var(--radius-control)] gap-2.5",
  default: "h-11 px-5 text-[0.9375rem] rounded-[var(--radius-control)] gap-2",
  sm: "h-9 px-3.5 text-[0.875rem] rounded-[8px] gap-1.5",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:brightness-95 shadow-[0_1px_2px_rgba(11,42,74,0.18)]",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100",
  ghost:
    "bg-transparent text-slate hover:bg-[rgba(11,42,74,0.05)]",
  danger:
    "bg-status-bad-tint text-status-bad hover:brightness-97 border border-[rgba(198,40,40,0.18)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "default", icon, block, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium select-none",
        "transition-[background-color,box-shadow,transform,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        "active:scale-[0.98] disabled:pointer-events-none disabled:bg-divider disabled:text-hint disabled:shadow-none disabled:border-transparent",
        SIZES[size],
        VARIANTS[variant],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0 [&_svg]:size-5" aria-hidden>{icon}</span> : null}
      {children}
    </button>
  );
});
