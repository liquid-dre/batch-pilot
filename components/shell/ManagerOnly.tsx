"use client";

import { useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

/**
 * Oversight screens that belong to the Manager profile only (e.g. the batch
 * archive). Supervisors capture; the manager reviews. A calm switch prompt
 * stands in for the demo; in Convex mode the account's role gates access
 * (ROADMAP §5/§9).
 */
export function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useCurrentUser();
  if (role === "manager") return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-h2">This is a manager screen</h1>
      <p className="text-body text-slate">
        The batch archive is part of the manager&apos;s oversight view. Switch to the Manager profile to browse previous batches.
      </p>
      <Button affordance={null} onClick={() => setRole("manager")}>Switch to Manager</Button>
    </div>
  );
}
