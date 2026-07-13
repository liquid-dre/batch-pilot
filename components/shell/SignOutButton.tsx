"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/Button";
import { IconLogout } from "@/components/icons";

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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      block
      loading={pending}
      affordance={IconLogout}
      onClick={() => {
        setPending(true);
        // Fire the revoke, but don't block the screen change on it.
        void Promise.resolve(signOut()).catch(() => {});
        // `replace` so the authed /app page doesn't linger in history.
        router.replace("/");
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
