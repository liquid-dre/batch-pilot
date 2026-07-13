"use client";

import { AuthProvider } from "@/lib/auth";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

/**
 * Client provider tree mounted once in the root layout. `ConvexClientProvider`
 * is outermost so `AuthProvider` (which reads the signed-in user from Convex)
 * and every screen's data hooks have the client + auth context. `usePlan()`
 * reads from `AuthProvider` and needs no provider of its own. Toasts are Sonner
 * now — `<AppToaster/>` mounts alongside this tree in the root layout.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConvexClientProvider>
  );
}
