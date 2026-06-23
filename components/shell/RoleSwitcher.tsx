"use client";

import type { Role } from "@/lib/types";
import type { IconComponent } from "@/components/icons";
import { useCurrentUser } from "@/lib/auth";
import { IconView, IconGrowers, IconDailyUpdate, IconDashboard } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Stands in for login (ROADMAP §5): switches the demo between the three
 * profiles — Supervisor (capture), Manager (oversight) and Contractor. It is the
 * most-used control in the shell, so it has to read as "change your viewpoint",
 * not account/settings — hence the explicit "Viewing as" label, the eye icon and
 * a per-option role icon. Clerk replaces it later; until then it stays visible,
 * labelled and large.
 */

const OPTIONS: { role: Role; label: string; hint: string; Icon: IconComponent }[] = [
  { role: "supervisor", label: "Supervisor", hint: "Capture", Icon: IconDailyUpdate },
  { role: "manager", label: "Manager", hint: "Oversight", Icon: IconDashboard },
  { role: "contractor", label: "Contractor", hint: "Portfolio", Icon: IconGrowers },
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
        aria-label="Switch viewpoint between supervisor, manager and contractor"
        className="flex flex-col gap-1 rounded-[var(--radius-control)] bg-brand-50 p-1"
      >
        {OPTIONS.map(({ role: r, label, hint, Icon }) => {
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(r)}
              className={cn(
                "flex items-center gap-2 rounded-[calc(var(--radius-control)-3px)] px-2.5 py-2 text-label font-semibold",
                "transition-colors duration-[var(--dur)] ease-[var(--ease-out)]",
                active ? "bg-brand-700 text-white shadow-[0_1px_2px_rgba(11,42,74,0.2)]" : "text-brand-700 hover:bg-brand-100",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              <span className={cn("text-[0.6875rem] font-medium", active ? "text-brand-100" : "text-hint")}>{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
