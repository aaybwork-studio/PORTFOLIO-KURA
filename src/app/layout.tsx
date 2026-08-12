import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/shell/SiteShell";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kura.aayushbhandari.com";

const TITLE = "Kura — Aayush Bhandari";
const DESCRIPTION = "I design interfaces that behave, then build them to prove it.";

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
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
