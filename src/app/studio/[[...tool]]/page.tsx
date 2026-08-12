import { NextStudio } from "next-sanity/studio";

import config from "../../../../sanity.config";
import { hasSanity } from "@/sanity/env";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!hasSanity) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 32,
          background: "#05040A",
          color: "#FFFFFF",
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 13,
          lineHeight: 1.7,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ margin: 0, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6 }}>
            Studio unavailable
          </p>
          <p style={{ margin: "14px 0 0" }}>
            Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> (and{" "}
            <code>NEXT_PUBLIC_SANITY_DATASET</code>) in your environment to enable the embedded
            Sanity Studio. The site itself runs on local fallback content until then.
          </p>
        </div>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
