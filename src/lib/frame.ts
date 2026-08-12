export type Pointer = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  hover: number;
  hoverT: number;
  nx: number;
  ny: number;
};

export type IconHover = {
  work: number;
  contact: number;
  workT: number;
  contactT: number;
};

export type FrameState = {
  pointer: Pointer;
  scrollY: number;
  vel: number;
  velEase: number;
  t: number;
  /** 0..1, written by HomeView's frame callback, read by HeroScene */
  heroOut: number;
  iconHover: IconHover;
};

export type FrameCallback = (dt: number, state: FrameState) => void;

/** motion constants — do not vary */
export const BOW_CURVE = 0.02;
export const ARCHIVE_SPEED = 1.2;

export const DEG = Math.PI / 180;

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;

export function createFrameState(): FrameState {
  return {
    pointer: { x: -400, y: -400, tx: -400, ty: -400, hover: 0, hoverT: 0, nx: 0, ny: 0 },
    scrollY: 0,
    vel: 0,
    velEase: 0,
    t: 0,
    heroOut: 0,
    iconHover: { work: 0, contact: 0, workT: 0, contactT: 0 },
  };
}
