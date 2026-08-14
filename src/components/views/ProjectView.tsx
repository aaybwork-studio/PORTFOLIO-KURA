/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import CaseMediaBlock from "./CaseMediaBlock";
import Reveal from "./Reveal";
import styles from "./views.module.css";

type Props = {
  project: Project;
  nextProject: Project;
  /** the project's position in the ordered list */
  index: number;
  settings: SiteSettings;
};

/*
 * Case study layout.
 *
 * This used to be a two-column shuffle — a sticky text card on one side, two
 * stacked images on the other, sides swapping per section. It read as a
 * comparison table rather than a story, it never let a single image be the
 * point, and at phone width the two columns collapsed into an unreadable
 * alternation of card, image, card, image.
 *
 * Now each section is one full-measure text frame followed by its media, and
 * the media owns the page: full-bleed frames, with split pairs for shots that
 * belong together. One column at every width, so the phone layout is the same
 * layout rather than a special case.
 */
export default function ProjectView({ project, nextProject }: Props) {
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
        (kids[i] as HTMLElement).dataset.active = i === active ? "true" : "false";
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

  const meta: { label: string; value: string }[] = [
    { label: "Year", value: project.year },
    { label: "Role", value: project.role },
    { label: "Discipline", value: project.discipline },
  ];

  return (
    <main className={styles.case}>
      <div ref={progRef} onClick={onProgClick} className={styles.progNav}>
        {project.sections.map((s, i) => (
          <a
            key={s.kicker + i}
            href={`#s${i + 1}`}
            data-step={i}
            data-active="false"
            className={styles.progItem}
            aria-label={s.kicker}
          >
            <span className={styles.progLabel} aria-hidden>
              {s.kicker}
            </span>
            <span className={styles.progTick} aria-hidden />
          </a>
        ))}
      </div>

      <header className={styles.caseHead}>
        <p className={styles.caseKicker}>{project.kicker}</p>
        <h1 className={styles.caseTitle}>{project.title}</h1>
      </header>

      {/*
        The hero runs to the page gutter rather than into a rounded card. The
        first thing a case study should do is show the work at the largest size
        the viewport allows.
      */}
      <Reveal className={styles.caseHero}>
        <div className={styles.caseMediaFrame} style={{ aspectRatio: "16 / 9" }}>
          <img
            className={styles.caseMediaEl}
            src={project.heroImage.src}
            alt={project.heroImage.alt ?? project.title}
          />
        </div>
      </Reveal>

      {/*
        Credits sit under the hero as a label/value strip, not as pills. Pills
        read as filters you can press; this is a masthead. It also collapses
        cleanly to two columns on a phone, which a wrapping row of pills did
        not.
      */}
      <div className={styles.caseMeta}>
        {meta.map((m) => (
          <div key={m.label}>
            <p className={styles.caseMetaLabel}>{m.label}</p>
            <p className={styles.caseMetaValue}>{m.value}</p>
          </div>
        ))}
      </div>

      {project.sections.map((s, j) => (
        <section key={s.kicker + j} id={`s${j + 1}`} data-psec="1" className={styles.caseSection}>
          {/*
            One text frame per section: the kicker as a marginal label on
            desktop, stacked above the prose on a phone. No box, no border --
            the type carries it, and a card around every paragraph was what
            made the old layout feel like a form.
          */}
          <Reveal className={styles.caseText}>
            <p className={styles.caseTextLabel}>{s.kicker}</p>
            <div className={styles.caseTextBody}>
              <h2 className={styles.caseHeading}>{s.heading}</h2>
              <p className={styles.caseBody}>{s.body}</p>
              {s.note ? <p className={styles.caseNote}>{s.note}</p> : null}
            </div>
          </Reveal>

          <div className={styles.caseGrid}>
            {s.media.map((m, k) => (
              <CaseMediaBlock key={`${m.src}-${k}`} item={m} index={k} />
            ))}
          </div>
        </section>
      ))}

      <a
        href={`/work/${nextProject.slug}`}
        onClick={go(`/work/${nextProject.slug}`)}
        data-title="Next"
        className={styles.nextPanel}
      >
        <p className={styles.caseKicker}>Next project</p>
        <h2 className={styles.nextTitle}>
          {nextProject.title}{" "}
          {/* IntraNet has no arrow glyph — set it in the body face on purpose
              rather than letting the browser fall back mid-line. */}
          <span style={{ fontFamily: "var(--ff-body)" }}>&rarr;</span>
        </h2>
      </a>
    </main>
  );
}
