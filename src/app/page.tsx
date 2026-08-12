import HomeView from "@/components/views/HomeView";
import { getProjects, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()]);
  return <HomeView settings={settings} projects={projects} />;
}
