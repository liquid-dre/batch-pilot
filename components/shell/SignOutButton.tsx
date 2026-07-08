"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Sign out of Convex Auth and return to the landing page. Only rendered when a
 * Convex deployment is connected (see SidebarNav), so `useAuthActions` always
 * has its provider.
 */
export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="w-full rounded-[var(--radius-control)] border border-divider px-3 py-2 text-label font-semibold text-slate transition-colors hover:bg-paper"
    >
      Sign out
    </button>
  );
}
