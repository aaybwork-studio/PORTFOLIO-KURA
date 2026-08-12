"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./views.module.css";

type Props = {
  /** static opening words, e.g. "I like" */
  prefix: string;
  /** the part that cycles, e.g. ["building experiences.", "designing interfaces."] */
  phrases: string[];
  /** ms each phrase is held before swapping */
  interval?: number;
};

/**
 * The hero's one line of copy. The prefix stays put and the phrase after it
 * cycles, so a visitor learns what the work actually is within a few seconds.
 *
 * The widest phrase is rendered once, invisible, to reserve the line's width —
 * otherwise the whole line reflows on every swap and the prefix jitters.
 *
 * Honours prefers-reduced-motion by holding the first phrase and never cycling.
 */
export default function HeroLine({ prefix, phrases, interval = 2600 }: Props) {
  // Defensive: a page rendered from data that predates the heroPhrases field
  // would otherwise crash the whole hero on `phrases.length`.
  const list = Array.isArray(phrases) && phrases.length > 0 ? phrases : [];
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced.current || list.length < 2) return;

    let swapTimer: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      setLeaving(true);
      swapTimer = setTimeout(() => {
        setI((n) => (n + 1) % list.length);
        setLeaving(false);
      }, 260);
    }, interval);

    return () => {
      clearInterval(tick);
      clearTimeout(swapTimer);
    };
  }, [list.length, interval]);

  const current = list[i] ?? "";

  return (
    <p className={styles.heroLine}>
      <span>{prefix} </span>
      <span
        key={i}
        className={`${styles.heroPhrase} ${leaving ? styles.heroPhraseOut : ""}`}
      >
        {current}
      </span>
    </p>
  );
}
