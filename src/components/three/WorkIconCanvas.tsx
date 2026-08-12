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
import { buildWorkIcon, type Uniforms } from "@/lib/three/logo";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/* Design file lines 1154-1186 (initWorkIcon) — verbatim. */
export default function WorkIconCanvas({ className, style }: Props) {
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
    cam.position.z = 4.2;
    const uniforms: Uniforms = { uTime: { value: 0 } };
    const group = new THREE.Group();
    scene.add(group);
    const icon = buildWorkIcon(uniforms);
    icon.scale.setScalar(1.15);
    group.add(icon);

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
      const pointer = frame.current.pointer;
      group.rotation.y = Math.sin(t * 0.55) * 0.6 + pointer.nx * 0.5;
      group.rotation.x = Math.sin(t * 0.4) * 0.14 + pointer.ny * 0.22;
      group.position.y = Math.sin(t * 1.0) * 0.07;
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    return () => {
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
