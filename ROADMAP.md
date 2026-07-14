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
  Clerk later. Because there's no login, a visible **role switcher** in the app shell toggles between
  the three profiles for the demo: **Supervisor / Foreman** (grower-side data capturer), **Manager**
  (grower-side oversight) and **Contractor**. `Role = "supervisor" | "manager" | "contractor"`, with
  `isGrowerRole()` covering the two grower profiles (both scoped to a site).
  **Maker-checker lives on this seam:** supervisors capture, managers correct, and every
  correction is attributed (the `EditRecord` audit trail via `lib/data` — `submitManagerEdit` /
  `getEditLog`). Today the editor is the auth-stub manager; when Clerk lands the editor is the
  authed session identity and the log becomes a Convex table, with no UI/signature change.
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
guideline. The system is **monochrome (black-and-white) + ONE vibrant azure accent**, shipped in **two
modes — light (default) and dark (near-black greyscale), with a persisted toggle**. Azure is reserved for
major CTAs, links, the focus ring and active/selected states; everything else is neutral grey. Charts keep
a vibrant categorical palette (per-mode). Status green/amber/red stay reserved. *(Crimson and Horizon blue
are both retired — see the changelog entries.)*

**Define these in `globals.css` — `:root` = LIGHT, `.dark` = DARK overrides (see the file for the full,
AA-verified set). Components read semantic tokens, so flipping the `.dark` values re-themes the whole app:**

```css
:root{ /* LIGHT (default) */
  /* Brand — azure accent. brand-700 = CTA/active FILL (white text, constant across modes);
     brand-600 = link/active TEXT (brightens on dark); brand-900 = constant dark-chrome value. */
  --brand-900:#0B0B0C; --brand-800:#0A4F8F; --brand-700:#0C62B0; --brand-600:#0E6FC4;
  --brand-500:#0EA5E9; --brand-100:#DBEAFE; --brand-50:#EFF6FF;
  --accent-700:#0E6FC4; --accent-600:#0EA5E9; --accent-500:#38BDF8; /* folded onto azure */
  /* Inverse / dark-chrome (intentionally dark in BOTH modes — hero, headers, tooltips, scrim) */
  --canvas-invert:#0B0B0C; --surface-invert:#18181B; --on-invert:#E7E9EA; --on-invert-dim:#A1A1AA;
  --wash:rgba(10,10,10,.05);
  /* Neutrals — true greyscale (flips under .dark) */
  --ink:#0A0A0A; --slate:#3F3F46; --muted:#52525B; --hint:#71717A;
  --border:#E4E4E7; --divider:#EFEFF1; --paper:#F7F7F8; --surface:#FFFFFF;
  /* Status — reserved (danger/error stays here, NOT the accent) */
  --status-good:#1F7A3D; --status-warn:#C77800; --status-bad:#C62828;
  --status-good-tint:#E3F2E8; --status-warn-tint:#FAF0DC; --status-bad-tint:#FAE4E4;
  /* Chart series — vibrant, dataviz-validated; chart crimson/coral/gold live here ONLY */
  --chart-1:#0D8BA3; --chart-2:#E01A4F; --chart-3:#7A5CC0;
  --chart-4:#B8790F; --chart-5:#4B5BD0; --chart-6:#F15946;
  --ring-focus:0 0 0 3px rgba(14,111,196,.22),0 0 0 1.5px #0E6FC4;
  /* Type / radii / spacing / motion — unchanged */
  --radius-card:16px; --radius-control:10px; --radius-pill:999px; --space-unit:4px;
}
.dark{ /* near-black greyscale — only what changes */
  --ink:#FAFAFA; --slate:#D4D4D8; --muted:#A1A1AA; --hint:#8B8B93;
  --border:#26262A; --divider:#1E1E21; --paper:#0B0B0C; --surface:#161618;
  --brand-600:#38BDF8; --brand-500:#38BDF8; --brand-100:#14324C; --brand-50:#0E2233;
  --canvas-invert:#17171A; --surface-invert:#232327;
  --status-good-tint:#14301F; --status-warn-tint:#33280F; --status-bad-tint:#331717;
  --chart-1:#17A2BA; --chart-2:#EF3B63; --chart-3:#9575E6;
  --chart-4:#BD8514; --chart-5:#6472E0; --chart-6:#F05E3A;
  --wash:rgba(255,255,255,.07); --ring-focus:0 0 0 3px rgba(56,189,248,.32),0 0 0 1.5px #38BDF8;
  color-scheme:dark;
}
```

**Type scale (mobile-first):** Display 32/700 · H1 26/700 · H2 21/600 · H3 18/600 · Body-L 17/400 ·
Body 15/400 · Label 14/500 · Data 15/500 (mono, tabular figures). Body never below 15px; anything
tappable ≥ 16px.

**Non-negotiable rules:**
- Status = **colour + icon + word + shape** (`✓`/`△`/`!` and `●`/`▲`/`■`). Never colour alone.
- The **azure accent is reserved** (CTAs / links / focus / active-selected) and clear of the reserved
  status red/amber/green; danger and error UI use the **status** red, never the accent, and info uses the
  azure-accent tint — so accent and status never collide. Chart crimson/coral/gold are chart-only.
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
DailyEntry   { id, placementId, date, day, dayMortality, nightMortality, mortality, culls,
               feedAddedKg, feedConsumedKg?, tempC?,
               charcoal?:{amount,unit}, vaccines?:[{name,amount,unit}], medications?:[…],
               // derived: cullAndMort, cumMort, cumPct, birdsRemaining }
TreatmentEntry { name, amount, unit }   // a vaccine/medication line; charcoal is {amount,unit}
WeightEntry  { id, placementId, day, avgWeightG, adgG, growthRatio, uniformityPct }
FeedDelivery { id, siteId, date, feedType, bagSizeKg, bagCount, netWeightKg }   // nominal vs net
CatchingEvent{ id, batchId, night, count, collectionWeightKg? }
BenchmarkSet { contractorId, breed, sex, unit, curve:[{day,weightG,dailyGainG,avgDailyGainG,
               dailyIntakeG,cumIntakeG,fcr}], overlay:{mortalityBand[],uniformityTarget[]} }
Contract     { id, chickPrice, feedPricePerKg, buyBackPerKg, focPct }
Status       { metric, level:'green'|'amber'|'red', actualVsTarget, cause?, fix? }
```

**Mortality capture.** "Birds found dead" is captured as **Day mortality** + **Night mortality**;
they sum to `mortality`, the single total every downstream calc/chart reads (so the split is additive
metadata, nothing else changed). **Culls** stay separate. The optional consumables — **charcoal**
(amount/unit), **vaccines** and **medications** (name + amount + unit) — are collapsed by default in
capture and are surfaced in the echo-back; they have no scoring impact yet (seams for later analytics).

Seed `BenchmarkSet.curve` from `ross308_as_hatched_benchmark.csv`. Seed mock sites/batches from the
Nhunge cycle-85 figures so the demo shows realistic numbers (the day-27/28 houses run ~13% under the
Ross weight curve — that under-performance is the hero story, keep it).

---

## 8. MVP feature list & status

> **MVP complete.** Phases 0–4 are all shipped: foundation + design system, the grower
> experience, the contractor experience, the rule-based analytics engine, and the Phase-4
> polish pass (motion, empty/loading/error states, mobile, accessibility). What remains is
> explicitly deferred (§9): real auth (Clerk), database + realtime (Convex), payments
> (Stripe), WhatsApp ingestion (Twilio), and offline/PWA/ML. The seams for each are in place.

**Phase 0 — Foundation**
- [x] Scaffold Next.js (App Router, TS, Tailwind); install deps; load the three fonts — Next 16.2.9 + Tailwind v4 (CSS-first); fonts via `next/font/google` in `app/layout.tsx` (Plus Jakarta Sans / IBM Plex Sans / IBM Plex Mono → CSS vars)
- [x] `globals.css` with full token set (§6); Tailwind wired to the CSS variables — raw + semantic tokens in `:root`; `@theme inline` bridges them to utilities (re-theme = edit this file only)
- [x] Data-access seam (`lib/data/`) + `lib/types.ts` + mock data seeded from Nhunge + Ross 308 — `lib/data/index.ts` (async, Convex-shaped), `lib/data/mock.ts` (cycle-85 anchors), `lib/data/ross308.ts` (full curve from CSV)
- [x] Auth/role stub (`useCurrentUser`, `<AuthProvider>`) + billing stub (`usePlan`) — `lib/auth.tsx` (session-scoped role) + `lib/billing.tsx`
- [x] UI primitives: Button, Card, StatusPill, Input, Stepper, Table, Alert/Callout, Toast — in `components/ui/`; StatusPill carries colour+icon+word+shape
- [x] App shell with BatchPilot mark + **role switcher (Grower / Contractor)** + nav — now the collapsible left sidebar `components/shell/` (`AppShell`, `SidebarNav`, `RoleSwitcher`, role-aware `RoleHome`/`GrowerDashboard`); a Server Component assembles data on the server. (The original `TopBar`/`AppFrame` were superseded by the sidebar shell in the IA restructure below.)

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

> **Phase 1 decisions.** (1) **Persistent shell.** The shell lives in the `/app` layout (originally a `TopBar`/`AppFrame`, later replaced by the collapsible `AppShell` + `SidebarNav` — see the IA restructure below); grower nav items are real `next/link` routes (`/app/daily`, `/app/houses`, `/app/feed`, `/app/weights`), contractor items stay Phase-2 stubs. (2) **Grower routes are role-gated** by the `GrowerOnly` client guard (a calm "switch to Grower" prompt for the contractor role) — Clerk will replace this with session-based access. (3) **Stepper is a hybrid control** — press-and-hold +/- with acceleration *and* a typable `inputMode` numeric/decimal field (phone number pad), so large values (feed kg) take seconds and either input path works; clamps + normalises on blur. (4) **Forms call the `lib/data/` write-stubs** (`submitDailyUpdate` / `submitFeedDelivery` / `submitWeights`) which compute derived figures and return them for echo-back/feedback but do **not** persist yet — Phase-later wires Convex mutations behind the same signatures. (5) **Projections are formula-based and explainable** (ML deferred, §9); the rigorous configurable status engine is still Phase 3 — Phase 1 reuses the seeded statuses for cards/alerts. (6) **Charting library: Recharts** (per §4) is now wired for the history view; chart colours come from CSS tokens via `var()` on SVG stroke/fill, so charts re-theme with `globals.css`. The full day-by-day mock series is generated in `lib/data/mock.ts` (front-loaded mortality summing to the documented cumMort; intake-based feed; weigh-days widening below Ross) and shaped by `getBatchHistory()`. (7) **Multi-series comparison** uses a categorical `--chart-*` token palette (distinct cool hues, deliberately clear of the green/amber/red status colours); the current batch is drawn emphasised. Closed batches are generated by `getComparableBatches()` toward their documented finals (`HISTORICAL_BATCHES`), aligned by day of cycle so lifecycles line up regardless of placing date.

**Phase 2 — Contractor experience**
- [x] Portfolio dashboard: all active batches, status, projected-ready vs kill date, ranking (EPEF) — `/portfolio` (`components/contractor/PortfolioDashboard.tsx`); batch summary + projected-ready-vs-kill verdict; `getPortfolio()` computes EPEF/FCR/livability per house
- [x] Per-grower drill-down: per-house detail, trends, track record — `/growers` + `/growers/[siteId]` (`GrowerDetail.tsx`); per-house cards with mortality `Sparkline`, plus a closed-cycle track-record table (`getGrowerDetail()`, `PAST_CYCLES`)
- [x] Flock-overview data table (dense, mono numbers, status pills) — sortable, EPEF-ranked table inside the portfolio dashboard (dark inverse-chrome header, tabular mono, status pills); click a column to sort, a row to drill in
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
- [x] Motion: page/route transitions, status-pill and toast micro-interactions (emil-kowalski-design) — route entrance via `app/app/template.tsx` (rise-in, the sidebar shell persists); `AnimatedNumber` counts hero stat figures up on mount; `StatusPill` pops in; toast exits faster than it enters; all on the strong `--ease-out` curve, <300ms, and disabled under `prefers-reduced-motion`
- [x] Empty, loading and error states for every surface — `app/app/loading.tsx` (branded skeleton streamed while data resolves), `app/app/error.tsx` (calm retry boundary), `app/not-found.tsx` (branded 404), `app/global-error.tsx`; reusable `EmptyState` + `Skeleton` primitives, wired where lists can be empty (feed log, alerts, compare picker, daily-done)
- [x] Responsive + true mobile pass (grower flow on a phone) — verified the grower flow at 375px (overview, daily, houses): chips wrap, 56px steppers, charts size down (band chart ~303px), no horizontal overflow, one clear action per screen
- [x] Accessibility pass (AA, focus rings, 48px targets, status never colour-only) — global `:focus-visible` brand ring; clickable table rows made keyboard-operable (`rowActivation`: role/tabindex/Enter-Space); grower primary actions 52–56px; status always colour + icon + word + shape; toast region is `aria-live`, loading is `aria-busy`; reduced-motion honoured (CSS + `AnimatedNumber` guard)

> **Phase 4 decisions.** Motion is purposeful, never decorative: a single route-entrance (not per-section), number count-ups only on the hero stat blocks, a subtle status-pill entrance because status is what the eye should find first. Everything degrades to a crossfade/instant under `prefers-reduced-motion`. The Recharts `ResponsiveContainer` can measure 0 on its very first mount frame (it recovers on the next layout tick); harmless given every chart sits in a sized card.

**Shell — public site & app boundary**
- [x] Marketing landing at `/` (dark near-black hero, value props, two-register section, "Get started" / "Log in" CTAs, tasteful motion) + the grower/contractor experience moved under `/app` (role switcher retained) — `components/marketing/Landing.tsx`; `app/app/layout.tsx` owns the shell so only `/app/*` gets it
- [x] **Information architecture + collapsible sidebar** — a left sidebar (`AppShell` + `SidebarNav`, `nav-config.tsx`) is the navigation vehicle: desktop full panel ↔ persisted icon rail (tooltips in rail) with collapsible, open-state-remembering groups; mobile hamburger in a slim top bar opens an off-canvas drawer over a dimmed scrim (tap-scrim / select / Escape / swipe to close, large targets); BatchPilot mark on top, role switcher in the sidebar, clear active highlight. Brand-token only, `prefers-reduced-motion` aware, full keyboard nav (`usePersisted` via `useSyncExternalStore`).
- [x] **Icon system — Untitled UI** — replaced every hand-built inline SVG with the official free `@untitledui/icons` line set, routed through one central module (`components/icons.tsx`) that re-exports the chosen icons under semantic names (`IconDashboard`, `IconDailyUpdate`, `IconStatusGood/Warn/Bad`, `IconMenu`, `IconCollapse`, …); every other file imports from that module only, so the whole set is swappable in one place. Covers sidebar nav + group headers, hamburger/collapse toggles, status pills, alerts, toasts, stepper +/−, and the form trash/check glyphs. On brand (line style, ~2px stroke, 24px nav / smaller inline) and colour comes from `currentColor` via semantic text tokens (never a hardcoded hex). Status stays colour + icon + word + shape via distinct glyphs — tick-circle (good) / triangle (at risk) / alert-circle (needs attention). A11y: decorative icons `aria-hidden`, icon-only buttons keep an `aria-label`.

> **Shell decision (the Clerk seam).** No real auth: the landing CTAs call the `AuthProvider` stub and `router.push('/app')`. The grower app offers two profiles — **Supervisor / Foreman** and **Manager** — each setting its demo role; the "for contractors" link sets the contractor role (see "Grower profiles" below). `app/app/layout.tsx` is the authenticated boundary: when **Clerk** lands (ROADMAP §9), these stub calls become real sign-in / sign-up and `/app/*` sits behind the auth middleware. Everything still flows through `lib/data/` and `useCurrentUser()`, so no UI changes are needed for the swap.

> **IA decision.** Features were arriving faster than structure, leaving two competing "homes" (overview vs flock-status), orphaned screens (house setup, allocate, alerts reachable only via buried buttons) and ambiguous labels. The upgrade gives every feature **one obvious home** under intuitive, role-matched sections. **Grower:** `Dashboard` (default, "what now?" — the consolidated greeting + projection + weight-vs-Ross hero + alerts summary + efficiency + per-house status, replacing the old overview *and* flock-status pages) · **Records** {Daily update, Feed deliveries, Weights} · **Analytics** {History & charts, Batch comparison} · **Setup** {Houses, Allocate a cycle} · `Alerts` (now its own screen). **Contractor:** `Overview` (the rankings dashboard, default) · `Growers` · `Collection schedule` · `Benchmarks`. Route moves: grower flock-status folded into `/app`; `/app/houses` is now **Setup → Houses**; new `/app/alerts`; contractor `/app` is the rankings (Portfolio folded in). Old routes redirect (`/app/houses/setup` → `/app/houses`, `/app/portfolio` → `/app`). Orientation: every screen has a clear title, nested screens carry a breadcrumb back-link (`PageHeader.back`), one obvious primary action, and guiding empty states.

**Assessment pass — clarity, honesty & first unit tests**
- [x] **Estimated metrics labelled** — FCR and EPEF are derived from feed *delivered*, not measured consumption, so every surface marks them with an "est." tag + the note "Estimated — based on feed delivered, not measured consumption" (`components/ui/Estimated.tsx`, the single source): contractor portfolio + grower rankings + track record, grower efficiency panel, history/compare FCR.
- [x] **Allocation done-state** — confirming the split shows a persistent "Cycle allocated" state (locked-in per-house split + "Allocated" badge), kept client-side (`lib/allocationStore.ts`) so it survives navigation/refresh; the Dashboard banner clears off the same store. (Also fixed a `usePersisted` infinite-loop on non-primitive values.)
- [x] **Role switcher reads as a viewpoint switch** — "Viewing as" label + eye icon + per-option role icons in the sidebar (`RoleSwitcher`), not a bare toggle; rail mode mirrors it.
- [x] **Demo-data note** — a calm, persistent "Demo data · resets on refresh" line at the foot of the sidebar (`SidebarNav`), so testers don't expect persistence.
- [x] **Constructive under-performance framing** — the weight gap is shown as guidance not an alarm (status + gap + likely cause + action); all copy in one editable place (`lib/guidance.ts` → `WeightGuidanceCard`). Distinguishes "not eating" from "eating but not gaining" (heat-stress after day 21, Ross <21 °C).
- [x] **Even contractor drill-down** — every grower drill-down has the same depth: per-house cards, a per-day **Trends** chart (reusing `CompareChart`), and track record (`GrowerTrends`).
- [x] **Unit tests (Vitest)** — pure logic only: the status/threshold engine, `recommendAllocation`, and the cumulative maths (extracted to `lib/calc.ts`); 21 tests via `npm test`. No UI/snapshot tests yet (interface still moving).

**Grower profiles + richer daily capture**
- [x] **Two grower profiles — Supervisor / Foreman & Manager** — the grower side splits into a data-capturer (supervisor/foreman) and an oversight (manager) profile, both on the same site and both on the auth **stub** (no real auth). `Role` becomes `"supervisor" | "manager" | "contractor"` with `isGrowerRole()` (`lib/types.ts`); mock `SUPERVISOR_USER` / `MANAGER_USER` (`lib/data/mock.ts`); `AuthProvider` maps all three (`lib/auth.tsx`). The login screen (`components/marketing/Landing.tsx`) now offers **Supervisor / Foreman** and **Manager** (plus the contractor link) — each sets the demo role and routes to that profile's home. **Homes:** supervisor → a new capture-first `SupervisorHome` ("today's round" front-and-centre + quick capture links + watch-list + site totals); manager → the existing oversight `GrowerDashboard`; contractor unchanged (`RoleHome`). **Nav** (`nav-config.tsx`) is profile-matched: supervisor = Capture {Daily, Feed, Weights} + Setup + Alerts; manager = Analytics {History, Compare} + Setup + Alerts. `GrowerOnly` gates on `isGrowerRole`; the `RoleSwitcher` + rail show all three profiles. **This is the Clerk seam** (recorded in §5/§9).
- [x] **Mortality split + optional consumables** — "Birds found dead" → **Day mortality** + **Night mortality** (sum to `mortality`, the figure all calcs/charts keep reading); Culls unchanged. New **optional, collapsed-by-default** consumables on the daily entry: **Charcoal** (amount/unit), **Vaccines** and **Medications** (name + amount + unit, add/remove rows). Wired through types (`DailyEntry`, `TreatmentEntry`, `Amount`), the seam (`submitDailyUpdate` / `DailyUpdateInput` compute the total + echo back the consumables) and the capture UI (`DailyUpdateForm` — paired steppers with a live total, a "Treatments & additives" collapsible). Mock series now carry the day/night split.
- [x] **Supervisor home = one minimal capture screen (most important grower UX)** — the supervisor/foreman is **not** tech-savvy and must never feel overwhelmed, so their home is now a single, calm capture surface and **their nav stays tiny** (`nav-config.tsx`: supervisor = "Today's capture" (the daily round) + "Feed deliveries" — the two things they log; oversight — analytics/setup/alerts — stays with the Manager profile). `SupervisorHome` (`components/flock/SupervisorHome.tsx`) is rebuilt from the ground up around the one job: **orientation up top** (weekday date via new `longDate`, site · cycle · breed, and the selected house's **day of cycle**); a calm house-round selector; then **only the day's fields** — Day mortality, Night mortality (live total), Culls, Feed added — as the big 56px hybrid steppers; the **optional Charcoal / Vaccines / Medications collapsed** by default (shared `components/forms/treatments.tsx`, also now used by `DailyUpdateForm` — the duplicated panel was extracted). The day's **Ross 308 guideline values are plain descriptions, never charts** (`GuidePanel`: "Target weight today — N g", "Expected total deaths by today — under ~X% (~Y birds)"; feed stepper hints the Ross intake g/bird). After mortality is entered, **one calm line** (`StandingLine`) says whether cumulative mortality is above/below the day's contractor standard and by how much (colour + icon + word, never alarming) — matching the status engine's band. **Vaccination days are obvious** (`VaccinationBanner` + highlighted, pre-seeded vaccines field): a `VACCINATION_SCHEDULE` (day 10 Gumboro / 18 ND / 28 ND-booster) keyed to each house's own day-count surfaces the prompt and reveals the vaccines-used fields, while the mortality-vs-standard line still shows (Murray Downs houses 1–2 land on the day-28 ND booster in the demo). **One primary Save** per house → a **simple confirmation** (`SavedCard`: what was recorded + the cumulative maths done for them + the standing line), then the round flows to the next house. Seam: `getSupervisorCapture()` + `CaptureHouse`/`SupervisorCaptureData` view-models compute the per-house day, prior totals, guideline values and vaccination flag server-side (the calm screen stays a thin client); pure `mortalityBandPctAt()` added to `lib/data/ross308.ts` (unit-tested) so the descriptive standard and the status pill always agree.

**Manager profile — full oversight + attributed corrections + benchmark toggle**
- [x] **Manager keeps ALL the richer grower functionality** — the manager profile is the oversight register: its home is the consolidated `GrowerDashboard` and its nav (`nav-config.tsx`) carries Dashboard · Analytics {History & charts, Batch comparison} · Setup {Houses, Allocate} · Alerts. The supervisor screen is the only stripped-down one; the manager loses nothing. (No new screens were needed — this confirms and documents the split; the new manager-only capability is editing rights, below.)
- [x] **Manager editing rights — deliberate + ATTRIBUTED (maker-checker)** — supervisors capture; **managers can correct any captured value**, and every correction is recorded, never silent. New `EditRecord` + `EditableField` types (`lib/types.ts`); a mutable `EDIT_LOG` audit store (`lib/data/mock.ts`); `submitManagerEdit()` applies the change, writes one **audit record per changed field** (who / when / old→new / optional note) and **re-derives the house's cumulative chain forward** (mortality cascades — cum mort, cum %, birds remaining), with `getEditLog()` to read the trail (`lib/data/index.ts`, unit-tested in `test/managerEdit.test.ts`). UI lives in **History & charts** (`components/history/HouseHistoryTable.tsx`): managers get a per-row pencil that opens an inline correction panel (steppers for day/night mortality, culls, feed, temp); corrected entries are **visibly marked "Edited"** for everyone (a brand-tinted badge with an edit glyph) and the **change is viewable inline** (field · old→new · editor name + role + timestamp). `HistoryView` holds history + audit trail in state and re-fetches the seam after a save so the recomputed cumulatives render in place; gating is `role === "manager"` (supervisors/contractors see the markers read-only). **This is the maker-checker / Clerk seam** (§5/§9): today the editor is the auth-stub manager; later it's the authed Clerk identity and the log becomes a Convex table.
- [x] **Weight-vs-benchmark toggle — numerical difference ⇄ percentage** — anywhere weight is shown against the Ross 308 objective, a toggle switches the gap between the **actual numerical difference** (default, e.g. "89 g below target") and a **percentage** ("6% below target"). One pure source (`lib/weightCompare.ts`: `vsBenchmark` / `vsBenchmarkFromPct` / `formatGap` / `compactGap`, unit-tested) + one session-remembered control/hook (`components/ui/BenchmarkToggle.tsx`, sessionStorage via `useSyncExternalStore`, default `difference`). Applied consistently across **cards** (house status, projection, weight-guidance), **tables** (history batch table + per-house weigh rows, compare summary "vs target") and **chart annotations** (the hero `WeightBandChart` tooltip and the History weight-chart tooltip). The chosen mode is shared across every surface and persists for the browser session.

**Manager profile — Previous Batches archive + restructured batch detail**
- [x] **Interactive "Previous batches" archive table** — a new manager-only Analytics screen (`/app/batches`, `nav-config.tsx` adds it between History & Batch comparison; `IconArchive`) listing every cycle on the site (current + closed) as a dense, on-brand data grid (`components/batches/PreviousBatchesTable.tsx`, `BatchArchiveView.tsx`). **Per-column filtering**: each column carries the filter its type warrants — text → search, number → min/max, date → from/to — and they **combine** (a row must pass every active filter). A **"Filters" toggle** (with an active-count badge), a row of **removable active-filter chips** and a **"Clear all"** affordance make state obvious; a calm **empty state** shows when nothing matches. **Column reordering** by dragging the header grip (HTML5 drag-and-drop) **and** by keyboard (focus the grip, ← / →), with a live drop indicator and a **"Reset columns"** action; the **existing sort** (click a header label, asc/desc, `aria-sort`) and a **sticky header** (the grid is a scroll region) keep working alongside reorder. **Column order + active filters persist for the browser session** (`useSessionPersisted` added to `lib/usePersisted.ts`, sessionStorage via `useSyncExternalStore`). Accessible throughout (keyboard-operable filters + reorder, labelled controls, a per-row **eye action** in a sticky right-hand column that opens the batch detail); numbers are mono tabular; FCR/EPEF keep the "est." tag. The **live-trajectory status pill** (On track / At risk / Needs attention) shows **only for the batch still on the floor** — a closed cycle is a finished result, so its row (and the detail "vs Ross" highlight) shows the numbers without the trajectory word. Seam: `getBatchArchive()` / `getBatchArchiveRow()` (`lib/view.ts` `BatchArchiveRow`), unit-tested (`test/batchArchive.test.ts`).
- [x] **Batch detail page restructured into TITLE / HIGHLIGHTS / DETAIL** — opening a row routes to `/app/batches/[id]` (`components/batches/BatchDetailView.tsx`, `ManagerOnly` guard). **TITLE**: the batch number as the page title ("Batch 85") with start–end dates as the subtitle (back-link to the archive). **HIGHLIGHTS**: scannable on-brand summary cards (`BatchHighlights.tsx`) — total mortality, final weight, FCR/EPEF (marked "est."), feed used, vaccination count, performance vs Ross + vs the kill date, with hero count-ups. **DETAIL**: the full **History & Charts view reused, not forked** — `HistoryView` gained two optional props (`embedded` drops its page chrome so it nests beneath the highlights; `editable` makes closed/archived batches read-only) plus a new **sticky jump-to-day** control (a labelled, keyboard-operable day picker that scrolls the day-by-day tables to a chosen day and flashes the row) alongside the existing day-range selector. Closed batches **generate a full per-house day-by-day history deterministically** from their summary seed so the same view renders unchanged: `getArchivedBatchHistory(batchId)` (current → real captured data; closed → generated), backed by a refactor that extracted the pure `assembleBatchHistory(placements, daily, weights, nameOf)` shared by `getBatchHistory()`.

> **Batch-archive decisions.** (1) **No grid library** — per the AGENTS Next.js note we checked before reaching for one; the data grid is a light headless approach (a plain `<table>` + a typed column model + `useSyncExternalStore`-backed session state), so nothing heavy was pulled in. (2) **Reuse, don't fork** — the detail "DETAIL" section is literally `HistoryView` with `embedded`/`editable` props and a shared jump-to-day enhancement, so the live History & charts screen and every archived batch render from one component. (3) **Closed-batch fidelity** — generated per-house series carry symmetric per-house jitter so the batch mean tracks the documented seed, and the archive row's *headline* figures (final weight / cum mortality / FCR / EPEF) come straight from the seed, keeping the table, the comparison view and the contractor track record in agreement. (4) **Session, not local** — column order + filters use sessionStorage (cleared on tab close) to match the "within the session" brief, distinct from the long-lived `usePersisted` (sidebar/allocation state).

**Data-entry ergonomics — the capture screens feel right in the thumb**
- [x] **Numeric fields never append to a literal 0** — count fields (day/night mortality, culls, treatment amounts, and the manager inline-edit fields) start **blank with a faint `0` placeholder**; the first keystroke replaces (type `4` → `4`, never `40`) and an empty field saves as `0`, so a zero-loss day is "leave it blank, Save". One `blankZero` prop on `components/ui/Stepper.tsx`; the seeded fields (feed = last delivery, weight = Ross target, capacity, allocation, temp) keep their helpful defaults.
- [x] **Live comma formatting while typing** — every numeric field comma-groups the integer part as you type (`4000` → `4,000`, `120000` → `120,000`; decimals like FCR `1.2` / `22.5 °C` untouched) while the emitted value stays a plain `number` for the maths. The caret is preserved across the reformat (pure, exported `reformat()` in `Stepper.tsx`, unit-tested in `test/stepper.test.ts`) so it never fights the +/− stepper or the phone number pad.
- [x] **Confirmation copy in one editable place, plain and on-your-side** — all save/echo-back wording moved out of ~8 inline sites into `lib/copy.ts` (mirrors `lib/guidance.ts`): the daily-save family (`dailySaved()` → toast, headline, read-back, one-line banner + tile labels) plus the feed / weights / allocation / house-setup toasts. Warm register — "lost" not "deaths", "birds still going" not "remaining" — so `"Day 1 saved — cumulative deaths 7, 3,993 birds remaining."` becomes `"House 3, day 12 is in. 4 lost today — 7 lost so far this cycle, 15,993 birds still going."` Wired through `SupervisorHome`, `DailyUpdateForm` and the Convex-path `FarmData`; wording locked in `test/copy.test.ts`.

> **Data-entry decisions.** (1) **Blank ⇒ 0**, so 0 and "left blank" are deliberately the same for count fields — the common zero-loss day needs no taps, and the `Stepper` keeps its plain `number` contract (no `number | null` ripple). (2) **Format lives in the control, not the callers** — grouping reuses the existing `num()` semantics via a pure `group()`/`reformat()` in `Stepper.tsx`, so every screen inherits it and nothing downstream sees commas (`clean()` strips them before emit). (3) **One copy home** — `lib/copy.ts` is now the single source for save-confirmation copy; components own layout, the module owns every string, so re-voicing is a one-file edit. `FarmData` (Convex path) was included because its inline string was the exact example being fixed. Verification note: the full app can't boot headless in this environment (the merged Convex work makes `NEXT_PUBLIC_CONVEX_URL` mandatory in the root layout), so behaviour is covered by the pure-logic unit tests + `npm run build`; a browser pass is a follow-up once a Convex dev URL is available.

**Supervisor information architecture — capture + view, never configure**
- [x] **Supervisor nav regrouped the way a supervisor thinks** (`components/shell/nav-config.tsx`) — from two flat items to: **Home** (`/app`) · **Today's capture** (`/app/capture`) · **Feed deliveries** (`/app/feed`) · **Records** {**Cycle history** `/app/history`, **House logbook** `/app/logbook`}. Do-today's-job at the top, look-back tucked in one group; nothing to set up. Runs through the existing collapsible sidebar + mobile burger/drawer (`AppShell`/`SidebarNav`) unchanged. Manager & contractor navs untouched.
- [x] **Home is a calm orientation dashboard** (`components/flock/SupervisorDashboard.tsx`, now the supervisor `/app` via `RoleHome`) — one primary **"Capture today's results"** CTA; **nothing recorded today** → a plain empty state + the CTA; **once houses are in** → a card each (what was captured + an on-track/off-track pill with the day's deviation size) plus a light **shadcn-style bar chart** of each house's gap to the day's standard. Read-only. `submitDailyUpdate` doesn't persist in the mock path, so a session store (`lib/captureStore.ts`, `useTodaysCaptures`) bridges the capture round → dashboard (resets on refresh, matching the demo note); when Convex lands the dashboard reads the reactive farm query with the same hook shape.
- [x] **Capture round relocated to its own screen** (`/app/capture` → the existing calm `SupervisorHome`), reached by the dashboard CTA + nav; the redundant manager-oriented `/app/daily` is no longer a supervisor destination. The standing-vs-standard logic was extracted to `lib/standing.ts` (`compareToStandard`, unit-tested in `test/standing.test.ts`) so the capture pill and the dashboard deviation always agree.
- [x] **shadcn-style chart primitive** (`components/ui/chart.tsx`) — a trimmed `ChartContainer` / `ChartTooltip` / `ChartTooltipContent` over the existing Recharts dep, themed via `--color-<key>` CSS vars so charts stay on brand tokens (no new UI framework). Calm by default (animation off).
- [x] **House logbook stubbed** (`/app/logbook`) — a calm "coming soon" placeholder (`PageHeader` + `EmptyState`) so the Records destination exists and explains itself rather than 404-ing.

> **Supervisor-IA decisions.** (1) **Capture + view only** — per the brief, supervisors (non-technical) never configure: **Houses**, **Start a cycle** (and its kill-date≥start-date validation) and the maker-checker corrections stay with the Manager; analytics-heavy **comparison** and the **batch archive** stay off the supervisor sidebar. This deliberately supersedes the earlier "supervisor nav stays tiny, capture-only" decision — the role now also *views* the record, but still does not configure. (2) **Dashboard is Home** — opening the app answers "have I done today's round?" first, with capture one tap away, rather than dropping straight into entry. (3) **Alerts folded, not a menu item** — the on-track/off-track read lives on the Home cards, so there's no separate Alerts screen to flood the nav. (4) **Two gaps stubbed, not faked** — the House logbook is an honest placeholder and the dashboard's charts are real; nothing pretends to be built that isn't. Same headless-verification caveat as above (Convex env gates the app in this environment): covered by `npm run build`, `tsc`, lint and the `lib/standing` unit tests; a browser pass follows once a Convex dev URL is available.

**Dashboard rebuilt to one shared structure (supervisor + manager)**
- [x] **Both dashboards now render one structure at role-appropriate depth** — a shared set of section components (`components/dashboard/`) fed by one seam bundle `getDashboardView()` (`lib/data/index.ts` → `lib/view.ts` `DashboardView`): **cycle info → on-track cards → yesterday's entries → projection chart**. `RoleHome` passes the same bundle to `SupervisorDashboard` (plain, led by the capture CTA) and `GrowerDashboard` (full). `app/app/page.tsx` collapsed from a 13-seam per-house assembly to the one bundle. **All house-level health/status surfaces removed** (the per-house `HouseStatusCard` grid + `EfficiencyPanel` are gone from the dashboards).
- [x] **Cycle info at the top** (`CycleInfo.tsx`) — cycle number · breed · **day of cycle** (per-house range, = latest captured + 1) · placed date · kill date + plain countdown (`getDashboardCycleInfo`).
- [x] **On-track cards** (`OnTrackCards.tsx`) — one card per stat (weight, mortality, feed-est, FCR-est): ahead/behind the Ross 308 guideline **and by how much**, via the shared numerical⇄percentage toggle (`useWeightCompareMode`/`BenchmarkToggle`). Status is the engine level as a `StatusPill` (colour + icon + word + shape). Site-level scoring reuses the existing `lib/engine` evaluators over averaged inputs (`getDashboardMetrics`); a new pure `lib/metricGap.ts` extends the difference/percentage phrasing to grams / percentage-points / FCR-points / g-per-bird (unit-tested, `test/metricGap.test.ts`). **Manager depth:** the engine's cause + fix on amber/red cards + a "See the day-by-day →" link. **Supervisor:** one calm "what it means" line.
- [x] **Previous day's entries** (`PreviousDayEntries.tsx`) — a read-only per-house review of yesterday's captured round (mortality · culls · feed), from `getYesterdayEntries` (the mock's latest entry). **Manager depth:** a per-row "Correct →" jump to the History maker-checker.
- [x] **Projection chart** (`ProjectionChart.tsx`) — daily average weight vs the Ross 308 curve: **actual weigh-ins solid, a dashed projected line** (`current + ADG × days-left`) running forward to the kill date, over the shaded green/amber/red band. Built on the **shadcn-style chart primitive** (`components/ui/chart.tsx`, Recharts + brand CSS-var tokens). New `getWeightProjection` seam (unit-tested for reach + monotonicity, `test/dashboard.test.ts`). **Manager depth:** a Site⇄Houses toggle overlaying each house's line; **supervisor:** one calm site-average line.

> **Dashboard-rebuild decisions.** (1) **Same structure, different depth via a `variant` prop** — one component set, so the two roles never drift; the supervisor gets the plain version of every section plus the capture CTA, the manager gets cause/fix + drill-downs + the per-house projection toggle and no capture CTA (it oversees, it doesn't capture). (2) **"Remove houses info" = remove per-house *health* cards**, not the raw entry log — yesterday's entries stay per-house (that's the review), while the on-track cards are site-level and the projection defaults to one site line. (3) **Site metrics reuse the engine** — averaged `PlacementMetrics` through the same `evaluateWeight/Mortality/Fcr`, so a card and a house pill can't disagree; feed is an explicit **est.** (cumulative added vs Ross intake), banded symmetrically rather than via the refill flag. (4) Same headless caveat (Convex env gates the app here): covered by `tsc`, `npm run build`, lint and unit tests (`metricGap`, the `getDashboard*` seam behaviour); a browser pass follows once a Convex dev URL exists.

**Auth polish + contractor permissions (Convex path)**
- [x] **Immediate sign-out** — `components/shell/SignOutButton.tsx` was awaiting the Convex token revoke *before* navigating, with no pending state, so it read as frozen. It now navigates optimistically (`router.replace("/")` at once, `signOut()` fired concurrently with a `.catch`) and shows a brief disabled **"Signing out…"** state for the in-flight moment. One file; middleware/Convex wiring were already correct for the `/` destination.
- [x] **Farm name is read-only for contractors after creation** — a contractor could rename a farm post-creation via an inline input + `renameFarm` mutation. Both are removed: the `ContractorFarmCard` (`components/onboarding/Onboarding.tsx`) now renders the name as static text next to the `farmCode` (matching the grower `FarmCard`), and the `renameFarm` mutation is deleted from `convex/tenancy.ts` (defence in depth — the name can't be changed from the UI *or* a direct call). The name is still set once at creation (`createFarm`).

> **Permissions decision.** Audited the contractor's whole editable surface: the only other thing they can edit is **inviting supervisors** to their own farm — kept, since onboarding growers is the contractor's job. `farmCode`, `location`, `contractorIds` are already immutable (no input, no mutation); houses / cycle / capture / corrections are grower/manager-only. So the name was the one field to lock. (Bonus: the removed `renameFarm` never recomputed `farmCode`, so a rename used to leave the code stale — gone now.) Convex-path only (the mock demo has no farm-name editor and uses the role switcher, so no sign-out there either); verified via `tsc` + `npm run build` + lint (no new issues) + the unit suite, with the standing headless caveat — a browser pass follows once a Convex dev URL exists.

**Sonner as the single toast system**
- [x] **One toast library, one wrapper** — replaced the hand-rolled `ToastProvider` with **Sonner** (`sonner` dep), mounted once as `<AppToaster/>` in the root layout (`app/layout.tsx`) at **`position="top-right"`** (explicit — Sonner defaults to bottom-right), `duration={4000}` (matches the old toast), `visibleToasts={3}` (a calm stack for a fast capture round), `closeButton` (dismissable + a11y). Components import **`notify`** from the one wrapper `components/ui/notify.ts` and never call `sonner` directly, so tone/icons/styling retune in one place. `components/ui/Toast.tsx` + `ToastProvider`/`useToast` are gone.
- [x] **Right tone for the context, everywhere** — `success` (record saved, allocation confirmed, houses saved), `error` (save failure, "Check the houses" validation), `warning` on **caveated saves** (a feed delivery short/over the order, a weigh-in below the Ross target — saved, but a heads-up), `info` for neutral notices. Tone is chosen at the call site; the copy stays in `lib/copy.ts` (the inline `HistoryView` "Correction saved" string moved into a new `correctionSavedToast`, plus `saveFailedToast` + a `SAVING` label — no new phrasing invented).
- [x] **Promise/loading toasts with a threshold** — `notify.promise(save, { loading, success, error })` shows a loading toast **only if the save is still pending after ~150ms**, then swaps that same toast to success/error. Instant mock saves go straight to success (no flash); Convex network saves show loading → success/error as one toast. Wired into every one-shot save (daily / feed / weights / allocation / houses) and the `HistoryView` correction (write + two re-fetches). The novel threshold logic is unit-tested (`test/notify.test.ts`, `vi.mock("sonner")` + fake timers).
- [x] **On-brand + accessible** — themed via our tokens on `[data-sonner-toast]` in `globals.css` (surface + a coloured status glyph matching StatusPill; not Sonner `richColors`), status icons passed through for success/warning/error/info parity; the existing global `prefers-reduced-motion` reset neutralises Sonner's animations; `closeButton` for dismissal.
- [x] **Only true toasts converted** — migrated the 8 existing `toast()` calls and converted the Convex onboarding `FarmData` green "saved" box + red error line (the one inline-confirmation masquerading as a toast) to Sonner. The 6 persistent `<Alert>`s (allocation prompt, on-track empty state, live reconciliation flag, over-capacity block, allocation done-state, round-complete summary) and the deliberate echo-back UX (`SavedCard`, the review→confirm card) **stay** — they're standing page state, and inline field validation stays inline.

> **Toast decision.** The app had already migrated its action feedback to a toast layer, so "replace all alerts" meant *don't* gut the deliberate persistent surfaces — every remaining `<Alert>` is the standing half of a persistent+toast pair. `warning` earns its place on the two caveated saves (the record saved fine, but the data needs a look) while the detailed live flag stays in the persistent reconciliation Alert. The threshold on `notify.promise` is what makes "loading → success/error in one toast" honest across both seams — the instant mock never flashes a loading state, the Convex network path does. Headless caveat as ever (Convex env gates the app here): covered by `tsc`, `npm run build`, lint (FarmData `any`-count unchanged) and the notify unit test; a browser pass (top-right, on-brand tints, dismissable, loading only on slow saves) follows once a Convex dev URL exists.

**Button rebuilt as the dot-expand system**
- [x] **Dot-expand motion sharpened to match the reference** — the hover reveal is now the reference's full choreography: the small resting dot **grows into the arrow-circle** (padding wraps a glyph that animates `size-0` → target), the glyph **scales up + slides in**, the pill's **left padding pulls in** (`hover:pl-*`, `padding` added to the transition), and the glyph **rotates -45° on press** (`group-active:-rotate-45`). Brand colours + per-action icons unchanged; single-file change, all 22 call-sites untouched; reduced-motion snaps to the end-state via the global reset.
- [x] **`components/ui/Button.tsx` rebuilt around the dot-expand pattern** — a pill with a leading dot that expands into an action glyph on hover (the reference move), **re-coloured to the Horizon brand via tokens only** (no raw hex, no `neutral-200`/`black`). Full matrix: `variant` primary / secondary / ghost / danger × `size` lg 52 / default 44 / sm 36 (grower screens use `lg`); all `rounded-pill`. States: hover (pill deepens / secondary+danger invert light→dark), `active:scale-[0.98]`, `focus-visible:rounded-pill` (so the global ring hugs the pill), `disabled` (token greys), `loading` (spinner in the dot slot + `disabled` + `aria-busy`). `iconOnly` circular variant (requires `aria-label`). The hover transition is neutralised by the global `prefers-reduced-motion` reset — the end-state is a static, legible icon.
- [x] **Context-appropriate affordance, not just an arrow** — `affordance?: IconComponent | null` picks the glyph that fits the action (default `IconArrowRight`; `null` = plain pill). Convention: go/navigate → arrow-right, save/confirm → check, add → plus, back/cancel → arrow-left, reset/retry → refresh, send → send, log in/out → login/logout. All glyphs come from the central `@untitledui/icons` re-export module (`components/icons.tsx`, extended with `IconArrowLeft`/`IconRefresh`/`IconSend`/`IconLogin`/`IconLogout`), never `react-icons`.
- [x] **`inverse` prop for dark surfaces** — the marketing hero sits on `brand-900`/`brand-700`, where the light variants have no AA-safe mapping; `inverse` swaps each variant for an on-dark set (primary → filled light pill, secondary → outline, ghost → subtle text) using the white-with-alpha glass idiom the landing already used. Keeps the system honest instead of fighting `cn` (a plain join, not tailwind-merge) with `className` overrides.
- [x] **Every action CTA migrated; true controls kept bespoke** — converted the raw `<button>` CTAs across `app/signin`, `components/onboarding/*` (+ `FarmData`), `components/marketing/Landing.tsx`, `components/forms/*` (daily/feed/weights/house-setup/treatments), `components/history/*`, `components/batches/PreviousBatchesTable.tsx`, `components/flock/*`, the role guards, `SignOutButton` and `app/app/error.tsx` to the new `Button`. **Left bespoke** (their own patterns, not the CTA pill): `aria-pressed` segmented toggles / chips, the `Stepper` +/−, sidebar nav + collapse chrome, table sort / drag-reorder headers, disclosure toggles, icon-only row chrome (trash / view / correct), full-row table navigation, and the dependency-free `app/global-error.tsx`.

> **Button decision.** Grilled the "arrow everywhere" instinct before applying it: a right-arrow reads as "proceed", which is wrong on a *save*, a *back*, a *reset* or an *add* — so the affordance is per-action (the dot still expands, but into the glyph that matches the verb) rather than omitted where it doesn't fit. Scope is **action buttons only**: anything that's really a *control* (a toggle, a stepper, a sort header, a disclosure) keeps its own affordance and stays bespoke, because forcing them into a CTA pill would misrepresent what they do. Dark-surface CTAs get a first-class `inverse` treatment rather than `className` patches, since `lib/cn` is a plain join and can't reliably override a variant's colours. Standing headless caveat (Convex env gates the app here): covered by `tsc`, `npm run build`, lint (changed files) and the full unit suite (71 green); a browser pass (pill shape + brand colour per variant/size, the dot expanding to the right glyph, focus ring hugging the pill, ≥52px `lg` targets, disabled/loading, AA contrast, reduced-motion) follows once a Convex dev URL exists.

**Sidebar restyled — Framer-Motion `layout` collapse, nested IA preserved**
- [x] **Animated full ↔ rail collapse** (`components/shell/AppShell.tsx` + `SidebarNav.tsx`) — the desktop rail now morphs with **Framer Motion** (`motion` / `motion/react`, new dep): the `<aside>` is a `motion.aside` animating `width` (~224px panel ↔ 76px rail), and inside a `LayoutGroup` every group + item carries `layout` so rows **glide** to their new positions instead of snapping. Labels + the brand wordmark fade/slide via `AnimatePresence`; group headings collapse to a hairline in rail. Motion character matches the app (`--ease-out` curve, ~220ms, no bounce — crisp for a dashboard).
- [x] **Nested IA kept (not flattened to the reference's flat list)** — groups survive in **both** modes as one **stable DOM tree** that morphs (items never reparent, so `layout` stays clean). Rail renders each group as an icon cluster fenced by a hairline. **Rail shows every item**, overriding per-group disclosure (rail has no chevron, so no destination may become unreachable); the persisted per-group open/closed state applies in full mode only.
- [x] **Bottom-pinned "Hide" toggle** — one control replaces the old top-right + bottom collapse buttons: a bottom-pinned row (`⟨ Hide` in full, a centred chevron rotated 180° in rail), account block (`SignOutButton` / demo note) sits just above it. `active:scale-[0.98]` press feedback; the chevron rotates on state.
- [x] **Live notification badge** — `NavItem` gained a declarative `badge?: BadgeSource` (source key, not a number); the manager's **Alerts** item resolves a live count through `lib/data` (`BADGE_FETCHERS.alerts → getAlerts().length`), polled ~30s and fetched **only** for roles whose nav has a badge (contractor/supervisor fetch nothing). Renders a count pill in full, a **corner dot** in rail, **hidden at 0**; the count rides in the item's `aria-label` (pill/dot `aria-hidden`), so it's number + shape, never colour-only. Becomes a Convex reactive query later (one-line swap, polling drops away).
- [x] **Accessible + reduced-motion + no load-flash** — `aria-current="page"` on the active item, `aria-expanded` on group disclosure, native keyboard nav + the global `:focus-visible` ring, rail tooltips reachable on hover **and** focus. `useReducedMotion()` (via `MotionConfig reducedMotion="always"`) strips movement while keeping legibility — the global CSS reset alone can't stop JS-driven Framer motion. Animation is gated on the user's **first toggle** (not a `setState`-in-effect mount flag, which the repo's lint forbids), so `usePersisted`'s hydration correction never animates a collapse on page load. Mobile is untouched: below `md` there's no rail — the hamburger still opens the off-canvas drawer.

> **Sidebar decision.** Grilled how the reference's *flat-list* `layout` motion maps onto our *nested* IA before building. The answer was **one stable tree that morphs**, not a cross-fade of two trees and not a flattened rail: keeping the same DOM in both modes is exactly what lets Framer's `layout` glide items cleanly, and it honours "keep our IA." Two adaptations fall out of the rail having **no disclosure affordance** — it shows every item (reachability beats respecting a hidden-group preference you can't undo there), and group headings become hairlines rather than vanishing. Per emil-kowalski's rule that *frequent* list-navigation shouldn't be animated, the active highlight is a **static** background (it only glides when the rail itself collapses), avoiding motion on every nav click. Badges are wired **live** but only for roles that have one, and stay honest (no invented counts; hidden at zero). Standing headless caveat (Convex env gates the app here): covered by `tsc`, `npm run build`, lint (changed files) and the full unit suite (71 green); a browser pass (glide vs. snap, label fade, heading→hairline, brand mark swap, bottom Hide toggle, rail tooltips on hover+focus, manager Alerts pill/dot hidden-at-zero, reduced-motion instant, mobile drawer intact) follows once a Convex dev URL exists.

**Vibrance pass — Horizon blue retired for a crimson + near-black + cyan system**
- [x] **New brand system, tokens only** (`app/globals.css`) — the whole re-theme is a one-file change: re-pointed the `--brand-*` ramp to **crimson** (anchored on the vivid `#E01A4F`; `brand-700 #D4164A` primary, `brand-900 #0C090D` near-black for bands/ink) + a new **cyan `--accent-*`** ramp (data/focus/info) + a `--wash` token, vibrant **`--chart-1..6`**, brighter `--paper #FAF8F4`, deeper `--ink #0C090D`, cyan `--ring-focus`, and bolder type helpers (display/h1 → **800**, h2 → 700). Because components lean on `brand-*`/helper tokens, almost everything re-coloured with **no call-site edits**.
- [x] **Every new step is AA-verified** — computed WCAG contrast for each real pairing: white-on-`brand-700` 5.2:1, `brand-700` on white 5.2:1 / on the `brand-50` tint (active-nav) 4.7:1, `ink` on `paper` ~18:1, cyan **`accent-700`** text/focus 5.0:1 (the light `#53B3CB` is fills-only at 2.4:1, so text/focus use the dark step). Chart palette run through the **dataviz validator** (colour-blind separation + ≥3:1 on surface all PASS), ordered to lead with band-safe hues so a line stays legible over the green/amber/red status bands.
- [x] **Status stays reserved; crimson can't masquerade as error** — green/amber/red untouched; `Button` `danger` + all error UI stay on **status-red**; the `Alert` `info` variant moved from the (now-crimson) brand tint to the **cyan** accent tint; coral `#F15946` + gold live in **charts only**. Off-token `rgba(11,42,74,…)` washes/shadows tokenised (`--wash`, ink-tinted depth); `themeColor` + the dependency-free `global-error` crash screen retinted to the new palette.
- [x] Docs updated: `docs/brand-guidelines.md §3` rewritten (blue retired), this changelog + the `§6` token block refreshed.

> **Vibrance decision.** The user supplied a 5-swatch palette, but **three of the five sat in the reserved status red/amber hues** — so adopting it wholesale would have broken the "status stays reserved / accent stays clear of status / AA / colour-blind-safe" rules the user themselves set. Grilled that collision first and landed on a **guarded** system: the two status-safe swatches (near-black, cyan) + one warm signature (crimson, kept magenta-leaning and *never* used as error) become the UI; coral + gold are quarantined to charts where no status semantics apply. Blue was **retired** (the user found it generic), crimson made primary but held to a **confident accent on a light, white-dominant canvas** (crimson-drenched would read as constant alarm — wrong for a "calm, never alarmist" farm tool). Contrast wasn't eyeballed: the crimson/cyan steps were picked by **computing WCAG ratios** and the chart set by **running the dataviz validator**. Standing headless caveat (Convex env gates the app here): covered by `tsc`, `npm run build`, lint and the full unit suite (71 green); a browser pass (vibrant-not-dark, info-cyan vs error-red unmistakable, status pills unchanged, charts legible over bands, AA holds, bolder type) follows once a Convex dev URL exists.

**Monochrome + azure re-theme — crimson retired for a black-and-white base with one accent, light + dark**
- [x] **Two-mode token system, one file** (`app/globals.css`) — added `@custom-variant dark (&:where(.dark, .dark *))`; `:root` holds the **LIGHT** (default) values and a new `.dark` block the **near-black greyscale** overrides. Re-pointed `--brand-*` from crimson to an **azure** ramp (folded the old cyan `--accent-*` onto the same azure) and flipped the neutral ramp (`ink/slate/muted/hint/border/divider/paper/surface`) per mode. Because components read semantic tokens, the whole app re-themes with almost no call-site edits. **Rule: fills use `brand-700` (deep, constant, white-text AA); accent text uses `brand-600` (brightens to `#38BDF8` on dark)** — so the app-wide `text-brand-700 → text-brand-600` normalisation keeps links/figures legible after the flip.
- [x] **Dedicated inverse/dark-chrome tokens** — `--canvas-invert / --surface-invert / --on-invert / --on-invert-dim` for chrome that is intentionally dark in *both* modes (marketing hero, FinalCta band, dense table headers, the sidebar tooltip, the drawer scrim). Repointed every such island off `brand-900/brand-100` (which don't survive the flip) onto these, fixing the "silent traps" (`bg-ink/40` scrim + `bg-ink` tooltip would have gone *white* on dark; `text-brand-900` on tints would have vanished).
- [x] **Light/dark toggle, persisted, no-FOUC** — `.dark` class on `<html>`; `lib/useTheme.ts` (`useSyncExternalStore`, no setState-in-effect) + a `ThemeToggle` in the sidebar footer and the landing nav; an inline `<head>` script applies the stored theme before paint (light default rendered instantly).
- [x] **Every chart on the shadcn primitive, vibrant per mode** — `HistoryChart`, `WeightBandChart`, `CompareChart` moved onto `ChartContainer`/`ChartTooltip`(+`Content`) with config-driven `--color-<key>` series (joining `ProjectionChart`); `--chart-1..6` kept vibrant and **retuned for near-black** (dataviz validator: CVD + ≥3:1 on both surfaces PASS). Band fills use the per-mode status tints; the primary actual/projected metric line uses the azure accent.
- [x] **AA-verified both modes** — body ink ~19:1 (light) / ~18:1 (dark), muted ≥ 4.5:1, white-on-`brand-700` 6.2:1; `Alert` `info` folds onto the azure tint; `global-error` crash screen + `themeColor` retinted (light default). `tsc` + `npm run build` + lint (changed files clean) + full unit suite (71 green).
- [x] Docs updated: `docs/brand-guidelines.md §3`/`§6` rewritten to the monochrome+azure two-mode system; this changelog + the `§Design` token block refreshed.

> **Re-theme decision.** The user wanted "black and white like X's dark mode, still vibrant on the graphs, a vibrant colour on the major CTA." Grilled the direction before building and locked: **neutral near-black** greyscale (not pure black, not blue-tinted) for the dark base; **azure** as the single accent (green excluded — collides status-good); accent reach = **CTAs + links + focus + active/selected only**; a **light/dark toggle with light as default**; and **both modes redesigned as the same monochrome+azure system** (crimson retired from *both*, not just dark). The token discipline already in place made this mostly a `globals.css` retune under `.dark` plus a finite fix-list; the one structural subtlety — `brand-700` fills can't brighten on dark without breaking white-on-fill AA, but accent *text* must — is resolved by splitting fill (`brand-700`, constant) from text (`brand-600`, flips). Standing headless caveat (Convex env gates the app here): covered by `tsc`/`build`/lint/tests; a browser pass (toggle + no-flash, azure only where decided, charts vibrant + shadcn tooltips in both modes, dark islands legible, status pills intact) follows once a Convex dev URL exists.

**Landing hero — WebGL "eggpit" (Ballpit restyled as floating eggs)**
- [x] **Decorative Three.js eggs behind the hero** (`/`) — ported the React Bits Ballpit engine to TS (`components/marketing/eggpit/engine.ts`, `three@0.185`) and restyled it as tumbling **eggs**: the shared `SphereGeometry` is **vertex-deformed once** into a true egg (elongated + one end tapered, normals recomputed), each instance gets a **fixed random orientation** composed into its matrix, and a warm matte `MeshPhysicalMaterial` + warm lights make them read as eggs, not plastic. Hero baseline `count:50, gravity:1, friction:0.928, wallBounce:0.85, followCursor`. Collisions stay **sphere-based** (accepted approximation — physics untouched).
- [x] **Egg colours from tokens, clear of status** — new `--egg-white/cream/tan/brown/brown-deep` in `globals.css` (earthy, **saturation ≤ 51%** vs status-warn amber's 100%, verified distinct from the reserved amber/red/green); the canvas reads them from CSS vars at runtime, so **no raw hex** lives in the component and a re-theme stays one-file.
- [x] **Gated, lazy, disposable** — WebGL mounts only when capable (not reduced-motion, desktop-class width + fine pointer, `hardwareConcurrency ≥ 4`, WebGL present); `three` is **code-split behind `dynamic(ssr:false)`** and loads only then (verified: `three` sits in its own lazy chunk, not the landing bundle), so **phones never download it**. `IntersectionObserver` pauses the RAF loop off-screen; full `dispose()` (renderer/geometry/material/listeners/context) on unmount. Gate read via `useSyncExternalStore` (no `setState`-in-effect — the repo's lint forbids it) so SSR renders the fallback with no hydration mismatch.
- [x] **Fallback + a11y + readability** — reduced-motion / mobile / no-WebGL fall back to the hero's existing blur+LogoMark motif (no new asset). The canvas is `aria-hidden` + `pointer-events-none` (never traps focus, never blocks the CTAs); a scrim gradient + a subtle text-shadow keep the white headline/CTAs AA-legible if a pale egg drifts behind. `three`/`@types/three` added; `tsc`/`lint`/`build`/tests (71) green.

> **Eggpit decision.** Grilled the two real forks before building. **Shape:** the Ballpit has no shape prop and its balls are one shared `SphereGeometry` in an `InstancedMesh` — so both a scale-to-ovoid and a true vertex-deform are one-time edits to that shared geometry (identical runtime cost, neither touches the sphere collisions). Chose the **true vertex-deform egg** for a real asymmetric silhouette; the only added work is recomputing normals. **Fallback:** rather than ship a new poster asset, gate WebGL to capable desktops and reuse the hero's existing static motif everywhere else — and crucially lazy-load `three` *behind* that gate so low-power devices never pay for a bundle they won't render. The one colour trap (a tan/brown egg reading as the reserved status-warn amber) was closed by **measuring HSL** and keeping every egg tone low-chroma. Standing headless + no-WebGL caveat here: covered by build + type/lint + the code-split check; the visual pass (eggs read as eggs in warm light, tumbling orientation, readable CTAs, mobile motif, reduced-motion static) follows once a Convex dev URL + a real browser exist. If the sphere-collision approximation looks wrong there, flag it — don't rewrite the physics.

**Marketing landing built out — full story, honest, mobile-first**
- [x] **`/` is now a full marketing page** (keeps the egg hero) — Hero → Problem → Wedge → Who it's for → Catch it early → How it works → Trust → FAQ → final CTA. Every CTA is the dot-expand `Button`; tokens only; heading hierarchy (one `<h1>`, `<h2>` per section); FAQ uses native `<details>` (keyboard). All copy lives in **one editable module** `lib/landingCopy.ts` (typed consts, mirrors `lib/copy.ts`), in the two brand registers (grower plain / contractor data-forward).
- [x] **The wedge shows, doesn't tell** — the **real WhatsApp message reproduced verbatim** (BRD §7.2) beside the exact typed-vs-computed field split (types Day/House/Mortality/Culls/Feed/Chlorine; BatchPilot computes Cull&Mort / CumMort / Cum % / Birds remaining / Site average). **Catch it early** reuses `WeightBandChart` (fed plain `WeightBandData` from the mock `getWeightBandData()` in `app/page.tsx` — no Convex) with the Ross 308 green/amber/red bands + a `StatusPill`.
- [x] **Reused, not reinvented** — `Button`/`Card`/`StatusPill`/`WeightBandChart`/`LogoMark`; a small `Reveal` scroll-reveal (WAAPI on first in-view, **content visible by default** so no-JS/headless/crawlers still see it, `prefers-reduced-motion` skips it, no `setState`-in-effect). Mobile-first single-column stacks; the wedge and role rows collapse; tap targets ≥44px.
- [x] **Honest by construction** — no claim implies BatchPilot reads/parses WhatsApp today: the wedge frames it as "mirror the message + one-tap summary back" with **"two-way capture is on the roadmap"** (deferred, BRD §13/§15); the ~13%-under/day-18 story is a **clearly-labelled illustrative example**; Trust says **"grounded in real field data from an active Irvine's grower (Nhunge, cycle 85)"** and compares against the public **Ross 308 objectives** — never "built with" and never claiming 13% as measured. `tsc`/`lint`/`build`/tests (71) green; `/` renders with no Convex.

> **Landing decision.** Grilled headline, structure, cuts and honesty first. **Headline** names the problem, not the category ("Know a flock's behind on day 18 — not at the kill date"). **Cuts:** the standalone "WhatsApp-native" section was **merged into the wedge** (it repeated the same story and risked implying two-way parsing), and the hero was simplified to one **Get started** + **Log in** (role entries moved into their sections). **Roles** are a compact stacked "Who it's for" (not three full-bleed heroes) to stay light on a cheap Android. The sharpest call was **honesty**: the BRD marks two-way WhatsApp out-of-scope and never states the Ross 308 "13% under" figure, so the page frames WhatsApp as mirror+share-back (two-way = roadmap) and labels the weight story illustrative — matching the "trustworthy, never alarmist" brand rather than overclaiming. Standing headless caveat (Convex-gated app + WebGL can't render here): covered by build + type/lint + reasoning; the visual/mobile pass (story reads top-to-bottom, wedge legible, chart bands + pill, dot-expand CTAs reachable, 375px no h-scroll, reduced-motion static) follows once a Convex dev URL + browser exist.

---

## 9. Explicitly deferred (post-MVP) — and the seam each will use

- **Auth → Convex Auth** (was Clerk) — seam: `<AuthProvider>` / `useCurrentUser()`.
  **In progress** (same branch): auth runs entirely in Convex via
  `@convex-dev/auth` (email + password), so there is no third-party auth service —
  identity and app data share one backend. `convex/auth.ts` (Password provider,
  role captured at sign-up), `convex/schema.ts` (`authTables` + a custom `users`
  table carrying `role` / `siteId` / `contractorId`), `convex/http.ts`,
  `convex/users.ts` (`currentUser`). App side: `ConvexAuthNextjsServerProvider`
  (root layout) + `ConvexClientProvider` (client) + `middleware.ts` gating
  `/app` → `/signin`; the `/signin` route is a real email+password sign-in /
  sign-up with the grower(Supervisor/Manager)/contractor role picker.
  `useCurrentUser()` keeps its shape — it returns the signed-in Convex user when
  connected, and falls back to the demo role switcher when `NEXT_PUBLIC_CONVEX_URL`
  is unset. The **maker-checker** trail is now attributed to the authenticated
  user server-side (`getAuthUserId` in `submitManagerEdit`), no longer spoofable.
  **Multi-tenant onboarding — stage 1 (identity loop):** no demo tenant is
  assigned any more (a fresh account is blank). A contractor signs up self-serve
  (their own org); supervisors/managers are **invite-only**. `convex/tenancy.ts`
  (`createFarm`, `inviteManagers`, `myWorkspace`) + an `invites` table + the auth
  `afterUserCreatedOrUpdated` hook match a sign-up email to its invite and stamp
  role + farm. `components/onboarding/Onboarding.tsx` is the `/app` home when
  Convex is connected: contractor creates farms + invites supervisors, supervisor
  invites managers, each lands on their own (blank) farm. `npx convex run seed:clear`
  blanks the demo. **Stage 2a (done):** the grower configures the farm on Convex
  from the onboarding home — houses (`setHouses`) + a growing cycle
  (`startCycle`: batch + per-house placements), with farm-scoped unique ids.
  **Stage 2b (done):** supervisor daily capture (`writes.submitDailyUpdate`,
  tenant-guarded) + a live manager review panel, both on the reactive
  `farm.farmData` query — a saved round shows up live on the manager's screen.
  **Stage 2c (next):** the full analytics dashboard (projections, weight-vs-Ross
  curve, alerts, efficiency) and the contractor portfolio, per farm; the nav
  routes other than the home still show the mock demo until then.
- **Database + realtime → Convex** — seam: `lib/data/*`. **In progress** (branch
  `claude/convex-integration-setup-g02tm5`): backend scaffolded — `convex/schema.ts`
  (every operational entity, app id kept as indexed `extId`), `convex/seed.ts` +
  `convex/seedData.json` (a byte-identical snapshot of the mock demo),
  `convex/reads.ts` (`getDataset`, one reactive query) and `convex/writes.ts`
  (daily / feed / weights / manager-edit / saveHouses / confirmAllocation
  mutations, re-deriving the cumulative chain). `<ConvexClientProvider>` wraps
  the app (root layout) and is a no-op until `NEXT_PUBLIC_CONVEX_URL` is set.
  Runbook + the
  screen-by-screen realtime conversion recipe: **`docs/CONVEX.md`**. Static
  reference (Ross curve, vaccination schedule, demo users) stays in code.
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
