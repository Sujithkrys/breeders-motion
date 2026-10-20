// Shared helpers for motion components. Components import from here instead of re-deriving timing and layout math.
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import type { Ratio } from "./types";

// Families by name, never via var(): the exporter rasterises inline SVG outside the page, where an undefined CSS
// variable invalidates the whole font-family and text falls back to serif. next/font registers these exact names,
// and src/lib/export/fonts.ts registers them with Remotion so they're embedded into exported SVGs.
export const FONT_SANS = "'Geist', ui-sans-serif, system-ui, sans-serif";
export const FONT_MONO = "'Geist Mono', ui-monospace, monospace";

// ---- Shape (spec §4). Use these instead of ad hoc numbers; multiply by `u`.
// Radius: chip/bar ends 8, buttons and inputs 16, cards and tiles of 100px+ 32, hero objects 48.
export const RADIUS = { chip: 8, button: 16, card: 32, hero: 48 } as const;
// Stroke: hairlines (charts, grids, dividers) 1.5, rings and borders 2.5, bars and progress 6.
// Strokes sit at 18–30% opacity unless the stroke is the accent itself.
export const STROKE = { hair: 1.5, ring: 2.5, bar: 6 } as const;

// ---- Motion (spec §5). Four curves plus a spring for physical objects (cards, tiles, chips, cubes).
// enter: things arriving · exit: things leaving · travel: between two on-screen states ·
// linear: only for continuous motion (marquees, orbits, sweeps) · spring: physical objects.
export const CURVES = {
  enter: [0.22, 1, 0.36, 1],
  exit: [0.64, 0, 0.78, 0],
  travel: [0.65, 0, 0.35, 1],
  linear: [0, 0, 1, 1],
} as const;
export const SPRING_CONFIG = { damping: 200, mass: 0.6, stiffness: 120 } as const;
// Timing: clips are 120, 150 or 180 frames and end on FINAL_HOLD still frames; entrances 18–24f, exits 12–16f,
// siblings stagger 3f (8 at most, then in groups of 8).
export const DURATIONS = [120, 150, 180] as const;
export const FINAL_HOLD = 12;
export const STAGGER = 3;
export const ENTER_FRAMES = { min: 18, max: 24 } as const;
export const EXIT_FRAMES = { min: 12, max: 16 } as const;

export type EaseName = keyof typeof CURVES | "spring";
// Names used before the motion spec, kept so saved links and older components resolve to the nearest curve.
const LEGACY: Record<string, EaseName> = { smooth: "enter", soft: "travel", snappy: "travel", bouncy: "spring" };
const resolveEase = (name: string): EaseName => {
  if (name === "spring" || name in CURVES) return name as EaseName;
  return LEGACY[name] ?? "enter";
};
export const EASE_OPTIONS = [
  { label: "Enter", value: "enter" },
  { label: "Travel", value: "travel" },
  { label: "Exit", value: "exit" },
  { label: "Spring", value: "spring" },
  { label: "Linear", value: "linear" },
];
// The spring stretched over the eased window, so it can stand in wherever a curve is accepted.
const springEase = (t: number) => spring({ frame: Math.min(1, Math.max(0, t)) * 100, fps: 30, config: SPRING_CONFIG, durationInFrames: 100 });
export const easing = (name: EaseName | string) => {
  const e = resolveEase(name);
  if (e === "spring") return springEase;
  const b = CURVES[e];
  return Easing.bezier(b[0], b[1], b[2], b[3]);
};
export const bezierText = (name: EaseName | string) => {
  const e = resolveEase(name);
  if (e === "spring") return `spring (damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness})`;
  return e === "linear" ? "linear" : `cubic-bezier(${CURVES[e].join(", ")})`;
};

// 0 → 1 between two frames, clamped, eased.
export const progress = (frame: number, from: number, to: number, ease: EaseName | string = "enter") =>
  interpolate(frame, [from, to], [0, 1], { easing: easing(ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// In/hold/out envelope for looping components: rises over [0, inEnd] with `ease`, holds, then falls over
// [outStart, total] on the exit curve, as the motion spec asks of anything leaving.
export const envelope = (frame: number, total: number, inEnd: number, outStart: number, ease: EaseName | string = "enter") =>
  frame < outStart ? progress(frame, 0, inEnd, ease) : 1 - progress(frame, outStart, total, "exit");

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Layout for the current composition. `u` is one design unit: 1px at 1080 on the short side, so the same numbers
// work at 16:9, 9:16 and 1:1. Write sizes as `n * u`.
export const useLayout = () => {
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const short = Math.min(width, height);
  const ratio: Ratio = width === height ? "1:1" : width > height ? "16:9" : "9:16";
  return { width, height, durationInFrames, fps, ratio, isVertical: height > width, u: short / 1080 };
};

// Hex helpers for glows and tints.
export const alpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Prompt helpers: one place for how numbers read in prompts.
export const secs = (frames: number, fps: number) => `${(frames / fps).toFixed(1).replace(/\.0$/, "")}s`;
export const targetLine = (target: "claude" | "react" | "css", what: string, width: number, height: number, seconds: number) =>
  target === "claude"
    ? `Build a ${seconds}s Remotion component at ${width}×${height}: ${what}.`
    : target === "react"
      ? `Build a ${seconds}s React + Framer Motion component in a ${width}×${height} frame: ${what}.`
      : `Build a ${seconds}s looping HTML/CSS animation in a ${width}×${height} frame: ${what}.`;
