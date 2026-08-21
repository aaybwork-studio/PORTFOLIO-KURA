"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteShell } from "./SiteShellContext";
import SoundToggle from "./SoundToggle";
import styles from "./shell.module.css";

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

  /*
   * The menu opens on hover, but only where hovering is a real thing. On a
   * touch screen a tap synthesises a mouseenter, which would open the panel and
   * then have the click immediately toggle it shut again — so the handlers are
   * only attached when the pointer is genuinely fine.
   */
  const [hoverable, setHoverable] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverable(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /*
   * Hover intent.
   *
   * Opening on the raw mouseenter made the panel flick open whenever the
   * pointer crossed the button on its way somewhere else, and slam shut the
   * instant it left. A short delay in each direction fixes both: the open delay
   * ignores pass-through, and the longer close delay forgives the diagonal
   * travel from the button down into the panel.
   */
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const scheduleMenu = useCallback(
    (open: boolean) => {
      clearHoverTimer();
      hoverTimer.current = setTimeout(() => setMenuOpen(open), open ? 90 : 260);
    },
    [setMenuOpen],
  );

  useEffect(() => clearHoverTimer, []);

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
    <header className={styles.header}>
      {/*
        The logo is absolutely positioned rather than flexed into place,
        because the left and right clusters are different widths and flex
        centring would put it off-axis by half that difference. On a phone it
        moves to the top left, which is the only chrome left up there once the
        controls have gone to the bottom.

        It sits outside the controls cluster on purpose: the cluster relocates
        on mobile and the logo must not travel with it.

        No pill around it. A capsule made it read as a button competing with
        the menu, when it is the identity.
      */}
      <Link
        ref={headLogoRef}
        href="/"
        onClick={(e) => go(e, "/")}
        className={styles.headLogo}
        data-title="Home"
        /* SiteShell writes this element's opacity every frame, so it has to
           start inline or the first paint disagrees with the loop. */
        style={{ opacity: 0 }}
      >
        <img
          src="/media/logo-white.svg"
          alt="Kura"
          style={{ height: 22, width: "auto", display: "block" }}
        />
      </Link>

      {/*
        The menu gets a wrapper so it can be relocated on its own. On desktop
        the wrapper is `display: contents`, so the header's flex layout is
        exactly what it always was — menu left, logo centred, sound right. On a
        phone the wrapper becomes a fixed control in the bottom right, where a
        thumb actually reaches, and the top of the screen is freed for the logo
        and, on a case study, for the section progress.
      */}
      <div className={styles.controls}>
      <div
        className={styles.menuWrap}
        onMouseEnter={hoverable ? () => scheduleMenu(true) : undefined}
        onMouseLeave={hoverable ? () => scheduleMenu(false) : undefined}
      >
        <button
          type="button"
          onClick={() => {
            clearHoverTimer();
            setMenuOpen((p) => !p);
          }}
          aria-label="Menu"
          aria-expanded={menuOpen}
          /*
            No cursor tag on this button at all.

            The menu opens on hover, so by the time anyone reads a label the
            panel is already open and the label is describing something that
            has happened. The rows inside it are tagged; the button that only
            ever gets passed over is not.
          */
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

        {/*
          Always mounted, opened by attribute.

          It used to be conditionally rendered, so there was no "before" state
          for the browser to transition from and it appeared instantly. The
          wrapper is anchored at the bottom of the button with transparent top
          padding rather than a 10px offset — a real gap would drop the hover as
          the pointer travelled from the button into the panel.
        */}
        <div className={styles.menuPanel} data-open={menuOpen ? "true" : "false"}>
            <div
              style={{
                width: 190,
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderRadius: 16,
                background: "rgba(9, 6, 26, 0.92)",
                padding: 8,
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
                display: "grid",
                gap: 1,
              }}
            >
              <Link href="/" className="kura-menu-row" style={rowStyle} data-title="Go" onClick={(e) => go(e, "/")}>
                Home
              </Link>
              <Link
                href="/work"
                className="kura-menu-row"
                style={rowStyle}
                data-title="Go"
                onClick={(e) => go(e, "/work")}
              >
                Work
              </Link>
              <Link
                href="/archive"
                className="kura-menu-row"
                style={rowStyle}
                data-title="Go"
                onClick={(e) => go(e, "/archive")}
              >
                Archive
              </Link>
              <Link
                href="/info"
                className="kura-menu-row"
                style={rowStyle}
                data-title="Go"
                onClick={(e) => go(e, "/info")}
              >
                Info
              </Link>
              <Link
                href="/#contact"
                className="kura-menu-row"
                style={rowStyle}
                data-title="Go"
                onClick={(e) => go(e, "/", "contact")}
              >
                Contact
              </Link>
            </div>
        </div>
      </div>

      </div>

      {/* The cassette stays in the top right. Only the menu travels. */}
      <SoundToggle />
    </header>
  );
}
