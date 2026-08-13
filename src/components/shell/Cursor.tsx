"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { disposeScene, makeRenderer } from "@/lib/three/renderer";
import { buildCursorIcon } from "@/lib/three/logo";

type Props = {
  cursorRef: RefObject<HTMLDivElement | null>;
  scaleRef: RefObject<HTMLDivElement | null>;
  labelRef: RefObject<HTMLSpanElement | null>;
  /** No WebGL available — draw the flat SVG arrow instead. */
  flat: boolean;
};

/*
 * The pointer, as an extruded arrow in the same family as the hero icons and
 * the header recorder (its own opaque material — see buildCursorIcon).
 *
 * Two nested elements on purpose:
 *
 *   cursorRef  position only, written straight from the pointermove handler.
 *   scaleRef   scale only, eased in the frame loop for the hover state.
 *
 * They were one element before, which meant the position had to come from the
 * same eased value as the scale and the cursor visibly trailed the mouse. A
 * cursor is the one thing on a page that must never lag, so tracking is now
 * raw and only the hover response is smoothed.
 *
 * The canvas is tiny and fixed-size, so there is no resize handling and the
 * render loop is local rather than joining the shell's — it only needs to run
 * while the arrow is actually rotating.
 */

const SIZE = 46;

/*
 * Flat fallback, used when there is no WebGL to draw the extruded arrow with.
 *
 * The cursor must never depend on the render tier. It did, and on a machine
 * with hardware acceleration disabled that meant no custom cursor AND no
 * hidden OS cursor — the visitor just got their desktop pointer back with none
 * of the design. Same silhouette, same hotspot, no GPU.
 */
function FlatArrow() {
  return (
    <svg
      width={26}
      height={30}
      viewBox="0 0 26 30"
      fill="none"
      style={{ position: "absolute", left: -1, top: -1, display: "block" }}
      aria-hidden
    >
      <path
        d="M2 1.6 L2 24.5 L8.2 18.6 L12.4 28.4 L16.6 26.6 L12.5 17.2 L21 17.2 Z"
        fill="#ffffff"
        stroke="#2a14e8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Cursor({ cursorRef, scaleRef, labelRef, flat }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (flat) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = makeRenderer(canvas, true);
    if (!renderer) {
      canvas.style.display = "none";
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(SIZE, SIZE, false);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.z = 3.4;

    const arrow = buildCursorIcon();
    arrow.scale.setScalar(1.25);
    scene.add(arrow);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      // A slow wobble, enough to read as a solid object catching light rather
      // than as a flat sprite.
      arrow.rotation.y = Math.sin(t * 0.9) * 0.5;
      arrow.rotation.x = Math.sin(t * 0.7) * 0.16;
      renderer.render(scene, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      disposeScene(scene);
      renderer.dispose();
    };
  }, [flat]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 220,
        pointerEvents: "none",
        transform: "translate3d(-300px, -300px, 0)",
        willChange: "transform",
      }}
    >
      <div ref={scaleRef} style={{ transform: "scale(1)", willChange: "transform" }}>
        {/*
          Offset so the arrow's tip, not its centre, sits on the hotspot —
          the geometry is centred on its bounding box by `extrude`.
        */}
        {flat ? (
          <FlatArrow />
        ) : (
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              position: "absolute",
              left: -SIZE * 0.31,
              top: -SIZE * 0.28,
              width: SIZE,
              height: SIZE,
              display: "block",
            }}
          />
        )}
        <span
          ref={labelRef}
          style={{
            position: "absolute",
            left: 22,
            top: 20,
            display: "block",
            background: "#FFFFFF",
            color: "#2A14E8",
            fontFamily: "var(--ff-body)",
            fontStretch: "87.5%",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "8px 12px 7px",
            borderRadius: 2,
            whiteSpace: "nowrap",
            opacity: 0,
            transition: "opacity 0.22s ease",
          }}
        >
          VIEW
        </span>
      </div>
    </div>
  );
}
