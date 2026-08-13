"use client";

import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
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

const COLUMN = "62ch";

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

const linkStyle: CSSProperties = {
  fontWeight: 600,
  borderBottom: "1px solid rgba(255, 255, 255, 0.32)",
  paddingBottom: "1px",
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
      {/*
        The column is wider than the reading measure so the name can be big;
        prose blocks clamp themselves back to COLUMN. The reference does the
        same — wide display line, narrow body.
      */}
      <div style={{ maxWidth: "min(100%, 1080px)", margin: "0 auto", textAlign: "left" }}>
        <p style={{ ...labelStyle, letterSpacing: "0.3em", marginBottom: "clamp(14px, 2vh, 22px)" }}>
          {info.eyebrow}
        </p>

        {/*
          The name is the one place IntraNet gets to be loud. It is unicase, so
          it reads as caps whatever the source string says; -0.04em pulls the
          very wide advances back to something typographic.

          It must stay on one line. IntraNet's ink spans 1.19em, so two lines at
          a display line-height overlap each other — and raising the leading
          enough to clear that throws away the tight stacked look. "Aayush
          Bhandari" measures 15.59em at this tracking, so the clamp is capped at
          1080/15.59 = 4.2rem and the vw term at 90/15.59 = 5.4vw.
        */}
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--ff-display)",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 5.4vw, 4.2rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {info.name}
        </h1>

        <p
          style={{
            margin: "clamp(14px, 2vh, 22px) 0 0",
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
            maxWidth: COLUMN,
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
          <div style={{ maxWidth: COLUMN, display: "grid", gap: "clamp(16px, 2.4vh, 26px)" }}>
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
                maxWidth: COLUMN,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "clamp(24px, 4vw, 56px)",
            paddingTop: "clamp(46px, 7vh, 86px)",
            marginTop: "clamp(38px, 5.5vh, 68px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div>
            <p style={labelStyle}>{info.contactLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "1rem" }}>
              {/* `break-all` on an email is what pushed `.com` onto its own line
                  on the home page — here the column is narrow enough that the
                  address is allowed to wrap only at the @ if it must. */}
              <a href={`mailto:${settings.email}`} style={{ ...linkStyle, overflowWrap: "anywhere" }}>
                {settings.email}
              </a>
              <span style={{ opacity: 0.6 }}>{`${settings.location} · ${settings.timezoneLabel}`}</span>
            </div>
          </div>

          <div>
            <p style={labelStyle}>{info.elsewhereLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "1rem", justifyItems: "start" }}>
              {elsewhere.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener" style={linkStyle}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/*
          Spotify. `nowPlaying` is empty whenever the integration is
          unconfigured or Spotify is unreachable, and the whole block simply
          does not render — no skeleton, no error state.
        */}
        {nowPlaying.length > 0 ? (
          <Block label={info.nowPlayingLabel}>
            <ul className={styles.nowPlaying}>
              {nowPlaying.map((item) => (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noopener">
                    <Image
                      src={item.image}
                      alt={`${item.title} by ${item.artist}`}
                      width={160}
                      height={160}
                      unoptimized
                    />
                    <span className={styles.nowPlayingTitle}>{item.title}</span>
                    <span className={styles.nowPlayingArtist}>{item.artist}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}
      </div>
    </main>
  );
}
