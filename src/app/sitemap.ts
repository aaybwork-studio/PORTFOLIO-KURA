import type { MetadataRoute } from "next";

import { getProjects } from "@/lib/content";
import { siteUrl } from "@/lib/site";

/*
 * Static routes plus one entry per case study.
 *
 * `getProjects` never throws — it falls back to the local content when Sanity
 * is unreachable — so a CMS outage produces a sitemap listing the fallback
 * slugs rather than a 500 on /sitemap.xml. A sitemap that is briefly wrong is
 * better than one that is missing, which is the state this was in.
 *
 * /studio is deliberately absent: it is the editor, not a page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/archive`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/info`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];

  const projects = await getProjects();
  const caseStudies: MetadataRoute.Sitemap = projects
    .filter((p) => !p.comingSoon)
    .map((p) => ({
      url: `${siteUrl}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...caseStudies];
}
