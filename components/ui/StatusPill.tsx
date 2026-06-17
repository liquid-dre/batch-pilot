import { cn } from "@/lib/cn";
import type { StatusLevel } from "@/lib/types";

/**
 * The signature status indicator. Status is NEVER colour alone (ROADMAP §6,
 * brand-guidelines §3/§8): every pill carries colour + icon + WORD + SHAPE, so
 * it survives glare, greyscale and colour-blindness. The shape (●/▲/■) is drawn
 * as the icon's silhouette, so the marker differs even with colour removed.
 */

interface LevelStyle {
  word: string;
  tint: string;
  fg: string;
  Mark: (p: { className?: string }) => React.ReactElement;
}

const CircleMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none">
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    <path d="M5 8.2 7 10.2 11 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TriangleMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none">
    <path d="M8 1.5 15 14 1 14Z" fill="currentColor" />
    <path d="M8 6.2v3.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.6" r="0.95" fill="white" />
  </svg>
);

const SquareMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="currentColor" />
    <path d="M8 4.4v4.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="11.2" r="1" fill="white" />
  </svg>
);

const LEVELS: Record<StatusLevel, LevelStyle> = {
  green: { word: "On track", tint: "bg-status-good-tint", fg: "text-status-good", Mark: CircleMark },
  amber: { word: "At risk", tint: "bg-status-warn-tint", fg: "text-status-warn", Mark: TriangleMark },
  red: { word: "Needs attention", tint: "bg-status-bad-tint", fg: "text-status-bad", Mark: SquareMark },
};

interface StatusPillProps {
  level: StatusLevel;
  /** Override the default word (e.g. "Watch", "Action now"). */
  label?: string;
  size?: "sm" | "default";
  className?: string;
}

export function StatusPill({ level, label, size = "default", className }: StatusPillProps) {
  const { word, tint, fg, Mark } = LEVELS[level];
  const text = label ?? word;
  return (
    <span
      className={cn(
        "animate-pop inline-flex items-center rounded-[var(--radius-pill)] font-medium",
        tint,
        fg,
        size === "sm" ? "gap-1.5 px-2.5 py-1 text-[0.8125rem]" : "gap-2 px-3 py-1.5 text-label",
        className,
      )}
    >
      <Mark className={size === "sm" ? "size-3.5" : "size-4"} />
      {text}
    </span>
  );
}
