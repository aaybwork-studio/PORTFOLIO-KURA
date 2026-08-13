import "server-only";
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

async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

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
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
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
    if (!res.ok) return [];

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
