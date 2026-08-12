export const apiVersion = "2025-02-19";

export const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "").trim();

export const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production").trim();

/** True when a Sanity project is configured. When false the app runs on local fallback content. */
export const hasSanity = Boolean(projectId);
