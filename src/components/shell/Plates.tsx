"use client";

import type { RefObject } from "react";

type Props = {
  topRef: RefObject<HTMLDivElement | null>;
  botRef: RefObject<HTMLDivElement | null>;
};

/* eslint-disable @next/next/no-img-element */
export default function Plates({ topRef, botRef }: Props) {
  return (
    <>
      <div
        ref={topRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          height: "51%",
          zIndex: 300,
          background: "#0B0B0C",
          overflow: "hidden",
          pointerEvents: "none",
          animation: "kuraPlateT 1.7s cubic-bezier(0.76, 0, 0.24, 1) forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "100vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <img
            src="/media/logo-white.svg"
            alt=""
            style={{ width: "clamp(150px, 19vw, 290px)", height: "auto", display: "block" }}
          />
        </div>
      </div>

      <div
        ref={botRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: "51%",
          zIndex: 300,
          background: "#0B0B0C",
          overflow: "hidden",
          pointerEvents: "none",
          animation: "kuraPlateB 1.7s cubic-bezier(0.76, 0, 0.24, 1) forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "100vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <img
            src="/media/logo-white.svg"
            alt=""
            style={{ width: "clamp(150px, 19vw, 290px)", height: "auto", display: "block" }}
          />
        </div>
      </div>
    </>
  );
}
