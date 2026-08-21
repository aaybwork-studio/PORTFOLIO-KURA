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

/**
 * One media block inside a case section.
 *
 * `span` is the layout, not the file: `full` takes the whole measure, `half`
 * pairs with the next `half` to make a split row. That is the only structural
 * decision the case study layout needs, so it is the only one stored.
 *
 * Videos are the same shape as images. A case study is mostly moving work, and
 * treating video as a special case downstream meant it could not sit in the
 * same rhythm as the stills.
 */
export interface CaseMedia {
  kind: "image" | "video";
  src: string;
  alt: string;
  span: "full" | "half";
  /**
   * Overrides the shape the span would have given the block, as a CSS
   * aspect-ratio. Set only where the asset's own proportions have to survive
   * the crop — a square reel in a 16:10 frame loses its edges.
   */
  ratio?: string;
  /** poster frame for video; ignored for images */
  poster?: string;
}

export interface CaseSection {
  kicker: string;
  heading: string;
  body: string;
  note: string;
  imageA: ResolvedImage;
  imageB: ResolvedImage;
  /** resolved media for this section — never empty, see mapSections */
  media: CaseMedia[];
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

export type ArchiveKind = "poster" | "ui" | "photo";

export interface ArchiveItem {
  title: string;
  image: ResolvedImage;
  order: number;
  /** Posters and UI work open onto their own page; photos stay in the carousel. */
  kind?: ArchiveKind;
  slug?: string;
  year?: string;
  note?: string;
  gallery?: CaseMedia[];
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
  /** One line explaining the name on the logo. Empty hides it. */
  nameNote: string;
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
  /** Artist or album names to keep out of the Spotify row. */
  nowPlayingExclude: string[];
}
