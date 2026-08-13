/*
 * One-off: bring the live siteSettings hero copy in line with the IntraNet
 * type scale. The phrases are width-budgeted against real font metrics — see
 * the note beside `heroPhrases` in src/lib/fallback.ts before changing them.
 *
 *   npx tsx scripts/patch-hero.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const settings = await client
    .patch("siteSettings")
    .set({
      heroLine: "I design UX that works.",
      heroPrefix: "I design",
      heroPhrases: ["UX that works.", "research first.", "the whole flow.", "for real users."],
    })
    .commit();

  // The old heading carried an em-dash, which IntraNet has no glyph for — it
  // fell back to Noto Sans mid-sentence and was visible on the page.
  const info = await client
    .patch("infoPage")
    .set({ heading: "Interaction and UX, prototyped until it behaves." })
    .commit();

  console.log("siteSettings:", (settings as { heroPhrases?: string[] }).heroPhrases);
  console.log("infoPage:", (info as { heading?: string }).heading);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
