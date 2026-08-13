"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import Lenis from "lenis";

import { BOW_CURVE, clamp, createFrameState } from "@/lib/frame";
import { playClick, playHover, playNavigate } from "@/lib/audio";
import { atLeast, initTier, onTierChange, sampleFrame } from "@/lib/perf";
import type { Tier } from "@/lib/perf";
import type { FrameCallback, FrameState } from "@/lib/frame";
import { SiteShellContext } from "./SiteShellContext";
import type { SiteShellApi } from "./SiteShellContext";
import Plates from "./Plates";
import Cursor from "./Cursor";
import ParticleField from "./ParticleField";
import BackToTop from "./BackToTop";
import Header from "./Header";
import CloudCanvas from "@/components/three/CloudCanvas";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  /* ---------- mutable frame state (never React state) ---------- */
  const frame = useRef<FrameState>(createFrameState());
  const callbacks = useRef<Set<FrameCallback>>(new Set());

  /* ---------- element refs ---------- */
  const topRef = useRef<HTMLDivElement | null>(null);
  const botRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorScaleRef = useRef<HTMLDivElement | null>(null);
  const cursorLabelRef = useRef<HTMLSpanElement | null>(null);
  const headLogoRef = useRef<HTMLAnchorElement | null>(null);

  /* ---------- shell-owned mutable bits ---------- */
  const lenisRef = useRef<Lenis | null>(null);
  const mountedRef = useRef(false);
  const transitioningRef = useRef(false);
  const committedRef = useRef(false);
  const guardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headKRef = useRef(0);
  const headLogoTargetRef = useRef(0);
  const pendingJumpRef = useRef<"work" | "contact" | null>(null);
  const pathnameRef = useRef(pathname);
  const reducedRef = useRef(false);

  const [transitioning, setTransitioning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  /* Starts at "full" so SSR and the first client paint agree; the effect below
     corrects it before anything expensive has had time to run. */
  const [tier, setTierState] = useState<Tier>("full");
  /* Whether the custom cursor is mounted. False until the effect below has
     confirmed there is a mouse to replace. */
  const [cursorOn, setCursorOn] = useState(false);

  pathnameRef.current = pathname;

  /* ---------- scroll helpers ---------- */
  const scrollTop = useCallback((y: number, smooth?: boolean) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(y, smooth ? { duration: 1.5 } : { immediate: true, force: true });
    }
    if (!lenis || !smooth) window.scrollTo(0, y);
    frame.current.scrollY = y;
  }, []);

  const scrollToEl = useCallback((el: HTMLElement | null, offset?: number) => {
    if (!el) return;
    const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - (offset || 0));
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(y, { duration: 1.5 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const startScroll = useCallback(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.start();
      lenis.resize();
    }
  }, []);

  const registerFrame = useCallback((cb: FrameCallback) => {
    callbacks.current.add(cb);
    return () => {
      callbacks.current.delete(cb);
    };
  }, []);

  const setHeadLogoTarget = useCallback((v: number) => {
    headLogoTargetRef.current = v;
  }, []);

  /*
   * Interface sound, delegated from the document rather than wired into every
   * control. Two listeners cover the whole site and nothing has to know that
   * audio exists; playClick/playHover are no-ops while sound is off.
   *
   * The recorder in the header is excluded — it plays its own click at the
   * moment it enables the context, and a delegated one would double it.
   */
  /*
   * Hide the OS cursor only where ours is drawn. This is a class on <html>
   * rather than a static rule in globals.css because the Studio is outside the
   * (site) group and never mounts this shell — a blanket rule would leave the
   * CMS with no pointer.
   */
  useEffect(() => {
    const root = document.documentElement;
    const initial = initTier();
    root.dataset.tier = initial;
    setTierState(initial);

    /*
     * Whether the custom cursor exists is decided here and nowhere else. One
     * boolean drives both the mount and the class that hides the OS cursor, so
     * the two can never disagree — they used to, because CSS made the touch
     * decision separately via a media query.
     *
     * `any-pointer`, not `pointer`. The unprefixed queries describe the
     * PRIMARY input, so a Windows laptop with both a touch panel and a mouse
     * reports coarse even while the visitor is using the mouse — which is what
     * made the OS cursor come back on exactly that hardware. `any-pointer:
     * fine` asks the question that actually matters: is there a mouse at all.
     */
    const fineMq = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");

    const apply = () => {
      /*
       * A mouse is the only requirement. This used to also demand a tier that
       * could run WebGL, which meant a machine with hardware acceleration off
       * got no custom cursor and no hidden OS cursor — the desktop pointer
       * back, with none of the design. The flat SVG arrow covers that case, so
       * the cursor exists wherever there is a pointer to replace.
       */
      const wanted = fineMq.matches;
      setCursorOn(wanted);
      root.classList.toggle("kura-hide-cursor", wanted);
    };

    const sync = (t: Tier) => {
      setTierState(t);
      root.dataset.tier = t;
      apply();
    };

    sync(initial);
    const off = onTierChange(sync);
    fineMq.addEventListener("change", apply);

    return () => {
      off();
      fineMq.removeEventListener("change", apply);
      root.classList.remove("kura-hide-cursor");
      delete root.dataset.tier;
    };
  }, []);

  useEffect(() => {
    const INTERACTIVE = 'a, button, summary, [role="button"]';

    const isSounded = (target: EventTarget | null): Element | null => {
      if (!(target instanceof Element)) return null;
      const el = target.closest(INTERACTIVE);
      if (!el || el.hasAttribute("data-no-sound")) return null;
      return el;
    };

    const onClick = (e: MouseEvent) => {
      if (isSounded(e.target)) playClick();
    };
    const onOver = (e: PointerEvent) => {
      // pointerover bubbles, unlike pointerenter, so one listener is enough.
      if (e.pointerType !== "mouse") return;
      const el = isSounded(e.target);
      // Ignore moves that stay inside the same control.
      if (el && !el.contains(e.relatedTarget as Node | null)) playHover();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onOver);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  /* ---------- plates ---------- */
  const parkPlates = useCallback(() => {
    [topRef.current, botRef.current].forEach((el, i) => {
      if (!el) return;
      el.style.animation = "none";
      // The design parks with a pixel offset measured from the plate. That reads
      // 0 whenever the document is not being laid out (a load in a background
      // tab), which would strand the plates over the page forever. A percentage
      // is resolved against the plate's own height at paint time, so it is
      // exact — a plate is 51% tall, so -100% == the design's -H — and it
      // survives a zero measurement.
      gsap.set(el, { y: 0, yPercent: i === 0 ? -100 : 100 });
    });
  }, []);

  /* ---------- route transition (design `go()`) ---------- */
  const navigate = useCallback(
    (href: string, jump?: "work" | "contact") => {
      if (transitioningRef.current) return;
      playNavigate();
      const top = topRef.current;
      const bot = botRef.current;

      const commit = () => {
        if (committedRef.current) return;
        committedRef.current = true;
        setMenuOpen(false);
        pendingJumpRef.current = href === "/" && jump ? jump : null;
        if (href === pathnameRef.current) {
          // same route: no push will fire, so consume the jump right here
          const target = pendingJumpRef.current;
          pendingJumpRef.current = null;
          scrollTop(0);
          if (target) {
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                scrollToEl(
                  document.getElementById(target),
                  target === "work" ? window.innerHeight * 0.08 : 0,
                ),
              ),
            );
          }
        } else {
          scrollTop(0);
          router.push(href);
        }
        startScroll();
      };

      if (!top || !bot) {
        commit();
        return;
      }

      top.style.animation = "none";
      bot.style.animation = "none";
      transitioningRef.current = true;
      setTransitioning(true);
      committedRef.current = false;

      if (guardRef.current) clearTimeout(guardRef.current);
      guardRef.current = setTimeout(() => {
        commit();
        transitioningRef.current = false;
        setTransitioning(false);
        parkPlates();
      }, 3200);

      const clearGuard = () => {
        if (guardRef.current) clearTimeout(guardRef.current);
        guardRef.current = null;
      };

      const tl = gsap.timeline({
        onComplete: () => {
          transitioningRef.current = false;
          setTransitioning(false);
          clearGuard();
        },
        onInterrupt: () => {
          transitioningRef.current = false;
          setTransitioning(false);
          clearGuard();
          commit();
        },
      });
      // Percentages rather than the design's measured pixel H — see parkPlates.
      // Identical motion (the plates are 51% tall), immune to a 0 measurement.
      tl.set(top, { y: 0, yPercent: -100 });
      tl.set(bot, { y: 0, yPercent: 100 });
      tl.to(top, { yPercent: 0, duration: 0.52, ease: "expo.inOut" }, 0);
      tl.to(bot, { yPercent: 0, duration: 0.52, ease: "expo.inOut" }, 0);
      tl.call(commit, undefined, ">+0.06");
      tl.to(top, { yPercent: -100, duration: 0.68, ease: "expo.inOut" }, ">+0.22");
      tl.to(bot, { yPercent: 100, duration: 0.68, ease: "expo.inOut" }, "<");
    },
    [router, parkPlates, scrollTop, scrollToEl, startScroll],
  );

  /* ---------- mount: reduced-motion, lenis, pointer, keys, park, rAF ---------- */
  useEffect(() => {
    mountedRef.current = true;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    setReduced(mq.matches);
    const onMq = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    mq.addEventListener("change", onMq);

    /* Lenis */
    /*
     * Smooth scroll is a per-frame transform of the whole document. On a
     * software rasteriser that repaints the entire page every frame, which is
     * exactly the wrong trade — so `minimal` scrolls natively.
     */
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: !mq.matches && atLeast("reduced"),
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", (inst: Lenis) => {
      frame.current.scrollY = inst.scroll != null ? inst.scroll : window.scrollY;
      frame.current.vel = inst.velocity || 0;
    });
    let lenisRaf = 0;
    const rafLenis = (time: number) => {
      if (!mountedRef.current) return;
      lenis.raf(time);
      lenisRaf = requestAnimationFrame(rafLenis);
    };
    lenisRaf = requestAnimationFrame(rafLenis);
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    lenis.start();
    lenis.resize();

    /* pointer */
    const onPointerMove = (e: PointerEvent) => {
      const p = frame.current.pointer;
      p.tx = e.clientX;
      p.ty = e.clientY;

      // The cursor is positioned here rather than in the frame loop. Reading
      // the eased p.x/p.y made it trail the real pointer by ~60ms, which is
      // very visible on the one element that is supposed to BE the pointer.
      // The eased values are still maintained above for the WebGL scenes,
      // which want the smoothing.
      const c = cursorRef.current;
      if (c) c.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;

      const t = e.target as Element | null;
      const el = t && typeof t.closest === "function" ? t.closest("[data-title]") : null;
      p.hoverT = el ? 1 : 0;
      const lab = cursorLabelRef.current;
      if (lab) {
        lab.style.opacity = el ? "1" : "0";
        if (el) {
          const txt = el.getAttribute("data-title") || "VIEW";
          if (lab.textContent !== txt) lab.textContent = txt;
        }
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* keys */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    /* resize */
    const onResize = () => lenisRef.current?.resize();
    window.addEventListener("resize", onResize);

    /* first-load plates park */
    const parkTimer = setTimeout(() => {
      if (!transitioningRef.current) parkPlates();
    }, 1800);

    /*
     * A document loaded while hidden (opened in a background tab) has its CSS
     * animations suspended, so the intro plates never finish and timers are
     * throttled — the page can end up revealed with the plates still covering
     * it. Park them again the moment the tab actually becomes visible.
     */
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!transitioningRef.current) parkPlates();
    };
    document.addEventListener("visibilitychange", onVisible);

    /* ---------- the one global rAF (design `loop()`) ---------- */
    let last = performance.now();
    let rafId = 0;
    const step = () => {
      if (!mountedRef.current) return;
      rafId = requestAnimationFrame(step);
      const now = performance.now();
      const rawMs = now - last;
      const dt = Math.min(0.05, rawMs / 1000);
      last = now;

      // Watch real frame times. Static detection catches disabled hardware
      // acceleration and named software renderers; this catches everything
      // else — weak integrated GPUs, thermal throttling, a machine under load.
      sampleFrame(rawMs);

      const s = frame.current;
      s.t += dt;
      const p = s.pointer;
      p.x += (p.tx - p.x) * 0.18;
      p.y += (p.ty - p.y) * 0.18;
      p.hover += (p.hoverT - p.hover) * 0.16;
      p.nx = p.x / Math.max(1, window.innerWidth) - 0.5;
      p.ny = p.y / Math.max(1, window.innerHeight) - 0.5;

      // Position is handled in onPointerMove; only the hover response is eased.
      // The arrow shrinks slightly as the label appears so the two do not
      // fight for the same spot.
      const cs = cursorScaleRef.current;
      if (cs) cs.style.transform = "scale(" + (1 - p.hover * 0.22).toFixed(3) + ")";

      s.iconHover.work += (s.iconHover.workT - s.iconHover.work) * 0.12;
      s.iconHover.contact += (s.iconHover.contactT - s.iconHover.contact) * 0.12;

      const sgn = s.vel < 0 ? 1 : -1;
      const mag = Math.sqrt(Math.abs(s.vel)) * BOW_CURVE;
      const target = sgn * clamp(mag, 0, 0.035);
      s.velEase += (target - s.velEase) * (Math.abs(target) > Math.abs(s.velEase) ? 0.16 : 0.07);
      s.vel *= 0.88;

      /* view-registered work */
      callbacks.current.forEach((cb) => {
        try {
          cb(dt, s);
        } catch {
          /* a broken view must not kill the loop */
        }
      });

      /* header logo (design `restPlates()` / homeFrame tail) */
      const h = headLogoRef.current;
      if (h) {
        const want = pathnameRef.current === "/" ? headLogoTargetRef.current : 1;
        headKRef.current += (want - headKRef.current) * 0.1;
        h.style.opacity = headKRef.current.toFixed(3);
        h.style.pointerEvents = headKRef.current > 0.5 ? "auto" : "none";
      }
    };
    rafId = requestAnimationFrame(step);

    return () => {
      mountedRef.current = false;
      mq.removeEventListener("change", onMq);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(parkTimer);
      if (guardRef.current) clearTimeout(guardRef.current);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(lenisRaf);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [parkPlates]);

  /* ---------- route settled: scroll to top or to the pending jump ---------- */
  useEffect(() => {
    headLogoTargetRef.current = pathname === "/" ? 0 : 1;
    const jump = pendingJumpRef.current;
    pendingJumpRef.current = null;

    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        lenisRef.current?.resize();
        if (jump) {
          const el = document.getElementById(jump);
          if (el) {
            scrollToEl(el, jump === "work" ? window.innerHeight * 0.08 : 0);
            return;
          }
        }
        scrollTop(0);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pathname, scrollToEl, scrollTop]);

  const api = useMemo<SiteShellApi>(
    () => ({
      frame,
      registerFrame,
      navigate,
      scrollToEl,
      scrollTop,
      stopScroll,
      startScroll,
      transitioning,
      setHeadLogoTarget,
      reduced,
    }),
    [
      registerFrame,
      navigate,
      scrollToEl,
      scrollTop,
      stopScroll,
      startScroll,
      transitioning,
      setHeadLogoTarget,
      reduced,
    ],
  );

  return (
    <SiteShellContext.Provider value={api}>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100svh",
          background: "#05040A",
          color: "#FFFFFF",
        }}
      >
        <Plates topRef={topRef} botRef={botRef} />

        <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <CloudCanvas
            dark={0}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
          {/* A full-viewport blend layer costs a second composite of the whole
              page every frame, which a software compositor cannot afford. */}
          {tier === "full" ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.45,
                mixBlendMode: "overlay",
                backgroundImage:
                  "radial-gradient(rgba(255, 255, 255, 0.5) 0.7px, transparent 0.9px)",
                backgroundSize: "3px 3px",
                pointerEvents: "none",
              }}
            />
          ) : null}
        </div>

        {/* Decoration, and the first things to go. The cursor survives one tier
            longer than the particles because losing it is far more disorienting
            than losing a trail. */}
        {tier === "full" ? <ParticleField /> : null}
        {cursorOn ? (
          <Cursor
            cursorRef={cursorRef}
            scaleRef={cursorScaleRef}
            labelRef={cursorLabelRef}
            flat={tier === "minimal"}
          />
        ) : null}
        <BackToTop />

        <Header headLogoRef={headLogoRef} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

        {children}
      </div>
    </SiteShellContext.Provider>
  );
}
