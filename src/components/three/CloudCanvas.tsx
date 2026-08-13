"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import { CLOUD_FRAG } from "@/lib/three/shaders";
import { disposeScene, makeRenderer, onScreen } from "@/lib/three/renderer";
import { atLeast, onTierChange } from "@/lib/perf";

type Props = {
  /** 0 = the page background cloud, 1 = the dark work-section cloud. */
  dark: 0 | 1;
  className?: string;
  style?: React.CSSProperties;
};

/*
 * The gradient the CSS fallback paints when the shader is not affordable.
 * Sampled from the shader's own palette so the page keeps its colour, just
 * without the motion.
 */
const FALLBACK_BG: Record<0 | 1, string> = {
  0: "radial-gradient(125% 105% at 50% 45%, #0B01FF 0%, #0B01FF 52%, #0a0a8f 100%)",
  1: "radial-gradient(125% 105% at 50% 45%, #030142 0%, #030142 52%, #02021f 100%)",
};

/* Design file lines 976-1012 (initCloud / resizeCloud) — verbatim. */
export default function CloudCanvas({ dark, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { frame } = useSiteShell();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
     * This is the most expensive thing on the page by a wide margin: a
     * full-viewport fbm fragment shader, evaluated per pixel per frame. It is
     * the first thing to go, and it is dropped for anything below `full` — a
     * CPU rasteriser spends tens of milliseconds a frame here on its own.
     *
     * The parent element already carries the fallback gradient, so hiding the
     * canvas is all that is needed.
     */
    let stopped = false;
    const applyTier = () => {
      if (atLeast("full")) return false;
      canvas.style.display = "none";
      stopped = true;
      return true;
    };
    if (applyTier()) return;
    const offTier = onTierChange(applyTier);

    const renderer = makeRenderer(canvas, false, 0.6);
    if (!renderer) {
      canvas.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const u = {
      uTime: { value: dark ? 140 : 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uDark: { value: dark },
    };
    scene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          vertexShader: "void main(){ gl_Position = vec4(position, 1.0); }",
          fragmentShader: CLOUD_FRAG,
          uniforms: u,
          depthTest: false,
          depthWrite: false,
        }),
      ),
    );

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      u.uRes.value.set(
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio(),
      );
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // A mid-session demotion stops the shader without tearing the component
      // down; the gradient underneath is already in place.
      if (stopped) return;
      if (!canvas.isConnected || !onScreen(canvas)) return;
      u.uTime.value = (dark ? 140 : 0) + clock.getElapsedTime();
      u.uMouse.value.set(frame.current.pointer.nx, -frame.current.pointer.ny);
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      offTier();
      window.removeEventListener("resize", resize);
      disposeScene(scene);
      try {
        renderer.dispose();
      } catch {
        /* noop — matches the design's swallowed dispose */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The gradient sits on the wrapper, not the canvas, so it is already painted
  // if the shader never starts or is switched off later.
  return (
    <div className={className} style={{ ...style, background: FALLBACK_BG[dark] }}>
      {/*
        The canvas renders at 60% and is scaled up by CSS. Left alone the
        browser smooths that, which would blur the dither into the gradient it
        was there to replace. `pixelated` turns the upscale into part of the
        effect: one shader fragment becomes a visible square.
      */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
