"use client";

import type { CSSProperties, RefObject } from "react";

type Props = {
  topRef: RefObject<HTMLDivElement | null>;
  botRef: RefObject<HTMLDivElement | null>;
};

/*
 * The route-transition plates.
 *
 * Two panels, each 51% tall, that slide apart. Each one carries a full copy of
 * the wordmark, positioned so that both copies land on the same point at the
 * centre of the screen; `overflow: hidden` means the top plate shows the top of
 * the mark and the bottom plate shows the bottom, and the two line up into one
 * logo that then tears in half as the plates leave.
 *
 * The alignment is what makes or breaks it, and it used to be done with a
 * 100vh-tall inner box.
 *
 * On iOS Safari that is wrong. `vh` resolves against the large viewport — the
 * height the page would have with the toolbars collapsed — while the plate's
 * own `51%` resolves against the initial containing block as the browser is
 * currently painting it. With the address bar visible those two disagree, so
 * the two copies of the mark centred on different points and the logo came
 * apart: reported from Safari on a phone, and visible as a horizontal shear
 * because the wordmark is slanted, so a vertical mismatch reads as a sideways
 * one.
 *
 * The inner box is now sized from the plate itself: 100/51 of a plate that is
 * 51% tall is exactly 100% of the same reference the plate used. Whatever
 * Safari decides that is, both halves derive from it, so they cannot disagree.
 */
const INNER_HEIGHT = "calc(100% * 100 / 51)";

const plateStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  height: "51%",
  zIndex: 300,
  background: "#0B0B0C",
  overflow: "hidden",
  pointerEvents: "none",
};

const logoStyle: CSSProperties = {
  width: "clamp(150px, 19vw, 290px)",
  height: "auto",
  display: "block",
};

/* eslint-disable @next/next/no-img-element */
export default function Plates({ topRef, botRef }: Props) {
  return (
    <>
      <div
        ref={topRef}
        style={{
          ...plateStyle,
          top: 0,
          animation: "kuraPlateT 1.7s cubic-bezier(0.76, 0, 0.24, 1) forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: INNER_HEIGHT,
            display: "grid",
            placeItems: "center",
          }}
        >
          <img src="/media/logo-white.svg" alt="" style={logoStyle} />
        </div>
      </div>

      <div
        ref={botRef}
        style={{
          ...plateStyle,
          bottom: 0,
          animation: "kuraPlateB 1.7s cubic-bezier(0.76, 0, 0.24, 1) forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: INNER_HEIGHT,
            display: "grid",
            placeItems: "center",
          }}
        >
          <img src="/media/logo-white.svg" alt="" style={logoStyle} />
        </div>
      </div>
    </>
  );
}
