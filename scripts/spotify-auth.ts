/*
 * One-time Spotify authorisation.
 *
 *   npm run spotify:auth
 *
 * Spins a throwaway localhost server, opens the consent screen, catches the
 * callback, and prints the refresh token. Refresh tokens do not expire, so this
 * is run once and the output pasted into .env.local and Vercel.
 *
 * Before running, in the Spotify dashboard (developer.spotify.com/dashboard):
 *   - create an app
 *   - add EXACTLY this redirect URI: http://127.0.0.1:8888/callback
 *   - put the Client ID and Client Secret in .env.local
 *
 * Spotify rejects `localhost` in redirect URIs now; it must be 127.0.0.1.
 */

import { createServer } from "node:http";
import { exec } from "node:child_process";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ["user-top-read", "user-read-recently-played"].join(" ");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.\n" +
      "Add both to .env.local first — see developer.spotify.com/dashboard.",
  );
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  });

async function exchange(code: string): Promise<void> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const json = (await res.json()) as { refresh_token?: string; error_description?: string };

  if (!res.ok || !json.refresh_token) {
    console.error("\nToken exchange failed:", json.error_description ?? res.statusText);
    process.exit(1);
  }

  console.log("\n  Add this to .env.local and to the Vercel project:\n");
  console.log(`  SPOTIFY_REFRESH_TOKEN=${json.refresh_token}\n`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error || url.searchParams.get("state") !== state || !code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(error ? `Spotify returned: ${error}` : "Bad callback.");
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Done. You can close this tab and go back to the terminal.");

  await exchange(code);
  server.close();
  process.exit(0);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("\n  Opening Spotify consent in your browser.");
  console.log("  If it does not open, paste this URL yourself:\n");
  console.log(`  ${authUrl}\n`);
  const open =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${open} "${authUrl}"`);
});
