"use client";

import { TopBar } from "./TopBar";

/**
 * Persistent shell: the TopBar (logo + role switcher + nav) stays mounted
 * across route changes; each page renders into <main>. Kept thin and client so
 * the root layout itself stays a Server Component.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
