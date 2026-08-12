"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
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
export default function HeroScene({ className, style }: Props) {
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

      logoG.position.set(0, vhU * 0.06 + Math.sin(t * 0.8) * 0.045, 0);
      logoG.rotation.y = nx * 0.7 + Math.sin(t * 0.35) * 0.12 + out * 2.2;
      logoG.rotation.x = ny * 0.4 + out * 0.8;
      logoG.scale.setScalar(Math.max(0.001, 1 - out * 0.9));

      const ix = Math.min(vwU * 0.375, vwU / 2 - 0.55);
      workG.position.set(-ix, vhU * 0.06 + Math.sin(t * 1.15) * 0.09, 0.3);
      workG.rotation.y = Math.sin(t * 0.5) * 0.6 + nx * 0.4 - out * 2.4;
      workG.rotation.z = Math.sin(t * 0.7) * 0.12 - out * 0.9;
      workG.scale.setScalar(
        Math.max(0.001, (1 + f.iconHover.work * 0.18) * (1 - out)),
      );

      contG.position.set(ix, vhU * 0.06 + Math.sin(t * 1.15 + 2.1) * 0.09, 0.3);
      contG.rotation.y = Math.sin(t * 0.5 + 1.4) * 0.6 + nx * 0.4 + out * 2.4;
      contG.rotation.z = -0.35 + Math.sin(t * 0.7 + 1.1) * 0.12 + out * 0.9;
      contG.scale.setScalar(
        Math.max(0.001, (1 + f.iconHover.contact * 0.18) * (1 - out)),
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

  return <canvas ref={canvasRef} className={className} style={style} />;
}
