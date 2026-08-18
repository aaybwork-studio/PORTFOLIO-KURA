import type { Metadata } from "next";

import BriefView from "@/components/views/BriefView";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Build a brief — Kura",
  description:
    "Seven questions that turn a rough idea into something worth replying to. Takes about two minutes.",
};

export const revalidate = 60;

/*
 * A real route rather than an overlay.
 *
 * It is linkable, it survives a refresh, and the browser Back button does what
 * someone expects halfway through a form. An overlay would keep the page behind
 * it, which sounds lighter until a refresh loses four answered questions.
 *
 * The address is passed down so the error state can offer it: if the send fails
 * the one thing that must not happen is a dead end.
 */
export default async function BriefPage() {
  const settings = await getSiteSettings();
  return <BriefView email={settings.email} />;
}
