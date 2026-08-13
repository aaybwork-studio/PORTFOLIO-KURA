/*
 * Background music.
 *
 * Every track is by HoliznaCC0, from the "Public Domain Lofi" album on Free
 * Music Archive, released under CC0 1.0 Universal. CC0 is a public-domain
 * dedication: commercial use is fine and no attribution is required. The
 * credit below is courtesy, not obligation.
 *
 * One artist rather than six was deliberate. The tracks shuffle continuously,
 * so a mixed bag would lurch in tone every few minutes; a single album stays
 * coherent whatever order it lands in.
 *
 * Pixabay was the other candidate and was rejected: half the shortlisted URLs
 * 404'd, and every surviving one was labelled "AI modified or generated",
 * which is a strange thing to soundtrack a designer's portfolio with.
 *
 * The files are NOT in the repo. Download them from the URLs below into
 * `public/audio/` using exactly the `file` names here. Until they exist the
 * player falls back to the synthesised pad — nothing breaks, it just does not
 * play music.
 */

export interface Track {
  /** Path under public/. */
  file: string;
  title: string;
  source: string;
}

export const TRACK_CREDIT = "Music by HoliznaCC0 (CC0 1.0)";

export const TRACKS: Track[] = [
  {
    file: "/audio/moon-unit.mp3",
    title: "Moon Unit",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/moon-unit-lofi-reflection-dreamy/",
  },
  {
    file: "/audio/lucid.mp3",
    title: "Lucid",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/lucid-lofi-dreamy-chill/",
  },
  {
    file: "/audio/calm-currents.mp3",
    title: "Calm Currents",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/",
  },
  {
    file: "/audio/tokyo-sunset.mp3",
    title: "Tokyo Sunset",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/",
  },
  {
    file: "/audio/still-life.mp3",
    title: "Still Life",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/still-life-lofi-chill-nostalgic/",
  },
  {
    file: "/audio/when-i-was-human.mp3",
    title: "When I Was Human",
    source:
      "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-i-was-human-lofi-chill/",
  },
];
