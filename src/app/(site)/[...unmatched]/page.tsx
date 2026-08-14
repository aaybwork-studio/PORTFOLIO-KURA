import type { Metadata } from "next";
import { notFound } from "next/navigation";

/*
 * The title lives on this route, not on not-found.tsx.
 *
 * Metadata is resolved from the matched route segment. `not-found.tsx` is a
 * rendering boundary rather than a segment, so a `metadata` export there is
 * not reliably applied — the tab kept the previous page's title. This route is
 * what actually matched the URL, so this is where the title belongs.
 */
export const metadata: Metadata = {
  title: "404 — Kura",
};

/*
 * Catch-all so unmatched URLs get the site's own 404 rather than Next's.
 *
 * A `not-found.tsx` inside a route group only handles `notFound()` thrown by
 * routes in that group. A URL that matches no route at all never enters the
 * group, so it renders the framework default — a bare "This page could not be
 * found" with no layout, which is what was happening here: no header, no menu,
 * no way out except the back button.
 *
 * This route exists to match those URLs, join the group (and therefore
 * SiteShell), and immediately hand off to `(site)/not-found.tsx`. Defined
 * routes are more specific than a catch-all, so nothing real is shadowed —
 * including /studio, which is outside this group anyway.
 *
 * `notFound()` sets the 404 status as well as rendering the page. Returning
 * the markup directly would serve a 200, which tells crawlers the URL is a
 * real page.
 */
export default function Unmatched(): never {
  notFound();
}
