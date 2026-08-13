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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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

  const token = json.refresh_token;

  /*
   * Write it in rather than asking for a copy-paste.
   *
   * The first version only printed the token, which meant the one step that
   * actually completes the setup happened outside the script — and a token
   * scrolled off the terminal is a token that has to be re-fetched. The file
   * is rewritten in place: an existing SPOTIFY_REFRESH_TOKEN line is replaced,
   * otherwise the line is appended. Nothing else in the file is touched.
   */
  const envPath = resolve(process.cwd(), ".env.local");
  let wrote = false;
  try {
    const line = `SPOTIFY_REFRESH_TOKEN=${token}`;
    const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
    const next = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(existing)
      ? existing.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
      : `${existing}${existing.endsWith("\n") || existing === "" ? "" : "\n"}${line}\n`;
    writeFileSync(envPath, next, "utf8");
    wrote = true;
  } catch (err) {
    console.error("\n  Could not write .env.local:", (err as Error).message);
  }

  if (wrote) {
    console.log("\n  Written to .env.local. Restart `npm run dev` to pick it up.");
  } else {
    console.log("\n  Add this to .env.local yourself:");
  }
  // Printed either way — Vercel needs the same value pasted into the project's
  // environment variables, which no local file can do for you.
  console.log(`\n  SPOTIFY_REFRESH_TOKEN=${token}\n`);
  console.log("  Add that to the Vercel project's environment variables too.\n");
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
