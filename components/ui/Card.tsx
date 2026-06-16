import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Subtle lift on hover — for interactive/clickable cards only. */
  interactive?: boolean;
  as?: "div" | "article" | "section";
}

/* The surface primitive: token radius + soft brand-tinted shadow, never the
   1px-border-plus-wide-shadow "ghost card". One depth, used consistently. */
export function Card({ interactive, as = "div", className, children, ...props }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "bg-surface rounded-[var(--radius-card)] shadow-card",
        interactive &&
          "transition-shadow duration-[var(--dur)] ease-[var(--ease-out)] hover:shadow-raised",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props}>
      {children}
    </div>
  );
}

/** Small uppercase eyebrow used inside cards (e.g. "FLOCK · DAY"). Used
 *  deliberately as a data label, not as decorative scaffolding on every block. */
export function CardEyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
