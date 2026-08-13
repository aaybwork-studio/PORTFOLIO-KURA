# Kura Portfolio

Aayush Bhandari's portfolio — a one-to-one build of the `Kura Portfolio` design, on Next.js 15 (App Router)
with Sanity as the CMS, deployed on Vercel.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript (strict) |
| CMS | Sanity v3, Studio embedded at `/studio` |
| 3D / shaders | three 0.128 — GLSL cloud background, extruded SVG logo, DVD-bounce footer |
| Motion | GSAP (plate-wipe route transitions), Lenis (smooth scroll) |
| Hosting | Vercel |
| Type | IntraNet (display, self-hosted) + Noto Sans (everything else) |

## Typography

Two faces, two jobs. There is no third family — the small tracked labels that
used to be IBM Plex Mono are now Noto Sans narrowed on its `wdth` axis.

| Role | Face | Where |
|---|---|---|
| Display | IntraNet 400/700, `var(--ff-display)` | hero line, project titles, page headings, marquee, 404 |
| Body | Noto Sans 400–600, `var(--ff-body)` | bios, FAQ, case prose, everything under 28px |
| Label | Noto Sans, `font-stretch: 87.5%`, uppercase, tracked | `[01]`, `SCROLL`, years, roles, pills |

**IntraNet is display-only, and it has sharp edges.** Measured from the font
binary, not eyeballed:

- **Unicase.** Cap-height and x-height are both 800, so lowercase draws at cap
  height. It stops reading below ~28px — never set body copy in it.
- **Ink spans 1.19em** (yMin −0.367, yMax 0.818) inside a 1.8em content box.
  Any `line-height` below ~1.2 makes a multi-line heading collide with itself.
  The display default is 1.25; do not tighten it.
- **~1.08em average advance** — more than double the Archivo it replaced. Every
  display `font-size` clamp in the app was recomputed against this. The hero is
  a single `nowrap` line, so it overflows rather than wraps: keep any hero
  phrase under 23em including the prefix (see `heroPhrases` in `src/lib/fallback.ts`).
- **147 glyphs.** No em-dash, no en-dash, no curly apostrophe, no arrows. Those
  characters fall back to Noto Sans mid-word and the swap is visible. Keep
  display strings to straight quotes and hyphens; where a missing glyph is
  wanted on purpose (the next-project arrow), it is set in the body face
  explicitly.

Widows and orphans are handled in `globals.css` with `text-wrap: balance` on
headings and `text-wrap: pretty` on paragraphs. Both degrade to normal wrapping
in older browsers.

Font files live in `src/app/fonts/` as woff2 (converted from the vendor OTFs).
`IntraNet-Outline.woff2` is kept but not loaded — it is held in reserve.
IntraNet is free for personal and commercial use, no attribution required;
Noto Sans is SIL OFL and pulled through `next/font/google`.

## Getting started

```bash
npm install
npm run dev
```

The app runs with or without Sanity configured — with no `NEXT_PUBLIC_SANITY_PROJECT_ID` it falls back to the
local content in `src/lib/fallback.ts`, which reproduces the design exactly.

### Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=oqe1c9xj
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=...
SANITY_API_WRITE_TOKEN=...   # only needed for `npm run seed`
```

`SANITY_API_WRITE_TOKEN` is only read by the seed script and never ships to the client.

## Content

Edit everything at [`/studio`](http://localhost:3000/studio). Document types:

- **siteSettings** (singleton) — hero line, email, location, timezone, socials, section labels
- **infoPage** (singleton) — the whole Info page: heading, badges, marquee, stats, bio, services, toolkit
- **project** — title, slug, kicker, year, role, discipline, card + hero images, `comingSoon`,
  home-grid aspect ratio, and 5 `caseSection` blocks (kicker / heading / body / note / two images)
- **archiveItem** — title + image for the 3D archive carousel

To re-seed the dataset from the design's content:

```bash
npm run seed
```

It is idempotent — documents use fixed `_id`s and images dedupe by hash.

## Architecture

```
src/
├─ app/                     routes: / /work /work/[slug] /archive /info /studio
├─ components/
│  ├─ shell/                SiteShell — the only rAF, Lenis, plates, cursor, header
│  ├─ three/                one component per WebGL canvas
│  └─ views/                one component per design view
├─ lib/
│  ├─ content.ts            Sanity → resolved types, falls back locally, never throws
│  ├─ fallback.ts           the design's content as data
│  ├─ frame.ts              shared per-frame state types
│  └─ three/                shaders, renderer helpers, extruded-logo builders
└─ sanity/                  client, image URLs, GROQ, schema types
```

`SiteShell` owns a single `requestAnimationFrame` loop and a mutable frame-state ref (pointer, scroll
velocity, hero progress). Views subscribe with `registerFrame()` rather than starting their own loops, which
keeps the pointer, cursor, sticky-stack and carousel math on one clock — the same structure as the design.

Route changes run the design's plate wipe: two panels close over the viewport (0.52s `expo.inOut`), the route
commits, then they open (0.68s), with a 3.2s guard that force-commits if GSAP is interrupted.

## Deploying

Push to GitHub and import the repo on Vercel. Set the four env vars in the Vercel project, then add your
production domain as a CORS origin in Sanity:

```bash
npx sanity cors add https://your-domain.com --credentials
```
