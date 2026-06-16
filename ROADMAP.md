# BatchPilot — Product Roadmap & Build Context

> **Read this file first, before any work.** It is the single source of truth for the build.
> As you complete items in §8, change `[ ]` → `[x]` and add a one-line note. If reality diverges
> from this file, update the file — don't let it go stale. Future agents (and humans) rely on it
> to know where we are, where we came from, and where we're going.

---

## 1. What BatchPilot is

BatchPilot is a WhatsApp-native operations layer for broiler (meat-chicken) farming in Zimbabwe.
It connects two groups:

- **Growers / farm supervisors** — rear the chickens; today they post a daily hand-tallied update
  per house into a WhatsApp group.
- **Contractors** (e.g. Irvine's) — supply chicks, feed and vaccines, then collect the grown birds.

BatchPilot turns each day's raw figures into **auto-computed cumulatives**, a **green / amber / red
status** per house against a breed benchmark, and **projections** (will the flock hit target weight
by the contractor's kill date?), plus the prescriptive "what to do next."

**The wedge:** supervisors hand-calculate cumulative mortality, cum %, and a whole site-average block
every morning across six houses. BatchPilot does that maths for them and adds the analytics on top.

---

## 2. Where we've come from (context the agent must respect)

This product is grounded in real field data, not guesses. Decisions already validated:

- **Per-house, per-day is the unit.** A site has several houses (the reference site, "Nhunge," has 6 ×
  ~16,000 birds). A batch can be **split across houses with staggered placing dates** (Houses 1–2 a day
  ahead of 3–6), so each house tracks its **own day-count**.
- **The benchmark is Ross 308** (as-hatched) performance objectives — target weight, daily gain, ADG,
  feed intake, FCR per day. Mortality/uniformity bands are a **contractor overlay** on top.
- **Projections measure against the contractor's kill date**, which is set up front in the cycle-planning
  message (not a fixed grow-out length).
- **Feed has two meanings** — *added to a house* vs *consumed*. They differ (we've seen 190 g/bird/day
  reported, which is a bin refill, not consumption). FCR/intake scoring needs the consumed figure.
- **Temperature is diagnostic, not a benchmark** — captured optionally, surfaced as a likely *cause*
  when weight/mortality go off (Ross guidance: keep <21 °C from day 21).
- **Status is never colour alone:** colour + icon + word + shape, so it survives glare and colour-blindness.
- **The competitor is a WhatsApp group**, so the product must feel like *less* work than typing the
  message does today. WhatsApp ingestion (1:1, via Twilio) is a later phase; the data model is built
  channel-agnostic so it can plug in.

Reference data shipped with the repo: `ross308_as_hatched_benchmark.csv` (the breed curve) and the
brand guideline PDF (visual system). Use them.

---

## 3. Where we are now (this build)

Going from an empty Next.js project to a **beautiful, clickable, architecturally-clean MVP prototype**
that demonstrates both the grower and contractor experiences.

- **Data is hardcoded** (mock), not a database — but accessed through a seam (see §5) so a real backend
  drops in later without touching the UI.
- **No authentication yet** — a role switcher stands in for login.
- **No payments yet.**
- The bar is: it should look and feel like a shipped Apple-grade product, on our brand, and be
  structured so Convex (DB), Clerk (auth) and Stripe (billing) slot in cleanly.

---

## 4. Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- Fonts via `next/font`: **Plus Jakarta Sans** (display/headings), **IBM Plex Sans** (body/UI),
  **IBM Plex Mono** (numbers/metrics)
- Charts: Recharts (or hand-built SVG where cleaner)
- Motion: Framer Motion and/or CSS, directed by the installed design skills
- **Installed Claude Code design skills to use on every UI task:** `emil-kowalski-design` (motion &
  interaction), `ui-ux-pro`, `impeccable`. Lean on them hard — the goal is beautiful and *distinctive*,
  not a default template.
- **Planned later (do not build now, but leave the seams):** Convex (DB + realtime), Clerk (auth),
  Stripe (billing), Twilio (WhatsApp).

---

## 5. Architecture principles — build for the swap

Everything that will later become "real" is hidden behind a seam now, so swapping mock → real is a
one-module change and the UI never has to be rewritten.

- **Data-access seam.** All reads/writes go through typed functions in `lib/data/` (e.g.
  `getActiveBatches()`, `getHouseDailyEntries(houseId)`, `submitDailyUpdate(input)`). They return
  hardcoded data today; they become Convex queries/mutations later. **UI components never import mock
  data directly** — only these functions.
- **Types are the contract.** `lib/types.ts` defines the data model (§7). Mock data and future Convex
  both conform to it.
- **Auth seam.** `useCurrentUser()` (and an `<AuthProvider>`) returns a hardcoded user + role now →
  Clerk later. Because there's no login, a visible **role switcher** in the app shell toggles
  Grower ↔ Contractor for the demo.
- **Billing seam.** `usePlan()` returns a stub plan now → Stripe later.
- **Theming seam.** Every brand value is a CSS custom property in `globals.css`. Components reference
  **semantic tokens** (`--color-primary`, `--status-bad`…), never raw hex. Re-theming = editing
  `globals.css` only.
- Keep mock-data calls simple/synchronous where possible, but type them as if async, so the Convex swap
  is mechanical.

---

## 6. Design system & brand

**Aesthetic:** Apple-clean — generous whitespace, restraint, crisp type hierarchy, subtle depth,
purposeful motion — expressed through the **BatchPilot brand**, never generic SaaS. Two registers:

- **Grower / supervisor screens:** spacious, calm, large touch targets, one clear action per screen
  ("what now?" before any chart). Built for one thumb, bright sun, a cheap Android.
- **Contractor screens:** denser and data-forward, but still clean and uncluttered.

**Identity:** mark = two ascending chevrons; wordmark = **BatchPilot**; palette and type per the brand
guideline PDF. Brand colour is **Horizon blue** and must stay clear of the green/amber/red status system.

**Define these in `globals.css` (raw scale + semantic aliases):**

```css
:root{
  /* Brand — Horizon (themeable) */
  --brand-900:#0B2A4A; --brand-700:#14487E; --brand-600:#1A5B9C;
  --brand-500:#2474C4; --brand-100:#DCEAF7; --brand-50:#EEF5FC;
  /* Neutrals — warm grey (fixed) */
  --ink:#1B1E23; --slate:#44474E; --muted:#6B6F76; --hint:#9499A1;
  --border:#C9CDD3; --divider:#E4E7EA; --paper:#F4F2ED; --surface:#FFFFFF;
  /* Status — reserved, never used for branding */
  --status-good:#1F7A3D; --status-warn:#C77800; --status-bad:#C62828;
  --status-good-tint:#E3F2E8; --status-warn-tint:#FAF0DC; --status-bad-tint:#FAE4E4;
  /* Semantic aliases — components use THESE */
  --color-primary:var(--brand-700); --color-primary-hover:var(--brand-600);
  --color-accent:var(--brand-500); --color-bg:var(--paper); --color-surface:var(--surface);
  --color-text:var(--ink); --color-text-muted:var(--muted); --color-border:var(--divider);
  /* Type */
  --font-display:'Plus Jakarta Sans'; --font-body:'IBM Plex Sans'; --font-mono:'IBM Plex Mono';
  /* Radii / spacing / motion */
  --radius-card:16px; --radius-control:10px; --radius-pill:999px;
  --space-unit:4px; --shadow-card:0 1px 2px rgba(11,42,74,.06),0 4px 16px rgba(11,42,74,.05);
  --ease-out:cubic-bezier(.16,1,.3,1); --dur-fast:140ms; --dur:220ms;
}
```

**Type scale (mobile-first):** Display 32/700 · H1 26/700 · H2 21/600 · H3 18/600 · Body-L 17/400 ·
Body 15/400 · Label 14/500 · Data 15/500 (mono, tabular figures). Body never below 15px; anything
tappable ≥ 16px.

**Non-negotiable rules:**
- Status = **colour + icon + word + shape** (`✓`/`△`/`!` and `●`/`▲`/`■`). Never colour alone.
- Brand colour is never green/amber/red.
- WCAG 2.1 AA contrast; grower tap targets ≥ 48px (use 52–64px); numbers in mono with tabular figures.
- Numeric entry on grower screens uses a **big +/− stepper**, not a raw keyboard.

---

## 7. Data model (the contract — `lib/types.ts`)

```
Contractor   { id, name, brandTheme? }
Grower/Site  { id, name, farmCode, location{lat,lng}, contractorIds[], houses[] }
House        { id, siteId, name, capacity }
Batch/Cycle  { id, siteId, contractorId, cycleNo, breed, killDate, focPct, contractId }
Placement    { id, batchId, houseId, placedCount, placingDate, dayCount }   // per-house age
DailyEntry   { id, placementId, date, day, mortality, culls, feedAddedKg, feedConsumedKg?, tempC?,
               // derived: cullAndMort, cumMort, cumPct, birdsRemaining }
WeightEntry  { id, placementId, day, avgWeightG, adgG, growthRatio, uniformityPct }
FeedDelivery { id, siteId, date, feedType, bagSizeKg, bagCount, netWeightKg }   // nominal vs net
CatchingEvent{ id, batchId, night, count, collectionWeightKg? }
BenchmarkSet { contractorId, breed, sex, unit, curve:[{day,weightG,dailyGainG,avgDailyGainG,
               dailyIntakeG,cumIntakeG,fcr}], overlay:{mortalityBand[],uniformityTarget[]} }
Contract     { id, chickPrice, feedPricePerKg, buyBackPerKg, focPct }
Status       { metric, level:'green'|'amber'|'red', actualVsTarget, cause?, fix? }
```

Seed `BenchmarkSet.curve` from `ross308_as_hatched_benchmark.csv`. Seed mock sites/batches from the
Nhunge cycle-85 figures so the demo shows realistic numbers (the day-27/28 houses run ~13% under the
Ross weight curve — that under-performance is the hero story, keep it).

---

## 8. MVP feature list & status

**Phase 0 — Foundation**
- [x] Scaffold Next.js (App Router, TS, Tailwind); install deps; load the three fonts — Next 16.2.9 + Tailwind v4 (CSS-first); fonts via `next/font/google` in `app/layout.tsx` (Plus Jakarta Sans / IBM Plex Sans / IBM Plex Mono → CSS vars)
- [x] `globals.css` with full token set (§6); Tailwind wired to the CSS variables — raw + semantic tokens in `:root`; `@theme inline` bridges them to utilities (re-theme = edit this file only)
- [x] Data-access seam (`lib/data/`) + `lib/types.ts` + mock data seeded from Nhunge + Ross 308 — `lib/data/index.ts` (async, Convex-shaped), `lib/data/mock.ts` (cycle-85 anchors), `lib/data/ross308.ts` (full curve from CSV)
- [x] Auth/role stub (`useCurrentUser`, `<AuthProvider>`) + billing stub (`usePlan`) — `lib/auth.tsx` (session-scoped role) + `lib/billing.tsx`
- [x] UI primitives: Button, Card, StatusPill, Input, Stepper, Table, Alert/Callout, Toast — in `components/ui/`; StatusPill carries colour+icon+word+shape
- [x] App shell: top bar with BatchPilot mark + **role switcher (Grower / Contractor)**, nav — `components/shell/` (TopBar, RoleSwitcher, role-aware Dashboard); `app/page.tsx` assembles data on the server

> **Phase 0 decisions.** (1) **Fonts own their CSS vars.** `next/font` self-hosts the three families and assigns `--font-display` / `--font-body` / `--font-mono`; `globals.css` references those vars rather than the literal family names shown illustratively in §6, so there are no Google network requests and no layout shift. (2) **Token→Tailwind bridge.** `@theme inline` maps raw/neutral/status tokens to utilities (`bg-surface`, `text-ink`, `text-brand-700`, `shadow-card`…). The §6 semantic aliases (`--color-primary`, `--color-bg`, `--color-text`) stay `:root`-only and are consumed via `var()`; `surface`/`border` are deliberately *not* re-aliased there to avoid colliding with the raw utility tokens. (3) **Server-fetched data.** The page is a Server Component that `await`s the `lib/data/` seam and passes a typed view-model (`lib/view.ts`) to the client shell — the exact shape the Convex swap will keep. (4) **Phase-0 home is a role-aware overview** that exercises every primitive on real seam data; the dedicated feature screens it links to are stubbed to a toast and built in Phases 1–2.

**Phase 1 — Grower experience**
- [x] Daily update form (per house: mortality, culls, feed added kg, optional temp) → auto-computes
      cull&mort, cum mort, cum %, birds remaining, site average; **echo-back confirmation** before save — `/daily` (`components/forms/DailyUpdateForm.tsx`); house-by-house round with saved chips; echo-back recomputes via `submitDailyUpdate` seam + live site average
- [x] Feed delivery form (type, bag size, bag count, weighed net) + nominal-vs-net reconciliation flag — `/feed` (`FeedDeliveryForm.tsx`); live reconciliation via `submitFeedDelivery`, flags ≥1% off, recent-deliveries list
- [x] Weights form (avg g, ADG, growth ratio, uniformity) — `/weights` (`WeightsForm.tsx`); live vs-Ross-target comparison + StatusPill via `submitWeights`
- [x] House status cards (green/amber/red, with icon+word+shape) + site rollup — `/houses` (`components/flock/HouseStatusCard.tsx` + `SiteRollupCard.tsx`)
- [x] Projection card: countdown + verdict vs the contractor **kill date** — `ProjectionCard.tsx`; `getProjection()` formula = current weight + dailyGain × days-left vs Ross objective at kill day
- [x] Alerts list with cause & fix — `AlertsList.tsx`; `getAlerts()` returns amber/red houses (red first) with plain-language cause + fix
- [x] House setup: add/remove houses, capacity per house, auto-summed total capacity, validation (name + positive-integer capacity), persisted via `lib/data` — `/app/houses/setup` (`HouseSetupForm.tsx`); `saveHouses()` replaces the site's mutable houses list; mock capacities now vary per house
- [x] Allocation recommendation: for a planned batch with a total count but no per-house split, recommend a distribution (proportional to capacity, capped at capacity, remainder to the largest house) the grower accepts or adjusts, then confirm to surface per-house day-counts — `/app/houses/allocate` (`AllocationForm.tsx`); `recommendAllocation()` + `confirmAllocation()`; `PlannedBatch` type + cycle-86 mock; trigger banner on the flock-status screen
- [x] Hybrid numeric entry: every numeric field is +/- stepper **and** direct keyboard typing in one control (`inputMode` numeric/decimal for a phone number pad), 52–64px targets + clamp/validation — `components/ui/Stepper.tsx`; used by daily / feed / weights / house-setup / allocation
- [x] Batch history view: day-by-day tables **per house** and the **batch rollup**, plus charts (daily mort %, cumulative mort %, feed, weight vs Ross, FCR) at house and batch level with a house/metric toggle; a day-of-cycle range selector + house filter drive both — `/app/history` (`components/history/HistoryView.tsx` + `HistoryChart.tsx`, Recharts); `getBatchHistory()` seam + full day-1..current mock series (Nhunge cycle-85 shape, ~13%-under-Ross)
- [x] Batch comparison view: select several batches (past + current) and overlay their curves **aligned by day of cycle** (mortality %, cumulative mortality, average weight vs Ross, FCR) with a metric toggle + per-batch colours + Ross overlay; a compact summary table per batch (final/current weight + vs-Ross, cum mortality %, FCR, days-to-target, performance vs kill date) — `/app/compare` (`components/compare/CompareView.tsx` + `CompareChart.tsx`); `getComparableBatches()` seam; closed batches seeded in `HISTORICAL_BATCHES` (now the single source for the contractor track record too)

> **Phase 1 decisions.** (1) **Persistent shell.** TopBar moved into the root layout via `AppFrame`; grower nav items are real `next/link` routes (`/daily`, `/houses`, `/feed`, `/weights`), contractor items stay Phase-2 stubs. (2) **Grower routes are role-gated** by the `GrowerOnly` client guard (a calm "switch to Grower" prompt for the contractor role) — Clerk will replace this with session-based access. (3) **Stepper is a hybrid control** — press-and-hold +/- with acceleration *and* a typable `inputMode` numeric/decimal field (phone number pad), so large values (feed kg) take seconds and either input path works; clamps + normalises on blur. (4) **Forms call the `lib/data/` write-stubs** (`submitDailyUpdate` / `submitFeedDelivery` / `submitWeights`) which compute derived figures and return them for echo-back/feedback but do **not** persist yet — Phase-later wires Convex mutations behind the same signatures. (5) **Projections are formula-based and explainable** (ML deferred, §9); the rigorous configurable status engine is still Phase 3 — Phase 1 reuses the seeded statuses for cards/alerts. (6) **Charting library: Recharts** (per §4) is now wired for the history view; chart colours come from CSS tokens via `var()` on SVG stroke/fill, so charts re-theme with `globals.css`. The full day-by-day mock series is generated in `lib/data/mock.ts` (front-loaded mortality summing to the documented cumMort; intake-based feed; weigh-days widening below Ross) and shaped by `getBatchHistory()`. (7) **Multi-series comparison** uses a categorical `--chart-*` token palette (distinct cool hues, deliberately clear of the green/amber/red status colours); the current batch is drawn emphasised. Closed batches are generated by `getComparableBatches()` toward their documented finals (`HISTORICAL_BATCHES`), aligned by day of cycle so lifecycles line up regardless of placing date.

**Phase 2 — Contractor experience**
- [x] Portfolio dashboard: all active batches, status, projected-ready vs kill date, ranking (EPEF) — `/portfolio` (`components/contractor/PortfolioDashboard.tsx`); batch summary + projected-ready-vs-kill verdict; `getPortfolio()` computes EPEF/FCR/livability per house
- [x] Per-grower drill-down: per-house detail, trends, track record — `/growers` + `/growers/[siteId]` (`GrowerDetail.tsx`); per-house cards with mortality `Sparkline`, plus a closed-cycle track-record table (`getGrowerDetail()`, `PAST_CYCLES`)
- [x] Flock-overview data table (dense, mono numbers, status pills) — sortable, EPEF-ranked table inside the portfolio dashboard (dark Horizon header, tabular mono, status pills); click a column to sort, a row to drill in
- [x] Collection/catching schedule + vehicle manifest view — `/schedule` (`ScheduleView.tsx`); phased night quotas with progress bars + authorised-vehicle/driver manifest and held count (`getManifest()`, `MANIFEST`)
- [x] Benchmark view: Ross curve + contractor overlay — `/benchmark` (hand-built SVG `BenchmarkChart.tsx`): Ross 308 weight curve + kill-day line + each house plotted, with the mortality-band / uniformity-target overlay listed
- [x] Grower-level performance: ranked overview of **all** the contractor's growers — top/worst on a chosen metric (EPEF, FCR, cumulative mortality, weight-vs-target, on-time-to-kill), sortable with a visual ranking bar + status pills; a **"general position across the days"** overlay of each grower's trend by day of cycle (incl. final results for completed cycles); drill-down reuses the grower detail/chart components — `/app/growers` (`ContractorGrowersView`, reusing `CompareChart`) + `/app/growers/[siteId]` (reusing `GrowerDetail`); `getContractorGrowers()` / `getGrowerDetailById()`; several growers + a 2nd contractor seeded in `GROWER_PROFILES`

> **Phase 2 decisions.** (1) **Contractor nav now routes** to real screens (`/portfolio`, `/growers`, `/schedule`, `/benchmark`); `ContractorOnly` guard mirrors `GrowerOnly`; active-tab logic uses `startsWith` so `/growers/[id]` keeps the tab lit. (2) **EPEF is computed and explainable** — `(liveability% × liveweight kg) / (age days × FCR) × 100`; FCR is estimated from the Ross objective and worsened in proportion to the weight shortfall, until consumed-feed capture lands. The rigorous configurable engine is still Phase 3. (3) **Charts are hand-built SVG** (no chart lib yet, per §4) — `BenchmarkChart` + `Sparkline` are tokenised and theme via `fill-*`/`stroke-*` utilities. (4) **Sorting/ranking is client-side** in `PortfolioDashboard`; rows arrive EPEF-sorted from the seam and the rank column stays stable across re-sorts. (5) **Demo rename:** the reference site is now **Murray Downs** (`AUMD`, NSW) and the demo users are **John** (grower) / **Andy** (contractor); the grower greeting reads the current user's name. Field-data provenance is unchanged. (6) **Tenant isolation lives in the seam:** `getContractorGrowers(contractorId)` returns only that contractor's growers (a 2nd contractor, Drummonds, and its Coorong grower exist purely to prove the boundary) — this is the Convex query scope. Murray Downs is the one **real** grower (full per-house data); the other growers are **generated** from `GROWER_PROFILES` on demand (per-house series + curves conform to the existing view types), so the single-site screens stay untouched.

**Phase 3 — Analytics engine**
- [x] Rule-based status engine vs Ross 308 (thresholds configurable; see brand doc for default bands) — `lib/engine/` (`status.ts` + `thresholds.ts`): `evaluatePlacement()` scores weight / mortality / FCR / feed-intake against the curve + overlay and returns green/amber/red with a cause + fix. Default bands: weight ≥97% / 90–97% / <90%; FCR ≤+3% / +3–8% / >+8%; feed >120% of intake = bin-refill flag; mortality vs the contractor band. Wired into every status surface (replaces the hand-seeded statuses): grower house cards + alerts, contractor portfolio + grower detail
- [x] Weight-curve chart: actual per house vs Ross objective (the Nhunge ~13%-under hero view) — the **hero band chart** (`components/charts/WeightBandChart.tsx`, Recharts): actual weigh-ins per house over the Ross 308 curve with the shaded **green/amber/red** band (≥97 / 90–97 / <90% of Ross). On the grower flock-status screen and the contractor benchmark view; the houses sit in the amber-to-red zone (~13% under at day 28). (The `/app/history` weight-vs-Ross line chart remains too.)
- [x] FCR / efficiency + feed-added-vs-consumed flags — `getHouseDiagnostics()` returns the per-metric breakdown; `EfficiencyPanel` shows per-house FCR vs target + a **bin-refill** flag when feed added runs >120% of expected intake (House 6 is seeded with a refill spike to demonstrate)
- [x] Causes-&-fixes lookup keyed by metric + growth phase — `lib/engine/causes-fixes.ts`: a table keyed by metric + `growthPhase(day)` (brooding/starter/grower/finisher) + level, in the grower voice (action first, reason second); the engine attaches the matching cause/fix to amber/red statuses

> **Phase 3 decisions.** (1) **The engine is pure** (`lib/engine/`, no data-layer imports): the seam passes the Ross curve + overlay in, so it's testable and backend-agnostic. (2) **Thresholds are a config object** (`DEFAULT_THRESHOLDS`) a contractor can override without touching logic. (3) **Single source of truth for status:** `getHouseStatus` / `getAlerts` / portfolio / grower-detail all call the engine now — the Phase-0/1 hand-seeded `SEED_STATUS_BY_HOUSE` is deleted. Overall house status = the worst metric (welfare/growth before efficiency), carrying that metric's cause + fix. (4) **Chart and engine share the bands:** `WeightBandChart` reads the same `weight.green`/`weight.amber` fractions, so the shaded zones always match the rule that colours the pills. With the flock ~13% under, weight and FCR both score red across the board — that's the honest headline, not a styling choice.

**Phase 4 — Polish**
- [ ] Motion: page/route transitions, status-pill and toast micro-interactions (emil-kowalski-design)
- [ ] Empty, loading and error states for every surface
- [ ] Responsive + true mobile pass (grower flow on a phone)
- [ ] Accessibility pass (AA, focus rings, 48px targets, status never colour-only)

**Shell — public site & app boundary**
- [x] Marketing landing at `/` (Horizon-blue hero, value props, two-register section, "Get started" / "Log in" CTAs, tasteful motion) + the grower/contractor experience moved under `/app` (role switcher retained) — `components/marketing/Landing.tsx`; `app/app/layout.tsx` owns the `AppFrame`/TopBar so only `/app/*` gets the shell

> **Shell decision (the Clerk seam).** No real auth: the landing CTAs call the `AuthProvider` stub — "Get started" / "Log in" set a demo session (role = grower) and `router.push('/app')`; the secondary "for contractors" link sets the contractor role. `app/app/layout.tsx` is the authenticated boundary: when **Clerk** lands (ROADMAP §9), these stub calls become real sign-in / sign-up and `/app/*` sits behind the auth middleware. Everything still flows through `lib/data/` and `useCurrentUser()`, so no UI changes are needed for the swap.

---

## 9. Explicitly deferred (post-MVP) — and the seam each will use

- **Auth → Clerk** — seam: `<AuthProvider>` / `useCurrentUser()`; the boundary is `app/app/layout.tsx` and the landing CTAs (`components/marketing/Landing.tsx`) become real sign-in / sign-up
- **Database + realtime → Convex** — seam: `lib/data/*`
- **Payments → Stripe** — seam: `usePlan()`
- **WhatsApp ingestion → Twilio** — 1:1 messaging to a BatchPilot number, tolerant parser + echo-back
  (the data model is already channel-agnostic for this)
- **Offline / PWA, native app, ML projections** — later phases

Do **not** build these now. Just don't paint us into a corner that blocks them.

---

## 10. How to use this file (for the agent)

1. Read §1–§7 before writing code so your choices match the product and brand.
2. Work one phase at a time, top to bottom.
3. As each item completes, set `[x]` and append `— <one-line note: file/decision>`.
4. If you make an architectural decision, record it under the relevant section.
5. Never hardcode a colour or font in a component — use the tokens in `globals.css`.
6. Use the `emil-kowalski-design`, `ui-ux-pro` and `impeccable` skills on every UI task.
