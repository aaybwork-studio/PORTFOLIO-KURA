import { createClient, type SanityClient } from "next-sanity";

import { apiVersion, dataset, hasSanity, projectId } from "./env";

/** Null when no Sanity project is configured — callers fall back to local content. */
export const client: SanityClient | null = hasSanity
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
      stega: false,
    })
  : null;
