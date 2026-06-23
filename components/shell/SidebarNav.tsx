"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";
import { usePersisted } from "@/lib/usePersisted";
import { cn } from "@/lib/cn";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { IconChevronDown, IconCollapse, IconExpand, IconSwitch, IconInfo } from "@/components/icons";
import { RoleSwitcher } from "./RoleSwitcher";
import { NAV, NavGlyph, isActive, type NavSection } from "./nav-config";

const Chevron = ({ open }: { open: boolean }) => (
  <IconChevronDown
    className={cn("size-3.5 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]", open ? "" : "-rotate-90")}
  />
);

interface SidebarNavProps {
  /** Desktop icon-rail mode (always false in the mobile drawer). */
  collapsed: boolean;
  onToggleCollapse?: () => void;
  /** Called when a nav item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onToggleCollapse, onNavigate }: SidebarNavProps) {
  const { role } = useCurrentUser();
  const pathname = usePathname();
  const sections = NAV[role];

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand + collapse toggle */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-divider", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/app" aria-label="BatchPilot home" onClick={onNavigate} className="rounded-[var(--radius-control)]">
          {collapsed ? <LogoMark className="h-6 w-7 text-brand-700" /> : <Logo />}
        </Link>
        {onToggleCollapse && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="flex size-9 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-[rgba(11,42,74,0.05)] hover:text-slate"
          >
            <IconCollapse className="size-5" />
          </button>
        ) : null}
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin]">
        {collapsed
          ? sections.map((section, i) => (
              <RailSection key={section.label ?? `top-${i}`} section={section} pathname={pathname} onNavigate={onNavigate} withDivider={i > 0} />
            ))
          : sections.map((section, i) => (
              <FullSection key={section.label ?? `top-${i}`} section={section} pathname={pathname} onNavigate={onNavigate} />
            ))}
      </nav>

      {/* Collapse toggle in rail mode (expand) */}
      {onToggleCollapse && collapsed ? (
        <div className="flex justify-center border-t border-divider py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="flex size-10 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-[rgba(11,42,74,0.05)] hover:text-slate"
          >
            <IconExpand className="size-5" />
          </button>
        </div>
      ) : null}

      {/* Role switcher + demo-data note */}
      <div className={cn("shrink-0 space-y-3 border-t border-divider", collapsed ? "px-2 py-3" : "px-4 py-4")}>
        {collapsed ? <RoleRail /> : <RoleSwitcher />}
        <DemoNote collapsed={collapsed} />
      </div>
    </div>
  );
}

const DEMO_NOTE = "Demo data · resets on refresh";

/** Calm, persistent reminder that nothing here is saved (no DB yet). */
function DemoNote({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <span title={DEMO_NOTE} aria-label={DEMO_NOTE} className="flex size-7 items-center justify-center text-hint">
          <IconInfo className="size-4" />
        </span>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-1.5 px-1 text-[0.6875rem] text-hint">
      <IconInfo className="size-3.5 shrink-0" />
      {DEMO_NOTE}
    </p>
  );
}

/* ---- Full mode: grouped, collapsible sections ---- */

function FullSection({ section, pathname, onNavigate }: { section: NavSection; pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = usePersisted(`bp.nav.${section.label ?? "_"}`, true);

  if (!section.label) {
    return (
      <div className="mb-1">
        {section.items.map((item) => (
          <FullItem key={item.key} item={item} active={isActive(item.href, pathname)} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1 mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-[var(--radius-control)] px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint transition-colors hover:text-muted"
      >
        {section.label}
        <Chevron open={open} />
      </button>
      {open ? (
        <div className="mt-0.5">
          {section.items.map((item) => (
            <FullItem key={item.key} item={item} active={isActive(item.href, pathname)} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FullItem({ item, active, onNavigate }: { item: NavSection["items"][number]; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-label font-medium transition-colors duration-[var(--dur-fast)]",
        active ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate hover:bg-[rgba(11,42,74,0.05)] hover:text-ink",
      )}
    >
      <NavGlyph icon={item.icon} className={cn("size-5 shrink-0", active ? "text-brand-600" : "text-hint")} />
      {item.label}
    </Link>
  );
}

/* ---- Rail mode: flat icon buttons with tooltips ---- */

function RailSection({ section, pathname, onNavigate, withDivider }: { section: NavSection; pathname: string; onNavigate?: () => void; withDivider: boolean }) {
  return (
    <div className={cn(withDivider && "mt-2 border-t border-divider pt-2")}>
      {section.items.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "group relative mx-auto my-0.5 flex size-11 items-center justify-center rounded-[var(--radius-control)] transition-colors duration-[var(--dur-fast)]",
              active ? "bg-brand-50 text-brand-700" : "text-hint hover:bg-[rgba(11,42,74,0.05)] hover:text-slate",
            )}
          >
            <NavGlyph icon={item.icon} className="size-5" />
            <span className="pointer-events-none absolute left-full z-[var(--z-dropdown)] ml-2 whitespace-nowrap rounded-[var(--radius-control)] bg-ink px-2 py-1 text-[0.75rem] font-medium text-white opacity-0 shadow-card transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-visible:opacity-100">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ---- Rail-mode role toggle (compact) ---- */

const RAIL_ROLES: { role: Role; label: string; glyph: string }[] = [
  { role: "supervisor", label: "Supervisor", glyph: "S" },
  { role: "manager", label: "Manager", glyph: "M" },
  { role: "contractor", label: "Contractor", glyph: "C" },
];

function RoleRail() {
  const { role, setRole } = useCurrentUser();
  return (
    <div role="radiogroup" aria-label="Switch viewpoint between supervisor, manager and contractor" className="flex flex-col items-center gap-1">
      <IconSwitch className="mb-0.5 size-4 text-hint" aria-hidden />
      {RAIL_ROLES.map(({ role: r, label, glyph }) => {
        const active = role === r;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Viewing as ${label}`}
            title={`Viewing as ${label}`}
            onClick={() => setRole(r)}
            className={cn(
              "flex size-9 items-center justify-center rounded-[var(--radius-pill)] text-label font-semibold transition-colors",
              active ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            {glyph}
          </button>
        );
      })}
    </div>
  );
}
