"use client";

import { useTheme } from "@/lib/useTheme";
import { IconSun, IconMoon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Light/dark toggle. Monochrome chrome; shows the icon of the mode you'd switch
 * TO (moon in light, sun in dark). Keyboard-focusable, aria-pressed.
 */
export function ThemeToggle({ className, onDark }: { className?: string; onDark?: boolean }) {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors duration-[var(--dur-fast)] active:scale-[0.96]",
        onDark ? "text-on-invert-dim hover:bg-white/10 hover:text-on-invert" : "text-muted hover:bg-wash hover:text-ink",
        className,
      )}
    >
      {dark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
    </button>
  );
}
