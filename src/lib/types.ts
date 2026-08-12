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

export interface GlanceItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InfoPage {
  /** factual label/value rows — replaces the design's placeholder stats block */
  glance: GlanceItem[];
  glanceLabel: string;
  faq: FaqItem[];
  faqLabel: string;
  faqIntro: string;
  eyebrow: string;
  heading: string;
  badges: string[];
  marqueeWords: string[];
  stats: StatItem[];
  bio: string[];
  services: ServiceItem[];
  toolkit: string[];
  contactLabel: string;
  elsewhereLabel: string;
  toolkitLabel: string;
}
