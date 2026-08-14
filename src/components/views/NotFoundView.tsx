"use client";

import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import { playEdge } from "@/lib/audio";
import { clamp } from "@/lib/frame";
import styles from "./views.module.css";

/*
 * The 404.
 *
 * Same idea as the contact section: one mark bouncing around an otherwise
 * empty screen, with the copy sitting still in the middle of it. The header
 * and its menu come from the shell, so there is no "back home" button here —
 * the way out is the same way out as on every other page.
 *
 * It is DOM rather than WebGL, unlike the contact logo. That mark is an
 * extruded 3D object built from a traced path; a numeral set in IntraNet is
 * just type, and putting it through a canvas would mean parsing the font into
 * geometry to draw something the browser already draws. It also means the page
 * behaves identically on a machine with no usable GPU, which matters more on
 * an error page than anywhere else — this is often the first page someone
 * sees, and it is the one that has to work when something else already has
 * not.
 *
 * The physics are the contact logo's, kept deliberately: constant speed with a
 * floor and a ceiling, a soft push away from the pointer, and a ring on each
 * wall.
 */
export default function NotFoundView() {
  const { frame, registerFrame, reduced } = useSiteShell();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const mark = markRef.current;
    if (!stage || !mark) return;

    /*
     * Layout centres the mark, which is exactly where the message is. Left at
     * its resting position it renders directly behind the sentence for the
     * first frame — and permanently for anyone with reduced motion, where the
     * loop never runs at all.
     *
     * So it is placed off-centre before anything else happens, up and to the
     * left, clear of the copy. The offset is a fraction of the stage rather
     * than a fixed pixel count so it holds at any size.
     */
    const rect0 = stage.getBoundingClientRect();
    const startX = -Math.max(0, rect0.width / 2 - mark.offsetWidth / 2) * 0.75;
    const startY = -Math.max(0, rect0.height / 2 - mark.offsetHeight / 2) * 0.6;
    mark.style.transform = `translate3d(${startX.toFixed(1)}px,${startY.toFixed(1)}px,0)`;

    // Someone who asked for less motion keeps it parked there rather than
    // having a numeral orbit the message they are trying to read.
    if (reduced) return;

    const st = { x: startX, y: startY, vx: 190, vy: 132, hit: 0, tilt: 0 };

    return registerFrame((dt) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      /*
       * Bounds are measured every frame from the live element rather than
       * cached on resize. The mark is sized in vw, so a rotation of the phone
       * changes both the box and the thing inside it at once, and a cached
       * half-width would let it walk off screen until the next resize event.
       */
      const halfW = mark.offsetWidth / 2;
      const halfH = mark.offsetHeight / 2;
      const limX = Math.max(4, rect.width / 2 - halfW);
      const limY = Math.max(4, rect.height / 2 - halfH);

      // Pointer repulsion, in the stage's own coordinates.
      const p = frame.current.pointer;
      const px = p.x - rect.left - rect.width / 2;
      const py = p.y - rect.top - rect.height / 2;
      const dx = st.x - px;
      const dy = st.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const reach = Math.min(rect.width, rect.height) * 0.42;
      if (dist < reach && dist > 0.001) {
        const f = (1 - dist / reach) * 420 * dt;
        st.vx += (dx / dist) * f;
        st.vy += (dy / dist) * f;
      }

      // Speed is held inside a band. Left alone, the pointer either stalls it
      // against a wall or slingshots it off screen between two frames.
      const spd = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
      if (spd > 460) {
        st.vx *= 460 / spd;
        st.vy *= 460 / spd;
      } else if (spd < 130) {
        const k = 130 / Math.max(spd, 0.001);
        st.vx *= k;
        st.vy *= k;
      }

      st.x += st.vx * dt;
      st.y += st.vy * dt;

      // playEdge is a no-op while sound is off, so there is nothing to gate.
      if (st.x > limX) {
        st.x = limX;
        st.vx = -Math.abs(st.vx);
        st.hit = 0.07;
        playEdge("x");
      } else if (st.x < -limX) {
        st.x = -limX;
        st.vx = Math.abs(st.vx);
        st.hit = 0.07;
        playEdge("x");
      }
      if (st.y > limY) {
        st.y = limY;
        st.vy = -Math.abs(st.vy);
        st.hit = 0.07;
        playEdge("y");
      } else if (st.y < -limY) {
        st.y = -limY;
        st.vy = Math.abs(st.vy);
        st.hit = 0.07;
        playEdge("y");
      }

      // Leans into the direction of travel, eased so a bounce does not snap it.
      const tilt = clamp(st.vx * 0.012, -7, 7);
      st.tilt += (tilt - st.tilt) * 0.08;

      mark.style.transform =
        "translate3d(" +
        st.x.toFixed(1) +
        "px," +
        st.y.toFixed(1) +
        "px,0) rotate(" +
        st.tilt.toFixed(2) +
        "deg) scale(" +
        (1 + st.hit).toFixed(3) +
        ")";
      st.hit *= 0.86;
    });
  }, [frame, reduced, registerFrame]);

  return (
    <main className={styles.notFound}>
      {/*
        The mark is aria-hidden and the message carries the meaning. A screen
        reader announcing a stray "404" before the sentence that explains it is
        noise, and the numeral is decoration here however large it is.
      */}
      <div ref={stageRef} className={styles.notFoundStage} aria-hidden>
        <span ref={markRef} className={styles.notFoundMark}>
          404
        </span>
      </div>

      <p className={styles.notFoundText}>404 page not found</p>
    </main>
  );
}
