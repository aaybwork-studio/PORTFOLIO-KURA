"use client";

import { createContext, useContext } from "react";
import type { FrameCallback, FrameState } from "@/lib/frame";

export type SiteShellApi = {
  frame: React.MutableRefObject<FrameState>;
  /** register a per-frame callback; returns an unsubscribe fn. Call inside useEffect. */
  registerFrame: (cb: FrameCallback) => () => void;
  /** plate-wipe navigation. jump only applies when href === "/" */
  navigate: (href: string, jump?: "work" | "contact") => void;
  /** smooth-scroll helpers backed by Lenis (fall back to window.scrollTo) */
  scrollToEl: (el: HTMLElement | null, offset?: number) => void;
  scrollTop: (y: number, smooth?: boolean) => void;
  /** Lenis control for the archive focus overlay */
  stopScroll: () => void;
  startScroll: () => void;
  /** true while a route wipe is running */
  transitioning: boolean;
  /** the shell forces the header logo fully visible on non-home routes.
      HomeView calls this with its own computed value each frame. */
  setHeadLogoTarget: (v: number) => void;
  reduced: boolean;
};

export const SiteShellContext = createContext<SiteShellApi | null>(null);

export function useSiteShell(): SiteShellApi {
  const ctx = useContext(SiteShellContext);
  if (!ctx) throw new Error("useSiteShell must be used inside <SiteShell>");
  return ctx;
}
