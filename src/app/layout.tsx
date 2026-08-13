import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/*
  Two faces, two jobs.

  IntraNet is a unicase display face: cap-height and x-height are both 800, so
  lowercase draws at cap height and there is no ascender/descender rhythm to
  read by. It is only used at >= 28px. Its default line box is 1.8em
  (ascent 1200 / descent -599 on a 1000 upm), so anything set in it must
  declare its own line-height or the leading blows out.

  Noto Sans carries everything else. Small tracked labels use its `wdth` axis
  (font-stretch: 87.5%) instead of a third family — that is what replaced the
  design's IBM Plex Mono.
*/
const intranet = localFont({
  src: [
    { path: "./fonts/IntraNet-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IntraNet-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: false,
  fallback: ["Noto Sans", "Helvetica Neue", "Arial", "sans-serif"],
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-body",
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
    <html lang="en" className={`${intranet.variable} ${notoSans.variable}`}>
      {/*
        The shell (plates, cursor, Lenis, WebGL background) lives in the
        (site) group, not here — the Studio at /studio must not inherit it.
      */}
      <body>{children}</body>
    </html>
  );
}
