"use client";

/**
 * Auth seam (ROADMAP §5, §9). Auth now runs entirely in Convex (Convex Auth),
 * so `useCurrentUser()` returns the *real* signed-in user — while keeping its
 * exact shape (`{ user, role, setRole }`), so no consumer changed.
 *
 * Two modes, chosen by whether a Convex deployment is connected:
 *
 *  - **Connected** (`NEXT_PUBLIC_CONVEX_URL` set): identity comes from the
 *    signed-in Convex user (`api.users.currentUser`). `setRole` stays as a local
 *    "preview viewpoint" override that powers the sidebar role switcher for
 *    demos; with no override the account's own role is used.
 *  - **Demo / not connected**: the original role-switcher stub — a hardcoded
 *    user per role, `setRole` toggles it. Lets the prototype run with no backend.
 */
import { createContext, useContext, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Role, User } from "@/lib/types";
import { CONTRACTOR_USER, MANAGER_USER, PLATFORM_ADMIN_USER, SUPERVISOR_USER } from "@/lib/data/mock";

const USERS: Record<Role, User> = {
  supervisor: SUPERVISOR_USER,
  manager: MANAGER_USER,
  contractor: CONTRACTOR_USER,
  platformAdmin: PLATFORM_ADMIN_USER,
};

interface AuthContextValue {
  user: User;
  role: Role;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Demo / no-backend: the role switcher stands in for login (unchanged). */
function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("manager");
  return <AuthContext.Provider value={{ user: USERS[role], role, setRole }}>{children}</AuthContext.Provider>;
}

/** Convex Auth: identity from the signed-in user; `setRole` previews a viewpoint. */
function ConvexAuthedProvider({ children }: { children: React.ReactNode }) {
  const authed = useQuery(api.users.currentUser); // User-shaped | null | undefined (loading)
  const [override, setOverride] = useState<Role | null>(null);

  let user: User;
  let role: Role;
  if (override) {
    user = USERS[override];
    role = override;
  } else if (authed) {
    user = authed as User;
    role = authed.role as Role;
  } else {
    // Signed out or still loading — a harmless default; `/app` is gated by
    // middleware, so this only shows briefly during the auth handshake.
    user = USERS.manager;
    role = "manager";
  }

  return <AuthContext.Provider value={{ user, role, setRole: setOverride }}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <ConvexAuthedProvider>{children}</ConvexAuthedProvider>
  ) : (
    <DemoAuthProvider>{children}</DemoAuthProvider>
  );
}

export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentUser must be used within <AuthProvider>");
  return ctx;
}
