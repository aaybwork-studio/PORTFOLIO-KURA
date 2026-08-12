"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import {
  disposeScene,
  makeRenderer,
  resizePerspective,
} from "@/lib/three/renderer";
import { buildLogo, type Uniforms } from "@/lib/three/logo";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/* Design file lines 1188-1218 (initInfoLogo) — verbatim.
   Note: this loop intentionally checks only `canvas.isConnected` and NOT
   onScreen(), exactly as the design does. */
export default function LogoCanvas({ className, style }: Props) {
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
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    cam.position.z = 5;
    const uniforms: Uniforms = { uTime: { value: 0 } };
    const group = new THREE.Group();
    scene.add(group);

    let alive = true;
    buildLogo(uniforms, 2.7, (wrap) => {
      if (!alive) {
        disposeScene(wrap);
        return;
      }
      group.add(wrap);
    });

    const resize = () => resizePerspective(renderer, cam, canvas);
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!canvas.isConnected) return;
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      const pointer = frame.current.pointer;
      group.rotation.y = Math.sin(t * 0.5) * 0.45 + pointer.nx * 0.5;
      group.rotation.x = Math.sin(t * 0.33) * 0.12 + pointer.ny * 0.25;
      group.position.y = Math.sin(t * 0.9) * 0.06;
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
