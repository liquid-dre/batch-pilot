"use client";

import { useCurrentUser } from "@/lib/auth";
import { isGrowerRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";

/**
 * The Phase-1 screens are the grower register (either the supervisor or the
 * manager profile). If the demo is in the Contractor role, show a calm switch
 * prompt rather than grower data out of context. (When Clerk lands, route access
 * comes from the session instead.)
 */
export function GrowerOnly({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useCurrentUser();
  if (isGrowerRole(role)) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-h2">This is a grower screen</h1>
      <p className="text-body text-slate">
        Switch to a grower profile to add daily numbers, log feed and record weights.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => setRole("supervisor")}>Supervisor / Foreman</Button>
        <Button variant="secondary" onClick={() => setRole("manager")}>Manager</Button>
      </div>
    </div>
  );
}
