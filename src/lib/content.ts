/**
 * Single content access layer. Returns Sanity data when a project is
 * configured, and the local design fallback otherwise. Never throws.
 */

import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { client } from "@/sanity/client";
import { hasSanity } from "@/sanity/env";
import { img } from "@/sanity/image";
import {
  archiveItemBySlugQuery,
  archiveQuery,
  infoPageQuery,
  projectBySlugQuery,
  projectsQuery,
  siteSettingsQuery,
} from "@/sanity/queries";

import {
  SECTION_DEFS,
  SHOTS,
  fallbackArchive,
  fallbackInfoPage,
  fallbackProjects,
  fallbackSiteSettings,
} from "./fallback";
import { defaultMedia } from "./caseMedia";
import type {
  ArchiveItem,
  CaseMedia,
  CaseSection,
  FaqItem,
  HomeAspect,
  InfoPage,
  Project,
  ResolvedImage,
  ServiceItem,
  SiteSettings,
  SocialLink,
} from "./types";

/* ------------------------------------------------------------------ raw docs */

type RawImage = SanityImageSource | null | undefined;

interface RawSiteSettings {
  heroLine?: string | null;
  heroPrefix?: string | null;
  heroPhrases?: (string | null)[] | null;
  scrollLabel?: string | null;
  email?: string | null;
  location?: string | null;
  timezoneLabel?: string | null;
  timezoneOffsetMinutes?: number | null;
  copyright?: string | null;
  socials?: ({ label?: string | null; url?: string | null } | null)[] | null;
  contactEyebrow?: string | null;
  featuredWorkLabel?: string | null;
  archiveCtaLabel?: string | null;
}

interface RawCaseSection {
  kicker?: string | null;
  heading?: string | null;
  body?: string | null;
  note?: string | null;
  imageA?: RawImage;
  imageB?: RawImage;
  media?: (RawCaseMedia | null)[] | null;
}

interface RawCaseMedia {
  _type?: string | null;
  image?: RawImage;
  videoUrl?: string | null;
  poster?: RawImage;
  alt?: string | null;
  span?: string | null;
  ratio?: string | null;
}

/**
 * The authored shape override, as a CSS aspect-ratio.
 *
 * Only the listed values are honoured. Anything else — an old document, a
 * typo, a field left empty — returns undefined and the block falls back to the
 * shape its span implies.
 */
const RATIOS: Record<string, string> = {
  "1:1": "1 / 1",
  "4:3": "4 / 3",
  "3:2": "3 / 2",
  "16:10": "16 / 10",
  "16:9": "16 / 9",
  "21:9": "21 / 9",
  "16:3": "16 / 3",
};

function ratioOf(m: RawCaseMedia): string | undefined {
  return typeof m.ratio === "string" ? RATIOS[m.ratio.trim()] : undefined;
}

interface RawProject {
  title?: string | null;
  slug?: string | null;
  kicker?: string | null;
  year?: string | null;
  role?: string | null;
  discipline?: string | null;
  order?: number | null;
  comingSoon?: boolean | null;
  homeCardLabel?: string | null;
  workCardSubtitle?: string | null;
  homeAspect?: string | null;
  cardImage?: RawImage;
  heroImage?: RawImage;
  sections?: (RawCaseSection | null)[] | null;
}

interface RawArchiveItem {
  title?: string | null;
  image?: RawImage;
  order?: number | null;
  kind?: string | null;
  slug?: string | null;
  year?: string | null;
  note?: string | null;
  gallery?: (RawCaseMedia | null)[] | null;
}

interface RawInfoPage {
  eyebrow?: string | null;
  name?: string | null;
  roleLine?: string | null;
  bio?: (string | null)[] | null;
  services?: ({ title?: string | null; body?: string | null } | null)[] | null;
  servicesLabel?: string | null;
  toolkit?: (string | null)[] | null;
  toolkitLabel?: string | null;
  interests?: (string | null)[] | null;
  interestsLabel?: string | null;
  faqLabel?: string | null;
  faqIntro?: string | null;
  faq?: ({ question?: string | null; answer?: string | null } | null)[] | null;
  contactLabel?: string | null;
  elsewhereLabel?: string | null;
  nowPlayingLabel?: string | null;
  nowPlayingExclude?: (string | null)[] | null;
}

/* ------------------------------------------------------------------- helpers */

function str(value: string | null | undefined, fallback: string): string {
  const v = typeof value === "string" ? value.trim() : "";
  return v.length > 0 ? v : fallback;
}

function strList(
  value: (string | null)[] | null | undefined,
  fallback: string[],
): string[] {
  if (!Array.isArray(value)) return fallback;
  const out = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return out.length > 0 ? out : fallback;
}

function isHomeAspect(value: string | null | undefined): value is HomeAspect {
  return value === "4 / 3" || value === "3 / 4";
}

async function fetchOr<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!hasSanity || !client) return null;
  try {
    return await client.fetch<T>(query, params);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------- mapping */

function mapSections(raw: RawProject, index: number): CaseSection[] {
  const seed = fallbackProjects[index] ?? fallbackProjects[0];
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const count = Math.max(rawSections.length, SECTION_DEFS.length);

  return Array.from({ length: count }, (_, j) => {
    const s = rawSections[j] ?? null;
    const def = SECTION_DEFS[j % SECTION_DEFS.length];
    const seedSection = seed.sections[j] ?? seed.sections[j % seed.sections.length];
    const fallbackA = seedSection?.imageA.src ?? SHOTS[j % SHOTS.length];
    const fallbackB = seedSection?.imageB.src ?? SHOTS[(j + 3) % SHOTS.length];

    return {
      kicker: str(s?.kicker, seedSection?.kicker ?? def.kicker),
      heading: str(s?.heading, seedSection?.heading ?? def.heading),
      body: str(s?.body, seedSection?.body ?? ""),
      note: str(s?.note, seedSection?.note ?? ""),
      imageA: { src: img(s?.imageA, fallbackA), alt: "" },
      imageB: { src: img(s?.imageB, fallbackB), alt: "" },
      media: mapMedia(s, { src: img(s?.imageA, fallbackA), alt: "" }, { src: img(s?.imageB, fallbackB), alt: "" }, j),
    };
  });
}

/*
 * Authored media wins; otherwise the two legacy images are laid out on the
 * default rhythm. Every existing project predates the media field, so a section
 * with nothing authored must still produce a full pair rather than an empty
 * stretch of page.
 *
 * A video needs a real URL, so an entry with neither an image nor a videoUrl is
 * dropped instead of rendering an empty frame.
 */
function mapMedia(
  s: RawCaseSection | null,
  imageA: ResolvedImage,
  imageB: ResolvedImage,
  index: number,
): CaseMedia[] {
  const raw = Array.isArray(s?.media) ? s!.media! : [];
  const out: CaseMedia[] = [];
  for (const m of raw) {
    if (!m) continue;
    const span: CaseMedia["span"] = m.span === "half" ? "half" : "full";
    const alt = str(m.alt, "");
    const ratio = ratioOf(m);
    const video = typeof m.videoUrl === "string" ? m.videoUrl.trim() : "";
    if (video.length > 0) {
      const poster = img(m.poster, "");
      out.push({ kind: "video", src: video, alt, span, ratio, poster: poster || undefined });
      continue;
    }
    const src = img(m.image, "");
    if (!src) continue;
    out.push({ kind: "image", src, alt, span, ratio });
  }
  return out.length > 0 ? out : defaultMedia(imageA, imageB, index);
}

function mapProject(raw: RawProject, index: number): Project {
  const slug = str(raw.slug, fallbackProjects[index]?.slug ?? `project-0${index + 1}`);
  const seed =
    fallbackProjects.find((p) => p.slug === slug) ??
    fallbackProjects[index] ??
    fallbackProjects[0];

  return {
    title: str(raw.title, seed.title),
    slug,
    kicker: str(raw.kicker, seed.kicker),
    year: str(raw.year, seed.year),
    role: str(raw.role, seed.role),
    discipline: str(raw.discipline, seed.discipline),
    order: typeof raw.order === "number" ? raw.order : index,
    comingSoon: raw.comingSoon === true,
    homeCardLabel: str(raw.homeCardLabel, seed.homeCardLabel),
    workCardSubtitle: str(raw.workCardSubtitle, seed.workCardSubtitle),
    homeAspect: isHomeAspect(raw.homeAspect) ? raw.homeAspect : seed.homeAspect,
    cardImage: { src: img(raw.cardImage, seed.cardImage.src), alt: str(raw.title, seed.title) },
    heroImage: { src: img(raw.heroImage, seed.heroImage.src), alt: str(raw.title, seed.title) },
    sections: mapSections(raw, fallbackProjects.indexOf(seed) >= 0 ? fallbackProjects.indexOf(seed) : index),
  };
}

function mapSiteSettings(raw: RawSiteSettings): SiteSettings {
  const f = fallbackSiteSettings;
  const socials: SocialLink[] = Array.isArray(raw.socials)
    ? raw.socials
        .filter((s): s is { label?: string | null; url?: string | null } => Boolean(s))
        .map((s) => ({ label: str(s.label, ""), url: str(s.url, "") }))
        .filter((s) => s.label.length > 0 && s.url.length > 0)
    : [];

  return {
    heroLine: str(raw.heroLine, f.heroLine),
    heroPrefix: str(raw.heroPrefix, f.heroPrefix),
    // An empty phrase list would leave the hero reading just "I like", so fall
    // back to the local phrases rather than rendering a dangling prefix.
    heroPhrases:
      (raw.heroPhrases ?? []).filter((p): p is string => Boolean(p && p.trim())).length > 0
        ? (raw.heroPhrases ?? []).filter((p): p is string => Boolean(p && p.trim()))
        : f.heroPhrases,
    scrollLabel: str(raw.scrollLabel, f.scrollLabel),
    email: str(raw.email, f.email),
    location: str(raw.location, f.location),
    timezoneLabel: str(raw.timezoneLabel, f.timezoneLabel),
    timezoneOffsetMinutes:
      typeof raw.timezoneOffsetMinutes === "number"
        ? raw.timezoneOffsetMinutes
        : f.timezoneOffsetMinutes,
    copyright: str(raw.copyright, f.copyright),
    socials: socials.length > 0 ? socials : f.socials,
    contactEyebrow: str(raw.contactEyebrow, f.contactEyebrow),
    featuredWorkLabel: str(raw.featuredWorkLabel, f.featuredWorkLabel),
    archiveCtaLabel: str(raw.archiveCtaLabel, f.archiveCtaLabel),
  };
}

function mapInfoPage(raw: RawInfoPage): InfoPage {
  const f = fallbackInfoPage;

  const services: ServiceItem[] = Array.isArray(raw.services)
    ? raw.services
        .filter((s): s is { title?: string | null; body?: string | null } => Boolean(s))
        .map((s) => ({ title: str(s.title, ""), body: str(s.body, "") }))
        .filter((s) => s.title.length > 0 || s.body.length > 0)
    : [];

  const faq: FaqItem[] = Array.isArray(raw.faq)
    ? raw.faq
        .filter((q): q is { question?: string | null; answer?: string | null } => Boolean(q))
        .map((q) => ({ question: str(q.question, ""), answer: str(q.answer, "") }))
        .filter((q) => q.question.length > 0 && q.answer.length > 0)
    : [];

  return {
    eyebrow: str(raw.eyebrow, f.eyebrow),
    name: str(raw.name, f.name),
    roleLine: str(raw.roleLine, f.roleLine),
    bio: strList(raw.bio, f.bio),
    services: services.length > 0 ? services : f.services,
    servicesLabel: str(raw.servicesLabel, f.servicesLabel),
    toolkit: strList(raw.toolkit, f.toolkit),
    toolkitLabel: str(raw.toolkitLabel, f.toolkitLabel),
    interests: strList(raw.interests, f.interests),
    interestsLabel: str(raw.interestsLabel, f.interestsLabel),
    faqLabel: str(raw.faqLabel, f.faqLabel),
    faqIntro: str(raw.faqIntro, f.faqIntro),
    faq: faq.length > 0 ? faq : f.faq,
    contactLabel: str(raw.contactLabel, f.contactLabel),
    elsewhereLabel: str(raw.elsewhereLabel, f.elsewhereLabel),
    nowPlayingLabel: str(raw.nowPlayingLabel, f.nowPlayingLabel),
    nowPlayingExclude: strList(raw.nowPlayingExclude, f.nowPlayingExclude),
  };
}

/** Gallery blocks on an archive item. Unlike case sections there is no default:
 *  an item with nothing uploaded has an empty gallery and simply does not open. */
function mapGallery(raw: (RawCaseMedia | null)[] | null | undefined): CaseMedia[] {
  if (!Array.isArray(raw)) return [];
  const out: CaseMedia[] = [];
  for (const m of raw) {
    if (!m) continue;
    const span: CaseMedia["span"] = m.span === "half" ? "half" : "full";
    const alt = str(m.alt, "");
    const ratio = ratioOf(m);
    const video = typeof m.videoUrl === "string" ? m.videoUrl.trim() : "";
    if (video.length > 0) {
      const poster = img(m.poster, "");
      out.push({ kind: "video", src: video, alt, span, ratio, poster: poster || undefined });
      continue;
    }
    const src = img(m.image, "");
    if (!src) continue;
    out.push({ kind: "image", src, alt, span, ratio });
  }
  return out;
}

function mapArchiveItem(raw: RawArchiveItem, index: number): ArchiveItem {
  const seed = fallbackArchive[index % fallbackArchive.length];
  const title = str(raw.title, seed.title);
  const kind = raw.kind === "ui" || raw.kind === "photo" ? raw.kind : "poster";
  const slug = str(raw.slug, "");
  const year = str(raw.year, "");
  const note = str(raw.note, "");
  return {
    title,
    image: { src: img(raw.image, seed.image.src), alt: title },
    order: typeof raw.order === "number" ? raw.order : index,
    kind,
    slug: slug || undefined,
    year: year || undefined,
    note: note || undefined,
    gallery: mapGallery(raw.gallery),
  };
}

/* --------------------------------------------------------------- public API */

export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await fetchOr<RawSiteSettings | null>(siteSettingsQuery);
  if (!raw) return fallbackSiteSettings;
  try {
    return mapSiteSettings(raw);
  } catch {
    return fallbackSiteSettings;
  }
}

export async function getProjects(): Promise<Project[]> {
  const raw = await fetchOr<RawProject[] | null>(projectsQuery);
  if (!Array.isArray(raw) || raw.length === 0) return fallbackProjects;
  try {
    return raw.map(mapProject);
  } catch {
    return fallbackProjects;
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  const fallback = fallbackProjects.find((p) => p.slug === slug) ?? null;
  const raw = await fetchOr<RawProject | null>(projectBySlugQuery, { slug });
  if (!raw) return fallback;
  try {
    const index = fallbackProjects.findIndex((p) => p.slug === slug);
    return mapProject(raw, index >= 0 ? index : 0);
  } catch {
    return fallback;
  }
}

export async function getArchive(): Promise<ArchiveItem[]> {
  const raw = await fetchOr<RawArchiveItem[] | null>(archiveQuery);
  if (!Array.isArray(raw) || raw.length === 0) return fallbackArchive;
  try {
    return raw.map(mapArchiveItem);
  } catch {
    return fallbackArchive;
  }
}

export async function getArchiveItem(slug: string): Promise<ArchiveItem | null> {
  const raw = await fetchOr<RawArchiveItem | null>(archiveItemBySlugQuery, { slug });
  if (!raw) return null;
  try {
    return mapArchiveItem(raw, 0);
  } catch {
    return null;
  }
}

export async function getInfoPage(): Promise<InfoPage> {
  const raw = await fetchOr<RawInfoPage | null>(infoPageQuery);
  if (!raw) return fallbackInfoPage;
  try {
    return mapInfoPage(raw);
  } catch {
    return fallbackInfoPage;
  }
}
