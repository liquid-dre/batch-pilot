import { cn } from "@/lib/cn";

/**
 * FCR and EPEF are proxies, not measured truth: we capture feed *added* to a
 * house, not feed *consumed*, so both are derived from deliveries. Never present
 * them as exact. This is the single place that copy lives — `<EstTag>` sits
 * beside the metric label, `<EstFootnote>` explains it once below a table.
 */
export const ESTIMATED_NOTE = "Estimated — based on feed delivered, not measured consumption.";

/**
 * A small "est." chip. Colour is inherited (currentColor) so it reads correctly
 * on the dark table header and on light cards alike; the full note is the native
 * tooltip and the accessible label.
 */
export function EstTag({ className }: { className?: string }) {
  return (
    <span
      title={ESTIMATED_NOTE}
      aria-label={ESTIMATED_NOTE}
      className={cn(
        "ml-1 inline-flex cursor-help select-none items-center rounded-[4px] border border-current/30 px-1 align-middle",
        "text-[0.625rem] font-medium uppercase tracking-[0.03em] opacity-70 transition-opacity duration-[var(--dur-fast)] hover:opacity-100",
        className,
      )}
    >
      est.
    </span>
  );
}

/** One-line note explaining the est. tags, placed below a table or panel. */
export function EstFootnote({ className }: { className?: string }) {
  return <p className={cn("text-label text-muted", className)}>{ESTIMATED_NOTE}</p>;
}
