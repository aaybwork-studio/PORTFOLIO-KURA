import type { Metadata } from "next";

import { pageMeta } from "@/lib/site";
import InfoView from "@/components/views/InfoView";
import { getInfoPage, getSiteSettings } from "@/lib/content";
import { getNowPlaying } from "@/lib/spotify";

export const revalidate = 60;

/*
 * The description is written here rather than pulled from `info.roleLine`.
 * The role line is one clause sized for the top of the page, so as a search
 * result it read as a job title and nothing else. This says what the page
 * actually contains.
 */
export const metadata: Metadata = pageMeta({
  title: "Info",
  path: "/info",
  description:
    "Who I am and what I work with. There is also a FAQ, including an honest answer about why my case studies look the way they do.",
});

export default async function InfoPageRoute() {
  // getNowPlaying resolves to [] when Spotify is unconfigured or unreachable,
  // so it never blocks the page from rendering.
  const [info, settings] = await Promise.all([getInfoPage(), getSiteSettings()]);
  // The exclusion list lives in the Studio, so the fetch waits on the content.
  const nowPlaying = await getNowPlaying(24, info.nowPlayingExclude);
  return <InfoView info={info} settings={settings} nowPlaying={nowPlaying} />;
}
