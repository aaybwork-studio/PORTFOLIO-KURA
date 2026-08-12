import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectView from "@/components/views/ProjectView";
import { getProject, getProjects, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Not found — Kura" };
  const description = project.sections[0]?.body ?? project.discipline;
  return {
    title: `${project.title} — Kura`,
    description,
    openGraph: {
      title: `${project.title} — Kura`,
      description,
      images: project.heroImage.src ? [{ url: project.heroImage.src }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [project, projects, settings] = await Promise.all([
    getProject(slug),
    getProjects(),
    getSiteSettings(),
  ]);
  if (!project) notFound();

  const index = Math.max(
    0,
    projects.findIndex((p) => p.slug === project.slug)
  );
  // design line 1402: nextTitle = PROJECTS[(i + 1) % PROJECTS.length]
  const nextProject = projects[(index + 1) % projects.length] ?? project;

  return (
    <ProjectView
      project={project}
      nextProject={nextProject}
      index={index}
      settings={settings}
    />
  );
}
