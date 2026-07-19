"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FeedDelivery } from "@/lib/types";
import { FeedDeliveryForm } from "@/components/forms/FeedDeliveryForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Feed deliveries on Convex — the list comes from the reactive per-tenant
 * `myDataset` and the form persists through `writes.submitFeedDelivery` (which is
 * server-authoritative about the tenant). Saving re-fires the query, so the new
 * delivery appears without an optimistic stand-in.
 */
export function FeedConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const submit = useMutation(api.writes.submitFeedDelivery);

  if (raw === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader eyebrow="Feed delivery" title="Log a delivery" />
        <Card>
          <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
            Loading…
          </CardBody>
        </Card>
      </div>
    );
  }

  const siteId = (raw as { site?: { id?: string } } | null)?.site?.id ?? "";
  const deliveries = [...(((raw as { feedDeliveries?: FeedDelivery[] } | null)?.feedDeliveries) ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <FeedDeliveryForm deliveries={deliveries} today={today} save={(input) => submit({ siteId, ...input })} />
  );
}
