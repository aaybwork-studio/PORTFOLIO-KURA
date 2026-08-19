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

/*
 * The description is the one line a stranger reads before deciding whether to
 * click, and it is read in two places that want different things: Google cuts
 * it around 155 characters, and a chat unfurl shows perhaps the first hundred.
 * So the specifics go first and the availability goes last, where losing it
 * costs nothing.
 *
 * It is deliberately concrete — case studies, side projects, a poster archive —
 * because a list of real things on the site outruns any amount of adjectives
 * about being passionate and detail-oriented.
 */
const DESCRIPTION =
  "I like to build things. Interaction, UX and product design out of Noida — case studies, side projects and a poster archive. Open to work.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    /* Subpages set a bare title and inherit the brand half. */
    template: "%s — Kura",
  },
  description: DESCRIPTION,
  /* Terms someone would actually type. No keyword stuffing — search engines
     ignore this tag, but some social and AI crawlers still read it. */
  keywords: [
    "Aayush Bhandari",
    "Kura",
    "interaction designer",
    "UX designer",
    "product designer",
    "portfolio",
    "Noida",
    "India",
  ],
  authors: [{ name: "Aayush Bhandari", url: SITE_URL }],
  creator: "Aayush Bhandari",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kura",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
  },
  /*
    `summary_large_image` is what turns an X post from a link with a thumbnail
    into the full-width card. Without it the card falls back to the small
    square variant and the wordmark is unreadable.

    No `images` key on either block: opengraph-image.png sits beside this file
    and Next wires it into both, with the right absolute URL and dimensions.
  */
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
