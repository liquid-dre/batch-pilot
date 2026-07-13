"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Sign out of Convex Auth and return to the landing page. Only rendered when a
 * Convex deployment is connected (see SidebarNav), so `useAuthActions` always
 * has its provider.
 *
 * The navigation is optimistic: we leave for the landing page immediately and
 * let the token revoke finish in the background, rather than freezing the button
 * on a network round-trip. A brief "Signing out…" state covers the in-flight
 * moment (and guards against a double tap).
 */
export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        // Fire the revoke, but don't block the screen change on it.
        void Promise.resolve(signOut()).catch(() => {});
        // `replace` so the authed /app page doesn't linger in history.
        router.replace("/");
      }}
      className="w-full rounded-[var(--radius-control)] border border-divider px-3 py-2 text-label font-semibold text-slate transition-colors hover:bg-paper disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
