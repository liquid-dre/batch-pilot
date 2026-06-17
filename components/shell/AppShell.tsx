"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePersisted } from "@/lib/usePersisted";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { SidebarNav } from "./SidebarNav";

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

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
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-divider transition-[width] duration-[var(--dur)] ease-[var(--ease-out)] md:block",
          collapsed ? "w-[4.75rem]" : "w-64",
        )}
      >
        <SidebarNav collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-2 border-b border-divider bg-surface/90 px-3 backdrop-blur-md md:hidden">
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex size-11 items-center justify-center rounded-[var(--radius-control)] text-slate transition-colors hover:bg-[rgba(11,42,74,0.05)] active:scale-95"
          >
            <MenuIcon />
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
            className="absolute right-2 top-3 z-10 flex size-9 items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-[rgba(11,42,74,0.05)]"
          >
            <CloseIcon />
          </button>
          <SidebarNav collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </div>
  );
}
