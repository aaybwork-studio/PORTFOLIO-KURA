"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import { CLOUD_FRAG } from "@/lib/three/shaders";
import { disposeScene, makeRenderer, onScreen } from "@/lib/three/renderer";
import { atLeast, onTierChange } from "@/lib/perf";
import { PALETTES, getBackdrop, onBackdropChange, type BackdropName } from "@/lib/backdrop";

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
  0: PALETTES.site.css,
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
     * This used to be dropped below `full`, because it was an fbm shader with
     * three octaves of value noise per pixel per frame — genuinely the most
     * expensive thing on the page, and hopeless on a CPU rasteriser.
     *
     * The replacement is four sines and a Bayer lookup, which is cheap enough
     * to keep at `reduced`, where the pixel ratio is pinned to 1 anyway. That
     * matters: cutting it meant anyone with hardware acceleration disabled saw
     * a completely static gradient, which is exactly what a moving background
     * is not supposed to be. Only `minimal` — no usable WebGL at all — still
     * falls back.
     *
     * The parent element carries the fallback gradient, so hiding the canvas
     * is all that is needed.
     */
    let stopped = false;
    const applyTier = () => {
      if (atLeast("reduced")) return false;
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
    /*
     * The palette is eased rather than switched.
     *
     * This canvas is mounted once for the life of the session, so entering a
     * case study changes the colour of a background that is already on screen.
     * Cutting between palettes mid-route-transition reads as a glitch; a short
     * ease reads as the room changing.
     *
     * The dark work-section canvas keeps its own colours — it is a section
     * treatment, not the page backdrop, and nothing asks it to change.
     */
    const start = dark ? PALETTES.site : PALETTES[getBackdrop()];
    const u = {
      uTime: { value: dark ? 140 : 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uDark: { value: dark },
      uBase: { value: new THREE.Vector3(...start.base) },
      uDeep: { value: new THREE.Vector3(...start.deep) },
    };

    const target = {
      base: new THREE.Vector3(...start.base),
      deep: new THREE.Vector3(...start.deep),
    };

    const wrapper = canvas.parentElement;
    /*
     * Frames since this canvas started, so the first change can snap.
     *
     * Landing straight on a case study URL mounts this canvas before the page
     * below it declares its backdrop, so the palette changes a few frames in.
     * Easing that is a visible flash of brand blue settling to navy on every
     * cold load of a case study. Anything after the opening moment is a real
     * navigation between rooms and does ease.
     */
    let frames = 0;
    const applyBackdrop = (name: BackdropName) => {
      const p = PALETTES[name];
      target.base.set(...p.base);
      target.deep.set(...p.deep);
      if (frames < 12) {
        u.uBase.value.copy(target.base);
        u.uDeep.value.copy(target.deep);
      }
      // The gradient under the canvas has to follow, or a demoted tier is left
      // showing the old palette behind a canvas that has changed.
      if (wrapper) wrapper.style.background = p.css;
    };
    const offBackdrop = dark ? () => {} : onBackdropChange(applyBackdrop);
    if (!dark) applyBackdrop(getBackdrop());
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
      // Roughly a third of a second to settle, frame-rate independent enough
      // for a colour change nobody is timing.
      frames++;
      u.uBase.value.lerp(target.base, 0.06);
      u.uDeep.value.lerp(target.deep, 0.06);
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      offBackdrop();
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
