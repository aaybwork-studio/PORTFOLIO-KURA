/* eslint-disable @next/next/no-img-element */
"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import WorkIconCanvas from "@/components/three/WorkIconCanvas";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import { imgProps } from "@/lib/imageSet";
import styles from "./views.module.css";

type Props = { settings: SiteSettings; projects: Project[] };

/*
 * Small numbers spelled out, larger ones left as digits.
 *
 * A numeral in a line of 11px tracked small-caps reads as a piece of data
 * rather than as a sentence, and this line is meant to be read as prose. Past
 * twelve the word is longer than the space and the digit is clearer anyway.
 */
const WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six",
  "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
];

const spell = (n: number) => WORDS[n] ?? String(n);

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
            /* IntraNet's ink spans 1.19em, so at 0.95 a two-line heading
               overlapped itself — which is what "Featured Work" does as soon
               as the viewport is narrow enough to wrap it. */
            lineHeight: 1.25,
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
          {/*
            It read "Featured Projects" under a heading reading "Featured
            Work", which is the same words in a different order and told a
            reader nothing they had not already seen an inch higher. A count
            at least says how much there is to read.
          */}
          {projects.length === 1 ? "One case study" : `${spell(projects.length)} case studies`}
        </p>
      </div>

      {/*
        Two per row, 4:3.
        auto-fit with a 270px floor put four portrait cards across a desktop,
        which sized each one down to a thumbnail and made a landscape screen
        look like a phone screenshot. Two landscape cards fill the same row at a
        size you can actually read a UI in, and the column count is fixed rather
        than derived so the layout is the same on every wide screen.
      */}
      <div className={styles.projectGrid}>
        {projects.map((p, i) => (
          <a
            key={p.slug}
            href={`/work/${p.slug}`}
            onClick={go(`/work/${p.slug}`)}
            data-title={p.title}
            className={styles.projectCard}
            style={{ display: "block" }}
          >
            <div
              className={styles.projectCardFrame}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.07)",
              }}
            >
              <img
                /* Two per row above the phone breakpoint, one below. */
                {...imgProps(p.cardImage.src, "(max-width: 620px) 92vw, 46vw")}
                alt={p.cardImage.alt ?? p.title}
                loading={i === 0 ? undefined : "lazy"}
                decoding={i === 0 ? undefined : "async"}
                className={styles.projectCardImg}
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
        <Link
          data-title="Archive"
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
        </Link>
      </div>
    </main>
  );
}
