/**
 * Archive contents: posters, interface studies and photographs.
 *
 * Posters and UI sets open onto their own page, so they carry a gallery — the
 * whole artefact first, then real crops cut from the source file. Photographs
 * do not open, so they are a plate and a title and nothing more.
 *
 * Image paths are the derivatives written by scripts/archive-derivatives.py.
 * Consumed by scripts/seed-archive.ts.
 */

export type ArchiveKind = "poster" | "ui" | "photo";

export interface GallerySeed {
  src: string;
  span: "full" | "half";
  alt: string;
}

export interface ArchiveSeed {
  slug: string;
  title: string;
  kind: ArchiveKind;
  year?: string;
  note?: string;
  card: string;
  gallery: GallerySeed[];
}

const B = "/media/archive";

/*
 * What you see when a poster opens: it printed and hung, it framed, then the
 * details. The flat file is already the card, so it is not repeated here —
 * opening a plate should show you something the plate could not.
 */
const posterGallery = (slug: string, crops: [string, string, string], title: string): GallerySeed[] => [
  { src: `${B}/${slug}/mock-wall.jpg`, span: "full", alt: `${title}, printed` },
  { src: `${B}/${slug}/mock-framed.jpg`, span: "full", alt: `${title}, framed` },
  { src: `${B}/${slug}/crop-${crops[0]}.jpg`, span: "half", alt: `${title}, ${crops[0]} detail` },
  { src: `${B}/${slug}/crop-${crops[1]}.jpg`, span: "half", alt: `${title}, ${crops[1]} detail` },
  { src: `${B}/${slug}/crop-${crops[2]}.jpg`, span: "full", alt: `${title}, ${crops[2]} detail` },
];

/*
 * A gist, not a walkthrough.
 *
 * These are archive plates, not case studies: fifteen consecutive kiosk states
 * is a spec document, and nobody scrolls one out of curiosity. Each set picks
 * the few screens that carry the idea — the entry point, the decision, the
 * payoff — and leaves the rest in the file.
 */
const screens = (slug: string, picks: number[], title: string, labels: string[]): GallerySeed[] =>
  picks.map((n, i) => ({
    // The mockup, never the bare export. A screenshot on its own says nothing
    // about where the thing lives; a kiosk screen belongs on a kiosk and a
    // storefront belongs in a browser window.
    src: `${B}/${slug}/mock-${String(n).padStart(2, "0")}.jpg`,
    span: i === 0 ? ("full" as const) : ("half" as const),
    alt: `${title}, ${labels[i] ?? `screen ${n}`}`,
  }));

export const posters: ArchiveSeed[] = [
  {
    slug: "berserk",
    title: "Berserk 1966–2021",
    kind: "poster",
    year: "2024",
    note: "A broadsheet tribute to Kentaro Miura, built to be read like a newspaper rather than looked at like a poster. Everything is monochrome, so the hierarchy has to come from rules, scale and hatching alone. Printed at A2.",
    card: `${B}/berserk/card.jpg`,
    gallery: posterGallery("berserk", ["spine", "vortex", "guts"], "Berserk"),
  },
  {
    slug: "the-pink-tape",
    title: "The Pink Tape",
    kind: "poster",
    year: "2024",
    note: "A cover reinterpretation. The exercise was seeing how far outlined display type can be pushed before it stops reading, then pulling it back one step.",
    card: `${B}/the-pink-tape/card.jpg`,
    gallery: posterGallery("the-pink-tape", ["display", "portrait", "badge"], "The Pink Tape"),
  },
  {
    slug: "marshall-mathers",
    title: "Marshall Mathers",
    kind: "poster",
    year: "2024",
    note: "Almost no type and one archival photograph. Most of the work went into grain and dust, getting a clean digital file to feel like something that had been sitting in a drawer.",
    card: `${B}/marshall-mathers/card.jpg`,
    gallery: posterGallery("marshall-mathers", ["portrait", "script", "wordmark"], "Marshall Mathers"),
  },
  {
    slug: "dave-grohl",
    title: "Dave Grohl 1994",
    kind: "poster",
    year: "2024",
    note: "Two colours, one stencil portrait, and a sidebar that behaves like a record sleeve spine. The crease texture runs over the whole thing so the layers sit on one surface.",
    card: `${B}/dave-grohl/card.jpg`,
    gallery: posterGallery("dave-grohl", ["spine", "stencil", "roundel"], "Dave Grohl"),
  },
  {
    slug: "bring-me-the-horizon",
    title: "Bring Me The Horizon",
    kind: "poster",
    year: "2024",
    note: "Black metal logotype conventions applied to a band that is not black metal. Symmetrical build, ornate frame, and a halftone screen coarse enough to see the dots at print size.",
    card: `${B}/bring-me-the-horizon/card.jpg`,
    gallery: posterGallery("bring-me-the-horizon", ["logotype", "halftone", "frame"], "Bring Me The Horizon"),
  },
  {
    slug: "i-choose-me",
    title: "I Choose Me",
    kind: "poster",
    year: "2024",
    note: "One phrase, repeated and warped until it becomes the background itself. The figure sits low so the type has room to do the shouting.",
    card: `${B}/i-choose-me/card.jpg`,
    gallery: posterGallery("i-choose-me", ["type", "warp", "figure"], "I Choose Me"),
  },
  {
    slug: "the-weeknd",
    title: "After Hours Collage",
    kind: "poster",
    year: "2023",
    note: "A collage assembled from an era's worth of imagery, held together by a single blue cast so a dozen different sources read as one surface.",
    card: `${B}/the-weeknd/card.jpg`,
    gallery: posterGallery("the-weeknd", ["portrait", "panels", "wordmark"], "After Hours"),
  },
  {
    slug: "tentacion",
    title: "Tentacion Tribute",
    kind: "poster",
    year: "2023",
    note: "Mixed media, mostly by hand: scribbles, brush marks, torn paper and lyric fragments layered until the surface felt worked rather than designed.",
    card: `${B}/tentacion/card.jpg`,
    gallery: posterGallery("tentacion", ["portrait", "marks", "lettering"], "Tentacion"),
  },
  {
    slug: "twelve-carat-toothache",
    title: "Twelve Carat Toothache",
    kind: "poster",
    year: "2023",
    note: "A tracklist poster where the type does the layout work. Red on near-black, one photo window, and leader dots holding the bottom third together.",
    card: `${B}/twelve-carat-toothache/card.jpg`,
    gallery: posterGallery("twelve-carat-toothache", ["portrait", "title", "tracklist"], "Twelve Carat Toothache"),
  },
  {
    slug: "air-max-97",
    title: "Air Max 97",
    kind: "poster",
    year: "2023",
    note: "Product photography treated as editorial. The wordmark bleeds off both edges on purpose, so the eye finishes the letters and the shoe stays the subject.",
    card: `${B}/air-max-97/card.jpg`,
    gallery: posterGallery("air-max-97", ["wordmark", "shoe", "specs"], "Air Max 97"),
  },
  {
    slug: "less-is-more",
    title: "Less Is More",
    kind: "poster",
    year: "2023",
    note: "The quiet one. A line-art pattern at low contrast, a vertical column of Japanese type, and a single circular anchor low in the frame.",
    card: `${B}/less-is-more/card.jpg`,
    gallery: posterGallery("less-is-more", ["headline", "column", "medallion"], "Less Is More"),
  },
];

export const uiSets: ArchiveSeed[] = [
  {
    slug: "dishamitra-kiosk",
    title: "DishaMitra Kiosk",
    kind: "ui",
    year: "2024",
    note: "A metro ticketing kiosk for people who are queueing, in a hurry, and often not reading in their first language. Bilingual from the first screen rather than behind a settings toggle, and every path ends in something you can walk away with. Fifteen screens in the file; the five that carry the idea are here.",
    card: `${B}/dishamitra-kiosk/card.jpg`,
    gallery: screens(
      "dishamitra-kiosk",
      [1, 3, 6, 10, 14],
      "DishaMitra",
      ["home", "destination", "payment", "receipt", "cancel"]
    ),
  },
  {
    slug: "music-store-concept",
    title: "Music Store Concept",
    kind: "ui",
    year: "2024",
    note: "A storefront for physical music, built as an excuse to work on product pages in light and dark. Home, browse, product, checkout.",
    card: `${B}/music-store-concept/card.jpg`,
    gallery: screens(
      "music-store-concept",
      [1, 2, 4, 6],
      "Music store",
      ["home", "category", "product", "checkout"]
    ),
  },
  {
    slug: "photo-store-concept",
    title: "Photography Store",
    kind: "ui",
    year: "2024",
    note: "A small commerce concept for selling prints, made alongside the college photography work. Landing page and product page only, which was the whole scope.",
    card: `${B}/photo-store-concept/card.jpg`,
    gallery: screens("photo-store-concept", [1, 2], "Photography store", ["landing", "product"]),
  },
];

/*
 * Photographs. The plate is a 4:5 crop for the carousel; opening one shows the
 * frame uncropped and nothing else. Titles say what is in the shot, because a
 * photograph does not need a concept attached to it.
 */
const PHOTO_TITLES = [
  "Scooter in corridor",
  "Glass roof in rain",
  "Floodlight mast",
  "Pigeons on beam",
  "Telecom antennas",
  "Scaffolding on brick",
  "Wires at sunset",
  "Palms before hills",
  "Royal Enfield tank",
  "Leaf on ledge",
  "Moss on concrete",
  "Umbrella on wet road",
  "Fighter jet roundel",
  "Monkeys on glass",
  "Basketball jump shot",
];

export const photos: ArchiveSeed[] = PHOTO_TITLES.map((title, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    slug: `photograph-${n}`,
    title,
    kind: "photo" as const,
    year: "2023",
    card: `${B}/photography/photo-${n}-card.jpg`,
    gallery: [
      { src: `${B}/photography/photo-${n}.jpg`, span: "full" as const, alt: title },
    ],
  };
});
