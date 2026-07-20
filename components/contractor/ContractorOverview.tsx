"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ContractorGrowers } from "@/lib/view";
import { ContractorGrowersView } from "./ContractorGrowersView";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * Contractor Overview (`/app`) — the portfolio dashboard. Reuses the
 * cross-grower current-cycles view (summary highlight cards + ranked table +
 * not-reporting) and adds an Upcoming cycles section from the scheduled batches.
 * Farm management + scheduling live on `/app/growers`.
 */
export function ContractorOverview() {
  const data = useQuery(api.growers.contractorGrowers);
  const upcoming = useQuery(api.growers.contractorUpcomingCycles);

  if (data === undefined) return <ScreenLoading eyebrow="Overview" title="Your growers" />;
  if (data === null)
    return (
      <ScreenEmpty
        eyebrow="Overview"
        title="Your growers"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to see your portfolio."
      />
    );

  return (
    <div className="space-y-8 pb-8">
      <ContractorGrowersView data={data as ContractorGrowers} />

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <CardEyebrow>Upcoming cycles</CardEyebrow>
          <Link href="/app/growers">
            <Button variant="secondary" size="sm">Schedule a cycle →</Button>
          </Link>
        </div>
        {!upcoming || upcoming.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center text-body text-muted">
              No upcoming cycles scheduled. Schedule one from Growers.
            </CardBody>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((c) => (
              <li key={`${c.siteId}_${c.cycleNo}`}>
                <Card>
                  <CardBody className="pt-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-h3">{c.farmName}</h3>
                      <span className="font-mono text-label text-muted">cycle {c.cycleNo}</span>
                    </div>
                    <p className="mt-1 text-label text-muted">
                      {c.breed} · places {c.placementDate || "—"}
                      {c.totalBirds ? ` · ${c.totalBirds.toLocaleString()} birds` : ""}
                    </p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
