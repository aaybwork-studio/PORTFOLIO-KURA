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
  if (!project) return { title: "Not found" };
  /*
   * The opening paragraph of a case study runs to several hundred characters,
   * and Google cuts a description around 155. Left whole it was truncated
   * mid-word with an ellipsis. Trimming at the last sentence that fits ends
   * the result on a full stop instead.
   */
  const source = project.sections[0]?.body ?? project.discipline;
  const description = (() => {
    const text = source.trim().replace(/\s+/g, " ");
    if (text.length <= 160) return text;
    const cut = text.slice(0, 160);
    const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    /* No sentence break in range means one very long opening sentence, so fall
       back to the last whole word rather than splitting it. */
    return stop > 60 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
  })();

  /*
   * The bare project name. The root layout's title template appends the brand,
   * so spelling it out here produced "ORBIT — Kura — Kura".
   */
  const title = project.title;
  /* What the card shows, which is not what the page shows. `full` carries the
     brand because a shared link has no tab or breadcrumb to supply it. */
  const social = `${project.title} — Kura`;

  /*
   * Hero images come off the Sanity CDN at their full upload size, which for
   * these is around 2800px wide. A scraper downloads that whole file to build
   * a card it renders at 600px, and some of them give up on a slow fetch. The
   * CDN resizes on request, so ask for the size the card actually needs.
   */
  const card = (() => {
    const src = project.heroImage.src;
    if (!src) return undefined;
    /* Set the params rather than appending them: the stored URL already ends
       in `fit=max`, and a second `fit` in the query string is undefined
       behaviour rather than an override. */
    const url = new URL(src);
    url.searchParams.set("w", "1200");
    url.searchParams.set("h", "630");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("auto", "format");
    return url.toString();
  })();

  const images = card
    ? [
        {
          url: card,
          width: 1200,
          height: 630,
          alt: project.heroImage.alt || `${project.title}, a case study by Aayush Bhandari`,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { type: "article", url: `/work/${slug}`, title: social, description, images },
    /*
      Twitter has to be set here too. It is not derived from `openGraph`, so a
      page that overrides only the OG block still inherits the root layout's
      twitter tags, and every case study shared to X showed the home page card.
    */
    twitter: { card: "summary_large_image", title: social, description, images },
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
