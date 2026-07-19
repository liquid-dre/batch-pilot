"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup, MotionConfig, useReducedMotion } from "motion/react";
import { useCurrentUser } from "@/lib/auth";
import { usePersisted } from "@/lib/usePersisted";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/Logo";
import { IconChevronDown, IconInfo, IconUser } from "@/components/icons";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAlerts } from "@/lib/data";
import type { Dataset } from "@/lib/data/dataset";
import { alertKey, flockAlertKey } from "@/lib/alertKey";
import { NAV, NavGlyph, isActive, BADGE_FETCHERS, type NavSection, type NavItem, type BadgeSource } from "./nav-config";

/** True once a Convex deployment is connected — enables real sign-out. */
const CONVEX_CONNECTED = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

/** Matches --ease-out in globals.css, so JS motion shares the app's character. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface SidebarNavProps {
  /** Desktop icon-rail mode (always false in the mobile drawer). */
  collapsed: boolean;
  onToggleCollapse?: () => void;
  /** Called when a nav item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
}

/**
 * Live badge counts for the current role's nav. Two implementations, chosen once
 * by whether Convex is connected (a build-time constant, so the choice is stable
 * across renders): the mock path polls the seam fetchers; the Convex path derives
 * the count reactively from the signed-in tenant's own dataset.
 */
function useBadgeCountsMock(sections: NavSection[]): Partial<Record<BadgeSource, number>> {
  const sources = useMemo(() => {
    const set = new Set<BadgeSource>();
    for (const section of sections) for (const item of section.items) if (item.badge) set.add(item.badge);
    return [...set];
  }, [sections]);

  const [counts, setCounts] = useState<Partial<Record<BadgeSource, number>>>({});

  useEffect(() => {
    if (sources.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(sources.map(async (src) => [src, await BADGE_FETCHERS[src]()] as const));
      if (!cancelled) setCounts(Object.fromEntries(entries));
    };
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sources]);

  return counts;
}

/** Convex path: the alerts badge = this tenant's amber/red houses that the user
 *  hasn't dismissed, reactive. */
function useBadgeCountsConvex(_sections: NavSection[]): Partial<Record<BadgeSource, number>> {
  const raw = useQuery(api.dataset.myDataset);
  const dismissedRows = useQuery(api.alerts.myDismissedAlerts);
  const [alerts, setAlerts] = useState(0);
  useEffect(() => {
    if (!raw) {
      setAlerts(0);
      return;
    }
    let alive = true;
    getAlerts(raw as unknown as Dataset).then((a) => {
      if (!alive) return;
      const dismissed = new Set((dismissedRows ?? []).map((d) => alertKey(d.houseId, d.metric, d.level)));
      setAlerts(a.filter((x) => !dismissed.has(flockAlertKey(x))).length);
    });
    return () => {
      alive = false;
    };
  }, [raw, dismissedRows]);
  return { alerts };
}

const useBadgeCounts = CONVEX_CONNECTED ? useBadgeCountsConvex : useBadgeCountsMock;

export function SidebarNav({ collapsed, onToggleCollapse, onNavigate }: SidebarNavProps) {
  const { role } = useCurrentUser();
  const pathname = usePathname();
  // A freshly-invited user can be "pending" (no farm yet) — no nav until they're
  // placed on a farm; the onboarding home guides them.
  const rawSections = NAV[role] ?? [];
  // These screens have no Convex analog yet: allocation is done via start-cycle in
  // the setup flow, and the house logbook is superseded by Cycle history. Hide
  // their nav items when Convex is connected (the mock demo keeps them).
  const sections = CONVEX_CONNECTED
    ? rawSections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.key !== "allocate" && i.key !== "logbook") }))
        .filter((s) => s.items.length > 0)
    : rawSections;
  const counts = useBadgeCounts(sections);

  // Animate only once the user has actually toggled. usePersisted renders the
  // default (expanded) on the server then corrects to the stored value on the
  // client's first commit — gating on a real interaction keeps that correction
  // (and reduced-motion) instant, so nothing animates on page load.
  const reduce = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const transition = !interacted || reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT };

  return (
    <MotionConfig transition={transition} reducedMotion={reduce ? "always" : "never"}>
      <div className="flex h-full flex-col bg-surface">
        {/* Brand */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-divider", collapsed ? "justify-center px-2" : "gap-2 px-4")}>
          <Link href="/app" aria-label="BatchPilot home" onClick={onNavigate} className="flex items-center gap-2 rounded-[var(--radius-control)] text-brand-600">
            <LogoMark className="h-6 w-7 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.span
                  key="wordmark"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="whitespace-nowrap font-display text-[1.25rem] font-extrabold tracking-[-0.02em] text-ink"
                >
                  BatchPilot
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin]">
          <LayoutGroup>
            {sections.map((section, i) => (
              <NavGroup
                key={section.label ?? `top-${i}`}
                section={section}
                collapsed={collapsed}
                pathname={pathname}
                counts={counts}
                onNavigate={onNavigate}
                first={i === 0}
              />
            ))}
          </LayoutGroup>
        </nav>

        {/* Pinned footer: account block, then the Hide toggle as the last row */}
        <div className="shrink-0 border-t border-divider">
          <div className={cn("space-y-3", collapsed ? "px-2 py-3" : "px-4 py-4")}>
            <div className={cn("flex", collapsed ? "justify-center" : "justify-start")}>
              <ThemeToggle compact={collapsed} />
            </div>
            {CONVEX_CONNECTED ? (
              <Link
                href="/app/account"
                onClick={onNavigate}
                aria-current={pathname.startsWith("/app/account") ? "page" : undefined}
                className={cn(
                  "group flex h-10 items-center rounded-[var(--radius-control)] text-label font-medium transition-colors duration-[var(--dur-fast)]",
                  pathname.startsWith("/app/account")
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-wash hover:text-slate",
                  collapsed ? "mx-auto w-10 justify-center" : "w-full gap-2 px-3",
                )}
              >
                <IconUser className="size-4 shrink-0" />
                {!collapsed ? <span>Account</span> : null}
              </Link>
            ) : null}
            {CONVEX_CONNECTED && !collapsed ? <SignOutButton /> : null}
            {CONVEX_CONNECTED ? null : <DemoNote collapsed={collapsed} />}
          </div>

          {onToggleCollapse ? (
            <div className="border-t border-divider p-2">
              <button
                type="button"
                onClick={() => {
                  setInteracted(true);
                  onToggleCollapse();
                }}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "group flex h-10 items-center rounded-[var(--radius-control)] text-label font-medium text-muted transition-colors duration-[var(--dur-fast)] hover:bg-wash hover:text-slate active:scale-[0.98]",
                  collapsed ? "mx-auto w-10 justify-center" : "w-full gap-2 px-3",
                )}
              >
                <motion.span animate={{ rotate: collapsed ? -90 : 90 }} className="flex shrink-0">
                  <IconChevronDown className="size-4" />
                </motion.span>
                <AnimatePresence initial={false}>
                  {!collapsed ? (
                    <motion.span key="hide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                      Hide
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </MotionConfig>
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

/* ---- A group: heading (full only, collapses to a hairline in rail) + items ---- */

function NavGroup({
  section,
  collapsed,
  pathname,
  counts,
  onNavigate,
  first,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
  counts: Partial<Record<BadgeSource, number>>;
  onNavigate?: () => void;
  first: boolean;
}) {
  const [open, setOpen] = usePersisted(`bp.nav.${section.label ?? "_"}`, true);
  // Rail has no disclosure affordance, so every destination stays reachable:
  // disclosure is forced open there, and the per-group state only applies in full.
  const showItems = collapsed ? true : !section.label || open;

  return (
    <motion.div
      layout
      className={cn(
        "mb-1",
        section.label && !collapsed && "mt-2",
        // In rail a labelled group becomes an icon cluster fenced by a hairline.
        collapsed && section.label && !first && "mt-2 border-t border-divider pt-2",
      )}
    >
      {section.label ? (
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.button
              key="heading"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="flex w-full items-center justify-between rounded-[var(--radius-control)] px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint transition-colors hover:text-muted"
            >
              {section.label}
              <IconChevronDown className={cn("size-3.5 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]", open ? "" : "-rotate-90")} />
            </motion.button>
          ) : null}
        </AnimatePresence>
      ) : null}

      {showItems ? (
        <ul aria-label={section.label ?? undefined} className={cn(section.label && !collapsed && "mt-0.5")}>
          {section.items.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={isActive(item.href, pathname)}
              collapsed={collapsed}
              count={item.badge ? counts[item.badge] ?? 0 : 0}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </motion.div>
  );
}

/* ---- One nav item: gliding active highlight, fade/slide label, badge ---- */

function NavRow({
  item,
  active,
  collapsed,
  count,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count: number;
  onNavigate?: () => void;
}) {
  const hasBadge = count > 0;
  // Screen readers hear the count once (in the name), never from the pill/dot.
  const accessibleName = hasBadge ? `${item.label}, ${count} ${count === 1 ? "needs" : "need"} attention` : item.label;

  return (
    <motion.li layout>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed || hasBadge ? accessibleName : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative my-0.5 flex h-11 items-center rounded-[var(--radius-control)] transition-colors duration-[var(--dur-fast)]",
          collapsed ? "justify-center" : "gap-3 px-3",
          active ? "bg-brand-50 text-brand-600 font-semibold" : "text-slate hover:bg-wash hover:text-ink",
        )}
      >
        <span className="relative flex shrink-0">
          <NavGlyph icon={item.icon} className={cn("size-5", active ? "text-brand-600" : "text-hint")} />
          {collapsed && hasBadge ? (
            <motion.span
              aria-hidden
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1 size-2.5 rounded-full bg-status-bad ring-2 ring-surface"
            />
          ) : null}
        </span>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.span
              key="label"
              layout
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              className="flex flex-1 items-center justify-between gap-2 whitespace-nowrap text-label font-medium"
            >
              {item.label}
              {hasBadge ? (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-status-bad px-1.5 text-[0.6875rem] font-semibold tabular-nums text-white"
                >
                  {count}
                </motion.span>
              ) : null}
            </motion.span>
          ) : null}
        </AnimatePresence>

        {/* Rail tooltip — appears on hover and keyboard focus. */}
        {collapsed ? (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full z-[var(--z-dropdown)] ml-2 whitespace-nowrap rounded-[var(--radius-control)] bg-canvas-invert px-2 py-1 text-[0.75rem] font-medium text-on-invert opacity-0 shadow-card transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {item.label}
            {hasBadge ? ` · ${count}` : ""}
          </span>
        ) : null}
      </Link>
    </motion.li>
  );
}
