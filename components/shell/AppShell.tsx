"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { usePersisted } from "@/lib/usePersisted";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { IconMenu, IconClose } from "@/components/icons";
import { SidebarNav } from "./SidebarNav";

/**
 * App shell: a collapsible left sidebar on desktop (full ↔ icon rail, persisted)
 * and an off-canvas drawer on mobile opened from a slim top bar. The marketing
 * site at `/` sits outside this shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = usePersisted("bp.sidebar.collapsed", false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Animate the rail width only after a real toggle. usePersisted corrects
  // expanded→stored on hydration; gating on interaction keeps that correction
  // (and reduced-motion) instant, so the rail never animates on page load.
  const reduce = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const widthTransition = !interacted || reduce ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const };

  // While the drawer is open: Escape closes it, body scroll is locked, focus
  // moves into the panel, and focus returns to the hamburger on close.
  // (Nav items close the drawer themselves via onNavigate.)
  useEffect(() => {
    if (!drawerOpen) return;
    const hamburger = hamburgerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      hamburger?.focus();
    };
  }, [drawerOpen]);

  // Swipe-left to close.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current != null && e.changedTouches[0].clientX - touchStartX.current < -50) setDrawerOpen(false);
    touchStartX.current = null;
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — width morphs between the full panel and the icon rail */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 224 }}
        transition={widthTransition}
        className="sticky top-0 hidden h-screen shrink-0 border-r border-divider md:block"
      >
        <SidebarNav
          collapsed={collapsed}
          onToggleCollapse={() => {
            setInteracted(true);
            setCollapsed(!collapsed);
          }}
        />
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-2 border-b border-divider bg-surface/90 px-3 backdrop-blur-md md:hidden">
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex size-11 items-center justify-center rounded-[var(--radius-control)] text-slate transition-colors hover:bg-wash active:scale-95"
          >
            <IconMenu className="size-6" />
          </button>
          <Link href="/app" aria-label="BatchPilot home" className="rounded-[var(--radius-control)]">
            <Logo />
          </Link>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile drawer */}
      <div className="md:hidden" aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "fixed inset-0 z-[var(--z-overlay)] bg-ink/40 transition-opacity duration-[var(--dur)] ease-[var(--ease-out)]",
            drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={cn(
            "fixed inset-y-0 left-0 z-[var(--z-overlay)] flex w-[17rem] max-w-[85%] flex-col shadow-raised transition-transform duration-[var(--dur)] ease-[var(--ease-out)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="absolute right-2 top-3 z-10 flex size-9 items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-wash"
          >
            <IconClose className="size-6" />
          </button>
          <SidebarNav collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </div>
  );
}
