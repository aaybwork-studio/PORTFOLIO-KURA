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
  heroLine: string;
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

export interface InfoPage {
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
