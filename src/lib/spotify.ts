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
const TOP_TRACKS_URL =
  "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term";
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
      // 400 here almost always means the refresh token was revoked or belongs
      // to a different app than the client id/secret.
      warn(`token refresh failed (${res.status}). Re-run \`npm run spotify:auth\`.`);
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
 * The most-played albums of the last four weeks, deduped — Spotify returns
 * tracks, and several tracks off one album should not fill the whole row.
 */
export async function getNowPlaying(limit = 6): Promise<NowPlayingItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(TOP_TRACKS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) {
      // 403 is the giveaway that the Spotify app is in development mode and
      // this account is not on its allow-list.
      warn(`top-tracks request failed (${res.status}).`);
      return [];
    }

    const json = (await res.json()) as { items?: SpotifyTrack[] };
    const items = Array.isArray(json.items) ? json.items : [];

    const seen = new Set<string>();
    const out: NowPlayingItem[] = [];

    for (const track of items) {
      const album = track?.album;
      const url = album?.external_urls?.spotify;
      const image = album ? pickImage(album.images) : null;
      if (!album?.name || !url || !image) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({
        title: album.name,
        artist: album.artists?.map((a) => a.name).join(", ") ?? "",
        image,
        url,
      });
      if (out.length >= limit) break;
    }

    return out;
  } catch {
    return [];
  }
}
