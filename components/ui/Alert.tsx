import { cn } from "@/lib/cn";

/**
 * Callout used for info / success / warning / error (brand-guidelines §6):
 * icon + bold title + plain line. Status variants reuse the reserved status
 * tints; info uses the brand tint. Full background tint + matching icon — no
 * side-stripe borders.
 */

type Tone = "info" | "success" | "warning" | "error";

interface AlertProps {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
  /** Optional action area (e.g. a small Button). */
  action?: React.ReactNode;
  className?: string;
}

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    <path d="M12 11v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="7.6" r="1.05" fill="currentColor" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    <path d="M8 12.3 11 15.3 16.5 8.7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarnIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
    <path d="M12 3.5 21 19H3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M12 9.5v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="16.4" r="1.05" fill="currentColor" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.75" />
    <path d="M12 8v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="15.8" r="1.05" fill="currentColor" />
  </svg>
);

const TONES: Record<Tone, { wrap: string; fg: string; Icon: () => React.ReactElement }> = {
  info: { wrap: "bg-brand-50", fg: "text-brand-700", Icon: InfoIcon },
  success: { wrap: "bg-status-good-tint", fg: "text-status-good", Icon: CheckIcon },
  warning: { wrap: "bg-status-warn-tint", fg: "text-status-warn", Icon: WarnIcon },
  error: { wrap: "bg-status-bad-tint", fg: "text-status-bad", Icon: ErrorIcon },
};

export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const { wrap, fg, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-[var(--radius-card)] p-4", wrap, className)}
    >
      <span className={cn("mt-0.5 shrink-0", fg)}>
        <Icon />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-h3 font-semibold", fg)}>{title}</p>
        {children ? <div className="mt-0.5 text-body text-slate">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
