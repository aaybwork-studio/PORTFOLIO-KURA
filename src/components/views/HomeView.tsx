/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import CloudCanvas from "@/components/three/CloudCanvas";
import DvdLogo from "@/components/three/DvdLogo";
import HeroScene from "@/components/three/HeroScene";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import HeroLine from "./HeroLine";
import styles from "./views.module.css";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/*
 * Clickability cue for the two floating hero icons.
 *
 * Nothing about a WebGL folder says "link", and the icons sit well away from
 * any other affordance, so each one gets a hand-drawn arrow pointing back at it
 * and a short label. Drawn rather than a glyph arrow so it reads as an
 * annotation on the page instead of another piece of UI. `flip` mirrors it for
 * the icon on the right-hand side.
 */
function IconHint({ label, flip }: { label: string; flip?: boolean }) {
  return (
    <span className={`${styles.iconHint} ${flip ? styles.iconHintFlip : ""}`} aria-hidden>
      <svg viewBox="0 0 60 46" fill="none" className={styles.iconHintArrow}>
        <path
          d="M54 40 C 38 41, 20 33, 11 12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M11 12 L 21.5 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M11 12 L 9 23.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className={styles.iconHintLabel}>{label}</span>
    </span>
  );
}

/** design `el.__dy` bookkeeping from stackCards(), kept off the DOM nodes. */
const dyMap = new WeakMap<HTMLElement, number>();

type Props = { settings: SiteSettings; projects: Project[] };

export default function HomeView({ settings, projects }: Props) {
  const { frame, registerFrame, navigate, scrollToEl, setHeadLogoTarget } = useSiteShell();

  const heroRef = useRef<HTMLElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const workRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);
  const colARef = useRef<HTMLDivElement | null>(null);
  const colBRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  /* ---------- live IST clock (design startClock()) ---------- */
  const placeholder = `${settings.timezoneLabel} · --:--`;
  const [clock, setClock] = useState(placeholder);
  const tzOffset = settings.timezoneOffsetMinutes;
  const tzLabel = settings.timezoneLabel;
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const now = new Date();
      const k = new Date(now.getTime() + (now.getTimezoneOffset() + tzOffset) * 60000);
      setClock(`${tzLabel} · ${pad(k.getHours())}:${pad(k.getMinutes())}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tzLabel, tzOffset]);

  /* ---------- design stackCards() ---------- */
  const stackCards = useCallback(() => {
    const cols = [colARef.current, colBRef.current];
    /*
     * The stack is a two-column effect.
     *
     * It pins each card under the one above as the column scrolls past, which
     * needs two columns moving at different rates to read as anything. On a
     * phone the grid is a single column of full-width cards, where the same
     * maths just holds every card against the header in turn — so it is off,
     * and the transforms it already wrote are cleared rather than left frozen
     * on the elements after a resize.
     */
    if (window.innerWidth <= 720) {
      for (const col of cols) {
        if (!col) continue;
        for (let i = 0; i < col.children.length; i++) {
          const el = col.children[i] as HTMLElement;
          if (el.style.transform && el.style.transform !== "none") el.style.transform = "none";
          dyMap.set(el, 0);
        }
      }
      return;
    }
    const cta = ctaRef.current;
    const ctaTop = cta ? cta.getBoundingClientRect().top : Infinity;
    const T = clamp(window.innerHeight * 0.12, 88, 132);
    const gap = 20;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      if (!col) continue;
      const items: { el: HTMLElement; nat: number; h: number }[] = [];
      for (let i = 0; i < col.children.length; i++) {
        const el = col.children[i] as HTMLElement;
        const r = el.getBoundingClientRect();
        items.push({ el, nat: r.top - (dyMap.get(el) || 0), h: r.height });
      }
      let capNext = ctaTop;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const cap = capNext === Infinity ? Infinity : capNext - it.h - gap;
        const v = Math.min(Math.max(it.nat, T), Math.max(it.nat, cap));
        const dy = Math.max(0, v - it.nat);
        dyMap.set(it.el, dy);
        it.el.style.transform = dy > 0.5 ? "translate3d(0," + dy.toFixed(1) + "px,0)" : "none";
        capNext = it.nat + dy;
      }
    }
  }, []);

  /* ---------- design homeFrame() ---------- */
  useEffect(() => {
    return registerFrame(() => {
      const vh = window.innerHeight;
      const hero = heroRef.current;
      const heroR = hero ? hero.getBoundingClientRect() : null;

      if (heroR) {
        const hp = clamp(-heroR.top / Math.max(1, vh), 0, 1);
        frame.current.heroOut = hp;
        const cont = heroContentRef.current;
        if (cont) {
          const o = clamp(1 - hp * 2.1, 0, 1);
          cont.style.opacity = o.toFixed(3);
          cont.style.visibility = o < 0.02 ? "hidden" : "visible";
        }
      }

      const fadeIn = (el: HTMLElement | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const k = clamp((vh - r.top) / (vh * 0.45), 0, 1);
        const o = k * k * (3 - 2 * k);
        el.style.opacity = o.toFixed(3);
        el.style.transform = o > 0.995 ? "none" : "translate3d(0," + ((1 - o) * 34).toFixed(1) + "px,0)";
      };
      fadeIn(workRef.current);
      fadeIn(contactRef.current);
      stackCards();

      /*
       * The header logo appears once the hero has scrolled away, but it is
       * suppressed again over the contact section: the DVD logo is bouncing
       * around down there, so showing a second Kura mark in the header reads
       * as a duplicate rather than as persistent branding.
       */
      const contactR = contactRef.current?.getBoundingClientRect() ?? null;
      const overContact = contactR !== null && contactR.top < vh * 0.5;
      setHeadLogoTarget(!overContact && heroR && heroR.bottom < vh * 0.55 ? 1 : 0);
    });
  }, [frame, registerFrame, setHeadLogoTarget, stackCards]);

  /* ---------- handlers ---------- */
  const go = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  const goContact = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToEl(contactRef.current, 0);
  };

  const onIconEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const k = e.currentTarget.getAttribute("data-icon");
    if (k === "work") frame.current.iconHover.workT = 1;
    if (k === "contact") frame.current.iconHover.contactT = 1;
  };
  const onIconLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    const k = e.currentTarget.getAttribute("data-icon");
    if (k === "work") frame.current.iconHover.workT = 0;
    if (k === "contact") frame.current.iconHover.contactT = 0;
  };

  /* ---------- work grid: col A = 1 & 3, col B = 2 & 4 ---------- */
  const colA = [projects[0], projects[2]].filter(Boolean);
  const colB = [projects[1], projects[3]].filter(Boolean);

  const card = (p: Project, eager: boolean) => (
    <a
      key={p.slug}
      href={`/work/${p.slug}`}
      onClick={go(`/work/${p.slug}`)}
      data-title={p.title}
      style={{ display: "block", position: "relative", paddingBottom: "12px", willChange: "transform" }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: p.homeAspect,
          overflow: "hidden",
          borderRadius: "6px",
          background: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <img
          src={p.cardImage.src}
          alt={p.cardImage.alt ?? p.title}
          loading={eager ? undefined : "lazy"}
          decoding={eager ? undefined : "async"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p
        style={{
          margin: "14px 0 0",
          fontFamily: "var(--ff-body)", fontStretch: "87.5%",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {p.homeCardLabel}
      </p>
    </a>
  );

  return (
    <main style={{ position: "relative", zIndex: 10 }}>
      <section ref={heroRef} style={{ position: "relative", height: "100svh", overflow: "hidden" }}>
        <HeroScene
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: 2,
          }}
        />
        <div ref={heroContentRef} style={{ position: "absolute", inset: 0, zIndex: 3 }}>
          <a
            href="/info"
            onClick={go("/info")}
            data-title="About Kura"
            style={{
              position: "absolute",
              left: "50%",
              top: "44%",
              transform: "translate(-50%, -50%)",
              width: "min(46vw, 520px)",
              height: "min(22vh, 190px)",
              display: "block",
            }}
          />
          <Link
            href="/work"
            onClick={go("/work")}
            onMouseEnter={onIconEnter}
            onMouseLeave={onIconLeave}
            data-icon="work"
            data-title="Work"
            className={styles.heroIconWork}
          >
            <IconHint label="See the work" />
          </Link>
          <a
            href="#contact"
            onClick={goContact}
            onMouseEnter={onIconEnter}
            onMouseLeave={onIconLeave}
            data-icon="contact"
            data-title="Contact"
            className={styles.heroIconContact}
          >
            <IconHint label="Say hello" flip />
          </a>

          {/*
            The hero line and the scroll cue share one bottom-anchored stack so
            the line sits a fixed 25px above the cue, rather than floating at a
            percentage of the viewport where it collided with the logo.
          */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "clamp(26px, 4.5vh, 52px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "25px",
            }}
          >
            <HeroLine prefix={settings.heroPrefix} phrases={settings.heroPhrases} />
            <span
              style={{
                fontFamily: "var(--ff-body)", fontStretch: "87.5%",
                fontSize: "10px",
                lineHeight: 1.2,
                letterSpacing: "0.28em",
                textTransform: "lowercase",
                opacity: 0.66,
              }}
            >
              {settings.scrollLabel}
            </span>
          </div>
        </div>
      </section>

      <section
        ref={workRef}
        id="work"
        style={{
          position: "relative",
          minHeight: "200svh",
          background: "#050409",
          padding: "clamp(70px, 10vh, 130px) clamp(16px, 3vw, 56px) clamp(60px, 9vh, 120px)",
        }}
      >
        <CloudCanvas
          dark={1}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: 0,
            opacity: 0.85,
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1500px", margin: "0 auto" }}>
          <p
            style={{
              margin: "0 0 clamp(30px, 5vh, 60px)",
              fontFamily: "var(--ff-body)", fontStretch: "87.5%",
              fontSize: "11px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {settings.featuredWorkLabel}
          </p>
          <div className={styles.workGrid}>
            <div ref={colARef} className={styles.workCol}>
              {colA.map((p, i) => card(p, i === 0))}
            </div>
            <div ref={colBRef} className={`${styles.workCol} ${styles.workColB}`}>
              {colB.map((p) => card(p, false))}
            </div>
          </div>
          <div ref={ctaRef} style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(60px, 10vh, 140px)" }}>
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
        </div>
      </section>

      <section
        ref={contactRef}
        id="contact"
        style={{
          position: "relative",
          zIndex: 20,
          height: "100svh",
          minHeight: "560px",
          overflow: "hidden",
        }}
      >
        <DvdLogo
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "grid",
            placeItems: "center",
            padding: "clamp(100px, 14vh, 165px) clamp(16px, 3vw, 56px) clamp(58px, 8vh, 88px)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "clamp(16px, 2.4vh, 30px)",
              pointerEvents: "auto",
              maxWidth: "min(92vw, 900px)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--ff-body)", fontStretch: "87.5%",
                fontSize: "11px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                opacity: 0.65,
              }}
            >
              {settings.contactEyebrow}
            </p>
            {/*
              The address measures 30.25em in IntraNet Bold at -0.02em, so at
              the old size it overran the 900px column and `wordBreak` snapped
              it wherever it happened to land — which is how ".com" ended up
              alone on a second line.

              Now the only permitted break is at the @, and each half is
              nowrap. Desktop gets one line (30.25em x 1.85rem = 895px, inside
              the 900px cap); below 620px each half is forced onto its own line
              and sized against the longer of the two, so it is two deliberate
              lines rather than an orphaned TLD. Sizing lives in
              views.module.css so the phone rule can win — an inline font-size
              cannot be overridden by a media query.
            */}
            <a
              href={`mailto:${settings.email}`}
              className={styles.emailLink}
            >
              {(() => {
                const at = settings.email.indexOf("@");
                if (at < 0) return <span style={{ whiteSpace: "nowrap" }}>{settings.email}</span>;
                return (
                  <>
                    <span style={{ whiteSpace: "nowrap" }}>{settings.email.slice(0, at)}</span>
                    <wbr />
                    <span style={{ whiteSpace: "nowrap" }}>{settings.email.slice(at)}</span>
                  </>
                );
              })()}
            </a>
            <div className={styles.socialRow}>
              {settings.socials.map((s) => {
                const external = /^https?:/i.test(s.url);
                const inner = (
                  <>
                    <span>{s.label}</span>
                    <span aria-hidden className={styles.socialArrow}>
                      ↗
                    </span>
                  </>
                );
                return external ? (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className={styles.socialPill}
                  >
                    {inner}
                  </a>
                ) : (
                  <a key={s.label} href={s.url} onClick={go(s.url)} className={styles.socialPill}>
                    {inner}
                  </a>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px 22px",
                fontFamily: "var(--ff-body)", fontStretch: "87.5%",
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <span>{settings.location}</span>
              <span suppressHydrationWarning>{clock}</span>
              <span>{settings.copyright}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
