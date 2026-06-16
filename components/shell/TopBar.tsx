"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { RoleSwitcher } from "./RoleSwitcher";

interface NavItem {
  key: string;
  label: string;
  /** A real route (built). */
  href?: string;
  /** The phase that builds this screen (shown as a stub until then). */
  phase?: number;
}

const NAV: Record<Role, NavItem[]> = {
  grower: [
    { key: "overview", label: "Overview", href: "/app" },
    { key: "daily", label: "Daily update", href: "/app/daily" },
    { key: "houses", label: "Houses", href: "/app/houses" },
    { key: "feed", label: "Feed", href: "/app/feed" },
    { key: "weights", label: "Weights", href: "/app/weights" },
    { key: "history", label: "History", href: "/app/history" },
  ],
  contractor: [
    { key: "overview", label: "Overview", href: "/app" },
    { key: "portfolio", label: "Portfolio", href: "/app/portfolio" },
    { key: "growers", label: "Growers", href: "/app/growers" },
    { key: "schedule", label: "Schedule", href: "/app/schedule" },
    { key: "benchmark", label: "Benchmark", href: "/app/benchmark" },
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

const tabBase =
  "relative whitespace-nowrap px-3 py-2.5 text-label font-medium transition-colors duration-[var(--dur-fast)]";

function ActiveUnderline() {
  return <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-700" />;
}

export function TopBar() {
  const { user, role } = useCurrentUser();
  const { toast } = useToast();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-divider bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/app" aria-label="BatchPilot home" className="rounded-[var(--radius-control)]">
          <Logo />
        </Link>
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
            if (item.href) {
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(tabBase, active ? "text-brand-700" : "text-muted hover:text-slate")}
                  >
                    {item.label}
                    {active ? <ActiveUnderline /> : null}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() =>
                    toast(`${item.label} opens in Phase ${item.phase}`, {
                      tone: "info",
                      description: "The contractor experience is built next.",
                    })
                  }
                  className={cn(tabBase, "text-muted hover:text-slate")}
                >
                  {item.label}
                  <span className="ml-1.5 rounded-[var(--radius-pill)] bg-divider px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
                    P{item.phase}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
