import type { Metadata } from "next";

import { pageMeta } from "@/lib/site";
import ArchiveView from "@/components/views/ArchiveView";
import { getArchive } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = pageMeta({
  title: "Archive",
  path: "/archive",
  description:
    "Posters, interface studies and photographs. Side work I kept because I liked it, which is the only filter it went through.",
});

export default async function ArchivePage() {
  const items = await getArchive();
  return <ArchiveView items={items} />;
}
