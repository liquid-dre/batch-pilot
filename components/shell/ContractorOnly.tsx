"use client";

import { useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

/**
 * Phase-2 screens are the contractor register. If the demo is in the Grower
 * role, show a calm switch prompt rather than contractor tooling out of context.
 * (Clerk will replace this with session-based access.)
 */
export function ContractorOnly({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useCurrentUser();
  if (role === "contractor") return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-h2">This is a contractor screen</h1>
      <p className="text-body text-slate">
        Switch to the Contractor role to see the portfolio, schedules and benchmarks.
      </p>
      <Button affordance={null} onClick={() => setRole("contractor")}>Switch to Contractor</Button>
    </div>
  );
}
