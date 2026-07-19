"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ContractorGrowers } from "@/lib/view";
import { ContractorGrowersView } from "./ContractorGrowersView";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Convex-backed Growers screen. Scoped to the signed-in contractor by the
 * `growers.contractorGrowers` query (real identity, not the sidebar role
 * switcher), so a contractor only sees the farms they own. Reactive: a grower's
 * capture upstream re-renders this ranking live.
 */
export function ContractorGrowersConvex() {
  const data = useQuery(api.growers.contractorGrowers);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Growers" title="Grower performance" intro="Loading your growers…" />
        <Card>
          <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
            Loading…
          </CardBody>
        </Card>
      </div>
    );
  }

  if (data === null) {
    // Signed out, or the current viewpoint isn't a contractor account.
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
        <h1 className="text-h2">Contractor sign-in required</h1>
        <p className="text-body text-slate">
          The Growers overview shows the farms linked to your contractor account. Sign in as a contractor to see them.
        </p>
      </div>
    );
  }

  return <ContractorGrowersView data={data as ContractorGrowers} />;
}
