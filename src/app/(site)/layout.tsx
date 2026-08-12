import SiteShell from "@/components/shell/SiteShell";

/**
 * Everything the visitor sees runs inside the shell: the plate-wipe route
 * transition, the custom cursor, Lenis smooth scroll, the single rAF loop and
 * the WebGL cloud background. The Studio route sits outside this group so the
 * CMS is not rendered underneath a custom cursor and hijacked scrolling.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
