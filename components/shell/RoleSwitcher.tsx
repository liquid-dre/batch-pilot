"use client";

import type { Role } from "@/lib/types";
import type { IconComponent } from "@/components/icons";
import { useCurrentUser } from "@/lib/auth";
import { IconView, IconGrowers, IconHouses } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Stands in for login (ROADMAP §5): switches the demo between the Grower and
 * Contractor experiences. It is the most-used control in the shell, so it has
 * to read as "change your viewpoint", not account/settings — hence the explicit
 * "Viewing as" label, the eye icon, and a per-option role icon. Clerk replaces
 * it later; until then it stays visible, labelled and large.
 */

const OPTIONS: { role: Role; label: string; Icon: IconComponent }[] = [
  { role: "grower", label: "Grower", Icon: IconHouses },
  { role: "contractor", label: "Contractor", Icon: IconGrowers },
];

export function RoleSwitcher() {
  const { role, setRole } = useCurrentUser();

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint">
        <IconView className="size-3.5" />
        Viewing as
      </p>
      <div
        role="radiogroup"
        aria-label="Switch viewpoint between grower and contractor"
        className="flex items-center gap-1 rounded-[var(--radius-control)] bg-brand-50 p-1"
      >
        {OPTIONS.map(({ role: r, label, Icon }) => {
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(r)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-3px)] px-2 py-1.5 text-label font-semibold",
                "transition-colors duration-[var(--dur)] ease-[var(--ease-out)]",
                active ? "bg-brand-700 text-white shadow-[0_1px_2px_rgba(11,42,74,0.2)]" : "text-brand-700 hover:bg-brand-100",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
