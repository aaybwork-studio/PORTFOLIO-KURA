/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import type { ArchiveItem } from "@/lib/types";
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

  /* design renderVals(): row(off) = ARCHIVE.concat(ARCHIVE).slice(off, off+7) */
  const row = (off: number): Card[] => {
    if (n === 0) return [];
    return items
      .concat(items)
      .slice(off, off + 7)
      .map((a, j) => ({ i: (off + j) % n, title: a.title, img: a.image.src }));
  };
  const rows: Card[][] = [row(0), row(3), row(5)];

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

      if (focused !== null && n > 0) {
        focusTarget.current += dt * (0.16 + clamp(Math.abs(vel) * 0.02, 0, 1.2));
        focusPos.current += (focusTarget.current - focusPos.current) * 0.12;
        const stage = focusStageRef.current;
        if (stage) {
          const kids = stage.children;
          const FR = Math.min(W * 0.8, 1150);
          stage.style.transform = "translateZ(" + (-FR).toFixed(0) + "px)";
          const first = kids[0] as HTMLElement | undefined;
          const fw = first ? first.offsetWidth : 360;
          const fstep = Math.max(18, (2 * Math.asin(clamp((fw + 24) / (2 * FR), 0, 0.6))) / DEG);
          for (let i = 0; i < kids.length; i++) {
            let rel = (((i - focusPos.current) % n) + n) % n;
            if (rel > n / 2) rel -= n;
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
        let ti = Math.round(focusPos.current) % n;
        if (ti < 0) ti += n;
        if (ti !== lastFocusTitle.current && focusTitleRef.current && items[ti]) {
          lastFocusTitle.current = ti;
          focusTitleRef.current.textContent = items[ti].title;
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
    focusTarget.current = idx;
    focusPos.current = idx;
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
    <main style={{ position: "relative", zIndex: 10, height: "100svh", overflow: "hidden" }}>
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
                    src={c.img}
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
          <p className={styles.archHint} data-hidden={hintDone ? "true" : "false"} aria-hidden>
            Drag to browse
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
        <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(5, 3, 20, 0.92)" }}>
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
              {items.map((a, i) => (
                <div
                  key={`focus-${i}`}
                  style={{
                    position: "absolute",
                    height: "min(56svh, 62vw)",
                    aspectRatio: "4 / 5",
                    overflow: "hidden",
                    borderRadius: "8px",
                    background: "#14121C",
                    willChange: "transform",
                  }}
                >
                  <img
                    src={a.image.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
            <p
              ref={focusTitleRef}
              style={{
                margin: 0,
                fontFamily: "var(--ff-display)",
                fontWeight: 700,
                fontSize: "clamp(1.4rem, 2.2vw, 2.1rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Archive
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
