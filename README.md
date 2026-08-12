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
NEXT_PUBLIC_SANITY_PROJECT_ID=hzkdb160
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
