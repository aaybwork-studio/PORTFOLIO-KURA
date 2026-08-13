import type { Metadata } from "next";
import InfoView from "@/components/views/InfoView";
import { getInfoPage, getSiteSettings } from "@/lib/content";
import { getNowPlaying } from "@/lib/spotify";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const info = await getInfoPage();
  return { title: "Info — Kura", description: info.roleLine };
}

export default async function InfoPageRoute() {
  // getNowPlaying resolves to [] when Spotify is unconfigured or unreachable,
  // so it never blocks the page from rendering.
  const [info, settings] = await Promise.all([getInfoPage(), getSiteSettings()]);
  // The exclusion list lives in the Studio, so the fetch waits on the content.
  const nowPlaying = await getNowPlaying(14, info.nowPlayingExclude);
  return <InfoView info={info} settings={settings} nowPlaying={nowPlaying} />;
}
