"use client";

import type { CSSProperties, MouseEvent, RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteShell } from "./SiteShellContext";

type Props = {
  headLogoRef: RefObject<HTMLAnchorElement | null>;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((p: boolean) => boolean)) => void;
};

const rowStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  fontFamily: "var(--ff-body)", fontStretch: "87.5%",
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const barStyle: CSSProperties = {
  display: "block",
  height: 1.5,
  width: "100%",
  background: "#FFFFFF",
};

/* eslint-disable @next/next/no-img-element */
export default function Header({ headLogoRef, menuOpen, setMenuOpen }: Props) {
  const { navigate, scrollToEl } = useSiteShell();
  const pathname = usePathname();

  const go = (e: MouseEvent, href: string, jump?: "work" | "contact") => {
    e.preventDefault();
    setMenuOpen(false);
    if (jump && pathname === "/") {
      scrollToEl(
        document.getElementById(jump),
        jump === "work" ? window.innerHeight * 0.08 : 0,
      );
      return;
    }
    navigate(href, jump);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        padding: "clamp(14px, 2.2vw, 24px) clamp(16px, 2.4vw, 30px)",
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "relative", pointerEvents: "auto" }}>
        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="kura-pill"
          style={{
            appearance: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 5,
            width: 52,
            height: 40,
            padding: "0 15px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderRadius: 999,
            background: "rgba(10, 8, 24, 0.45)",
            backdropFilter: "blur(9px)",
            WebkitBackdropFilter: "blur(9px)",
          }}
        >
          <span style={barStyle} />
          <span style={barStyle} />
        </button>

        {menuOpen ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 50,
              width: 190,
              border: "1px solid rgba(255, 255, 255, 0.22)",
              borderRadius: 16,
              background: "rgba(9, 6, 26, 0.92)",
              padding: 8,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "grid", gap: 1 }}>
              <Link href="/" className="kura-menu-row" style={rowStyle} onClick={(e) => go(e, "/")}>
                Home
              </Link>
              <Link
                href="/work"
                className="kura-menu-row"
                style={rowStyle}
                onClick={(e) => go(e, "/work")}
              >
                Work
              </Link>
              <Link
                href="/archive"
                className="kura-menu-row"
                style={rowStyle}
                onClick={(e) => go(e, "/archive")}
              >
                Archive
              </Link>
              <Link
                href="/info"
                className="kura-menu-row"
                style={rowStyle}
                onClick={(e) => go(e, "/info")}
              >
                Info
              </Link>
              <Link
                href="/#contact"
                className="kura-menu-row"
                style={rowStyle}
                onClick={(e) => go(e, "/", "contact")}
              >
                Contact
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <Link
        ref={headLogoRef}
        href="/"
        onClick={(e) => go(e, "/")}
        className="kura-pill"
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          padding: "0 14px",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          borderRadius: 999,
          background: "rgba(10, 8, 24, 0.45)",
          backdropFilter: "blur(9px)",
          WebkitBackdropFilter: "blur(9px)",
          pointerEvents: "auto",
          opacity: 0,
        }}
      >
        <img
          src="/media/logo-white.svg"
          alt="Kura"
          style={{ height: 15, width: "auto", display: "block" }}
        />
      </Link>
    </header>
  );
}
