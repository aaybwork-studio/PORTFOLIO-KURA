"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import { useTier } from "@/lib/useTier";
import {
  disposeScene,
  makeRenderer,
  onScreen,
  resizePerspective,
} from "@/lib/three/renderer";
import {
  buildContactIcon,
  buildLogo,
  buildWorkIcon,
  type Uniforms,
} from "@/lib/three/logo";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/* Design file lines 1100-1152 (initHero) — verbatim. */
/*
 * With no usable GPU the whole hero would otherwise be an empty rectangle:
 * the logo, both icons and their motion all live in this one canvas. The flat
 * wordmark keeps the page recognisable — it is the same asset the header uses.
 */
function StaticHero({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{ ...style, display: "grid", placeItems: "center", pointerEvents: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/logo-white.svg"
        alt="Kura"
        style={{ width: "min(46vw, 460px)", height: "auto", opacity: 0.92 }}
      />
    </div>
  );
}

export default function HeroScene({ className, style }: Props) {
  const tier = useTier();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { frame } = useSiteShell();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = makeRenderer(canvas, true);
    if (!renderer) {
      canvas.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.z = 5.2;
    const uniforms: Uniforms = { uTime: { value: 0 } };
    const logoG = new THREE.Group(),
      workG = new THREE.Group(),
      contG = new THREE.Group();
    scene.add(logoG);
    scene.add(workG);
    scene.add(contG);

    let alive = true;
    buildLogo(uniforms, 2.9, (wrap) => {
      if (!alive) {
        disposeScene(wrap);
        return;
      }
      logoG.add(wrap);
    });

    const wi = buildWorkIcon(uniforms);
    wi.scale.setScalar(0.62);
    workG.add(wi);
    const ci = buildContactIcon(uniforms);
    ci.scale.setScalar(0.62);
    contG.add(ci);

    const resize = () => resizePerspective(renderer, cam, canvas);
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!canvas.isConnected || !onScreen(canvas)) return;
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      const vhU = 2 * Math.tan(((cam.fov * Math.PI) / 180) / 2) * cam.position.z;
      const vwU = vhU * cam.aspect;
      const f = frame.current;
      const out = f.heroOut;
      const nx = f.pointer.nx,
        ny = f.pointer.ny;

      /*
       * The logo is built at a fixed 2.9 world units wide, which overflows a
       * phone viewport (and its rotation sweeps wider still). Scale it to a
       * fraction of the visible width so it always clears the edges, and lift
       * it when the viewport is tall and narrow so it does not collide with the
       * hero line sitting at 64%.
       */
      const LOGO_W = 2.9;
      const fit = Math.min(1, (vwU * 0.78) / LOGO_W);
      const tall = vhU / vwU > 1.3;
      const logoY = tall ? vhU * 0.1 : vhU * 0.06;

      logoG.position.set(0, logoY + Math.sin(t * 0.8) * 0.045, 0);
      logoG.rotation.y = nx * 0.7 + Math.sin(t * 0.35) * 0.12 + out * 2.2;
      logoG.rotation.x = ny * 0.4 + out * 0.8;
      logoG.scale.setScalar(Math.max(0.001, fit * (1 - out * 0.9)));

      /*
       * The two icons are offset diagonally from the logo's axis rather than
       * sitting on it, so the logo owns the centre line.
       *
       * These must track the CSS hit-areas in views.module.css
       * (.heroIconWork / .heroIconContact). A viewport top percentage `p` maps
       * to world y as `vhU * (0.5 - p)`, so top 62% -> -0.12, top 30% -> +0.20.
       * The narrow-viewport breakpoints widen the horizontal inset to match the
       * CSS, which pulls the icons inward on tablet and phone.
       */
      /*
       * The icons are built at a fixed world scale, so on a phone they render
       * larger than the shrunken logo and crowd it. On narrow viewports they
       * get much smaller and push further apart vertically, giving a clear
       * diagonal — contact high-right, logo centre, work low-left — with the
       * hero line pinned below. The `vwU / 2 - 0.55` term keeps them on screen
       * when the viewport is too narrow for the requested fraction.
       */
      const wide = vwU / vhU > 1.1;
      const ixFrac = wide ? 0.36 : 0.33;
      const ix = Math.min(vwU * ixFrac, vwU / 2 - 0.4);
      const iconFit = wide ? 1 : Math.max(0.42, fit * 0.7);
      const workY = vhU * (wide ? -0.12 : -0.24);
      const contactY = vhU * (wide ? 0.2 : 0.34);

      workG.position.set(-ix, workY + Math.sin(t * 1.15) * 0.09, 0.3);
      workG.rotation.y = Math.sin(t * 0.5) * 0.6 + nx * 0.4 - out * 2.4;
      workG.rotation.z = Math.sin(t * 0.7) * 0.12 - out * 0.9;
      workG.scale.setScalar(
        Math.max(0.001, iconFit * (1 + f.iconHover.work * 0.18) * (1 - out)),
      );

      contG.position.set(ix, contactY + Math.sin(t * 1.15 + 2.1) * 0.09, 0.3);
      contG.rotation.y = Math.sin(t * 0.5 + 1.4) * 0.6 + nx * 0.4 + out * 2.4;
      contG.rotation.z = -0.35 + Math.sin(t * 0.7 + 1.1) * 0.12 + out * 0.9;
      contG.scale.setScalar(
        Math.max(0.001, iconFit * (1 + f.iconHover.contact * 0.18) * (1 - out)),
      );

      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      disposeScene(scene);
      try {
        renderer.dispose();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tier === "minimal") return <StaticHero className={className} style={style} />;

  return <canvas ref={canvasRef} className={className} style={style} />;
}
