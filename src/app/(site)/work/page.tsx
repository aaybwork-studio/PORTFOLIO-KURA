import type { Metadata } from "next";
import WorkView from "@/components/views/WorkView";
import { getProjects, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Work — Kura",
  description: "Featured projects by Aayush Bhandari.",
};

export default async function WorkPage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()]);
  return <WorkView settings={settings} projects={projects} />;
}
