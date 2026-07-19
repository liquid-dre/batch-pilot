"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { GrowerDetailData } from "@/lib/view";
import { GrowerDetail } from "./GrowerDetail";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Convex-backed grower drill-down. The query is tenant-guarded — it returns null
 * unless the site belongs to the signed-in contractor — so a farm id that isn't
 * yours (or doesn't exist) shows "not found" rather than another tenant's data.
 */
export function GrowerDetailConvex({ siteId }: { siteId: string }) {
  const data = useQuery(api.growers.contractorGrowerDetail, { siteId });

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader back={{ href: "/app/growers", label: "Growers" }} eyebrow="Grower" title="Loading…" />
        <Card>
          <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
            Loading…
          </CardBody>
        </Card>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
        <h1 className="text-h2">Grower not found</h1>
        <p className="text-body text-slate">This farm isn&apos;t linked to your contractor account, or hasn&apos;t reported a cycle yet.</p>
      </div>
    );
  }

  return <GrowerDetail data={data as GrowerDetailData} />;
}
