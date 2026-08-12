/* Design file lines 536-537 — verbatim. */

export const DEG = Math.PI / 180;

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;
