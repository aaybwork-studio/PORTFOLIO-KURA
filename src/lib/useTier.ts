"use client";

import { useEffect, useState } from "react";
import { getTier, initTier, onTierChange, type Tier } from "./perf";

/**
 * Subscribe a component to the rendering tier.
 *
 * Returns "full" on the server and for the first client paint so markup
 * matches and React does not report a hydration mismatch; the effect corrects
 * it immediately, before any canvas has done meaningful work.
 */
export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>("full");

  useEffect(() => {
    setTier(initTier());
    return onTierChange(setTier);
  }, []);

  return tier;
}

export { getTier };
