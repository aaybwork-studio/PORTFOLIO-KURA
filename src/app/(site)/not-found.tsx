import NotFoundView from "@/components/views/NotFoundView";

/*
 * Rendered both for URLs that match nothing (via the [...unmatched] catch-all)
 * and for notFound() thrown by a real route — a /work/<slug> that is not in
 * Sanity, for instance. The title is set by the catch-all; see the note there.
 */
export default function NotFound() {
  return <NotFoundView />;
}
