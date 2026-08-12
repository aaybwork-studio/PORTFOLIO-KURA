import type { Metadata } from "next";
import InfoView from "@/components/views/InfoView";
import { getInfoPage, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const info = await getInfoPage();
  return { title: "Info — Kura", description: info.heading };
}

export default async function InfoPageRoute() {
  const [info, settings] = await Promise.all([getInfoPage(), getSiteSettings()]);
  return <InfoView info={info} settings={settings} />;
}
