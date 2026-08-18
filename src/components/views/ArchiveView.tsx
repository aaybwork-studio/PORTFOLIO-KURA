/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { ArchiveItem } from "@/lib/types";
import { imgProps } from "@/lib/imageSet";
import styles from "./views.module.css";

const DEG = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

type Card = { i: number; title: string; img: string };
type Props = { items: ArchiveItem[] };

/*
 * Cards are 15% narrower than the design's, per direction from the author.
 * Three rows of 210px plates at phone width filled the screen edge to edge and
 * the carousel read as a wall rather than as a carousel.
 */
const cardStyle: CSSProperties = {
  position: "absolute",
  width: "clamp(102px, 11vw, 179px)",
  aspectRatio: "4 / 5",
  overflow: "hidden",
  borderRadius: "5px",
  background: "#14121C",
  display: "block",
  willChange: "transform",
};

const rowWrapStyle: CSSProperties = {
  position: "relative",
  height: "100%",
  transformStyle: "preserve-3d",
  pointerEvents: "none",
};

const rowStageStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: 0,
  height: 0,
  transformStyle: "preserve-3d",
  pointerEvents: "none",
};

export default function ArchiveView({ items }: Props) {
  const { frame, registerFrame, stopScroll, startScroll } = useSiteShell();

  const arch0Ref = useRef<HTMLDivElement | null>(null);
  const arch1Ref = useRef<HTMLDivElement | null>(null);
  const arch2Ref = useRef<HTMLDivElement | null>(null);
  const focusStageRef = useRef<HTMLDivElement | null>(null);
  const focusTitleRef = useRef<HTMLParagraphElement | null>(null);

  const rowPos = useRef<[number, number, number]>([0, 0, 0]);
  const focusPos = useRef(0);
  const focusTarget = useRef(0);
  const lastFocusTitle = useRef(-1);
  /** mirrors `focus` state so the frame callback always reads the live value. */
  const focusRef = useRef<number | null>(null);

  const [focus, setFocus] = useState<number | null>(null);
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  /** mirrors the focused item's shot count for the frame callback */
  const focusCountRef = useRef(0);

  /*
   * Auto-rotate, and the manual override.
   *
   * `auto` is state because a button renders from it; `autoRef` mirrors it
   * because the frame callback is registered once and would otherwise close
   * over the first value forever. Same reason `focusRef` exists.
   *
   * `delta` accumulates degrees from drags and wheels between frames and is
   * drained by the frame loop, so several input events inside one frame add up
   * instead of the last one winning.
   */
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  const dragRef = useRef({ active: false, x: 0, delta: 0, moved: false });
  const [hintDone, setHintDone] = useState(false);

  const toggleAuto = () => {
    const next = !autoRef.current;
    autoRef.current = next;
    setAuto(next);
  };

  const n = items.length;

  /*
   * Every plate appears exactly once.
   *
   * The rows used to be overlapping slices of a doubled list, so the same
   * poster could show up in all three rows at once and the archive read as
   * four things repeated rather than as thirty. Now the set is shuffled and
   * dealt out round-robin: shuffled so the kinds are mixed, dealt so no plate
   * is ever on screen twice.
   *
   * The shuffle is seeded rather than random, because this component renders on
   * the server too and Math.random would deal a different hand there than in
   * the browser, which React would flag as a hydration mismatch.
   */
  const rows: Card[][] = useMemo(() => {
    const deck = items.map((a, i) => ({ i, title: a.title, img: a.image.src }));
    let seed = 20260814;
    for (let k = deck.length - 1; k > 0; k--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (k + 1);
      [deck[k], deck[j]] = [deck[j], deck[k]];
    }
    return [0, 1, 2].map((r) => deck.filter((_, idx) => idx % 3 === r));
  }, [items]);

  /*
   * What the focus view shows: the plate you clicked and nothing else.
   *
   * It used to rotate through the whole archive, so opening one photograph put
   * you in a slow carousel of every other one. A poster opens onto its own
   * mockups and crops; a photograph opens onto itself.
   */
  const focusMedia = useMemo(() => {
    if (focus === null) return [] as { src: string; alt: string }[];
    const item = items[focus];
    if (!item) return [];
    const shots = (item.gallery ?? [])
      .filter((m) => m.kind === "image")
      .map((m) => ({ src: m.src, alt: m.alt || item.title }));
    return shots.length > 0 ? shots : [{ src: item.image.src, alt: item.title }];
  }, [focus, items]);
  const focusCount = focusMedia.length;
  const focusTitle = focus === null ? "" : (items[focus]?.title ?? "");
  useEffect(() => {
    focusCountRef.current = focusCount;
  }, [focusCount]);

  /* ---------- design archiveFrame() ---------- */
  useEffect(() => {
    return registerFrame((dt) => {
      const vel = frame.current.vel;
      const W = window.innerWidth;
      const R = Math.min(W * 1.15, 1500);
      const firstRow = arch0Ref.current;
      const firstChild = firstRow ? (firstRow.children[0] as HTMLElement | undefined) : undefined;
      const cw = firstChild ? firstChild.offsetWidth : 180;
      const stepA = Math.max(12, (2 * Math.asin(clamp((cw + 20) / (2 * R), 0, 0.55))) / DEG);
      const rowEls = [arch0Ref.current, arch1Ref.current, arch2Ref.current];
      /*
       * Roughly half the design's 1.2 deg/s, and the scroll boost is damped to
       * match. At the old rate a card crossed the visible 124-degree arc in
       * about a second and a half, which is not long enough to look at it --
       * and the whole point of the row is that you can.
       */
      const base = 0.55;
      const dirs = [1, -1, 1];
      const boost = clamp(Math.abs(vel) * 0.18, 0, 12);
      const focused = focusRef.current;
      /*
       * Manual drag beats the clock. While a finger or the pointer is down the
       * rows move only as far as the drag says, so the carousel does not keep
       * rotating out from under a card someone is trying to reach.
       */
      const auto = autoRef.current && !dragRef.current.active;
      const drag = dragRef.current.delta;
      dragRef.current.delta = 0;

      rowEls.forEach((rowEl, ri) => {
        if (!rowEl) return;
        const kids = rowEl.children;
        const count = kids.length;
        if (!count) return;
        rowEl.style.transform = "translateZ(" + (-R).toFixed(0) + "px)";
        const span = count * stepA;
        rowPos.current[ri] += (auto ? dt * dirs[ri] * (base + boost) : 0) + drag * dirs[ri];
        const pos = rowPos.current[ri] % span;
        const dim = focused !== null ? 0.15 : 1;
        for (let i = 0; i < count; i++) {
          let a = i * stepA + pos;
          a = ((a % span) + span) % span;
          if (a > span / 2) a -= span;
          const el = kids[i] as HTMLElement;
          if (Math.abs(a) > 62) {
            el.style.visibility = "hidden";
            el.style.pointerEvents = "none";
            continue;
          }
          el.style.visibility = "visible";
          el.style.pointerEvents = focused !== null ? "none" : "auto";
          el.style.transform =
            "translate(-50%, -50%) rotateY(" + a.toFixed(2) + "deg) translateZ(" + R.toFixed(0) + "px)";
          el.style.opacity = (clamp(1 - Math.abs(a) / 62, 0, 1) * dim).toFixed(3);
          el.style.zIndex = String(200 - Math.round(Math.abs(a)));
        }
      });

      const fc = focusCountRef.current;
      if (focused !== null && fc > 0) {
        // A single shot has nothing to rotate towards, so it sits still.
        if (fc > 1) focusTarget.current += dt * (0.16 + clamp(Math.abs(vel) * 0.02, 0, 1.2));
        focusPos.current += (focusTarget.current - focusPos.current) * 0.12;
        const stage = focusStageRef.current;
        if (stage) {
          const kids = stage.children;
          const FR = Math.min(W * 0.8, 1150);
          stage.style.transform = "translateZ(" + (-FR).toFixed(0) + "px)";
          /*
           * Space the ring off the WIDEST shot, not the first one.
           *
           * The frames are `width: auto` so each shot keeps its own aspect, and
           * a gallery mixes a portrait poster with a landscape crop and the odd
           * panorama. Measuring only `kids[0]` set one angular step for all of
           * them, so anything wider than the first overlapped its neighbours —
           * a wide crop sat straight across the poster beside it.
           *
           * One step sized to the widest frame guarantees no overlap for any
           * mix. Narrow shots get a little more air around them than they
           * strictly need, which is the right way round: too much space reads
           * as spacing, too little reads as breakage.
           */
          let fw = 360;
          for (let i = 0; i < kids.length; i++) {
            const w = (kids[i] as HTMLElement).offsetWidth;
            if (w > fw) fw = w;
          }
          const fstep = Math.max(18, (2 * Math.asin(clamp((fw + 40) / (2 * FR), 0, 0.72))) / DEG);
          for (let i = 0; i < kids.length; i++) {
            let rel = (((i - focusPos.current) % fc) + fc) % fc;
            if (rel > fc / 2) rel -= fc;
            const el = kids[i] as HTMLElement;
            if (Math.abs(rel) > 2.2) {
              el.style.visibility = "hidden";
              continue;
            }
            el.style.visibility = "visible";
            const a = rel * fstep;
            const sc = 1 - Math.min(Math.abs(rel), 3) * 0.07;
            el.style.transform =
              "translate(-50%, -50%) rotateY(" +
              a.toFixed(2) +
              "deg) translateZ(" +
              FR +
              "px) scale(" +
              sc.toFixed(3) +
              ")";
            el.style.opacity = clamp(1.05 - Math.abs(rel) / 2.3, 0, 1).toFixed(3);
            el.style.zIndex = String(100 - Math.round(Math.abs(rel) * 10));
          }
        }
      }
    });
  }, [frame, items, n, registerFrame]);

  /* ---------- wheel drives the focus carousel, or scrubs the rows ---------- */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (focusRef.current !== null) {
        focusTarget.current += (e.deltaY || 0) * 0.0035;
        return;
      }
      /*
       * The archive page is a fixed 100svh with overflow hidden, so a wheel
       * gesture here had nowhere to go — the page did not scroll and the rows
       * ignored it. It scrubs the carousel instead, which is what the gesture
       * looks like it should do.
       */
      dragRef.current.delta += (e.deltaY || 0) * 0.02;
      dragRef.current.moved = true;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  /*
   * Drag to scrub.
   *
   * Bound to the window rather than to the row container so a drag that leaves
   * the element still tracks, and released on pointercancel as well as
   * pointerup — on touch, a gesture the browser claims for its own fires
   * cancel and never fires up, which would otherwise leave the carousel frozen
   * with `active` stuck true.
   *
   * 0.16 deg per pixel is roughly one card per 100px of travel at the phone
   * card size, which is the ratio that makes the drag feel attached to the art.
   */
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (focusRef.current !== null) return;
      dragRef.current.active = true;
      dragRef.current.x = e.clientX;
      dragRef.current.moved = false;
    };
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.x;
      d.x = e.clientX;
      if (Math.abs(dx) > 0) d.delta += dx * 0.16;
      if (Math.abs(dx) > 2) {
        d.moved = true;
        setHintDone(true);
      }
    };
    const up = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  /* ---------- Escape closes focus ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (focusRef.current === null) return;
      focusRef.current = null;
      setFocus(null);
      startScroll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startScroll]);

  /* release the scroll lock if we unmount while focused */
  useEffect(() => () => startScroll(), [startScroll]);

  const onArchiveClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const a = target && target.closest ? target.closest("[data-arch]") : null;
    if (!a) return;
    e.preventDefault();
    // A drag that crossed a card ends with a click on it. Opening the focus
    // view there means every scrub finishes by launching something.
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    const idx = parseInt(a.getAttribute("data-arch") || "0", 10) || 0;
    /*
     * Everything opens the same way: in place, into its own shots. A poster
     * brings its mockups and crops, a UI set brings its screens, a photograph
     * brings itself. Nothing routes away to a case-study page — this is an
     * archive, and the artefact is the whole point.
     *
     * The stage starts at 0 because the list it rotates through is now the
     * item's own media, not the archive.
     */
    focusTarget.current = 0;
    focusPos.current = 0;
    lastFocusTitle.current = -1;
    focusRef.current = idx;
    stopScroll();
    setFocus(idx);
  };

  const closeFocus = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    focusRef.current = null;
    startScroll();
    setFocus(null);
  };

  return (
    <main className={styles.archiveRoot}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "clamp(78px, 11vh, 118px)",
          zIndex: 4,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "16px",
          padding: "0 clamp(16px, 3vw, 40px)",
          pointerEvents: "none",
        }}
      />

      <div
        onClick={onArchiveClick}
        className={styles.archiveStage}
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateRows: "repeat(3, 1fr)",
          alignItems: "center",
          perspective: "1400px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {rows.map((cards, ri) => (
          <div key={ri} style={rowWrapStyle}>
            <div ref={ri === 0 ? arch0Ref : ri === 1 ? arch1Ref : arch2Ref} style={rowStageStyle}>
              {cards.map((c, j) => (
                <a
                  key={`${ri}-${j}-${c.i}`}
                  href="#arch"
                  data-arch={c.i}
                  data-title={c.title}
                  style={cardStyle}
                >
                  <img
                    /* Plates cap at 179px wide; two sizes cover every screen
                       density without pulling the original upload. */
                    {...imgProps(c.img, "180px")}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/*
        Autoplay is a preference, not a fact of the page. Someone who wants to
        look at one plate should not have to fight the clock for it, and there
        was previously no way to stop it at all.
      */}
      {focus === null ? (
        <>
          {/*
            The gesture differs by device, so the hint does too: a wheel is the
            obvious move on a desktop and does not exist on a phone. Both are
            rendered and CSS picks one, since a JS check would flash the wrong
            wording before it ran.
          */}
          <p className={styles.archHint} data-hidden={hintDone ? "true" : "false"} aria-hidden>
            <span className={styles.archHintPointer}>Scroll to browse</span>
            <span className={styles.archHintTouch}>Drag to browse</span>
          </p>
          <div className={styles.archControls}>
            <button
              type="button"
              onClick={toggleAuto}
              className={styles.archBtn}
              aria-pressed={auto}
            >
              {auto ? "Pause ‖" : "Play ▶"}
            </button>
          </div>
        </>
      ) : null}

      {focus !== null ? (
        <div
          className={styles.archiveStage}
          style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(5, 3, 20, 0.92)" }}
        >
          <div style={{ position: "absolute", inset: 0, perspective: "1600px", perspectiveOrigin: "50% 50%" }}>
            <div
              ref={focusStageRef}
              style={{
                position: "absolute",
                left: "50%",
                top: "46%",
                width: 0,
                height: 0,
                transformStyle: "preserve-3d",
              }}
            >
              {/*
                No fixed aspect here. A 4:5 box with object-fit: cover was fine
                when every plate was a poster thumbnail, but these are the real
                shots — portrait posters, landscape mockups, square covers — and
                cropping a mockup to portrait defeats the point of opening it.
                Each frame takes its own proportions, bounded by height.
              */}
              {focusMedia.map((m, i) => (
                <div
                  key={`focus-${i}-${m.src}`}
                  style={{
                    position: "absolute",
                    height: "min(62svh, 74vw)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    willChange: "transform",
                  }}
                >
                  <img
                    /* The focus view is the one place a plate is shown large. */
                    {...imgProps(m.src, "(max-width: 720px) 84vw, 60vh")}
                    alt={m.alt}
                    loading="lazy"
                    decoding="async"
                    style={{
                      height: "100%",
                      width: "auto",
                      maxWidth: "84vw",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "clamp(28px, 5vh, 54px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/*
              A caption, not a headline. Set in the display face at 2rem it
              shouted over the artefact and, on a long title, wrapped across
              half the screen. The work is the thing being looked at; the title
              only has to say which one it is.
            */}
            <p
              ref={focusTitleRef}
              style={{
                margin: 0,
                fontFamily: "var(--ff-body)",
                fontStretch: "87.5%",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.72)",
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              {focusTitle}
            </p>
            <button
              onClick={closeFocus}
              className={styles.closeBtn}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                borderRadius: "999px",
                color: "#FFFFFF",
                fontFamily: "var(--ff-body)", fontStretch: "87.5%",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "13px 22px 12px",
              }}
            >
              Close ✕
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
