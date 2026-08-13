"use client";

import { useEffect, useRef } from "react";
import { useSiteShell } from "@/components/shell/SiteShellContext";

/** Preallocated so the frame loop never allocates — pool is scanned for a
 *  dead slot (life <= 0) on spawn instead of pushing to a growing array. */
const MAX_PARTICLES = 260;

type ParticlePool = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  radius: Float32Array;
  accent: Uint8Array;
};

function createPool(): ParticlePool {
  return {
    x: new Float32Array(MAX_PARTICLES),
    y: new Float32Array(MAX_PARTICLES),
    vx: new Float32Array(MAX_PARTICLES),
    vy: new Float32Array(MAX_PARTICLES),
    life: new Float32Array(MAX_PARTICLES),
    maxLife: new Float32Array(MAX_PARTICLES),
    radius: new Float32Array(MAX_PARTICLES),
    accent: new Uint8Array(MAX_PARTICLES),
  };
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { registerFrame } = useSiteShell();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pool = createPool();
    // -1 means "no slot free yet found this call" — findDeadSlot scans
    // linearly from 0 each time; with only 260 slots this is cheaper than
    // maintaining a separate free-list structure.
    let liveCount = 0;

    const findDeadSlot = (): number => {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (pool.life[i] <= 0) return i;
      }
      return -1;
    };

    const spawn = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      radius: number,
      life: number,
      accent: boolean
    ) => {
      const i = findDeadSlot();
      if (i < 0) return;
      pool.x[i] = x;
      pool.y[i] = y;
      pool.vx[i] = vx;
      pool.vy[i] = vy;
      pool.radius[i] = radius;
      pool.life[i] = life;
      pool.maxLife[i] = life;
      pool.accent[i] = accent ? 1 : 0;
      liveCount++;
    };

    // devicePixelRatio capped at 2 — beyond that the extra resolution costs
    // more paint time than the glow gains in sharpness.
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTrailX = -Infinity;
    let lastTrailY = -Infinity;
    let msSinceTrail = Infinity;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - lastTrailX;
      const dy = e.clientY - lastTrailY;
      // gate on both distance and elapsed time so a fast swipe doesn't
      // dump dozens of particles into the pool in a single frame
      if (msSinceTrail < 28 || dx * dx + dy * dy < 36) return;
      lastTrailX = e.clientX;
      lastTrailY = e.clientY;
      msSinceTrail = 0;
      spawn(
        e.clientX,
        e.clientY,
        (Math.random() - 0.5) * 0.4,
        -Math.random() * 0.3 - 0.1,
        1 + Math.random() * 1.5,
        500 + Math.random() * 100,
        Math.random() < 0.25
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      const count = 16 + Math.floor(Math.random() * 7);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 1.8;
        spawn(
          e.clientX,
          e.clientY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          1.5 + Math.random() * 2,
          700 + Math.random() * 300,
          Math.random() < 0.25
        );
      }
    };

    const onFrame = (dt: number) => {
      // dt from the shell loop is in seconds; the spawn-gate timer above
      // and per-particle life are tracked in ms for readability against
      // the spec's millisecond figures.
      const dtMs = dt * 1000;
      msSinceTrail += dtMs;

      if (liveCount <= 0) return;

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (pool.life[i] <= 0) continue;

        pool.life[i] -= dtMs;
        if (pool.life[i] <= 0) {
          liveCount--;
          continue;
        }

        // drag pulls velocity toward rest; the constant upward nudge is
        // what gives trail/burst particles their gentle float
        pool.vx[i] *= 0.96;
        pool.vy[i] *= 0.96;
        pool.vy[i] -= 0.0015 * dtMs;
        pool.x[i] += pool.vx[i] * dtMs * 0.06;
        pool.y[i] += pool.vy[i] * dtMs * 0.06;

        const t = pool.life[i] / pool.maxLife[i];
        // ease-out: fast fade at birth settles into a long fading tail
        const eased = 1 - (1 - t) * (1 - t);
        const alpha = eased * 0.85;
        const r = pool.radius[i] * eased;
        if (r <= 0.05) continue;

        ctx.fillStyle = pool.accent[i]
          ? "rgba(150,168,255," + alpha.toFixed(3) + ")"
          : "rgba(255,255,255," + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pool.x[i], pool.y[i], r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    // Reduced-motion is watched live rather than read once: a user can
    // flip the OS setting mid-session and the effect should react without
    // a remount. `unregister` doubles as the "currently active" flag.
    let unregister: (() => void) | null = null;

    const enable = () => {
      if (unregister) return;
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      unregister = registerFrame(onFrame);
    };

    const disable = () => {
      if (!unregister) return;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      unregister();
      unregister = null;
      // pool slots still "alive" would otherwise redraw a stale frame the
      // next time enable() fires before onFrame has a chance to clear it
      pool.life.fill(0);
      liveCount = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (mq.matches) disable();
      else enable();
    };
    if (!mq.matches) enable();
    mq.addEventListener("change", onMotionChange);

    return () => {
      mq.removeEventListener("change", onMotionChange);
      disable();
    };
  }, [registerFrame]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        pointerEvents: "none",
      }}
    />
  );
}
