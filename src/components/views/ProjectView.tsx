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
  const progTrackRef = useRef<HTMLDivElement | null>(null);
  const progNameRef = useRef<HTMLSpanElement | null>(null);
  /** design: `this.lastStep`, so the DOM is only written when the active step changes */
  const lastStep = useRef(-1);
  /** last moment the page was actually moving, for the compact-while-scrolling state */
  const lastMove = useRef(0);
  const lastScrolling = useRef<boolean | null>(null);
  /** scroll position and direction, for the auto-hide */
  const lastY = useRef(0);
  const lastHidden = useRef<boolean | null>(null);
  /** while this is in the future the indicator stays up regardless of direction */
  const revealUntil = useRef(0);
  const dirDown = useRef(false);

  /* ---------- next project: scroll past the card to go there ---------- */
  const nextRef = useRef<HTMLAnchorElement | null>(null);
  const nextRingRef = useRef<SVGRectElement | null>(null);
  /** 0..1 charge, and the last time downward intent was seen */
  const charge = useRef(0);
  const lastPush = useRef(0);
  const fired = useRef(false);
  const lastCharge = useRef(-1);

  // Design `projectFrame()` — lines 841-862, ported verbatim.
  useEffect(() => {
    lastStep.current = -1;
    return registerFrame((_dt, state) => {
      const nav = progRef.current;
      const bar = progTrackRef.current;
      if (!nav || !bar) return;

      /*
       * Compact while the page is moving.
       *
       * The indicator is a full-length pill at rest and collapses to a stub
       * while scrolling, which is also when the section name appears — you
       * find out where you are exactly when you are travelling, and the thing
       * gets out of the way the rest of the time.
       *
       * It runs off scroll velocity with a hold, not off a scroll event: the
       * velocity is already computed once per frame by the shell, and a raw
       * event would flicker the state on every micro-adjustment.
       */
      const now = performance.now();
      if (Math.abs(state.vel) > 0.35) lastMove.current = now;
      const scrolling = now - lastMove.current < 900;
      if (scrolling !== lastScrolling.current) {
        lastScrolling.current = scrolling;
        nav.dataset.scrolling = scrolling ? "true" : "false";
      }

      /*
       * Direction, for the auto-hide.
       *
       * Going down the indicator gets out of the way; coming back up it
       * returns. Reading position rather than velocity gives a signed answer
       * without depending on how the shell happens to define its sign, and the
       * 3px threshold keeps a thumb resting on the glass from flipping it.
       *
       * Near the top it is always shown — that is where someone lands, and an
       * indicator that starts hidden reads as one that is broken.
       */
      /*
       * Direction, with memory.
       *
       * The direction is only revised on a real move of more than 3px, so an
       * eased scroll settling to a stop cannot flip it and a thumb resting on
       * the glass cannot either. Position rather than velocity, so the sign
       * does not depend on how the shell defines its own.
       */
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) > 3) {
        lastY.current = y;
        dirDown.current = dy > 0;
      }

      /*
       * Three things put it back up on the way down: reaching the top, stopping,
       * and crossing into a new section.
       *
       * The last one is the point — auto-hiding while reading forwards is
       * right, but the one moment the indicator is wanted on the way down is
       * the moment you arrive somewhere new. A section change holds it up for a
       * beat and then lets it go again if you are still heading down.
       */
      const hide = y > 90 && dirDown.current && scrolling && now >= revealUntil.current;
      if (hide !== lastHidden.current) {
        lastHidden.current = hide;
        nav.dataset.hidden = hide ? "true" : "false";
      }

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
      // Arriving somewhere new: hold the indicator up long enough to be read.
      // Set after the early return above, so it only fires on a real change.
      revealUntil.current = performance.now() + 1500;

      // The name is written imperatively for the same reason the ticks are:
      // this runs every frame, and routing it through state would re-render
      // the whole case study on every section change.
      const name = progNameRef.current;
      const label = project.sections[active]?.kicker;
      if (name && label && name.textContent !== label) {
        name.textContent = label;
        // Restart the enter animation by taking the element out of the
        // animation and putting it back in the same frame.
        name.dataset.in = "false";
        void name.offsetWidth;
        name.dataset.in = "true";
      }
    });
  }, [registerFrame, project.sections, project.slug]);

  /*
   * Hold at the bottom to continue.
   *
   * The next-project card is the end of the page, so scrolling past it does
   * nothing — the gesture is already there and it was being thrown away. It now
   * charges a ring around the card, and when the ring closes the site goes to
   * that project.
   *
   * Only counted once the page is genuinely at the bottom and the gesture is
   * downward, so ordinary scrolling through the case study never arms it. The
   * charge decays as soon as the pushing stops, so a single flick at the end
   * does not commit anyone to a navigation they did not ask for — it takes
   * sustained intent.
   */
  useEffect(() => {
    fired.current = false;
    charge.current = 0;
    lastCharge.current = -1;

    const atBottom = () =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;

    const push = (delta: number) => {
      if (fired.current || delta <= 0 || !atBottom()) return;
      // Normalised so a trackpad flick and a mouse wheel notch charge at
      // comparable rates. 900px of over-scroll was too long a hold to sit
      // through; 495 is that cut by 45%, which still needs deliberate intent
      // rather than a single flick.
      charge.current = Math.min(1, charge.current + delta / 495);
      lastPush.current = performance.now();
    };

    const onWheel = (e: WheelEvent) => push(e.deltaY);

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      push(touchY - y);
      touchY = y;
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [project.slug]);

  useEffect(() => {
    return registerFrame(() => {
      const panel = nextRef.current;
      const ring = nextRingRef.current;
      if (!panel || !ring) return;

      // Decay once the pushing stops. Faster than it charges, so letting go
      // clearly abandons it rather than leaving a half-lit card behind.
      if (performance.now() - lastPush.current > 90 && charge.current > 0) {
        charge.current = Math.max(0, charge.current - 0.045);
      }

      const c = charge.current;
      if (Math.abs(c - lastCharge.current) > 0.004 || c === 0 || c === 1) {
        lastCharge.current = c;
        // pathLength is normalised to 1 on the rect, so the offset is the
        // remaining fraction directly and the ring is resolution independent.
        ring.style.strokeDashoffset = String(1 - c);
        panel.style.setProperty("--next-charge", c.toFixed(3));
        panel.dataset.charging = c > 0.02 ? "true" : "false";
      }

      if (c >= 1 && !fired.current) {
        fired.current = true;
        navigate(`/work/${nextProject.slug}`);
      }
    });
  }, [navigate, nextProject.slug, registerFrame]);

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
      <div ref={progRef} onClick={onProgClick} className={styles.progNav} data-scrolling="false" data-hidden="false">
        {/*
          The name lives inside the pill, and the pill grows to hold it. It used
          to sit outside as a floating word, which read as two separate objects
          rather than as one control that has something to say.
        */}
        <div className={styles.progTrack}>
          <span ref={progNameRef} className={styles.progName} data-in="true" aria-hidden>
            {project.sections[0]?.kicker ?? ""}
          </span>
          <div ref={progTrackRef} className={styles.progSteps}>
            {project.sections.map((s, i) => (
              <a
                key={s.kicker + i}
                href={`#s${i + 1}`}
                data-step={i}
                data-active="false"
                className={styles.progItem}
                aria-label={s.kicker}
              >
                <span className={styles.progTick} aria-hidden />
              </a>
            ))}
          </div>
        </div>
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
        ref={nextRef}
        href={`/work/${nextProject.slug}`}
        onClick={go(`/work/${nextProject.slug}`)}
        data-title="Next"
        data-charging="false"
        className={styles.nextPanel}
      >
        {/*
          The ring is an SVG rect rather than a conic-gradient border, because
          the card has rounded corners and a conic sweep does not follow a
          rounded rectangle — it cuts the corners. `pathLength="1"` normalises
          the perimeter so the dash offset is the remaining fraction whatever
          the card measures, at any viewport width.
        */}
        <svg className={styles.nextRing} aria-hidden preserveAspectRatio="none">
          <rect
            ref={nextRingRef}
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="12"
            pathLength="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        </svg>
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
