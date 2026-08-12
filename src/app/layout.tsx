import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aayushbhandari.com";

const TITLE = "Kura — Aayush Bhandari";
const DESCRIPTION =
  "Aayush Bhandari — interaction and UX designer in Noida. Open to full-time roles, freelance and contract projects.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kura",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      {/*
        The shell (plates, cursor, Lenis, WebGL background) lives in the
        (site) group, not here — the Studio at /studio must not inherit it.
      */}
      <body>{children}</body>
    </html>
  );
}
