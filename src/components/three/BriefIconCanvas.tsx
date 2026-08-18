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
import { buildContactIcon, type Uniforms } from "@/lib/three/logo";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/*
 * The envelope, on the brief page.
 *
 * The same extruded icon the hero uses for Contact, and the same one for a
 * reason: the brief is not a form on a website, it is an email being written.
 * Reusing the mark rather than inventing a new one says that before any of the
 * copy does.
 *
 * It drifts on its own and leans toward the pointer, like the hero icons. No
 * hit area and no link — this one is decoration, and the page it sits on
 * already has exactly one thing to do.
 */
export default function BriefIconCanvas({ className, style }: Props) {
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
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    cam.position.z = 4.2;
    const uniforms: Uniforms = { uTime: { value: 0 } };
    const group = new THREE.Group();
    scene.add(group);
    const icon = buildContactIcon(uniforms);
    icon.scale.setScalar(1.05);
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
      group.rotation.y = Math.sin(t * 0.5) * 0.55 + pointer.nx * 0.45;
      group.rotation.z = -0.22 + Math.sin(t * 0.7) * 0.1;
      group.rotation.x = Math.sin(t * 0.42) * 0.12 - pointer.ny * 0.2;
      group.position.y = Math.sin(t * 1.05) * 0.08;
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

  // No usable GPU: the page loses an ornament, not a control.
  if (tier === "minimal") return null;

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden />;
}
