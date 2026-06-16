"use client";

import type { Role } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

/**
 * Stands in for login (ROADMAP §5): a segmented control that toggles the demo
 * between the Grower and Contractor experiences. Replaced by Clerk later; until
 * then it's the most-used control in the shell, so it stays visible and large.
 */

const OPTIONS: { role: Role; label: string }[] = [
  { role: "grower", label: "Grower" },
  { role: "contractor", label: "Contractor" },
];

export function RoleSwitcher() {
  const { role, setRole } = useCurrentUser();

  return (
    <div
      role="radiogroup"
      aria-label="Switch role"
      className="relative inline-flex items-center rounded-[var(--radius-pill)] bg-brand-50 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = role === opt.role;
        return (
          <button
            key={opt.role}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setRole(opt.role)}
            className={cn(
              "relative z-10 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-label font-semibold",
              "transition-colors duration-[var(--dur)] ease-[var(--ease-out)]",
              active ? "bg-brand-700 text-white shadow-[0_1px_2px_rgba(11,42,74,0.2)]" : "text-brand-700 hover:text-brand-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
