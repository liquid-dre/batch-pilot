"use client";

import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client provider tree mounted once in the root layout. Kept as a thin wrapper
 * so the layout itself stays a Server Component. `usePlan()` reads from
 * `AuthProvider` and needs no provider of its own.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
