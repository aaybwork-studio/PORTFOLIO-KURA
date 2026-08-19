import type { Metadata } from "next";

import { pageMeta } from "@/lib/site";
import WorkView from "@/components/views/WorkView";
import { getProjects, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = pageMeta({
  title: "Work",
  path: "/work",
  description:
    "Case studies by Aayush Bhandari. More of the thinking than the final screens, which is deliberate.",
});

export default async function WorkPage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()]);
  return <WorkView settings={settings} projects={projects} />;
}
