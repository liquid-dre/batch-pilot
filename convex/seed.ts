import { internalMutation } from "./_generated/server";
import seedData from "./seedData.json";

/**
 * Seed the deployment with the exact demo dataset the mock served (Murray Downs,
 * Irvine's, cycle 85 — the ~13%-under-Ross hero story). `seedData.json` is a
 * snapshot dumped from `lib/data/mock.ts`, so the seeded DB is byte-identical to
 * the old prototype: every derived figure (cumMort, cumPct, birdsRemaining) is
 * already computed and stored, exactly as the mock returned it.
 *
 *   npx convex run seed:seed          # (idempotent — clears then inserts)
 *
 * Run once after `npx convex dev` has created the deployment + generated code.
 */

const TABLES = [
  "contractors",
  "contracts",
  "sites",
  "houses",
  "batches",
  "plannedBatches",
  "placements",
  "dailyEntries",
  "weightEntries",
  "feedDeliveries",
  "catchingEvents",
  "manifests",
  "editLog",
  "historicalBatches",
  "growerProfiles",
  "invites",
] as const;

/** The app's business `id` is stored as the indexed `extId` column (schema). */
function withExtId({ id, ...rest }: Record<string, unknown>) {
  return { extId: id as string, ...rest };
}

/**
 * Wipe every operational table (leaves the auth tables / user accounts intact).
 *   npx convex run seed:clear
 * Use to blank the demo data before onboarding real farms. To also remove test
 * accounts, clear the `users` / `auth*` tables from the Convex dashboard.
 */
export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of TABLES) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
    }
    return { cleared: TABLES.length };
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent: wipe every table first so re-running gives a clean demo.
    for (const table of TABLES) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
    }

    // `benchmark` is an object (not an array), so go through `unknown` — seed
    // only iterates the array tables below and never touches `benchmark`.
    const d = seedData as unknown as Record<string, Array<Record<string, unknown>>>;
    const insert = (table: (typeof TABLES)[number], rows: Array<Record<string, unknown>>, remap = true) =>
      Promise.all(rows.map((r) => ctx.db.insert(table, (remap ? withExtId(r) : r) as never)));

    await insert("contractors", d.contractors);
    await insert("contracts", d.contracts);

    // A site owns its houses; flatten the nested house list into the houses
    // table and keep the ordered extIds on the site row.
    for (const s of d.sites) {
      const houses = (s.houses as Array<Record<string, unknown>>) ?? [];
      await insert("houses", houses);
      const { id, houses: _drop, ...site } = s;
      await ctx.db.insert("sites", { extId: id as string, ...site, houseIds: houses.map((h) => h.id as string) } as never);
    }

    await insert("batches", d.batches);
    await insert("plannedBatches", d.plannedBatches);
    await insert("placements", d.placements);
    await insert("dailyEntries", d.dailyEntries);
    await insert("weightEntries", d.weightEntries);
    await insert("feedDeliveries", d.feedDeliveries);
    await insert("catchingEvents", d.catchingEvents);
    // Manifests key on batchId (no extId); grower profiles + historical batches
    // have no business id either — insert them verbatim.
    await insert("manifests", d.manifests, false);
    await insert("historicalBatches", d.historicalBatches, false);
    await insert("growerProfiles", d.growerProfiles, false);

    return { seeded: true, tables: TABLES.length };
  },
});
