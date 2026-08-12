"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import { CLOUD_FRAG } from "@/lib/three/shaders";
import { disposeScene, makeRenderer, onScreen } from "@/lib/three/renderer";

type Props = {
  /** 0 = the page background cloud, 1 = the dark work-section cloud. */
  dark: 0 | 1;
  className?: string;
  style?: React.CSSProperties;
};

/* Design file lines 976-1012 (initCloud / resizeCloud) — verbatim. */
export default function CloudCanvas({ dark, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { frame } = useSiteShell();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      if (!canvas.isConnected || !onScreen(canvas)) return;
      u.uTime.value = (dark ? 140 : 0) + clock.getElapsedTime();
      u.uMouse.value.set(frame.current.pointer.nx, -frame.current.pointer.ny);
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
        /* noop — matches the design's swallowed dispose */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} style={style} />;
}
