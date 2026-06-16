"use client";

import { useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

/**
 * The Phase-1 screens are the grower/supervisor register. If the demo is in the
 * Contractor role, show a calm switch prompt rather than grower data out of
 * context. (When Clerk lands, route access comes from the session instead.)
 */
export function GrowerOnly({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useCurrentUser();
  if (role === "grower") return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-h2">This is a grower screen</h1>
      <p className="text-body text-slate">
        Switch to the Grower role to add daily numbers, log feed and record weights.
      </p>
      <Button onClick={() => setRole("grower")}>Switch to Grower</Button>
    </div>
  );
}
