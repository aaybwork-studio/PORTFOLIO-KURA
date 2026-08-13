"use client";

/**
 * FAQ accordion.
 *
 * Still built on native <details>/<summary> rather than React state:
 * - taps open it on mobile with no handler of ours
 * - keyboard and screen readers get the right semantics for free
 * - it still works if the JS bundle fails
 *
 * The `name` attribute makes the group exclusive (opening one closes the rest)
 * in browsers that support it, and degrades to independent toggles elsewhere.
 *
 * On top of that, pointer devices open an item on hover. That is layered on
 * rather than replacing the click behaviour: the hover handlers are only bound
 * when `(hover: hover) and (pointer: fine)` matches, so a touch screen — where
 * a hover event fires on tap and would fight the native toggle — never sees
 * them. Leaving the whole list closes whatever hover opened, but an item the
 * user actually clicked is left alone until they click it again.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaqItem } from "@/lib/types";
import styles from "./views.module.css";

type Props = { items: FaqItem[] };

export default function FaqList({ items }: Props) {
  const [hoverable, setHoverable] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  /** Index the pointer opened, so a clicked item is not closed on mouse-out. */
  const hoverOpened = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverable(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const openAt = useCallback((index: number) => {
    const root = listRef.current;
    if (!root) return;
    const all = Array.from(root.querySelectorAll("details"));
    all.forEach((el, i) => {
      el.open = i === index;
    });
    hoverOpened.current = index;
  }, []);

  const closeHovered = useCallback(() => {
    const root = listRef.current;
    const index = hoverOpened.current;
    if (!root || index === null) return;
    const el = root.querySelectorAll("details")[index];
    if (el) el.open = false;
    hoverOpened.current = null;
  }, []);

  if (!items.length) return null;

  return (
    <div
      ref={listRef}
      className={styles.faqList}
      onMouseLeave={hoverable ? closeHovered : undefined}
    >
      {items.map((item, i) => (
        <details
          key={item.question + i}
          name="kura-faq"
          className={styles.faqItem}
          onMouseEnter={hoverable ? () => openAt(i) : undefined}
          // A real click takes ownership: clear the hover bookkeeping so
          // leaving the list does not slam shut something deliberately opened.
          onClick={() => {
            hoverOpened.current = null;
          }}
        >
          <summary className={styles.faqQuestion}>
            <span>{item.question}</span>
            <span aria-hidden className={styles.faqMarker} />
          </summary>
          <div className={styles.faqAnswer}>
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
