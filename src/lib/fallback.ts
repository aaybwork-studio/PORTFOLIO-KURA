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
  heading: "I design interaction and UX — then prototype it until it behaves.",
  badges: ["Open to full-time roles", "Freelance open", "Noida — remote friendly"],
  marqueeWords: [
    "INTERACTION DESIGN",
    "UX RESEARCH",
    "UI & VISUAL",
    "GRAPHIC DESIGN",
  ],
  // The design's stats row was placeholder by its own admission. The numbers
  // that are worth stating live in `glance` instead, next to the FAQ.
  stats: [],
  bio: [
    "I'm Aayush — an interaction and UX designer based in Noida. I finished my bachelor's in design, where the focus was interaction and UX, and I've been designing for about five years across college work and freelance, with six clients so far.",
    "Most of the work happens in Figma: flows, structure, screens, and the case study that explains why each decision went the way it did. I spent six months at Mala-Akbari in Delhi through 2025. Right now I'm freelancing and looking for a studio or product team to join.",
    "I'm not a developer, and I'd rather say so than imply otherwise. When something needs to exist as a real site I build it with AI-assisted tools — this site is one of them. The college work is built end to end in Figma with the research and reasoning documented alongside it.",
  ],
  services: [
    {
      title: "Interaction & UX",
      body: "Flows, information structure, and the states most specs skip. Research and testing when the answer isn't obvious yet.",
    },
    {
      title: "UI & visual design",
      body: "Screens, type and components, designed against how they will actually get built rather than as flat comps.",
    },
    {
      title: "Graphic design",
      body: "Posters, layout and art direction. The print-side work is collected in the archive.",
    },
  ],
  toolkit: [
    "Figma · Framer",
    "Photoshop · Illustrator",
    "Antigravity · Claude Code",
  ],
  contactLabel: "Contact",
  elsewhereLabel: "Elsewhere",
  toolkitLabel: "Toolkit",

  glanceLabel: "At a glance",
  glance: [
    { label: "Open to", value: "Full-time roles, freelance and contract projects" },
    {
      label: "Roles",
      value:
        "UX designer, Interaction designer, Product designer (UI), Design researcher, Front-end designer (design side)",
    },
    { label: "Status", value: "Freelancing — available now" },
    { label: "Based in", value: "Noida, India — GMT+5:30" },
    {
      label: "Work location",
      value: "Remote anywhere, hybrid across Delhi NCR, open to relocating for the right role",
    },
    { label: "Practising since", value: "2021 — five years across college and freelance" },
    { label: "Clients to date", value: "6" },
    { label: "Most recent", value: "Mala-Akbari, Delhi — six months, 2025" },
    { label: "Education", value: "Bachelor's in Design — Interaction & UX" },
    { label: "Replies", value: "Within two working days" },
    { label: "Working languages", value: "English, Hindi" },
  ],

  faqLabel: "Questions",
  faqIntro: "From hiring managers, studios and freelance clients.",
  faq: [
    {
      question: "What roles are you open to?",
      answer:
        "UX designer, interaction designer, product designer on the UI side, design researcher, and front-end design work — the design half of the front end, not the engineering. I'm early in my career and looking for a studio or product team where I'll be reviewed properly. Freelance and contract projects run alongside that.",
    },
    {
      question: "When can you start?",
      answer:
        "Now. My degree is finished and I'm freelancing rather than employed, so there's no notice period to work through — only whatever client commitments are open at the time, which I'll tell you about in the first email.",
    },
    {
      question: "How quickly do you reply?",
      answer:
        "Within two working days, to every serious enquiry — including the ones where the answer is no.",
    },
    {
      question: "Where can you work from?",
      answer:
        "I'm in Noida and work in IST. Remote anywhere suits me, hybrid across Delhi NCR is easy, and I'll relocate for the right role — tell me the profile and I'll give you a straight answer on whether the move works.",
    },
    {
      question: "How much experience do you have?",
      answer:
        "About five years of designing across college and freelance, with six clients so far, plus six months at Mala-Akbari in Delhi through 2025. I'm a fresher by employment history, not by practice.",
    },
    {
      question: "Do you code?",
      answer:
        "Not as a developer, and I won't pretend otherwise. I design in Figma and build shipping sites with AI-assisted tools — this site is one of them, in Next.js and Sanity. That's enough to hand engineers something buildable and to talk to them without a translator, but it isn't production engineering and I'd be joining a team to design, not to write the app.",
    },
    {
      question: "What do you work in?",
      answer:
        "Figma and Framer for design and prototyping, Photoshop and Illustrator for graphic and print work, and Antigravity and Claude Code for building.",
    },
    {
      question: "What's the difference between the case studies and the client work?",
      answer:
        "The college projects are built end to end in Figma with the research and the reasoning documented — those show how I think. The client work shows what survives contact with a deadline and someone else's opinion. Both are on this site; read the case studies if you want to judge the thinking.",
    },
    {
      question: "Do you take freelance alongside a full-time role?",
      answer:
        "Yes, and I've been doing exactly that since college. Send the scope and the deadline in the first email and I'll say whether it fits.",
    },
    {
      question: "How do you price freelance projects?",
      answer:
        "By scope rather than a published day rate — a poster set and a multi-week product engagement aren't the same unit of work. Tell me what needs to exist, and by when, and a figure comes back within two working days.",
    },
    {
      question: "Do you take graphic design work?",
      answer:
        "Yes — posters, layout and art direction. A lot of it is in the archive rather than written up as case studies, because the work is the artefact.",
    },
  ],
};
