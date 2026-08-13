"use client";

import type { RefObject } from "react";

type Props = {
  cursorRef: RefObject<HTMLDivElement | null>;
  labelRef: RefObject<HTMLSpanElement | null>;
};

export default function Cursor({ cursorRef, labelRef }: Props) {
  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 220,
        pointerEvents: "none",
        transform: "translate3d(-300px, -300px, 0) scale(0)",
        transformOrigin: "0 0",
        willChange: "transform",
      }}
    >
      <span
        ref={labelRef}
        style={{
          display: "block",
          transform: "translate(-50%, -50%)",
          background: "#FFFFFF",
          color: "#2A14E8",
          fontFamily: "var(--ff-body)", fontStretch: "87.5%",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "10px 15px 9px",
          borderRadius: 2,
          whiteSpace: "nowrap",
        }}
      >
        VIEW
      </span>
    </div>
  );
}
