import type { NowPlayingItem } from "./types";

/*
 * Spotify has no anonymous "what is this person listening to" endpoint, so this
 * reads Aayush's own account through the Authorization Code flow:
 *
 *   1. `npm run spotify:auth` walks the one-time consent and prints a refresh
 *      token. Refresh tokens do not expire.
 *   2. That token lives in SPOTIFY_REFRESH_TOKEN and is traded for a
 *      short-lived access token on each revalidate.
 *
 * The app stays in Spotify's development mode — it only ever reads one account,
 * so the extended-quota review does not apply.
 *
 * Every failure path returns [] rather than throwing. A dead token or a Spotify
 * outage must not take the info page down, so the caller simply renders nothing
 * where the row would have been.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
/*
 * Two ranges, not one.
 *
 * `short_term` answers "what has he played recently", which is not the same
 * question as "what does he listen to" — a few days of one mood dominates it.
 * So `long_term` (years of listening) leads and decides rank.
 *
 * But one range caps at 50 tracks, and after collapsing to albums that is a
 * thin pool to draw a long scrolling row from. `medium_term` (about six
 * months) is appended to widen it: it brings in artists that years of ranking
 * buries, without letting last week's listening set the tone. Duplicates
 * across the two are dropped by the album de-dupe that runs anyway.
 */
const TOP_TRACKS_URLS = [
  "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term",
  "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term",
];
/** Revalidate window, in seconds. Listening habits do not move faster than this. */
const REVALIDATE = 3600;

interface SpotifyImage {
  url: string;
  width: number;
}

interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  artists: { name: string }[];
}

interface SpotifyTrack {
  album: SpotifyAlbum;
}

/*
 * The row still fails silently for visitors — a dead Spotify must not take the
 * info page with it — but the reason is logged on the server in every
 * environment, including production.
 *
 * It was dev-only, which made a misconfigured deployment indistinguishable from
 * a working one with nothing to show. This runs server-side, so it reaches the
 * Vercel runtime logs and never the browser. No secret is ever logged: only
 * lengths and shapes, which is enough to spot the usual mistakes.
 */
function warn(message: string): void {
  console.warn(`[spotify] ${message}`);
}

/**
 * Describe a value without revealing it. A pasted `NAME=value` line and a
 * quote-wrapped value are the two ways these variables usually get entered
 * wrong, and both are invisible in the Vercel UI.
 */
function shape(name: string, value: string | undefined): string {
  if (!value) return `${name}: MISSING`;
  const notes: string[] = [`len ${value.length}`];
  if (value.includes("=")) notes.push("CONTAINS '=' (pasted the whole NAME=value line?)");
  if (/^['"]|['"]$/.test(value)) notes.push("WRAPPED IN QUOTES");
  if (value !== value.trim()) notes.push("HAS SURROUNDING WHITESPACE");
  if (value.startsWith(name)) notes.push("STARTS WITH ITS OWN NAME");
  return `${name}: ${notes.join(", ")}`;
}

async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!id || !secret || !refresh) {
    warn(
      "not configured, hiding the row. " +
        [
          shape("SPOTIFY_CLIENT_ID", id),
          shape("SPOTIFY_CLIENT_SECRET", secret),
          shape("SPOTIFY_REFRESH_TOKEN", refresh),
        ].join(" | "),
    );
    return null;
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh,
      }),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) {
      /*
       * Spotify's own reason plus the shape of each value.
       *
       * The shape report used to run only when a variable was absent, which
       * missed the case that actually happens: a value that is present but
       * carries its own `NAME=` prefix from a copied .env line. That is
       * truthy, so it sailed past the missing-check and came back as a bare
       * 400 with nothing to explain it.
       *
       * `invalid_client` points at the id/secret, `invalid_grant` at the
       * refresh token. Neither the body nor the shapes contain a secret.
       */
      let detail = res.statusText;
      try {
        const body = (await res.json()) as { error?: string; error_description?: string };
        detail = [body.error, body.error_description].filter(Boolean).join(": ") || detail;
      } catch {
        /* non-JSON error body; the status is still informative */
      }
      warn(
        `token refresh failed (${res.status}) ${detail}. ` +
          [
            shape("SPOTIFY_CLIENT_ID", id),
            shape("SPOTIFY_CLIENT_SECRET", secret),
            shape("SPOTIFY_REFRESH_TOKEN", refresh),
          ].join(" | "),
      );
      return null;
    }
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    warn("could not reach accounts.spotify.com.");
    return null;
  }
}

/** Pick the smallest image at least 200px wide — album art renders around 160px. */
function pickImage(images: SpotifyImage[]): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.width - b.width);
  return (sorted.find((i) => i.width >= 200) ?? sorted[sorted.length - 1]).url;
}

/**
 * All-time most-played albums, deduped — Spotify returns tracks, and several
 * tracks off one album should not fill the whole row.
 *
 * `exclude` drops artists by name, case-insensitively, matching on substrings
 * so "The Weeknd" catches a feature credit too. Top-items is a raw play count:
 * anything played enough shows up, whether or not it belongs on a portfolio.
 * Rather than guess at that, the list is editable in the Studio.
 *
 * The limit is generous because the row scrolls — a short list visibly repeats.
 */
export async function getNowPlaying(
  limit = 24,
  exclude: string[] = [],
): Promise<NowPlayingItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const blocked = exclude
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  try {
    const responses = await Promise.all(
      TOP_TRACKS_URLS.map((url) =>
        fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: REVALIDATE },
        }),
      ),
    );

    // One range failing is survivable; the other still fills the row. Only a
    // total failure is worth reporting, since 403 means the Spotify app is in
    // development mode without this account on its allow-list.
    const items: SpotifyTrack[] = [];
    for (const res of responses) {
      if (!res.ok) {
        warn(`top-tracks request failed (${res.status}).`);
        continue;
      }
      const json = (await res.json()) as { items?: SpotifyTrack[] };
      if (Array.isArray(json.items)) items.push(...json.items);
    }
    if (items.length === 0) return [];

    /*
     * Collapse to albums, then spread across artists.
     *
     * Top-items is ranked by raw play count, so a favourite artist takes four
     * of the fourteen slots and the row reads as one person's discography
     * rather than as a range of taste. Deduping by album alone did not fix
     * that — Spotify is happy to return four albums by the same artist.
     *
     * So it fills in passes: one album per artist first, in rank order, then
     * a second from each, and so on until the row is full. Rank still decides
     * who appears; the passes only decide how many each gets.
     */
    const seen = new Set<string>();
    const byArtist = new Map<string, NowPlayingItem[]>();

    for (const track of items) {
      const album = track?.album;
      const url = album?.external_urls?.spotify;
      const image = album ? pickImage(album.images) : null;
      if (!album?.name || !url || !image) continue;
      if (seen.has(url)) continue;

      const artist = album.artists?.map((a) => a.name).join(", ") ?? "";
      const haystack = `${artist} ${album.name}`.toLowerCase();
      if (blocked.some((b) => haystack.includes(b))) continue;

      seen.add(url);
      // Group on the lead artist so a feature credit does not read as a
      // separate act and win itself an extra slot.
      const key = (album.artists?.[0]?.name ?? artist).toLowerCase();
      const bucket = byArtist.get(key);
      if (bucket) bucket.push({ title: album.name, artist, image, url });
      else byArtist.set(key, [{ title: album.name, artist, image, url }]);
    }

    const buckets = [...byArtist.values()];
    const out: NowPlayingItem[] = [];
    const deepest = Math.max(0, ...buckets.map((b) => b.length));

    for (let round = 0; round < deepest && out.length < limit; round++) {
      for (const bucket of buckets) {
        if (out.length >= limit) break;
        const item = bucket[round];
        if (item) out.push(item);
      }
    }

    return out;
  } catch {
    return [];
  }
}
