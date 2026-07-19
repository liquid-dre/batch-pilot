"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { House } from "@/lib/types";
import { HouseSetupForm } from "@/components/forms/HouseSetupForm";
import { ScreenLoading } from "@/components/shell/ScreenState";

/**
 * House setup on Convex — reads the tenant's houses from the reactive myDataset
 * and persists through api.tenancy.setHouses (which durably creates/updates/
 * deletes rows and guards against removing a house that has a running cycle).
 * This replaces the mock saveHouses path that only mutated module memory (so
 * deletes didn't survive a refresh).
 */
export function HousesConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const setHouses = useMutation(api.tenancy.setHouses);

  if (raw === undefined) return <ScreenLoading eyebrow="House setup" title="Your houses" />;

  const houses = (((raw as { site?: { houses?: House[] } } | null)?.site?.houses) ?? []) as House[];

  return (
    <HouseSetupForm
      houses={houses}
      save={async (rows) => {
        const r = await setHouses({ houses: rows });
        return r.houses as unknown as House[];
      }}
    />
  );
}
