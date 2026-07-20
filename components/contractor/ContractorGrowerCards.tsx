"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";
import { IconArrowRight, IconCollection } from "@/components/icons";

/**
 * The contractor's Growers list (`/app/growers`) — one card per farm they own.
 * This is the management entry point: schedule a cycle for a farm, or click
 * through to its drill-down. Add-a-farm and the schedule form are their own pages
 * under the Growers nav group, so this stays a clean list (no inline forms).
 */
export function ContractorGrowerCards() {
  const workspace = useQuery(api.tenancy.myWorkspace);

  if (workspace === undefined) return <ScreenLoading eyebrow="Growers" title="Your growers" />;
  if (workspace === null || workspace.role !== "contractor")
    return (
      <ScreenEmpty
        eyebrow="Growers"
        title="Your growers"
        heading="Contractor sign-in required"
        body="Sign in as a contractor to manage your growers."
      />
    );

  const farms: any[] = workspace.farms ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Growers"
        title="Your growers"
        intro="Every farm you've onboarded. Schedule a cycle for one, or open it to see how the flock is tracking."
        action={
          <Link href="/app/growers/add">
            <Button variant="secondary" size="sm">Add a farm</Button>
          </Link>
        }
      />

      {farms.length === 0 ? (
        <Card>
          <CardBody className="space-y-4 py-14 text-center">
            <p className="text-body text-muted">No growers yet. Add your first farm and invite the manager who runs it.</p>
            <Link href="/app/growers/add" className="inline-block">
              <Button size="sm">Add a farm</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {farms.map((f) => {
            const joined = (f.managers ?? []).filter((m: any) => m.status === "accepted").length;
            const invited = (f.managers ?? []).length;
            return (
              <li key={f.id}>
                <Card className="flex h-full flex-col">
                  <CardBody className="flex flex-1 flex-col pt-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="min-w-0 truncate text-h3 text-ink">{f.name}</h3>
                      <span className="shrink-0 font-mono text-label text-muted">{f.farmCode}</span>
                    </div>
                    <p className="mt-1 text-label text-muted">
                      {f.houseCount} house(s) ·{" "}
                      {invited === 0
                        ? "no manager yet"
                        : `${joined}/${invited} manager${invited === 1 ? "" : "s"} joined`}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link href={{ pathname: "/app/growers/schedule", query: { farm: f.id } }}>
                        <Button size="sm" affordance={IconCollection}>Schedule cycle</Button>
                      </Link>
                      <Link
                        href={`/app/growers/${f.id}`}
                        className="inline-flex items-center gap-1 text-label font-medium text-brand-600 hover:text-brand-700"
                      >
                        View grower
                        <IconArrowRight className="size-4" />
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
