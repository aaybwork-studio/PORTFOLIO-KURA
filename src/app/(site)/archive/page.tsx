import type { Metadata } from "next";
import ArchiveView from "@/components/views/ArchiveView";
import { getArchive } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archive — Kura",
  description:
    "Posters, interface studies and photographs. Side work and experiments, kept because they were worth keeping, not because they were briefs.",
};

export default async function ArchivePage() {
  const items = await getArchive();
  return <ArchiveView items={items} />;
}
