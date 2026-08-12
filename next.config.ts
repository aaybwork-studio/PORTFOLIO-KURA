import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Running `next build` while `next dev` is live overwrites the chunks the dev
   * server is serving from, and it starts throwing MODULE_NOT_FOUND until it is
   * restarted with a clean cache. `npm run build:check` sets NEXT_DIST_DIR so a
   * verification build lands somewhere else and leaves the running server alone.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
