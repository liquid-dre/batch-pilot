"use client";

/**
 * Billing seam (ROADMAP §5, §9 → Stripe later).
 *
 * `usePlan()` returns a stub plan with capability flags the UI can gate on
 * without knowing anything about Stripe. The plan tracks the current role for
 * the demo (a contractor sees the contractor plan). When Stripe lands, only
 * this hook changes; callers keep reading `plan.features.*`.
 */
import type { Plan } from "@/lib/types";
import { useCurrentUser } from "@/lib/auth";

const GROWER_PLAN: Plan = {
  tier: "pro",
  name: "Grower Pro",
  features: { projections: true, benchmarkOverlay: true, whatsappIngest: false },
};

const CONTRACTOR_PLAN: Plan = {
  tier: "contractor",
  name: "Contractor",
  features: { projections: true, benchmarkOverlay: true, whatsappIngest: false },
};

export function usePlan(): Plan {
  const { role } = useCurrentUser();
  return role === "contractor" ? CONTRACTOR_PLAN : GROWER_PLAN;
}
