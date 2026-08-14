/**
 * Local fallback content — a verbatim port of the design file's PROJECTS,
 * ARCHIVE, SECTION_DEFS, SECTION_NOTES and SHOTS arrays, already resolved into
 * the shapes in `src/lib/types.ts`. Used whenever Sanity is unconfigured or a
 * query comes back empty. Copy strings are exact (the only deliberate change is
 * the hero-line typo fix).
 */

import { defaultMedia } from "./caseMedia";
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
  "Sketches, prototypes and the decisions in between. Show the middle, not just the polished end.",
  "The parts that resisted: technical limits, scope, or a pattern that looked right and tested wrong.",
  "Type, motion curves, states. The small work that makes the whole read intentional.",
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
    kicker: "Featured · 01",
    title: "PROJECT 01",
    slug: "project-01",
    year: "2025",
    role: "Lead Product Designer",
    discipline: "Product Design · Motion",
    hero: "/media/p01.png",
    card: "/media/p01.png",
    homeAspect: "4 / 3",
    homeCardLabel: "Project 01 · Product Design",
    workCardSubtitle: "Product Design, Motion",
    comingSoon: false,
    body1:
      "Placeholder case study. Swap this copy for the real story: what was broken, what you changed, and the one decision you'd defend in a room full of stakeholders.",
    body2:
      "The layout is built for a balanced read: enough words to explain the thinking, enough image to prove it happened.",
  },
  {
    kicker: "Featured · 02",
    title: "PROJECT 02",
    slug: "project-02",
    year: "2025",
    role: "Design Systems Lead",
    discipline: "Design System · Web",
    hero: "/media/p02.png",
    card: "/media/p02.png",
    homeAspect: "3 / 4",
    homeCardLabel: "Project 02 · Design System",
    workCardSubtitle: "Design System, Web",
    comingSoon: true,
    body1:
      "Placeholder case study. A systems project reads best as before/after: the inconsistency you inherited, the primitives you defined, the speed you gave back to the team.",
    body2: "Add component screenshots and one token table and this section carries itself.",
  },
  {
    kicker: "Featured · 03",
    title: "PROJECT 03",
    slug: "project-03",
    year: "2024",
    role: "Interaction Designer",
    discipline: "Interaction · Prototyping",
    hero: "/media/p04.png",
    card: "/media/p03.png",
    homeAspect: "3 / 4",
    homeCardLabel: "Project 03 · Interaction",
    workCardSubtitle: "Interaction, Prototyping",
    comingSoon: false,
    body1:
      "Placeholder case study. This is the one where the prototype does the arguing. Drop a screen recording in place of the first image and let motion make the case.",
    body2: "Keep the writing short here. The interaction is the artefact.",
  },
  {
    kicker: "Featured · 04",
    title: "PROJECT 04",
    slug: "project-04",
    year: "2024",
    role: "Art Director",
    discipline: "Brand · Art Direction",
    hero: "/media/p03.png",
    card: "/media/p04.png",
    homeAspect: "4 / 3",
    homeCardLabel: "Project 04 · Art Direction",
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
    media: defaultMedia(
      { src: SHOTS[(i * 2 + j) % SHOTS.length], alt: "" },
      { src: SHOTS[(i * 2 + j + 3) % SHOTS.length], alt: "" },
      j,
    ),
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
  heroLine: "I design UX that works.",
  heroPrefix: "I design",
  /*
   * Four short taglines covering the disciplines: UX craft, research,
   * end-to-end product, user focus.
   *
   * These are measured, not guessed. The hero is a single nowrap row set in
   * IntraNet, which averages ~1.08em per character — a long phrase overflows
   * the viewport instead of wrapping. With the "I design" prefix and the
   * -0.03em tracking, each full line below is 21.3em-22.4em wide, and the
   * `.heroLine` clamp is sized against that ceiling. Two rules for edits:
   * keep any new line under 23em, and keep the set within ~1em of each other
   * so the phrase swap does not visibly shift the centred line.
   *
   * Straight quotes and hyphens only — IntraNet has no em-dash and no curly
   * apostrophe, so those characters fall back to Noto Sans mid-word.
   */
  heroPhrases: [
    "UX that works.",
    "research first.",
    "the whole flow.",
    "for real users.",
  ],
  scrollLabel: "SCROLL",
  email: "aayushbhandari.work@gmail.com",
  location: "Noida, India",
  timezoneLabel: "GMT+5:30",
  timezoneOffsetMinutes: 330,
  copyright: "© 2026 Aayush Bhandari",
  /*
   * Labels are plain text. The arrow used to be baked into the string, which
   * meant its spacing rode on the letter-spacing of the uppercase label and it
   * could not animate — it is now a real element the pill renders itself.
   */
  socials: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/kura/" },
    { label: "Instagram", url: "https://www.instagram.com/bykuraaa/" },
    { label: "Archive", url: "/archive" },
    { label: "Info", url: "/info" },
  ],
  contactEyebrow: "Say something",
  featuredWorkLabel: "Featured Work",
  archiveCtaLabel: "Enter the archive →",
};

export const fallbackInfoPage: InfoPage = {
  eyebrow: "Info",
  name: "Aayush Bhandari",
  roleLine: "Interaction & UX Designer \\ Product \\ Research \\ Graphics",

  bio: [
    "Hi there. I'm Aayush, an interaction and UX designer in Noida. Most of my time goes into working out how a thing should behave, ideally before anyone starts arguing about what colour it is.",
    "Five years of designing, six clients, a bachelor's in design, and six months at Mala-Akbari in Delhi. The college work is built end to end in Figma with the research written up beside it, so you can see how I think. The client work is what survived a deadline and somebody else's opinion. Both are on this site.",
    "I'm not a developer and I won't pretend to be. I design the screens properly, then reach for AI-assisted tooling when something needs to actually exist on the internet. This site is one of those. It means I can hand engineers something buildable and talk to them without a translator.",
    "Off the clock it's F1 on Sundays, football and basketball the rest of the week, and a guitar I keep meaning to practise properly. Otherwise I'm gaming or somewhere deep in a music rabbit hole. Happy to talk about any of it.",
  ],

  servicesLabel: "What I do",
  services: [
    {
      title: "Interaction & UX",
      body: "Flows, information structure, and the states most specs forget. Research when the answer isn't obvious yet.",
    },
    {
      title: "UI & visual design",
      body: "Screens, type and components designed against how they'll get built, not as flat comps.",
    },
    {
      title: "Graphic design",
      body: "Posters, layout and art direction. Most of it lives in the archive.",
    },
  ],

  toolkitLabel: "Toolkit",
  toolkit: [
    "Figma",
    "Framer",
    "Photoshop",
    "Illustrator",
    "Antigravity",
    "Claude Code",
  ],

  interestsLabel: "Also into",
  interests: [
    "F1",
    "Football",
    "Basketball",
    "Gaming",
    "Guitar",
    "Music",
  ],

  /*
   * Ordering is deliberate: capability first, logistics second.
   *
   * An earlier pass opened with availability and answered most questions by
   * explaining a constraint, which reads as justifying rather than offering.
   * Every answer here leads with what the reader gets. Length matters too, so
   * they are kept short; a long answer to a simple question reads as anxious.
   */
  faqLabel: "Questions",
  faqIntro: "What hiring managers and clients actually ask.",
  faq: [
    {
      question: "What are you looking for?",
      answer:
        "A product or studio team where design owns the problem, not just the screens. Interaction and UX first, with research and UI where the work calls for it. I improve fastest around people who will tell me plainly what isn't working, so a team with a real critique culture matters more to me than a title.",
    },
    {
      question: "What experience is behind this?",
      answer:
        "Five years designing, six clients shipped, and six months in-house at Mala-Akbari in Delhi. My degree is in interaction and UX, so the fundamentals came from four years of critique rather than a short course.",
    },
    {
      question: "Do you code?",
      answer:
        "I design in Figma and build real sites with AI-assisted tooling. This one runs on Next.js and Sanity. That means engineers get specs that survive contact with a codebase, and I can prototype an idea instead of arguing about it in a meeting. I would join a team to design, not to write production code.",
    },
    {
      question: "How do you work?",
      answer:
        "Structure before surface. Flows, states and edge cases get settled while they are still cheap to change, then the visual work has something to sit on. Every project on this site has the reasoning written up next to it, so you can judge the thinking and not just the screens.",
    },
    {
      question: "When could you start?",
      answer:
        "Within about two weeks for most roles. I keep a small amount of freelance running, and you will know exactly what is on my plate well before an offer, not after it.",
    },
    {
      question: "Where do you work from?",
      answer:
        "Noida, working on IST. Remote and hybrid across Delhi NCR both suit me, and I will relocate for the right role. Tell me the profile and you get a straight answer rather than a maybe.",
    },
    {
      question: "What do you work in?",
      answer:
        "Figma and Framer for design and prototyping. Photoshop and Illustrator for print and graphics. Next.js, Sanity and Claude Code when something has to actually ship.",
    },
    {
      question: "Do you take freelance?",
      answer:
        "Yes, alongside full-time work, as I have since college. Send the scope and the deadline and you get a straight answer in two working days, including when I think someone else is the better fit.",
    },
    {
      question: "How do you price it?",
      answer:
        "By scope rather than a day rate. A poster set and a multi-week product engagement are not the same unit of work. Tell me what needs to exist and by when, and a number and a timeline come back together.",
    },
    {
      question: "Do you do graphic design too?",
      answer:
        "Yes. Posters, layout and art direction. Most of it lives in the archive rather than as case studies, because with print the artefact is the argument.",
    },
    {
      question: "Why do the case studies look nothing like this site?",
      answer:
        "Fair catch. They were made under college rules, so they are built to show the reasoning rather than to look good, and every call in them is made for the majority user rather than for my taste. If you came for the taste, it is in the archive and in the albums further down this page.",
    },
    {
      question: "How fast do you reply?",
      answer: "Within two working days, including when the answer is no.",
    },
  ],

  contactLabel: "Contact",
  elsewhereLabel: "Elsewhere",
  nowPlayingLabel: "On repeat",
  /*
   * Spotify's top-items is a raw play count, so anything played enough appears
   * whether or not it belongs on a portfolio. Add an artist or album name here
   * to keep it out of the row; matching is case-insensitive substring.
   */
  nowPlayingExclude: [],
};
