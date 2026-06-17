import { cn } from "@/lib/cn";
import type { StatusLevel } from "@/lib/types";
import { IconStatusGood, IconStatusWarn, IconStatusBad, type IconComponent } from "@/components/icons";

/**
 * The signature status indicator. Status is NEVER colour alone (ROADMAP §6,
 * brand-guidelines §3/§8): every pill carries colour + icon + WORD + SHAPE, so
 * it survives glare, greyscale and colour-blindness. The Untitled UI marks keep
 * the shapes distinct: a tick-circle (good), a triangle (at risk), an alert "!"
 * circle (needs attention).
 */

interface LevelStyle {
  word: string;
  tint: string;
  fg: string;
  Mark: IconComponent;
}

const LEVELS: Record<StatusLevel, LevelStyle> = {
  green: { word: "On track", tint: "bg-status-good-tint", fg: "text-status-good", Mark: IconStatusGood },
  amber: { word: "At risk", tint: "bg-status-warn-tint", fg: "text-status-warn", Mark: IconStatusWarn },
  red: { word: "Needs attention", tint: "bg-status-bad-tint", fg: "text-status-bad", Mark: IconStatusBad },
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
