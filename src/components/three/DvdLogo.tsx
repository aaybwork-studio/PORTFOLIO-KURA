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
import { buildLogo, type Uniforms } from "@/lib/three/logo";
import { clamp } from "@/lib/three/util";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/* Design file lines 1220-1277 (initDvd) — verbatim. */
export default function DvdLogo({ className, style }: Props) {
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
    const group = new THREE.Group();
    scene.add(group);

    const st = {
      x: 0,
      y: 0,
      vx: 0.34,
      vy: 0.24,
      halfW: 1.4,
      halfH: 0.5,
      hit: 0,
    };

    let alive = true;
    buildLogo(uniforms, 2.72, (wrap, size) => {
      if (!alive) {
        disposeScene(wrap);
        return;
      }
      group.add(wrap);
      st.halfW = size.w / 2;
      st.halfH = size.h / 2;
    });

    const resize = () => resizePerspective(renderer, cam, canvas);
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let last = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!canvas.isConnected || !onScreen(canvas)) return;
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, t - last);
      last = t;
      uniforms.uTime.value = t;
      const vhU = 2 * Math.tan(((cam.fov * Math.PI) / 180) / 2) * cam.position.z;
      const vwU = vhU * cam.aspect;
      const limX = Math.max(0.05, vwU / 2 - st.halfW),
        limY = Math.max(0.05, vhU / 2 - st.halfH);
      const r = canvas.getBoundingClientRect();
      const pointer = frame.current.pointer;
      const px = ((pointer.x - r.left) / Math.max(1, r.width) - 0.5) * vwU;
      const py = -((pointer.y - r.top) / Math.max(1, r.height) - 0.5) * vhU;
      const dx = st.x - px,
        dy = st.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2.0 && dist > 0.0001) {
        const f = (1 - dist / 2.0) * 0.9 * dt;
        st.vx += (dx / dist) * f;
        st.vy += (dy / dist) * f;
      }
      const spd = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
      if (spd > 1.15) {
        st.vx *= 1.15 / spd;
        st.vy *= 1.15 / spd;
      }
      if (spd < 0.3) {
        const k = 0.3 / Math.max(spd, 0.0001);
        st.vx *= k;
        st.vy *= k;
      }
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      if (st.x > limX) {
        st.x = limX;
        st.vx = -Math.abs(st.vx);
        st.hit = 0.06;
      }
      if (st.x < -limX) {
        st.x = -limX;
        st.vx = Math.abs(st.vx);
        st.hit = 0.06;
      }
      if (st.y > limY) {
        st.y = limY;
        st.vy = -Math.abs(st.vy);
        st.hit = 0.06;
      }
      if (st.y < -limY) {
        st.y = -limY;
        st.vy = Math.abs(st.vy);
        st.hit = 0.06;
      }
      const faceY = clamp((px - st.x) * 0.42, -0.9, 0.9);
      const faceX = clamp((py - st.y) * 0.32, -0.7, 0.7);
      group.rotation.y += (faceY - group.rotation.y) * 0.07;
      group.rotation.x += (faceX - group.rotation.x) * 0.07;
      group.rotation.z += (st.vx * 0.16 - group.rotation.z) * 0.05;
      group.position.set(st.x, st.y, 0);
      group.scale.setScalar(1 + st.hit);
      st.hit *= 0.88;
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
