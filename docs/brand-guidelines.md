# BatchPilot — Brand & Product Design Guidelines (agent reference)

Agent-readable version of the brand guideline. The visual system carries over from the original
"Coopilot" guideline; the product name is now **BatchPilot**. Build tokens live authoritatively in
`globals.css` (seeded from `ROADMAP.md §6`); this file is the rationale + the rules + the voice.

---

## 1. Foundation

**Positioning.** BatchPilot turns the daily work of rearing chickens into clear, confident decisions —
telling every grower how their flock is doing and what to do next, while giving contractors a live,
trustworthy picture of their whole network.

**Personality.** Trustworthy (calm, accurate, never alarmist) · Practical (built for one hand, bright
sun, a thumb — answers "what now?" before it shows a chart) · Approachable (warm, plain language, big
friendly controls) · Locally rooted (designed around Zimbabwean farms, without tractor/leaf/"Africa"
clichés).

**Tone, one line:** "A knowledgeable colleague standing next to you in the chicken house — clear, calm,
and on your side."

---

## 2. Logo

Two ascending chevrons — a rising trajectory and a roofline at once. Purely geometric (no bird, leaf or
tractor), so it's credible to contractors, sharp at 16px, and reproducible as one flat colour for
theming. Lockups: horizontal (mark + "BatchPilot"), stacked, app icon, round avatar, reversed (on dark),
mono. Clear space ≥ half the mark height. Min size 24px icon / 100px lockup; below that use the icon
alone. Never: stretch/distort, recolour to status colours, rotate, or add shadows/busy backgrounds.

---

## 3. Colour

Brand colour is **Horizon blue** — the only colour that ever changes per white-label client, and it must
stay clear of the green/amber/red status system.

**Brand — Horizon (themeable):** `brand900 #0B2A4A` · `brand700 #14487E` (primary) · `brand600 #1A5B9C`
(hover) · `brand500 #2474C4` (accent/link) · `brand100 #DCEAF7` (tint) · `brand50 #EEF5FC` (surface).

**Neutrals — warm grey (fixed):** Ink `#1B1E23` · Slate `#44474E` · Muted `#6B6F76` · Hint `#9499A1` ·
Border `#C9CDD3` · Divider `#E4E7EA` · Paper `#F4F2ED` · Surface `#FFFFFF`. Body text is Ink on Paper
(13.8:1 — readable in direct sun).

**Status — fixed & reserved (never used for branding):** Green `#1F7A3D` (on track) · Amber `#C77800`
(at risk) · Red `#C62828` (needs attention). Each also has an AA-safe tint for badges. **Status is never
communicated by colour alone** — always colour + icon (`✓`/`△`/`!`) + word + shape (`●`/`▲`/`■`).

**Themeable:** brand scale, logo/name, accent. **Fixed:** status colours, neutrals, type, spacing, radius,
icon style.

---

## 4. Typography

- **Plus Jakarta Sans** — display, headings, logo. Weights 600–800.
- **IBM Plex Sans** — body, UI, labels. Weights 400–600. Tall x-height, legible in glare.
- **IBM Plex Mono** — data, metrics, codes. Tabular figures so numbers align and 0/O never blur.

Scale (mobile-first): Display 32/700 · H1 26/700 · H2 21/600 · H3 18/600 · Body-L 17/400 · Body 15/400 ·
Label 14/500 · Data 15/500 (mono). Body never < 15px; tappable text ≥ 16px.

---

## 5. Iconography & imagery

Icons: 24px grid, 2px stroke, round caps/joins, no fills; geometric, minimal interior detail (sharp at
20px in glare). Two-tone reserved for status icons only. Many supervisors read little English — a clear
glyph is often the primary label, so pair messages with icons. Imagery: prefer icons/flat illustration;
any photos are real, documentary, working farms — never staged stock, no gradients, no "Africa" clichés,
no tractors. Always ship a solid-colour offline fallback.

---

## 6. Components

- **Buttons:** Large 52px / Default 44px / Small 36px. Grower screens use Large only (clears the 44px tap
  minimum with room for gloves). Primary = brand700 on white; secondary = brand50/brand100; ghost; danger
  = red tint; disabled = divider/hint.
- **Inputs:** 52–64px tall. Numeric entry on grower screens uses a **big +/− stepper**, not a keyboard
  (low-literacy, gloved, in-sun). Focused state = brand500 ring.
- **Status indicator (signature component):** card with `FLOCK · DAY` header, a pill (tint bg + status
  colour + icon + word + shape), and a plain-language line ("Feed is below target. Check the feeders.").
- **Alerts:** info (brand tint), success (green tint), warning (amber tint), error (red tint); icon +
  bold title + plain line.
- **Data table (contractor):** dark Horizon header row, mono tabular numbers, status pills, dense rows.

---

## 7. Voice & tone

One brand, two registers; always calm, honest, on-your-side.

- **To growers:** short sentences, everyday words, lead with the action ("Add feed."), warm and never
  blaming, pair with an icon, localise to Shona/Ndebele where possible.
- **To contractors:** precise and data-forward (give the figure), neutral and professional, name the
  house/metric/timeframe, recommend the action then the reason; industry terms fine (FCR, curve, intake).

**Microcopy examples**
- Feed-low — grower: "Feed is a bit low today. Check the feeders and top them up if you can." ·
  contractor: "House 1 feed intake is 12% below curve at day 18. Review feeder calibration."
- Empty state — grower: "No record for today yet. Tap the big blue button to add today's numbers." ·
  contractor: "No data for this flock yet. Records appear once the supervisor submits day 1."
- Save failed — grower: "That didn't save. Your numbers are safe — tap Save to try again." ·
  contractor: "Submission failed — no connection. Entry saved locally; it will retry to sync."

---

## 8. Accessibility (treated as survival, not compliance)

- WCAG 2.1 AA minimum: body ≥ 4.5:1, UI/large text ≥ 3:1 (most pairings exceed 7:1).
- Grower tap targets 52–64px with ≥ 8px spacing (gloves).
- Status = colour + icon + word + shape (works in greyscale and for colour-blind users).
- 15px body floor; 16px+ on anything tappable; respect OS text scaling and `prefers-reduced-motion`.

**Do:** keep brand blue clear of green/amber/red · show status with an icon + word always · use the big
stepper · write the action first, the reason second · define new colours as tokens.
**Don't:** theme in green/yellow/red · signal status by colour alone · use thin type or grey-on-grey for
key data · hide actions behind tiny unlabelled icons · lean on heavy gradients/shadows/photos.
