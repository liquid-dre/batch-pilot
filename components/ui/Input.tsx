"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Plain-language helper under the field. */
  hint?: string;
  error?: string;
  /** Trailing unit/adornment, e.g. "kg", "°C". */
  suffix?: string;
}

/* 52px tall to clear the glove-friendly tap minimum (brand-guidelines §6).
   Focus ring is the brand-500 ring from globals.css :focus-visible. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, suffix, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={fieldId} className="text-label text-slate">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-[52px] w-full bg-surface text-ink text-body-l",
            "rounded-[var(--radius-control)] border px-3.5",
            "placeholder:text-hint",
            "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            error ? "border-status-bad" : "border-border focus:border-brand-500",
            suffix && "pr-12",
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-label text-muted font-mono">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-label text-status-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-label text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
