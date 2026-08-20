"use client";

import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import FaqList from "./FaqList";
import styles from "./views.module.css";
import type { InfoPage, NowPlayingItem, SiteSettings } from "@/lib/types";

type Props = { info: InfoPage; settings: SiteSettings; nowPlaying: NowPlayingItem[] };

/*
 * One left-aligned column, capped at a reading measure. Everything below the
 * bio is a small-caps label followed by its block, separated by generous space
 * rather than rules or boxes — the design's centred layout, badge pills,
 * marquee, stat row and boxed service grid were dropped when this page was
 * rebuilt against the reference.
 */

/*
 * One column width for the whole page.
 *
 * The reference reads as tidy because the name and the prose share both edges
 * — everything is the same measure, and that block is centred in the viewport.
 * An earlier pass let the name run to 1080px over a 62ch body, which left a
 * ragged right side and no shared alignment to read down.
 *
 * 880px is ~63 characters of Noto Sans at this size, so it is a proper reading
 * measure as well as the width the name is sized against.
 */
const COLUMN = 880;

const labelStyle: CSSProperties = {
  margin: "0 0 14px",
  fontFamily: "var(--ff-body)",
  fontStretch: "87.5%",
  fontWeight: 600,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  opacity: 0.62,
};

/* The underline lives in CSS now so it can change colour on hover; see
   `.infoLink` in views.module.css. */
const linkStyle: CSSProperties = {
  fontWeight: 600,
};

/** Label + block, at the standard rhythm. */
function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ paddingTop: "clamp(38px, 5.5vh, 68px)" }}>
      <p style={labelStyle}>{label}</p>
      {children}
    </section>
  );
}

/** A dot-separated inline row — toolkit, interests. */
function DotRow({ items }: { items: string[] }) {
  return (
    <p
      style={{
        margin: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: "0 10px",
        alignItems: "baseline",
        fontSize: "clamp(0.98rem, 1.25vw, 1.12rem)",
        lineHeight: 1.9,
        fontWeight: 500,
      }}
    >
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 ? <span style={{ opacity: 0.4 }}>·</span> : null}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}

export default function InfoView({ info, settings, nowPlaying }: Props) {
  const elsewhere = settings.socials.filter((s) => /^https?:/i.test(s.url));

  return (
    <main
      style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100svh",
        padding: "clamp(104px, 14vh, 168px) clamp(20px, 5vw, 64px) clamp(80px, 10vw, 140px)",
      }}
    >
      <div style={{ maxWidth: `min(100%, ${COLUMN}px)`, margin: "0 auto", textAlign: "left" }}>
        {/*
          The gaps around the name are larger than they look like they need to
          be. IntraNet's ink spans 1.19em inside a 0.92 line box, so the glyphs
          overflow their own box top and bottom and eat into whatever margin
          sits next to them. Specifying the optical gap means over-specifying
          the CSS one.
        */}
        <p style={{ ...labelStyle, letterSpacing: "0.3em", marginBottom: "clamp(22px, 3.2vh, 38px)" }}>
          {info.eyebrow}
        </p>

        {/*
          The name is the one place IntraNet gets to be loud. It is unicase, so
          it reads as caps whatever the source string says; -0.04em pulls the
          very wide advances back to something typographic.

          It must stay on one line. IntraNet's ink spans 1.19em, so two lines at
          a display line-height overlap each other, and raising the leading
          enough to clear that throws away the tight stacked look. "Aayush
          Bhandari" measures ~15.9em at this tracking, so the size is capped at
          880/15.9 = 3.5rem, which lands the name on the column's right edge.

          The narrow-screen half of that sizing is in views.module.css
          (`.infoName`): it is a `min()` against the real available width rather
          than a clamp, because a clamp's lower bound is a rem figure and the
          type stops shrinking while the viewport keeps going — which is how the
          name ended up running off the edge of a phone.
        */}
        <h1 className={styles.infoName}>{info.name}</h1>

        <p
          style={{
            margin: "clamp(28px, 4vh, 46px) 0 0",
            fontSize: "clamp(1.02rem, 1.6vw, 1.35rem)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.35,
            opacity: 0.92,
            textWrap: "balance",
          }}
        >
          {info.roleLine}
        </p>

        <div
          style={{
            paddingTop: "clamp(30px, 4.5vh, 54px)",
            fontSize: "clamp(1rem, 1.35vw, 1.18rem)",
            lineHeight: 1.68,
          }}
        >
          {info.bio.map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "1.35em 0 0" }}>
              {para}
            </p>
          ))}
        </div>

        <Block label={info.servicesLabel}>
          <div style={{ display: "grid", gap: "clamp(16px, 2.4vh, 26px)" }}>
            {info.services.map((s) => (
              <div key={s.title}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.06rem", letterSpacing: "-0.01em" }}>
                  {s.title}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "0.98rem", lineHeight: 1.62, opacity: 0.74 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </Block>

        <Block label={info.toolkitLabel}>
          <DotRow items={info.toolkit} />
        </Block>

        {info.interests.length > 0 ? (
          <Block label={info.interestsLabel}>
            <DotRow items={info.interests} />
          </Block>
        ) : null}

        {info.faq.length > 0 ? (
          <Block label={info.faqLabel}>
            <p
              style={{
                margin: "-4px 0 clamp(14px, 2vh, 22px)",
                fontSize: "clamp(0.96rem, 1.2vw, 1.06rem)",
                lineHeight: 1.6,
                opacity: 0.66,
              }}
            >
              {info.faqIntro}
            </p>
            <FaqList items={info.faq} />
          </Block>
        ) : null}

        {/*
          Address, links, and the brief on one row.

          The brief used to hang below this block on a line of its own, which
          left the whole right half of the page empty under the links and made
          the card read as an afterthought stranded in the margin. It is a
          column here instead.

          The column widths are in views.module.css rather than inline, because
          the address column needs a real minimum — an `auto-fit` track let it
          shrink until the address broke and ".com" widowed onto its own line.
        */}
        <div className={styles.infoFooterGrid}>
          <div>
            <p style={labelStyle}>{info.contactLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "1rem" }}>
              {/* `break-all` on an email is what pushed `.com` onto its own line
                  on the home page — here the column is narrow enough that the
                  address is allowed to wrap only at the @ if it must. */}
              <a
                href={`mailto:${settings.email}`}
                className={styles.infoLink}
                data-title="Mail"
                /* Never mid-word: the only sane break in an address is the @,
                   and `anywhere` was splitting ".com" across two lines. */
                style={{ ...linkStyle, overflowWrap: "normal", wordBreak: "normal" }}
              >
                {settings.email}
              </a>
              {/* Just the place. The offset was noise: nobody briefs a designer
                  on the strength of a UTC offset, and it dated the line every
                  time the clock changed. */}
              <span style={{ opacity: 0.6 }}>{settings.location}</span>
            </div>
          </div>

          <div>
            <p style={labelStyle}>{info.elsewhereLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "1rem", justifyItems: "start" }}>
              {elsewhere.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  className={`${styles.infoLink} ${styles.infoLinkOut}`}
                  /* The cursor label the hero icons and the cards already use.
                     "Go" because these leave the site. */
                  data-title="Go"
                  style={linkStyle}
                >
                  <span>{s.label}</span>
                  <span aria-hidden className={styles.infoLinkArrow}>
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>

          <Link href="/brief" className={styles.briefCard} data-title="Start">
            <p className={styles.briefCardNote}>Not sure where to start?</p>
            <p className={styles.briefCardBody}>Seven questions. About two minutes.</p>
            <span />
            <span className={styles.briefCardFoot}>
              <span className={styles.briefCardTitle}>Build a brief</span>
              <span aria-hidden className={styles.briefCardArrow}>
                ↗
              </span>
            </span>
          </Link>
        </div>

        {/*
          Spotify. `nowPlaying` is empty whenever the integration is
          unconfigured or Spotify is unreachable, and the whole block simply
          does not render — no skeleton, no error state.
        */}
        {nowPlaying.length > 0 ? (
          <Block label={info.nowPlayingLabel}>
            {/*
              A single scrolling row.

              The list is rendered twice and the track slides exactly -50%, so
              the second copy is under the pointer at the moment the animation
              restarts and the loop has no seam. The duplicate is hidden from
              assistive tech — it is the same six links again.
            */}
            <div className={styles.nowPlaying}>
              {/*
                Duration scales with the list, so speed stays constant.

                The animation covers half the track, so a fixed duration means
                a longer list scrolls proportionally faster — doubling the
                albums doubled the speed and made the covers unreadable. About
                3.6s per item holds it near 50px/sec whatever the count.
              */}
              <div
                className={styles.nowPlayingTrack}
                /*
                  A custom property, not `animationDuration`.

                  globals.css forces every animation on the page to 0.01ms under
                  prefers-reduced-motion, and a stylesheet !important beats an
                  inline style — so an inline duration was being overridden and
                  the row looped thousands of times a second, which reads as
                  frozen. The property is set here and consumed by a declaration
                  in the stylesheet that can carry its own !important.
                */
                style={
                  {
                    "--marquee-duration": `${Math.max(24, nowPlaying.length * 3.6)}s`,
                  } as CSSProperties
                }
              >
                {[0, 1].map((copy) => (
                  <div className={styles.nowPlayingSet} key={copy} aria-hidden={copy === 1}>
                    {nowPlaying.map((item) => (
                      <a
                        key={`${copy}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener"
                        className={styles.nowPlayingItem}
                        /* Same label as every other link that leaves the site.
                           The duplicate copy carries it too — it is hidden from
                           assistive tech but the pointer still lands on it. */
                        data-title="Go"
                        tabIndex={copy === 1 ? -1 : undefined}
                      >
                        <Image
                          src={item.image}
                          alt={copy === 1 ? "" : `${item.title} by ${item.artist}`}
                          width={160}
                          height={160}
                          unoptimized
                        />
                        <span className={styles.nowPlayingTitle}>{item.title}</span>
                        <span className={styles.nowPlayingArtist}>{item.artist}</span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Block>
        ) : null}
      </div>
    </main>
  );
}
