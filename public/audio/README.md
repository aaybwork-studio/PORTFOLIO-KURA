# Background music

The site shuffles six lofi tracks behind the header recorder toggle. **The audio
files are not in the repo** — download them here yourself, once.

All six are by **HoliznaCC0**, from the *Public Domain Lofi* album on Free Music
Archive, released under **CC0 1.0 Universal**. CC0 is a public-domain
dedication: commercial use is allowed and **no attribution is required**. The
credit in `src/lib/tracks.ts` is courtesy, not obligation.

## Download them

Run `npm run tracks:fetch` from the project root. It pulls all six and checks
each one is real audio.

Note the URLs below point at FMA's CDN, **not** at `/track/<slug>/download/`.
That download route serves a login page to anyone who is not signed in, and
curl happily saves the HTML as an `.mp3` — six identical 27 KB files that look
downloaded and are not. The CDN paths need no account.

| Save as | Track | File |
|---|---|---|
| `moon-unit.mp3` | Moon Unit | `CbNZO1QUuJq1f50RHzZ5kykNj1hdqT04UaWOYSNf.mp3` |
| `lucid.mp3` | Lucid | `je7RethXWuduCoRV6Gq3w25yDXvxYnnOWt5OGlgv.mp3` |
| `calm-currents.mp3` | Calm Currents | `4rKapZUMNnNSPAOvpjlfSH6B5Ib8rgEWdvjnM7C6.mp3` |
| `tokyo-sunset.mp3` | Tokyo Sunset | `Xnd9Hr5AVzB68IlWcImKtXPlwCePD2G2m8ZFSVj4.mp3` |
| `still-life.mp3` | Still Life | `X2xAunfMENT4KSm1XpnQC2qUUC4hcMVbDXBMw9GI.mp3` |
| `when-i-was-human.mp3` | When I Was Human | `ChrX4PnONgrlvh9m2tgYBpK7mwnbfpLJoo36OOFW.mp3` |

All under `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/`.

The album has 42 tracks. To swap any of these, open the album page, run
`JSON.parse(document.querySelector('[data-track-info]').getAttribute('data-track-info')).fileUrl`
in the console on a track page to get its CDN path, and update
`scripts/fetch-tracks.ts` and `src/lib/tracks.ts` together.

## Until then

Nothing breaks. With the files missing the recorder falls back to the
synthesised pad, exactly as it behaved before the music existed.

## Commit them

**The mp3s must be committed to git.** Vercel builds from the repository, so a
file that is only on your laptop will not exist in production — the music would
work locally and silently fall back to the pad on the live site.

## Size

Six tracks at roughly 3 minutes each is about 20–30 MB in the repo. The browser
only downloads them when a visitor actually turns sound on — the `<audio>`
element has no `src` until then — so it costs nothing on first load. If the repo
size ever becomes a problem, move the files to Vercel Blob and point
`src/lib/tracks.ts` at the CDN URLs instead.

Re-encoding to ~96 kbps mono is also reasonable — it is background texture, not
a listening experience, and it roughly halves the size.
