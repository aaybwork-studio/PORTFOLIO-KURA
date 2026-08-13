/**
 * Resolved content shapes. Everything downstream (views, scenes, components)
 * consumes these — images are already resolved to plain URLs, so no Sanity
 * types ever leak past `src/lib/content.ts`.
 */

export interface ResolvedImage {
  src: string;
  alt?: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface ServiceItem {
  title: string;
  body: string;
}

export interface SiteSettings {
  /** full hero sentence, kept for metadata and as the fallback source */
  heroLine: string;
  /** static opening of the hero line, e.g. "I like" */
  heroPrefix: string;
  /** the part that cycles after the prefix */
  heroPhrases: string[];
  scrollLabel: string;
  email: string;
  location: string;
  timezoneLabel: string;
  timezoneOffsetMinutes: number;
  copyright: string;
  socials: SocialLink[];
  contactEyebrow: string;
  featuredWorkLabel: string;
  archiveCtaLabel: string;
}

export interface CaseSection {
  kicker: string;
  heading: string;
  body: string;
  note: string;
  imageA: ResolvedImage;
  imageB: ResolvedImage;
}

export type HomeAspect = "4 / 3" | "3 / 4";

export interface Project {
  title: string;
  slug: string;
  kicker: string;
  year: string;
  role: string;
  discipline: string;
  order: number;
  comingSoon: boolean;
  homeCardLabel: string;
  workCardSubtitle: string;
  homeAspect: HomeAspect;
  cardImage: ResolvedImage;
  heroImage: ResolvedImage;
  sections: CaseSection[];
}

export interface ArchiveItem {
  title: string;
  image: ResolvedImage;
  order: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** One album/track from the Spotify listening history. */
export interface NowPlayingItem {
  title: string;
  artist: string;
  image: string;
  url: string;
}

/*
 * The info page is a single left-aligned column: name, role line, prose, then
 * a stack of small-caps-labelled blocks. The design's centred layout —
 * badges, marquee, stat row, boxed service grid and the at-a-glance table —
 * was dropped when the page was rebuilt against the reference; the FAQ
 * absorbed everything the glance table used to say.
 */
export interface InfoPage {
  eyebrow: string;
  name: string;
  roleLine: string;
  bio: string[];
  services: ServiceItem[];
  servicesLabel: string;
  toolkit: string[];
  toolkitLabel: string;
  interests: string[];
  interestsLabel: string;
  faq: FaqItem[];
  faqLabel: string;
  faqIntro: string;
  contactLabel: string;
  elsewhereLabel: string;
  nowPlayingLabel: string;
}
