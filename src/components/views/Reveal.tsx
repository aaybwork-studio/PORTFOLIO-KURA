"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** stagger within a row, in ms */
  delay?: number;
  style?: React.CSSProperties;
};

/*
 * Scroll reveal.
 *
 * An IntersectionObserver rather than the shell's frame loop: a case study has
 * dozens of media blocks, and measuring every one of them on every frame to
 * decide something that happens once per element is work the browser will do
 * for free off the main thread.
 *
 * It unobserves on the first entry. Replaying the reveal when an element
 * re-enters from below is the thing that makes long pages feel twitchy on the
 * way back up.
 *
 * The visible state is an attribute, so the whole animation lives in CSS and
 * `prefers-reduced-motion` can switch it off without this component knowing.
 * Nothing here gates on JS being ready either — the element starts hidden only
 * once the observer attaches, so a failed hydration leaves the content visible
 * rather than blank.
 */
/*
 * Set the first time any observer anywhere on the page reports an
 * intersection. It is the evidence that IntersectionObserver works in this
 * browser at all, and the watchdog below reads it rather than second-guessing
 * a single element.
 */
let observerWorks = false;

export default function Reveal({ children, className, delay = 0, style }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "true";
      return;
    }

    /*
     * Anything already on screen is shown without hiding it first.
     *
     * Hiding it and waiting for the observer means the content above the fold
     * flashes out and back in on load, and it makes the first paint depend on
     * an async callback for no gain — it is already visible, there is nothing
     * to reveal.
     */
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.dataset.in = "true";
      return;
    }

    el.dataset.in = "false";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observerWorks = true;
          el.dataset.in = "true";
          io.unobserve(el);
        }
      },
      // Fire a little before the element reaches the fold, so the motion has
      // finished by the time it is properly in view.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    io.observe(el);

    /*
     * Watchdog.
     *
     * This is the only piece of the page whose content is invisible until an
     * async callback runs, so it is the only piece that can leave a blank
     * section if that callback never comes. Observed in the preview browser:
     * IntersectionObserver delivers nothing at all there, and every reveal
     * stayed at opacity 0.
     *
     * A missed reveal animation is a small loss; an invisible case study is a
     * broken page. So if no observer on the page has reported anything within
     * three seconds, every reveal gives up and shows its content.
     *
     * The check is the page-wide flag, not this element's own state: on a
     * working page the blocks further down are supposed to still be hidden at
     * the three second mark, and a per-element test would reveal the whole
     * article at once.
     */
    const watchdog = window.setTimeout(() => {
      if (!observerWorks) el.dataset.in = "true";
    }, 3000);

    return () => {
      window.clearTimeout(watchdog);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
