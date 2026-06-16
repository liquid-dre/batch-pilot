"use client";

import type { Role } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { RoleSwitcher } from "./RoleSwitcher";

interface NavItem {
  key: string;
  label: string;
  /** undefined = the live Overview; a number = the phase that builds it. */
  phase?: number;
}

const NAV: Record<Role, NavItem[]> = {
  grower: [
    { key: "overview", label: "Overview" },
    { key: "today", label: "Daily update", phase: 1 },
    { key: "houses", label: "Houses", phase: 1 },
    { key: "feed", label: "Feed", phase: 1 },
    { key: "weights", label: "Weights", phase: 1 },
  ],
  contractor: [
    { key: "overview", label: "Overview" },
    { key: "portfolio", label: "Portfolio", phase: 2 },
    { key: "growers", label: "Growers", phase: 2 },
    { key: "schedule", label: "Schedule", phase: 2 },
    { key: "benchmark", label: "Benchmark", phase: 2 },
  ],
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar() {
  const { user, role } = useCurrentUser();
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-divider bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3 sm:gap-4">
          <RoleSwitcher />
          <span className="hidden items-center gap-2.5 sm:flex">
            <span className="flex size-9 items-center justify-center rounded-[var(--radius-pill)] bg-brand-50 text-label font-semibold text-brand-700">
              {initials(user.name)}
            </span>
            <span className="leading-tight">
              <span className="block text-label font-semibold text-ink">{user.name}</span>
              <span className="block text-[0.8125rem] text-muted">{user.org}</span>
            </span>
          </span>
        </div>
      </div>

      <nav aria-label="Sections" className="mx-auto max-w-6xl px-2 sm:px-5">
        <ul className="flex items-center gap-1 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV[role].map((item) => {
            const active = item.phase === undefined;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() =>
                    active
                      ? undefined
                      : toast(`${item.label} opens in Phase ${item.phase}`, {
                          tone: "info",
                          description: "Phase 0 builds the foundation. This screen comes next.",
                        })
                  }
                  className={cn(
                    "relative whitespace-nowrap px-3 py-2.5 text-label font-medium transition-colors duration-[var(--dur-fast)]",
                    active ? "text-brand-700" : "text-muted hover:text-slate",
                  )}
                >
                  {item.label}
                  {item.phase !== undefined ? (
                    <span className="ml-1.5 rounded-[var(--radius-pill)] bg-divider px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
                      P{item.phase}
                    </span>
                  ) : null}
                  {active ? (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-700" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
