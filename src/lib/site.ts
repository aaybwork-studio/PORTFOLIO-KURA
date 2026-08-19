import type { Metadata } from "next";

/**
 * The site's own canonical origin.
 *
 * robots.txt and the sitemap have to emit absolute URLs, and a wrong host there
 * is worse than no file at all — it points crawlers at somewhere that is not
 * this site. Vercel exposes the deployment host, but that is the per-deployment
 * `*.vercel.app` name on previews, so the real domain is preferred and the
 * others are only a fallback.
 */
const FALLBACK = "https://aayushbhandari.com";

export const siteUrl: string = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  FALLBACK
).replace(/\/+$/, "");

/**
 * Page metadata that actually reaches the social card.
 *
 * Setting only `description` on a page is not enough. Next inherits the root
 * layout's whole `openGraph` object when a child does not define one, so a
 * hand-written page description reached Google's result and nothing else —
 * every page shared to Slack or WhatsApp unfurled with the home page's copy.
 * The same is true of `twitter`, which is not derived from `openGraph` either.
 *
 * `path` gives the page its own canonical URL. Omitting `image` is deliberate:
 * with no images key the root's opengraph-image is inherited, which is the
 * right card for any page that does not have art of its own.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const full = `${title} — Kura`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: full, description },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
