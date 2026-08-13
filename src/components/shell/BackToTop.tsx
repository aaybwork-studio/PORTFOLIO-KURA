"use client";

import { useEffect, useRef } from "react";
import { useSiteShell } from "./SiteShellContext";
import styles from "./shell.module.css";

/**
 * Bottom-right "back to top" button.
 *
 * Visibility is driven by the shared frame loop rather than a scroll
 * listener — one more DOM read per frame is cheaper than another
 * addEventListener("scroll", ...) fighting Lenis for the same event.
 */
export default function BackToTop() {
  const { registerFrame, scrollTop } = useSiteShell();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  // Design `lastStep`, so the DOM is only written when visibility flips.
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = false;
    return registerFrame(() => {
      const btn = btnRef.current;
      if (!btn) return;
      const visible = window.scrollY > window.innerHeight;
      if (visible === visibleRef.current) return;
      visibleRef.current = visible;
      btn.dataset.visible = String(visible);
    });
  }, [registerFrame]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => scrollTop(0, true)}
      className={styles.backToTop}
      data-visible="false"
      aria-label="Back to top"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11l5-5 5 5" />
      </svg>
    </button>
  );
}
