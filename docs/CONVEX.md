# Connecting BatchPilot to Convex

Convex is the deferred owner of the data seam (`ROADMAP.md` §5, §9): every read
and write already flows through `lib/data/`, so wiring Convex is a swap of what
lives behind that seam, not a UI rewrite. This document is the migration record
and the runbook.

## What's already in place (this branch)

- **`convex/schema.ts`** — every operational entity from `lib/types.ts` as a
  Convex table (`sites`, `houses`, `batches`, `placements`, `dailyEntries`,
  `weightEntries`, `feedDeliveries`, `catchingEvents`, `manifests`, `editLog`,
  `plannedBatches`, `historicalBatches`, `growerProfiles`, `contractors`,
  `contracts`). Each row keeps the app's own id as an indexed `extId`, so the
  string-id contract the UI speaks is unchanged. Static reference data (the Ross
  308 curve + overlay, the vaccination schedule, the demo users) stays in code.
- **`convex/seedData.json` + `convex/seed.ts`** — a snapshot dumped straight
  from `lib/data/mock.ts`, so the seeded database is byte-identical to today's
  demo (Murray Downs, cycle 85, ~13%-under-Ross). Seeding is idempotent.
- **`convex/reads.ts`** — `getDataset`, one reactive query returning the whole
  (small) single-site dataset. Any mutation invalidates it and every subscribed
  screen recomputes. Rows are mapped back to plain `lib/types` shapes.
- **`convex/writes.ts`** — mutations mirroring the seam's write-stubs, now
  actually persisting: `submitDailyUpdate`, `submitFeedDelivery`,
  `submitWeights`, `submitManagerEdit` (attributed maker-checker audit trail),
  `saveHouses`, `confirmAllocation`. Cumulative flock arithmetic uses the same
  pure logic as `lib/calc.ts`, and mortality corrections re-derive the house's
  chain forward.
- **`components/providers/ConvexClientProvider.tsx`** — wraps `/app/*`. It is a
  **transparent no-op until `NEXT_PUBLIC_CONVEX_URL` is set**, so the app keeps
  running on the mock seam until you connect a deployment. The moment the URL is
  present, Convex hooks go live.

## Authentication — Convex Auth (email + password)

Auth runs **inside Convex** via `@convex-dev/auth` — no Clerk, no third-party
service. Users, sessions and password hashes live in Convex tables:

- **`convex/schema.ts`** — `...authTables` plus a custom `users` table carrying
  BatchPilot's `role` / `org` / `siteId` / `contractorId`.
- **`convex/auth.ts`** — the `Password` provider. Its `profile` callback stores
  the role chosen at sign-up and scopes a new account to the demo tenant
  (growers → Murray Downs, contractor → Irvine's).
- **`convex/http.ts`**, **`convex/auth.config.ts`**, **`convex/users.ts`**
  (`currentUser`).
- App side: `ConvexAuthNextjsServerProvider` (root layout) + `ConvexClientProvider`
  (client, now `ConvexAuthNextjsProvider`) + **`middleware.ts`** gating `/app`.
  The **`/signin`** route is the real email+password sign-in / sign-up with the
  grower(Supervisor/Manager)/contractor picker. `useCurrentUser()` keeps its
  shape: it returns the signed-in Convex user when connected, and falls back to
  the demo role switcher when `NEXT_PUBLIC_CONVEX_URL` is unset.

Making an account: go to `/signin`, choose **Create account**, pick Supervisor /
Manager / Contractor, enter name + email + password. Manager corrections are
attributed to the authenticated user server-side (`getAuthUserId`).

## Step 1 — provision the deployment + auth (you, locally)

The remote agent container can't do Convex's interactive browser login, so run
this on your machine, on this branch:

```bash
npm install
npx convex dev          # logs in, creates the dev deployment, and:
                        #  • writes CONVEX_DEPLOYMENT + NEXT_PUBLIC_CONVEX_URL to .env.local
                        #  • generates convex/_generated/  (commit this)
                        #  • pushes schema + functions and keeps syncing

# In another terminal, one time — sets the auth JWT keys + SITE_URL on the deployment:
npx @convex-dev/auth
```

`convex/_generated/` does not exist in the repo yet — it can only be generated
against a real deployment. Once `npx convex dev` creates it, **commit it**; the
Convex-consuming code (now including `lib/auth.tsx`, `middleware.ts`, `/signin`)
won't typecheck without it, so run `npm run build` **after** this step, not
before. Until `NEXT_PUBLIC_CONVEX_URL` is set the app still runs on the mock seam
with the demo role switcher and `/app` stays open.

## Step 2 — seed the demo data

With `npx convex dev` running (or once), in another terminal:

```bash
npx convex run seed:seed
```

This clears and inserts the snapshot. Re-run any time to reset the demo.

## Step 3 — go realtime, screen by screen

Reads still come from the mock seam until each screen is switched to the
reactive query. The pattern (safe to do one screen at a time — mixed mock/Convex
is fine during the migration):

1. **Make the seam builders pure.** The view-model builders in
   `lib/data/index.ts` (`getPortfolio`, `getBatchHistory`, `getSupervisorCapture`,
   …) currently read the module-level mock arrays. Extract a `Dataset` type (the
   raw arrays) and have each builder take a `Dataset` argument. The mock path
   builds the `Dataset` from `lib/data/mock.ts`; the Convex path builds it from
   `getDataset`. The existing Vitest suite covers these builders — keep it green
   through the refactor.
2. **Add a client dataset hook.** `useDataset()` = `useQuery(api.reads.getDataset)`.
   A screen becomes realtime by calling the pure builder on that reactive dataset
   instead of `await`-ing the server seam.
3. **Convert a Server Component screen** with `preloadQuery` → `usePreloadedQuery`
   so SSR is preserved *and* the client subscription is reactive:

   ```tsx
   // app/app/.../page.tsx  (Server Component)
   import { preloadQuery } from "convex/nextjs";
   import { api } from "@/convex/_generated/api";
   export default async function Page() {
     const preloaded = await preloadQuery(api.reads.getDataset);
     return <ScreenClient preloaded={preloaded} />;
   }
   ```
   ```tsx
   // ScreenClient.tsx  ("use client")
   import { usePreloadedQuery } from "convex/react";
   const dataset = usePreloadedQuery(preloaded);   // reactive
   const vm = buildPortfolio(dataset);             // existing pure builder
   ```
4. **Point writes at mutations.** Swap each form's `submitX` seam call for
   `useMutation(api.writes.submitX)`. Signatures match the seam, and `getDataset`
   re-fires on write, so the echo-back and every other open screen update live.

Screens to convert (grouped): grower **Dashboard** / **Supervisor capture** /
**Alerts** / **Houses+Allocate**; **Daily / Feed / Weights** forms; **History &
charts** (+ manager edits); **Compare** / **Batches archive**; contractor
**Overview** / **Growers** / **Schedule** / **Benchmark**.

## Notes / decisions

- **One dataset query, not per-screen queries.** The single-site demo is a few
  hundred rows; one reactive `getDataset` keeps the client conversion trivial and
  every screen consistent. If the data grows (many sites/tenants), split into
  scoped queries (`getPortfolio(contractorId)` etc.) — the tenant boundary is
  already modelled (`growerProfiles.contractorId`).
- **Auth stays a stub (Clerk later, §9).** Mutations take the editor identity as
  an argument today; when Clerk lands it comes from `ctx.auth` and the demo users
  move out of code. No mutation signature changes.
- **Derived figures are stored, not just computed.** `dailyEntries` persist
  `cumMort` / `cumPct` / `birdsRemaining`; a correction re-derives them forward
  in the mutation, so every read is already consistent.
