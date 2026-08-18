/* eslint-disable @next/next/no-img-element */
"use client";

import type { CaseMedia } from "@/lib/types";
import Reveal from "./Reveal";
import { imgProps } from "@/lib/imageSet";
import styles from "./views.module.css";

/*
 * One media frame in a case study.
 *
 * The aspect ratio is chosen by span, not by the asset: a full-width block is
 * 16:10 and a half is 4:3, so a page of mixed uploads still scrolls on a
 * consistent rhythm and nothing shifts as images load. `object-fit: cover`
 * takes the difference.
 *
 * A block can override that with its own ratio, and one does: the Guitar Flow
 * reel is square, and a square cropped to 16:10 loses the fretboard. An
 * override still reserves its space before the asset loads, so the page does
 * not jump either way.
 */
export default function CaseMediaBlock({ item, index }: { item: CaseMedia; index: number }) {
  const full = item.span === "full";
  const ratio = item.ratio ?? (full ? "16 / 10" : "4 / 3");

  return (
    <Reveal
      className={`${styles.caseMedia} ${full ? styles.caseMediaFull : styles.caseMediaHalf}`}
      // Only the second half of a split row is offset — a full-width block has
      // nothing beside it to stagger against.
      delay={!full && index % 2 === 1 ? 90 : 0}
    >
      <div className={styles.caseMediaFrame} style={{ aspectRatio: ratio }}>
        {item.kind === "video" ? (
          /*
           * Muted + playsInline are what make autoplay legal on iOS; without
           * both, Safari shows a static poster and never starts. `preload`
           * stays at metadata so a page of clips does not pull tens of
           * megabytes before anything is on screen.
           */
          <video
            className={styles.caseMediaEl}
            src={item.src}
            poster={item.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={item.alt || undefined}
          />
        ) : (
          <img
            className={styles.caseMediaEl}
            /* Full-bleed blocks take the page gutter; a half takes about half
               of it, and everything is one column below 720px. */
            {...imgProps(item.src, full ? "(max-width: 720px) 94vw, 94vw" : "(max-width: 720px) 94vw, 47vw")}
            alt={item.alt}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </Reveal>
  );
}
