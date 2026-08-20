"use client";

import * as THREE from "three";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  disposeScene,
  makeRenderer,
  onScreen,
  resizePerspective,
} from "@/lib/three/renderer";
import { buildRecorderIcon, type Uniforms } from "@/lib/three/logo";
import {
  disable,
  enable,
  isSoundOn,
  onSoundChange,
  playClick,
  startAmbient,
  stopAmbient,
  storedPreference,
} from "@/lib/audio";
import styles from "./shell.module.css";

/**
 * The header recorder — the site's sound switch.
 *
 * The reels spin only while audio is on, so the state is legible without
 * reading anything; the label underneath names it for anyone who wants the
 * words. It renders as a still, unlit cassette when sound is off.
 *
 * Sound never starts on load. A stored "on" preference is honoured only after
 * the visitor's first gesture anywhere on the page, because an AudioContext
 * created without one is born suspended.
 */
export default function SoundToggle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [on, setOn] = useState(false);
  // Read by the render loop; state alone would restart the effect on toggle.
  const onRef = useRef(false);

  useEffect(() => {
    onRef.current = on;
  }, [on]);

  useEffect(() => onSoundChange(setOn), []);

  /*
   * Arm sound on load unless it was explicitly switched off before.
   *
   * The listeners are the whole point: an AudioContext created without a user
   * gesture is born suspended, so this waits for the first interaction of any
   * kind and starts there. `once` on each, and all three removed as soon as any
   * one of them fires, so a scroll after a click cannot start it twice.
   */
  useEffect(() => {
    if (!storedPreference()) return;

    const events = ["pointerdown", "keydown", "wheel"] as const;
    const resume = () => {
      events.forEach((e) => window.removeEventListener(e, resume));
      enable();
      startAmbient();
    };

    events.forEach((e) =>
      window.addEventListener(e, resume, { once: true, passive: true }),
    );
    return () => events.forEach((e) => window.removeEventListener(e, resume));
  }, []);

  const toggle = useCallback(() => {
    if (isSoundOn()) {
      stopAmbient();
      disable();
      return;
    }
    enable();
    playClick();
    startAmbient();
  }, []);

  /* ---------------- the cassette ---------------- */
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
    cam.position.z = 4.4;
    const uniforms: Uniforms = { uTime: { value: 0 } };
    const { group, reels } = buildRecorderIcon(uniforms);
    group.scale.setScalar(1.75);
    scene.add(group);

    const resize = () => resizePerspective(renderer, cam, canvas);
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    // Spin ramps in and out rather than snapping, so the toggle has weight.
    let spin = 0;
    let spinVel = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!canvas.isConnected || !onScreen(canvas)) return;
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      const want = onRef.current ? 2.4 : 0;
      spinVel += (want - spinVel) * 0.05;
      spin += spinVel * 0.016;
      // The two reels counter-rotate, as tape reels do.
      reels.forEach((r, i) => {
        r.rotation.z = i === 0 ? spin : -spin;
      });

      group.rotation.y = Math.sin(t * 0.5) * 0.18;
      group.rotation.x = Math.sin(t * 0.36) * 0.07;
      renderer.render(scene, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      disposeScene(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.soundToggle}
      // The delegated click sound would double the one this button plays at
      // the moment it creates the audio context.
      data-no-sound
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      /* The label says what the click does, which is the opposite of the
         current state — the cassette art already shows whether it is on. */
      data-title={on ? "Mute" : "Sound"}
    >
      <canvas ref={canvasRef} className={styles.soundCanvas} />
      <span className={styles.soundLabel} aria-hidden>
        {on ? "Sound on" : "Sound off"}
      </span>
    </button>
  );
}
