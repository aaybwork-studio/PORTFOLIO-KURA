import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/*
 * There was no robots.txt at all, so every crawler and scanner asking for one
 * got the rendered 404 page — a 200-sized HTML response to a request that
 * wanted six lines of text.
 *
 * The Studio is disallowed because it is the CMS editor, not content. It is
 * behind a login either way; keeping it out of the index just stops it turning
 * up in search results for the site's own name.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/studio/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
