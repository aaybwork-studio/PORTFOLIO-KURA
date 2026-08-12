/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import CloudCanvas from "@/components/three/CloudCanvas";
import DvdLogo from "@/components/three/DvdLogo";
import HeroScene from "@/components/three/HeroScene";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { Project, SiteSettings } from "@/lib/types";
import HeroLine from "./HeroLine";
import styles from "./views.module.css";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

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

      setHeadLogoTarget(heroR && heroR.bottom < vh * 0.55 ? 1 : 0);
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
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {p.homeCardLabel}
      </p>
    </a>
  );

  const pillStyle: CSSProperties = {
    border: "1px solid rgba(255, 255, 255, 0.55)",
    borderRadius: "999px",
    padding: "12px 17px 11px",
  };

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
          />
          <a
            href="#contact"
            onClick={goContact}
            onMouseEnter={onIconEnter}
            onMouseLeave={onIconLeave}
            data-icon="contact"
            data-title="Contact"
            className={styles.heroIconContact}
          />

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
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
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
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {settings.featuredWorkLabel}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0 clamp(18px, 3vw, 48px)",
              alignItems: "start",
            }}
          >
            <div
              ref={colARef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(90px, 34vh, 380px)",
                paddingBottom: "clamp(90px, 34vh, 380px)",
              }}
            >
              {colA.map((p, i) => card(p, i === 0))}
            </div>
            <div
              ref={colBRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(90px, 34vh, 380px)",
                marginTop: "clamp(60px, 24vh, 280px)",
                paddingBottom: "clamp(40px, 14vh, 180px)",
              }}
            >
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
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
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
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                opacity: 0.65,
              }}
            >
              {settings.contactEyebrow}
            </p>
            <a
              href={`mailto:${settings.email}`}
              className={styles.emailLink}
              style={{
                display: "inline-block",
                fontVariationSettings: "'wdth' 112",
                fontWeight: 700,
                fontSize: "clamp(1.15rem, 4vw, 3.4rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                wordBreak: "break-word",
                textShadow: "0 6px 30px rgba(8, 2, 60, 0.35)",
              }}
            >
              {settings.email}
            </a>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "clamp(10px, 1.6vw, 18px)",
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {settings.socials.map((s) => {
                const external = /^https?:/i.test(s.url);
                return external ? (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className={styles.socialPill}
                    style={pillStyle}
                  >
                    {s.label}
                  </a>
                ) : (
                  <a
                    key={s.label}
                    href={s.url}
                    onClick={go(s.url)}
                    className={styles.socialPill}
                    style={pillStyle}
                  >
                    {s.label}
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
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
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
