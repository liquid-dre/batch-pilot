import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  body?: string;
  /** Optional action (e.g. a Button or Link). */
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/** Calm, branded empty state — a quiet card, not an error. */
export function EmptyState({ title, body, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <span className="text-hint [&_svg]:size-7" aria-hidden>{icon}</span> : null}
      <p className="text-h3 text-ink">{title}</p>
      {body ? <p className="max-w-sm text-body text-muted">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
