<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — BatchPilot

Shared instructions for any AI coding agent on this project. `CLAUDE.md` imports this via
`@AGENTS.md`, so Claude Code reads it automatically. Keep it lean. This file tells you **how to
work**; `ROADMAP.md` tells you **what to build**. (Leave the Next.js block above untouched — it is
auto-managed by Next.js.)

## Project facts (fill in / keep what the scaffold detected)
- Dev / build / lint: `npm run dev` / `npm run build` / `npm run lint`  <!-- update if different -->
- Structure: App Router; no src/ dir (app/ at root); alias @/* → ./*; Tailwind v4 (CSS-first, theme tokens via @theme in globals.css)

## Start here
1. **Heed the Next.js block above** — this Next version may differ from your training data; consult
   `node_modules/next/dist/docs/` before writing framework code.
2. Read **`ROADMAP.md`** — the single source of truth for product, architecture, design tokens, data
   model, and the phased feature list with status checkboxes. Work top-to-bottom by phase.
3. Skim the document map below only as needed for depth.

## Document map (`/docs`)
| File | What it is | When to read it |
|---|---|---|
| `ROADMAP.md` (repo root) | Source of truth: scope, architecture, tokens, data model, phased checklist | **Always, first** |
| `docs/BRD.md` | Full product spec & rationale (real field data, the WhatsApp/benchmark decisions) | When you need *why* a feature exists or how it should behave |
| `docs/brand-guidelines.md` | Full visual + voice system (agent-readable) | When building UI or writing copy |
| `docs/brand-guidelines.pdf` | Same, for humans | Don't parse — use the `.md` |
| `ross308_as_hatched_benchmark.csv` (root) | Ross 308 growth curve; seed for the benchmark | Building the analytics/benchmark |

## Precedence (when sources conflict)
The Next.js block + `globals.css` + `ROADMAP.md` **win** over `docs/*`. The docs are background and
rationale; they are **reference, not a backlog**. Build **only** what `ROADMAP.md §8` lists for the
current phase. Anything in the BRD marked deferred/post-MVP (auth, DB, payments, WhatsApp, ML) is **not**
to be built now — only leave the seams described in `ROADMAP.md §5` and §9.

## Hard conventions (non-negotiable)
- **This Next.js differs from your training data.** Before writing or changing anything that touches
  routing, layouts, data fetching, caching, config, fonts or file conventions, read the relevant guide in
  `node_modules/next/dist/docs/` and heed deprecation notices. Do not assume older Next.js patterns.
- **Data only through `lib/data/`.** UI never imports mock data directly. These functions become Convex later.
- **No raw values in components.** Never hardcode a hex colour, font family, radius or spacing in a
  component — reference the semantic CSS variables in `globals.css`. Re-theming must be possible by
  editing `globals.css` alone.
- **Use the design skills on every UI task:** `emil-kowalski-design` (motion/interaction), `ui-ux-pro`,
  `impeccable`. Aim: Apple-grade and *distinctive*, on the BatchPilot brand — never a default template.
- **Status is never colour alone:** colour + icon + word + shape.
- **Keep `ROADMAP.md` current.** As you finish an item, set `[ ]`→`[x]` with a one-line note. Record
  architectural decisions in the relevant section.
- **Don't build auth, a database, or payments.** Stubs/seams only (see `ROADMAP.md §5`).
