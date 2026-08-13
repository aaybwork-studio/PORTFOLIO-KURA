/* eslint-disable @next/next/no-img-element */
"use client";

import type { MouseEvent } from "react";
import WorkIconCanvas from "@/components/three/WorkIconCanvas";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import styles from "./views.module.css";

type Props = { settings: SiteSettings; projects: Project[] };

export default function WorkView({ settings, projects }: Props) {
  const { navigate } = useSiteShell();

  const go = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <main
      style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100svh",
        padding: "clamp(100px, 14vh, 165px) clamp(16px, 3vw, 56px) clamp(70px, 9vw, 130px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          paddingBottom: "clamp(40px, 7vw, 90px)",
        }}
      >
        <WorkIconCanvas
          style={{ width: "min(230px, 40vw)", height: "clamp(110px, 17vh, 170px)", display: "block" }}
        />
        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "var(--ff-display)",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 2.4vw, 2.4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
          }}
        >
          {settings.featuredWorkLabel}
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--ff-body)", fontStretch: "87.5%",
            fontSize: "11px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          Featured Projects
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "clamp(20px, 2.4vw, 36px) clamp(14px, 1.8vw, 26px)",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {projects.map((p, i) => (
          <a
            key={p.slug}
            href={`/work/${p.slug}`}
            onClick={go(`/work/${p.slug}`)}
            data-title={p.title}
            style={{ display: "block" }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "3 / 4",
                overflow: "hidden",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.07)",
              }}
            >
              <img
                src={p.cardImage.src}
                alt={p.cardImage.alt ?? p.title}
                loading={i === 0 ? undefined : "lazy"}
                decoding={i === 0 ? undefined : "async"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {p.comingSoon ? (
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "12px",
                    background: "rgba(255, 255, 255, 0.94)",
                    color: "#2A14E8",
                    fontSize: "0.78rem",
                    padding: "5px 10px 4px",
                    borderRadius: "2px",
                  }}
                >
                  Coming Soon
                </span>
              ) : null}
            </div>
            <p
              style={{
                margin: "14px 0 0",
                fontWeight: 600,
                fontSize: "0.98rem",
                letterSpacing: "-0.01em",
              }}
            >
              {p.title}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "0.9rem", opacity: 0.62 }}>{p.workCardSubtitle}</p>
          </a>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(46px, 7vw, 100px)" }}>
        <a
          href="/archive"
          onClick={go("/archive")}
          className={styles.ctaPill}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "999px",
            padding: "15px 26px 14px",
            fontFamily: "var(--ff-body)", fontStretch: "87.5%",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {settings.archiveCtaLabel}
        </a>
      </div>
    </main>
  );
}
