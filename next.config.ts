import type { NextConfig } from "next";

/*
 * Content Security Policy.
 *
 * Two policies, on mutually exclusive paths. Browsers enforce the intersection
 * of every CSP header they are sent, so shipping both to the same URL would
 * silently apply the strictest combination of the two and break something at a
 * time nobody is looking. The `(?!studio)` negative lookahead keeps them apart.
 *
 * `'unsafe-inline'` on scripts is not an oversight. Next.js injects inline
 * bootstrap and hydration scripts on every page, and the only way to drop it is
 * a per-request nonce, which requires moving every route to dynamic rendering —
 * this site is almost entirely static, so that trade is not worth it. The
 * directives that actually stop the attacks in the report — frame-ancestors,
 * object-src, base-uri, form-action — are strict.
 */
const SITE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  // Nothing on this site is meant to be framed; this is the clickjacking fix.
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // cdn.sanity.io: project images. i.scdn.co: Spotify album art.
  "img-src 'self' data: blob: https://cdn.sanity.io https://i.scdn.co",
  // The lofi tracks are local files served from /audio.
  "media-src 'self'",
  "connect-src 'self' https://*.sanity.io https://*.apicdn.sanity.io",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

/*
 * The Studio gets its own, looser policy.
 *
 * It is a full editor: it loads user avatars from whatever identity provider an
 * editor signed in with, opens blob URLs for uploads and previews, and holds a
 * websocket for real-time collaboration. Locking it to the site's origin list
 * would break it, and it is behind a login, so the useful control there is
 * frame-ancestors rather than a source allowlist.
 */
const STUDIO_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://cdn.sanity.io",
  "connect-src 'self' https: wss://*.sanity.io",
  "frame-src 'self' https://*.sanity.io",
  "worker-src 'self' blob:",
].join("; ");

/* Deny every powerful feature this site does not use. */
const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=(self)",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const BASE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  /*
   * Belt and braces with `frame-ancestors`. X-Frame-Options is the older
   * mechanism and is ignored by browsers that understand CSP, but it is still
   * what most scanners check for and it costs nothing.
   */
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin cross-site, the full path same-site. Referrers are how
  // mailto targets and analytics elsewhere learn which page someone left.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  /*
   * Running `next build` while `next dev` is live overwrites the chunks the dev
   * server is serving from, and it starts throwing MODULE_NOT_FOUND until it is
   * restarted with a clean cache. `npm run build:check` sets NEXT_DIST_DIR so a
   * verification build lands somewhere else and leaves the running server alone.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  typedRoutes: false,

  /* Free fingerprinting for anyone scanning; nothing depends on it. */
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
      // Spotify album art on the info page.
      {
        protocol: "https",
        hostname: "i.scdn.co",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: BASE_HEADERS,
      },
      {
        // Everything except the Studio.
        source: "/((?!studio).*)",
        headers: [{ key: "Content-Security-Policy", value: SITE_CSP }],
      },
      {
        source: "/studio/:path*",
        headers: [
          { key: "Content-Security-Policy", value: STUDIO_CSP },
          // The CMS should never be indexed, whatever robots.txt says.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
