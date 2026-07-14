import { cn } from "@/lib/cn";
import { IconInfo, IconStatusGood, IconStatusWarn, IconStatusBad, type IconComponent } from "@/components/icons";

/**
 * Callout used for info / success / warning / error (brand-guidelines §6):
 * icon + bold title + plain line. Status variants reuse the reserved status
 * tints; info uses the azure accent tint (never a status hue, so an
 * informational callout can't be mistaken for a red error). Full background tint
 * + matching icon — no side-stripe borders.
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

const TONES: Record<Tone, { wrap: string; fg: string; Icon: IconComponent }> = {
  info: { wrap: "bg-accent-50", fg: "text-accent-700", Icon: IconInfo },
  success: { wrap: "bg-status-good-tint", fg: "text-status-good", Icon: IconStatusGood },
  warning: { wrap: "bg-status-warn-tint", fg: "text-status-warn", Icon: IconStatusWarn },
  error: { wrap: "bg-status-bad-tint", fg: "text-status-bad", Icon: IconStatusBad },
};

export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const { wrap, fg, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-[var(--radius-card)] p-4", wrap, className)}
    >
      <span className={cn("mt-0.5 shrink-0", fg)}>
        <Icon className="size-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-h3 font-semibold", fg)}>{title}</p>
        {children ? <div className="mt-0.5 text-body text-slate">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
