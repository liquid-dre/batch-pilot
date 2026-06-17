# TESTING.md — find & test everything in BatchPilot

A plain-language map of every feature that is actually built, where it lives, how to reach it,
and how to tell it's working. Written for someone who is **not** a developer. Keep this file
current as features change.

---

## Before you start

1. **Run the app.** In a terminal, from the project folder:
   ```
   npm install      # first time only
   npm run dev
   ```
   Then open **http://localhost:3000** in a browser.

2. **There is no login yet.** A **role switcher** stands in for it. The app has two "registers":
   - **Grower** — the farm supervisor who records daily numbers (the calm, big-button screens).
   - **Contractor** — the company that supplies chicks/feed and collects birds (the dense, data screens).

3. **How to switch role at any time:** look at the **bottom of the left sidebar** (desktop) — a
   **Grower / Contractor** toggle. On a narrow screen, open the menu with the **☰** button top-left first.
   The landing page CTAs also set your role (see below).

4. **The data is fake (mock) and resets on page reload.** Nothing is saved to a database. Forms show
   you the result ("echo-back") but don't persist. The demo is anchored to a fixed "today", and the
   headline story is deliberate: the reference flock (**Murray Downs**, Cycle 85) is running **~13% under**
   the Ross 308 target weight, so you'll see lots of amber/red — that's intended, not a bug.

5. **Reading status:** every status is **colour + icon + word + shape** — green tick‑circle "On track",
   amber triangle "At risk", red alert‑circle "Needs attention". If you see all three cues, that's correct.

---

## Shared / Landing

### Marketing landing page
- **What:** The public home page — hero, value props, two "register" cards, calls to action.
- **Route:** `/`
- **Click-path:** open **http://localhost:3000**
- **How to test:**
  1. Confirm the hero headline ("Run the flock by the numbers, not by feel.") and three value cards render.
  2. Click **Get started** or **Log in** → you land on the **grower** Dashboard at `/app`.
  3. Go back to `/`, click **"Seeing this for a contractor? View the portfolio →"** (or **Open the contractor view**) → you land on the **contractor** Overview.
- **Status:** ✅ working

### App shell — collapsible sidebar (desktop)
- **What:** Left navigation. Full panel ↔ slim icon rail; remembers your choice.
- **Route:** present on every `/app/*` screen
- **Click-path:** enter the app → click the **«** (collapse) / **»** (expand) control near the bottom of the sidebar.
- **How to test:** collapse it → labels disappear, icons remain, hovering an icon shows a tooltip; reload the page → it stays collapsed.
- **Status:** ✅ working

### App shell — mobile drawer
- **What:** On a narrow screen the sidebar becomes an off‑canvas drawer opened from a top bar.
- **Click-path:** shrink the browser to phone width (or use device emulation) → tap **☰** top-left.
- **How to test:** drawer slides in over a dimmed background; tap the scrim, press **Esc**, swipe left, or pick an item → it closes.
- **Status:** ✅ working

### Role switcher
- **What:** Toggles the whole app between Grower and Contractor (the stand-in for login).
- **Click-path:** sidebar footer ▸ **Grower / Contractor**
- **How to test:** switch to Contractor → the nav items and the `/app` home both change to the contractor set. Switch back → grower screens return.
- **Status:** ✅ working (this is a demo stub for real auth)

### Empty / loading / error / 404 states
- **What:** Branded skeletons while data loads, a calm retry screen on error, a branded 404.
- **How to test:** visit a nonsense URL like `/app/does-not-exist` → branded "not found" page. (Loading skeletons flash briefly on slow navigations.)
- **Status:** ✅ working

---

## Grower

> Switch the role to **Grower** first. All grower screens are role‑gated: if you open one while in the
> Contractor role you'll see a calm "This is a grower screen — Switch to Grower" prompt instead.

### Dashboard ("what now?")
- **What:** The grower's single home screen — greeting, projection, weight‑vs‑Ross hero chart, top alerts, site rollup, efficiency, and a status card per house.
- **Route:** `/app`
- **Click-path:** Log in (grower) → you're already here (sidebar ▸ **Dashboard**).
- **How to test:**
  1. Confirm the greeting ("Good morning, John."), the **Add today's numbers** button, and the **"Weight against the Ross curve"** band chart all render.
  2. Confirm the per‑house cards at the bottom show colour + icon + word status (mostly amber/red here).
  3. If a new cycle is waiting, a blue **"Cycle 86 is ready to allocate"** banner appears with an **Allocate** button.
- **Status:** ✅ working

### Daily update (the core wedge)
- **What:** Record per house — birds dead, culls, feed added, optional temperature — and it auto‑computes cumulative losses, %, birds remaining and the site average, with an echo‑back to confirm before saving.
- **Route:** `/app/daily`
- **Click-path:** sidebar ▸ **Records ▸ Daily update** (or the **Add today's numbers** button on the Dashboard).
- **How to test:**
  1. Pick a house chip, set **Birds found dead** with the +/− stepper (or type a number), set feed, tap **Review today's numbers**.
  2. The blue review card should restate your figures and show computed **Lost today / Total losses / Birds remaining / Site mortality now**.
  3. Tap **Confirm & save** → a toast confirms, and that house's chip turns green with a tick. Do all houses → a green "All houses recorded for today" banner appears.
- **Status:** ✅ working (computes live; does not persist after reload)

### Feed deliveries
- **What:** Log a feed delivery (type, bag size, bag count, weighed net) and flag when the weighed net differs from the nominal bag total.
- **Route:** `/app/feed`
- **Click-path:** sidebar ▸ **Records ▸ Feed deliveries**
- **How to test:** enter a bag size + count, then a net weight that's off by more than ~1% → a reconciliation flag appears; the delivery joins the recent‑deliveries list.
- **Status:** ✅ working

### Weights
- **What:** Record average weight, ADG, growth ratio and uniformity per house, compared live to the Ross 308 target with a status pill.
- **Route:** `/app/weights`
- **Click-path:** sidebar ▸ **Records ▸ Weights**
- **How to test:** enter an average weight for a house → it shows the comparison vs the Ross target for that day and a green/amber/red pill.
- **Status:** ✅ working

### History & charts
- **What:** Day‑by‑day tables (per house and the batch rollup) plus charts — daily mortality %, cumulative mortality %, feed, weight vs Ross, FCR — with house/metric toggles and a day‑range + house filter.
- **Route:** `/app/history`
- **Click-path:** sidebar ▸ **Analytics ▸ History & charts**
- **How to test:** switch the metric toggle (e.g. to "Weight vs Ross") and change the house filter / day range → the chart and table update together.
- **Status:** ✅ working

### Batch comparison
- **What:** Pick several batches (past + current) and overlay their curves aligned by day of cycle, plus a per‑batch summary table.
- **Route:** `/app/compare`
- **Click-path:** sidebar ▸ **Analytics ▸ Batch comparison**
- **How to test:** select two or more batches → their lines overlay on the chart with the Ross reference; the summary table lists final/current weight, vs‑Ross, mortality, FCR per batch. With none selected you get a guiding empty state.
- **Status:** ✅ working

### Houses (setup)
- **What:** Add/remove houses and set each capacity; total capacity is summed automatically; names and positive‑integer capacities are validated.
- **Route:** `/app/houses`  (the old `/app/houses/setup` link redirects here)
- **Click-path:** sidebar ▸ **Setup ▸ Houses**
- **How to test:** add a house, give it a name + capacity → the total updates; remove a house with the trash icon; try a blank name or a non‑positive capacity → it's rejected.
- **Status:** ✅ working (changes don't persist after reload)

### Allocate a cycle
- **What:** For a planned batch with a total bird count but no per‑house split, recommend a distribution (proportional to capacity), let the grower adjust, then confirm to surface per‑house day‑counts.
- **Route:** `/app/houses/allocate`
- **Click-path:** sidebar ▸ **Setup ▸ Allocate a cycle** (or the Dashboard **Allocate** banner)
- **How to test:** open it → a suggested split across houses is shown; adjust a number, confirm → it reports the per‑house allocation. (After confirming, the Dashboard banner clears until you reload.)
- **Status:** ✅ working

### Alerts
- **What:** A dedicated list of houses the status engine has flagged, worst first, each with a plain‑language cause and what to do next.
- **Route:** `/app/alerts`
- **Click-path:** sidebar ▸ **Alerts** (or **"All alerts →"** on the Dashboard)
- **How to test:** confirm red items sort above amber, and each row carries a cause + a fix in grower voice.
- **Status:** ✅ working

---

## Contractor

> Switch the role to **Contractor** first (sidebar footer toggle). Contractor screens are role‑gated the same way.

### Overview (portfolio rankings)
- **What:** The contractor home — every active flock as a dense, EPEF‑ranked, sortable table with status pills and a projected‑ready‑vs‑kill‑date verdict.
- **Route:** `/app`  (the old `/app/portfolio` link redirects here)
- **Click-path:** switch to Contractor → you're already here (sidebar ▸ **Overview**).
- **How to test:**
  1. Confirm the ranked table renders with mono/tabular numbers and status pills.
  2. Click a column header → the table re‑sorts; the rank column stays stable.
  3. Click a row → you drill into that grower.
- **Status:** ✅ working

### Growers — ranked overview
- **What:** All of the contractor's growers ranked on a chosen metric (EPEF, FCR, mortality, weight‑vs‑target, on‑time‑to‑kill), with a ranking bar and a "position across the days" trend overlay.
- **Route:** `/app/growers`
- **Click-path:** sidebar ▸ **Growers**
- **How to test:** change the metric selector → the ranking and the trend overlay update. Only this contractor's growers appear (tenant isolation; the second contractor's grower is hidden).
- **Status:** ✅ working

### Grower drill-down
- **What:** Per‑grower detail — per‑house cards with a mortality sparkline, plus a closed‑cycle track‑record table.
- **Route:** `/app/growers/[siteId]` (e.g. `/app/growers/<id>`)
- **Click-path:** sidebar ▸ **Growers** → click a grower (or click a row on the **Overview** table)
- **How to test:** confirm per‑house cards with sparklines render and a back‑link/breadcrumb returns you to the list.
- **Status:** ✅ working

### Collection schedule + vehicle manifest
- **What:** The catching plan — phased night quotas with progress bars — and the authorised‑vehicle/driver manifest with a held count.
- **Route:** `/app/schedule`
- **Click-path:** sidebar ▸ **Collection schedule**
- **How to test:** confirm the night quotas show progress bars and the manifest lists vehicles + drivers.
- **Status:** ✅ working

### Benchmarks
- **What:** The Ross 308 weight curve with the contractor overlay — kill‑day line, each house plotted, and the mortality‑band / uniformity‑target overlay listed.
- **Route:** `/app/benchmark`
- **Click-path:** sidebar ▸ **Benchmarks**
- **How to test:** confirm the curve renders with each house plotted and a kill‑day marker; houses sit in the amber‑to‑red zone (~13% under) by day 28.
- **Status:** ✅ working

---

## Orphaned / unreachable / stubbed — call-outs

- **Legacy redirects (intentional, not broken):** `/app/houses/setup` → `/app/houses`, and `/app/portfolio` → `/app`. They keep old links alive; both land somewhere sensible.
- **Billing plan stub has no screen.** `usePlan()` is wired as a provider (the Stripe seam) but nothing in the UI shows a plan, upgrade, or billing state. There is nothing to click — expected for this build.
- **"Allocate a cycle" is always in the nav, even after allocating.** Once you confirm the split, the Dashboard banner clears, but the **Setup ▸ Allocate a cycle** item stays. Re‑opening it after allocation is a slightly ambiguous state (see recommendations).
- **No persistence anywhere.** Every form (daily, feed, weights, houses, allocate) computes and echoes back but resets on reload. This is by design (mock data), but a first‑time tester can mistake it for a save bug.
- **WhatsApp ingestion, real auth, database, payments, ML projections, offline/PWA** are explicitly **not built** (deferred — ROADMAP §9). Only the seams exist. Don't go looking for them.

---

## Claude Code recommendations

An honest assessment of the biggest remaining flow/clarity gaps and what to do next. None of these are
build‑breaking; the MVP prototype is complete and coherent. These are the things a real pilot user would
trip on.

### Biggest flow / clarity problems
1. **"Saved" looks real but isn't.** The daily/feed/weights flows give satisfying confirmation (green
   chips, toasts, echo‑back), then everything vanishes on reload. In a demo to a grower this reads as a
   bug. Either add a visible "Demo — entries reset on refresh" note on the forms, or persist within the
   session (e.g. localStorage behind the `lib/data` seam) so a walkthrough survives a refresh.
2. **The allocation flow has no satisfying "done" state.** After confirming a split, the **Allocate a
   cycle** nav item remains and re‑entering shows an ambiguous screen. It should either show a clear
   "Cycle 86 allocated" summary (with an option to re‑allocate) or drop out of the primary nav once done.
3. **Role switching is the most important control and the least discoverable.** It sits at the bottom of
   the sidebar; on mobile it's two taps deep inside the drawer. Since it *is* the demo's login, consider
   surfacing the current role more prominently (e.g. a labelled chip near the top) so testers always know
   which register they're in — especially right after the role‑gate "switch" prompt.
4. **The "~13% under Ross" story isn't explained on first contact.** A new viewer sees a wall of amber/red
   and may assume the app is mis‑configured. One sentence of framing on the Dashboard hero ("This is a real
   under‑performing cycle — that's the story") would turn confusion into the intended "aha".

### Half-built / thin spots
- **Feed *consumed* vs *added* is acknowledged but not captured.** FCR/EPEF are estimated from the Ross
  objective and the weight shortfall (per ROADMAP), not from real consumption. This is the single biggest
  fidelity gap in the analytics — flagged in the docs, but worth making visible in‑product (label EPEF/FCR
  as "estimated" wherever shown).
- **Contractor drill‑down depth is uneven.** The Overview → grower path is strong; the per‑house detail is
  lighter than the grower's own Dashboard. Reusing the band chart / efficiency panel there would make the
  two registers feel equally complete.
- **No automated tests.** There is no unit/integration/e2e coverage. The status engine (`lib/engine/`) and
  the derived‑figure maths in the forms are pure functions and the highest‑value, lowest‑effort place to
  add tests — they're exactly the logic a regression would silently break.

### Documentation drift (worth a quick fix)
- ROADMAP §8 still refers to a `TopBar` / `AppFrame` persistent shell; those components were replaced by
  `AppShell` + `SidebarNav` in the IA restructure and no longer exist. Update the Phase‑1 note so future
  readers aren't sent looking for files that are gone.

### Suggested priority order
1. **Add a "demo data resets" affordance** (or session persistence) — removes the #1 "is this broken?" reaction. *(small)*
2. **Give allocation a real done‑state.** *(small)*
3. **Label estimated metrics (EPEF/FCR) as estimated** until consumed‑feed lands. *(small)*
4. **Make the current role more visible** and add one line of framing to the Dashboard hero. *(small)*
5. **Add unit tests for `lib/engine/` and the form maths.** *(medium)*
6. **Deepen the contractor per‑house drill‑down** to match the grower Dashboard. *(medium)*
7. **Fix the ROADMAP TopBar/AppFrame drift.** *(trivial)*

> When the next real feature lands (or the first deferred seam — Clerk/Convex/Stripe/Twilio — is wired),
> update this file: add/adjust the feature's row and revisit the recommendations.
