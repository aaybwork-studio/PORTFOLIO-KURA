"use client";

import { Fragment } from "react";
import type { CSSProperties } from "react";
import LogoCanvas from "@/components/three/LogoCanvas";
import type { InfoPage, SiteSettings } from "@/lib/types";

type Props = { info: InfoPage; settings: SiteSettings };

const badgeStyle: CSSProperties = {
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderRadius: "999px",
  padding: "9px 15px 8px",
  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const colLabelStyle: CSSProperties = {
  margin: "0 0 14px",
  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  opacity: 0.5,
};

const underlineLink: CSSProperties = {
  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
  paddingBottom: "2px",
};

export default function InfoView({ info, settings }: Props) {
  // The design hard-codes the marquee words twice so the kuraTape 50% shift loops seamlessly.
  const tape = [...info.marqueeWords, ...info.marqueeWords];
  const elsewhere = settings.socials.filter((s) => /^https?:/i.test(s.url));

  return (
    <main
      style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100svh",
        padding: "clamp(96px, 13vh, 150px) clamp(16px, 3vw, 56px) clamp(70px, 9vw, 130px)",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 clamp(6px, 1.5vh, 16px)",
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          {info.eyebrow}
        </p>
        <LogoCanvas
          style={{ width: "min(560px, 84vw)", height: "clamp(120px, 22vh, 210px)", display: "block" }}
        />

        <h1
          style={{
            margin: "clamp(10px, 2vh, 26px) 0 0",
            fontVariationSettings: "'wdth' 112",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 4vw, 3.4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            maxWidth: "18ch",
            textWrap: "balance",
          }}
        >
          {info.heading}
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            paddingTop: "clamp(22px, 3.5vh, 38px)",
          }}
        >
          {info.badges.map((b) => (
            <span key={b} style={badgeStyle}>
              {b}
            </span>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            overflow: "hidden",
            margin: "clamp(30px, 5vh, 60px) 0",
            borderTop: "1px solid rgba(255, 255, 255, 0.18)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
            padding: "14px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "max-content",
              gap: "34px",
              fontVariationSettings: "'wdth' 125",
              fontWeight: 700,
              fontSize: "clamp(1.1rem, 2.4vw, 2rem)",
              letterSpacing: "-0.03em",
              opacity: 0.8,
              animation: "kuraTape 26s linear infinite",
            }}
          >
            {tape.map((w, i) => (
              <Fragment key={`${w}-${i}`}>
                <span>{w}</span>
                <span style={{ opacity: 0.45 }}>✷</span>
              </Fragment>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "clamp(18px, 3vw, 44px)",
            width: "100%",
            paddingBottom: "clamp(34px, 5vh, 62px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {info.stats.map((s) => (
            <div key={s.label}>
              <p
                style={{
                  margin: 0,
                  fontVariationSettings: "'wdth' 125",
                  fontWeight: 700,
                  fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  opacity: 0.55,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            maxWidth: "62ch",
            paddingTop: "clamp(34px, 5vh, 62px)",
            fontSize: "clamp(0.98rem, 1.3vw, 1.16rem)",
            lineHeight: 1.62,
          }}
        >
          {info.bio.map((para, i) => (
            <p key={i} style={{ margin: i === info.bio.length - 1 ? 0 : "0 0 1.3em" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ width: "100%", paddingTop: "clamp(40px, 6vh, 80px)" }}>
          <p
            style={{
              margin: "0 0 clamp(16px, 2.4vh, 26px)",
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            What I do
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {info.services.map((s) => (
              <div
                key={s.title}
                style={{
                  background: "rgba(9, 5, 40, 0.55)",
                  padding: "clamp(18px, 2.6vw, 30px)",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontVariationSettings: "'wdth' 112",
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.title}
                </p>
                <p style={{ margin: "10px 0 0", fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.72 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "clamp(22px, 4vw, 56px)",
            width: "100%",
            paddingTop: "clamp(40px, 6vh, 80px)",
            marginTop: "clamp(34px, 5vh, 62px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div>
            <p style={colLabelStyle}>{info.contactLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "0.96rem", justifyItems: "center" }}>
              <a href={`mailto:${settings.email}`} style={underlineLink}>
                {settings.email}
              </a>
              <span style={{ opacity: 0.6 }}>{`${settings.location} — ${settings.timezoneLabel}`}</span>
            </div>
          </div>
          <div>
            <p style={colLabelStyle}>{info.elsewhereLabel}</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "0.96rem", justifyItems: "center" }}>
              {elsewhere.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener" style={underlineLink}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p style={colLabelStyle}>{info.toolkitLabel}</p>
            <p style={{ margin: 0, fontSize: "0.96rem", lineHeight: 1.75, opacity: 0.85 }}>
              {info.toolkit.map((t, i) => (
                <Fragment key={t}>
                  {i > 0 ? <br /> : null}
                  {t}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
