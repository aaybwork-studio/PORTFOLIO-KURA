/**
 * Local fallback content — a verbatim port of the design file's PROJECTS,
 * ARCHIVE, SECTION_DEFS, SECTION_NOTES and SHOTS arrays, already resolved into
 * the shapes in `src/lib/types.ts`. Used whenever Sanity is unconfigured or a
 * query comes back empty. Copy strings are exact (the only deliberate change is
 * the hero-line typo fix).
 */

import type {
  ArchiveItem,
  CaseSection,
  HomeAspect,
  InfoPage,
  Project,
  SiteSettings,
} from "./types";

export const SHOTS: string[] = [
  "/media/p01.png",
  "/media/p02.png",
  "/media/p03.png",
  "/media/p04.png",
  "/media/p05.png",
  "/media/p06.png",
  "/media/p07.png",
  "/media/p08.png",
];

export const SECTION_DEFS: { kicker: string; heading: string }[] = [
  { kicker: "About", heading: "The brief" },
  { kicker: "Process", heading: "How it was made" },
  { kicker: "Challenges", heading: "What fought back" },
  { kicker: "Craft", heading: "Details worth the time" },
  { kicker: "Results", heading: "Where it landed" },
];

export const SECTION_NOTES: string[] = [
  "Replace with the real context: who it was for, what it had to do, and the constraint that shaped everything after.",
  "Sketches, prototypes and the decisions in between — show the middle, not just the polished end.",
  "The parts that resisted: technical limits, scope, or a pattern that looked right and tested wrong.",
  "Type, motion curves, states — the small work that makes the whole read intentional.",
  "Outcome, adoption or the metric worth quoting. One number beats three paragraphs.",
];

interface ProjectSeed {
  kicker: string;
  title: string;
  slug: string;
  year: string;
  role: string;
  discipline: string;
  hero: string;
  card: string;
  homeAspect: HomeAspect;
  homeCardLabel: string;
  workCardSubtitle: string;
  comingSoon: boolean;
  body1: string;
  body2: string;
}

const PROJECT_SEEDS: ProjectSeed[] = [
  {
    kicker: "Featured — 01",
    title: "PROJECT 01",
    slug: "project-01",
    year: "2025",
    role: "Lead Product Designer",
    discipline: "Product Design · Motion",
    hero: "/media/p01.png",
    card: "/media/p01.png",
    homeAspect: "4 / 3",
    homeCardLabel: "Project 01 — Product Design",
    workCardSubtitle: "Product Design, Motion",
    comingSoon: false,
    body1:
      "Placeholder case study. Swap this copy for the real story: what was broken, what you changed, and the one decision you'd defend in a room full of stakeholders.",
    body2:
      "The layout is built for a balanced read — enough words to explain the thinking, enough image to prove it happened.",
  },
  {
    kicker: "Featured — 02",
    title: "PROJECT 02",
    slug: "project-02",
    year: "2025",
    role: "Design Systems Lead",
    discipline: "Design System · Web",
    hero: "/media/p02.png",
    card: "/media/p02.png",
    homeAspect: "3 / 4",
    homeCardLabel: "Project 02 — Design System",
    workCardSubtitle: "Design System, Web",
    comingSoon: true,
    body1:
      "Placeholder case study. A systems project reads best as before/after: the inconsistency you inherited, the primitives you defined, the speed you gave back to the team.",
    body2: "Add component screenshots and one token table and this section carries itself.",
  },
  {
    kicker: "Featured — 03",
    title: "PROJECT 03",
    slug: "project-03",
    year: "2024",
    role: "Interaction Designer",
    discipline: "Interaction · Prototyping",
    hero: "/media/p04.png",
    card: "/media/p03.png",
    homeAspect: "3 / 4",
    homeCardLabel: "Project 03 — Interaction",
    workCardSubtitle: "Interaction, Prototyping",
    comingSoon: false,
    body1:
      "Placeholder case study. This is the one where the prototype does the arguing — drop a screen recording in place of the first image and let motion make the case.",
    body2: "Keep the writing short here. The interaction is the artefact.",
  },
  {
    kicker: "Featured — 04",
    title: "PROJECT 04",
    slug: "project-04",
    year: "2024",
    role: "Art Director",
    discipline: "Brand · Art Direction",
    hero: "/media/p03.png",
    card: "/media/p04.png",
    homeAspect: "4 / 3",
    homeCardLabel: "Project 04 — Art Direction",
    workCardSubtitle: "Brand, Art Direction",
    comingSoon: false,
    body1:
      "Placeholder case study. Identity work wants big plates and few words: the mark, the type, the one application that made everyone finally get it.",
    body2: "Replace these images with the real deliverables at full bleed.",
  },
];

/** Design formula: imgA = SHOTS[(i*2+j) % 8], imgB = SHOTS[(i*2+j+3) % 8]. */
function buildSections(seed: ProjectSeed, i: number): CaseSection[] {
  return SECTION_DEFS.map((def, j) => ({
    kicker: def.kicker,
    heading: def.heading,
    body: j === 0 ? seed.body1 : j === 4 ? seed.body2 : SECTION_NOTES[j],
    note: SECTION_NOTES[(j + 2) % SECTION_NOTES.length],
    imageA: { src: SHOTS[(i * 2 + j) % SHOTS.length], alt: "" },
    imageB: { src: SHOTS[(i * 2 + j + 3) % SHOTS.length], alt: "" },
  }));
}

export const fallbackProjects: Project[] = PROJECT_SEEDS.map((seed, i) => ({
  title: seed.title,
  slug: seed.slug,
  kicker: seed.kicker,
  year: seed.year,
  role: seed.role,
  discipline: seed.discipline,
  order: i,
  comingSoon: seed.comingSoon,
  homeCardLabel: seed.homeCardLabel,
  workCardSubtitle: seed.workCardSubtitle,
  homeAspect: seed.homeAspect,
  cardImage: { src: seed.card, alt: seed.title },
  heroImage: { src: seed.hero, alt: seed.title },
  sections: buildSections(seed, i),
}));

export const fallbackArchive: ArchiveItem[] = [
  { title: "Poster Series", image: { src: "/media/p05.png", alt: "Poster Series" }, order: 0 },
  { title: "Interaction Study", image: { src: "/media/p06.png", alt: "Interaction Study" }, order: 1 },
  { title: "Mobile Concept", image: { src: "/media/p07.png", alt: "Mobile Concept" }, order: 2 },
  { title: "Identity Sketch", image: { src: "/media/p08.png", alt: "Identity Sketch" }, order: 3 },
  { title: "Editorial Spread", image: { src: "/media/p03.png", alt: "Editorial Spread" }, order: 4 },
  { title: "Motion Tests", image: { src: "/media/p04.png", alt: "Motion Tests" }, order: 5 },
  { title: "Type Experiment", image: { src: "/media/p01.png", alt: "Type Experiment" }, order: 6 },
  { title: "Shader Sketch", image: { src: "/media/p02.png", alt: "Shader Sketch" }, order: 7 },
];

export const fallbackSiteSettings: SiteSettings = {
  heroLine: "I design interfaces that behave.",
  heroPrefix: "I design",
  /*
   * Four short taglines covering the disciplines: UI/UX, product, motion,
   * systems. They are deliberately close in length — the line is a single
   * nowrap row sized to the viewport, so a long phrase overflows instead of
   * wrapping.
   */
  heroPhrases: [
    "interfaces that behave.",
    "products end to end.",
    "motion with intent.",
    "systems teams can use.",
  ],
  scrollLabel: "SCROLL",
  email: "aayushbhandari.work@gmail.com",
  location: "Noida, India",
  timezoneLabel: "GMT+5:30",
  timezoneOffsetMinutes: 330,
  copyright: "© 2026 Aayush Bhandari",
  socials: [
    { label: "LinkedIn ↗", url: "https://www.linkedin.com/in/kura/" },
    { label: "Instagram ↗", url: "https://www.instagram.com/bykuraaa/" },
    { label: "Archive ↗", url: "/archive" },
    { label: "Info ↗", url: "/info" },
  ],
  contactEyebrow: "Contact — say something",
  featuredWorkLabel: "Featured Work",
  archiveCtaLabel: "Enter the archive →",
};

export const fallbackInfoPage: InfoPage = {
  eyebrow: "Info",
  heading: "I design interfaces that behave, then build them to prove it.",
  badges: ["Open for 2026 work", "Coffee ≥ 3/day", "Easing nerd"],
  marqueeWords: ["MOTION FIRST", "PROTOTYPE TO DECIDE", "SHIP THE DETAIL"],
  stats: [
    { value: "6+", label: "Years designing" },
    { value: "40+", label: "Shipped projects" },
    { value: "12", label: "Design systems" },
    { value: "∞", label: "Easing tweaks" },
  ],
  bio: [
    "I'm an India-based designer who enjoys pushing pixels, sweating the details and staying in it. Most of my favourite work happens between design and engineering — prototyping an interaction to find out how it should feel, or building the piece that's easier to show than to spec.",
    "Everything numeric above is placeholder while I decide what's worth claiming.",
  ],
  services: [
    {
      title: "Interaction & UX",
      body: "Flows, states, and the small behaviours that make a product feel considered.",
    },
    {
      title: "Motion & 3D",
      body: "GSAP timelines, shader work and WebGL scenes that carry meaning, not decoration.",
    },
    {
      title: "Systems & Build",
      body: "Tokens, components and front-end that survives the trip from comp to production.",
    },
  ],
  toolkit: ["Figma · GSAP", "Three.js · GLSL", "React · Rive"],
  contactLabel: "Contact",
  elsewhereLabel: "Elsewhere",
  toolkitLabel: "Toolkit",
};
