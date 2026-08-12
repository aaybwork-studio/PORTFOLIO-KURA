/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import styles from "./views.module.css";

type Props = {
  project: Project;
  nextProject: Project;
  /** the project's position in the ordered list — drives the design's section alternation */
  index: number;
  settings: SiteSettings;
};

const MONO = "var(--font-mono), 'IBM Plex Mono', monospace";

export default function ProjectView({ project, nextProject, index }: Props) {
  const { registerFrame, navigate, scrollTop } = useSiteShell();
  const progRef = useRef<HTMLDivElement | null>(null);
  /** design: `this.lastStep`, so the DOM is only written when the active step changes */
  const lastStep = useRef(-1);

  // Design `projectFrame()` — lines 841-862, ported verbatim.
  useEffect(() => {
    lastStep.current = -1;
    return registerFrame(() => {
      const bar = progRef.current;
      if (!bar) return;
      const secs = document.querySelectorAll<HTMLElement>("[data-psec]");
      if (!secs.length) return;
      const mid = window.innerHeight * 0.45;
      let active = 0;
      let best = 1e9;
      for (let i = 0; i < secs.length; i++) {
        const r = secs[i].getBoundingClientRect();
        const d = Math.abs(r.top - mid);
        if (r.top < window.innerHeight * 0.75 && d < best) {
          best = d;
          active = i;
        }
      }
      if (active === lastStep.current) return;
      lastStep.current = active;
      const kids = bar.children;
      for (let i = 0; i < kids.length; i++) {
        const on = i === active;
        const el = kids[i] as HTMLElement;
        el.style.opacity = on ? "1" : "0.5";
        el.style.background = on ? "#FFFFFF" : "transparent";
        el.style.color = on ? "#2A14E8" : "#FFFFFF";
      }
    });
  }, [registerFrame, project.slug]);

  // Design `onProgClick` — lines 1390-1401.
  const onProgClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("[data-step]");
      if (!a) return;
      e.preventDefault();
      const n = parseInt(a.getAttribute("data-step") ?? "0", 10) || 0;
      const secs = document.querySelectorAll<HTMLElement>("[data-psec]");
      const el = secs[n];
      if (!el) return;
      const y = Math.max(
        0,
        el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12
      );
      scrollTop(y, true);
    },
    [scrollTop]
  );

  const go = (href: string) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    navigate(href);
  };

  const pill = {
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "999px",
    padding: "9px 15px 8px",
    fontFamily: MONO,
    fontSize: "10px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const;

  return (
    <main style={{ position: "relative", zIndex: 10, color: "#FFFFFF" }}>
      <div
        ref={progRef}
        onClick={onProgClick}
        style={{
          position: "fixed",
          left: "50%",
          top: "clamp(16px, 2.4vw, 26px)",
          transform: "translateX(-50%)",
          zIndex: 95,
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "6px",
          border: "1px solid rgba(255, 255, 255, 0.24)",
          borderRadius: "999px",
          background: "rgba(9, 6, 26, 0.72)",
        }}
      >
        {project.sections.map((s, i) => (
          <a
            key={s.kicker + i}
            href={`#s${i + 1}`}
            data-step={i}
            style={{
              display: "block",
              padding: "8px 13px 7px",
              borderRadius: "999px",
              fontFamily: MONO,
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            {s.kicker}
          </a>
        ))}
      </div>

      <section
        style={{ padding: "clamp(120px, 16vh, 210px) clamp(16px, 3vw, 56px) clamp(26px, 4vh, 50px)" }}
      >
        <p
          style={{
            margin: "0 0 clamp(14px, 2vw, 22px)",
            fontFamily: MONO,
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          {project.kicker}
        </p>
        <h1
          style={{
            margin: 0,
            fontVariationSettings: "'wdth' 125",
            fontWeight: 700,
            fontSize: "clamp(2.4rem, 8.5vw, 8rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
          }}
        >
          {project.title}
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            paddingTop: "clamp(20px, 3vh, 34px)",
          }}
        >
          <span style={pill}>{project.year}</span>
          <span style={pill}>{project.role}</span>
          <span style={pill}>{project.discipline}</span>
        </div>
      </section>

      <section style={{ padding: "0 clamp(16px, 3vw, 56px)" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.06)",
          }}
        >
          <img
            src={project.heroImage.src}
            alt={project.heroImage.alt ?? project.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </section>

      {project.sections.map((s, j) => {
        // design line 1385: tOrd = (i + j) % 2 === 0 ? 1 : 2, iOrd its inverse
        const even = (index + j) % 2 === 0;
        return (
          <section
            key={s.kicker + j}
            id={`s${j + 1}`}
            data-psec="1"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
              gap: "clamp(20px, 3vw, 52px)",
              alignItems: "start",
              padding: "clamp(60px, 12vh, 150px) clamp(16px, 3vw, 56px) 0",
            }}
          >
            <div
              style={{
                order: even ? 1 : 2,
                maxWidth: "620px",
                position: "sticky",
                top: "clamp(96px, 14vh, 150px)",
                border: "1px solid rgba(255, 255, 255, 0.26)",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.07)",
                padding: "clamp(20px, 2.6vw, 34px)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: MONO,
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                }}
              >
                {s.kicker}
              </p>
              <h2
                style={{
                  margin: "14px 0 0",
                  fontVariationSettings: "'wdth' 112",
                  fontWeight: 700,
                  fontSize: "clamp(1.3rem, 2.6vw, 2.1rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.035em",
                }}
              >
                {s.heading}
              </h2>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: "clamp(0.95rem, 1.15vw, 1.08rem)",
                  lineHeight: 1.6,
                  opacity: 0.86,
                }}
              >
                {s.body}
              </p>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "clamp(0.95rem, 1.15vw, 1.08rem)",
                  lineHeight: 1.6,
                  opacity: 0.66,
                }}
              >
                {s.note}
              </p>
            </div>
            <div style={{ order: even ? 2 : 1, display: "grid", gap: "clamp(14px, 2vw, 26px)" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <img
                  src={s.imageA.src}
                  alt={s.imageA.alt ?? ""}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 2",
                  overflow: "hidden",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <img
                  src={s.imageB.src}
                  alt={s.imageB.alt ?? ""}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </div>
          </section>
        );
      })}

      <a
        href={`/work/${nextProject.slug}`}
        onClick={go(`/work/${nextProject.slug}`)}
        data-title="Next"
        className={styles.nextPanel}
        style={{
          display: "block",
          margin: "clamp(70px, 12vh, 160px) clamp(16px, 3vw, 56px) clamp(60px, 9vw, 140px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.07)",
          padding: "clamp(40px, 7vw, 100px) clamp(20px, 3vw, 50px)",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: MONO,
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          Next project
        </p>
        <h2
          style={{
            margin: 0,
            fontVariationSettings: "'wdth' 125",
            fontWeight: 700,
            fontSize: "clamp(2rem, 7vw, 6rem)",
            lineHeight: 0.86,
            letterSpacing: "-0.05em",
          }}
        >
          {nextProject.title} →
        </h2>
      </a>
    </main>
  );
}
