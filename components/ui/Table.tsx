import { cn } from "@/lib/cn";

/**
 * Dense data table for contractor screens (brand-guidelines §6): dark inverse
 * header row (reads on both themes), mono tabular numbers, status pills, compact
 * rows. Composable so callers control columns; numeric cells opt into mono via
 * the `num` prop.
 */

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-divider">
      <table className={cn("w-full border-collapse text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-canvas-invert text-[0.75rem] uppercase tracking-[0.04em] text-on-invert-dim">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-divider">{children}</tbody>;
}

export function TR({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "bg-surface transition-colors duration-[var(--dur-fast)] hover:bg-wash",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface CellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Render as a mono, right-aligned numeric cell. */
  num?: boolean;
}

export function TH({ num, className, children, ...props }: CellProps) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-2.5 font-semibold", num && "text-right tabular-nums", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ num, className, children, ...props }: CellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-body text-slate",
        num && "text-right font-mono tabular-nums text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
