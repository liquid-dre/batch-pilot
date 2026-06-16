"use client";

/**
 * Auth seam (ROADMAP §5, §9 → Clerk later).
 *
 * There is no login yet. `<AuthProvider>` holds the current role in state and
 * `useCurrentUser()` returns the matching hardcoded user. A visible role
 * switcher in the app shell toggles Grower ↔ Contractor for the demo. When
 * Clerk lands, this provider is replaced and `useCurrentUser()` keeps its shape.
 */
import { createContext, useContext, useState } from "react";
import type { Role, User } from "@/lib/types";
import { CONTRACTOR_USER, GROWER_USER } from "@/lib/data/mock";

const USERS: Record<Role, User> = {
  grower: GROWER_USER,
  contractor: CONTRACTOR_USER,
};

interface AuthContextValue {
  user: User;
  role: Role;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Role is session-scoped for the demo (defaults to Grower). When Clerk lands,
  // the active user/role comes from the auth session instead of this state.
  const [role, setRole] = useState<Role>("grower");

  return (
    <AuthContext.Provider value={{ user: USERS[role], role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentUser must be used within <AuthProvider>");
  return ctx;
}
