import type { Metadata } from "next";
import ArchiveView from "@/components/views/ArchiveView";
import { getArchive } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archive — Kura",
  description: "Posters, studies, sketches and motion tests.",
};

export default async function ArchivePage() {
  const items = await getArchive();
  return <ArchiveView items={items} />;
}
