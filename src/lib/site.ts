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
