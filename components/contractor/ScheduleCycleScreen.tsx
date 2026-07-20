"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";
import { ScheduleCycleForm } from "./growerForms";

/**
 * Schedule-a-cycle page (`/app/growers/schedule`). The farm can be pre-selected
 * via `?farm=<siteId>` — the "Schedule cycle" button on a grower card deep-links
 * here with its farm chosen.
 */
export function ScheduleCycleScreen() {
  const workspace = useQuery(api.tenancy.myWorkspace);
  const params = useSearchParams();
  const farmParam = params.get("farm") ?? undefined;

  if (workspace === undefined) return <ScreenLoading eyebrow="Growers" title="Schedule a cycle" />;
  if (workspace === null || workspace.role !== "contractor")
    return (
      <ScreenEmpty
        eyebrow="Growers"
        title="Schedule a cycle"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to schedule a cycle."
      />
    );

  const farms: any[] = workspace.farms ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Growers"
        title="Schedule a cycle"
        intro="Set the plan for a farm — dates, target weight range and bird count. The manager places the birds against it."
        back={{ href: "/app/growers", label: "Growers" }}
      />
      {farms.length === 0 ? (
        <Card>
          <CardBody className="space-y-4 py-14 text-center">
            <p className="text-body text-muted">Add a farm before scheduling a cycle.</p>
            <Link href="/app/growers/add" className="inline-block">
              <Button size="sm">Add a farm</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ScheduleCycleForm farms={farms} initialSiteId={farmParam} />
      )}
    </div>
  );
}
