# Background music

The site shuffles six lofi tracks behind the header recorder toggle. **The audio
files are not in the repo** — download them here yourself, once.

All six are by **HoliznaCC0**, from the *Public Domain Lofi* album on Free Music
Archive, released under **CC0 1.0 Universal**. CC0 is a public-domain
dedication: commercial use is allowed and **no attribution is required**. The
credit in `src/lib/tracks.ts` is courtesy, not obligation.

## What to download

Open each link, hit the download button, and save it here under **exactly** the
filename in the left column. The player looks these paths up by name.

| Save as | Track | Link |
|---|---|---|
| `moon-unit.mp3` | Moon Unit | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/moon-unit-lofi-reflection-dreamy/ |
| `lucid.mp3` | Lucid | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/lucid-lofi-dreamy-chill/ |
| `calm-currents.mp3` | Calm Currents | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/ |
| `tokyo-sunset.mp3` | Tokyo Sunset | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/ |
| `still-life.mp3` | Still Life | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/still-life-lofi-chill-nostalgic/ |
| `when-i-was-human.mp3` | When I Was Human | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-i-was-human-lofi-chill/ |

The album has 42 tracks. Swap any of these for others you prefer — just keep the
filenames in step with `src/lib/tracks.ts`.

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
