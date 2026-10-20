// Shared helpers for motion components. Components import from here instead of re-deriving timing and layout math.
import { Easing, interpolate, useVideoConfig } from "remotion";
import type { Ratio } from "./types";

// Families by name, never via var(): the exporter rasterises inline SVG outside the page, where an undefined CSS
// variable invalidates the whole font-family and text falls back to serif. next/font registers these exact names,
// and src/lib/export/fonts.ts registers them with Remotion so they're embedded into exported SVGs.
export const FONT_SANS = "'Geist', ui-sans-serif, system-ui, sans-serif";
export const FONT_MONO = "'Geist Mono', ui-monospace, monospace";

// Easing presets, named the way the Edit tab and prompts name them.
export const EASES = {
  smooth: [0.2, 0.8, 0.2, 1],
  snappy: [0.7, 0, 0.2, 1],
  soft: [0.4, 0, 0.2, 1],
  bouncy: [0.3, 1.5, 0.4, 1],
} as const;
export type EaseName = keyof typeof EASES;
export const EASE_OPTIONS = (Object.keys(EASES) as EaseName[]).map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: k }));
export const easing = (name: EaseName | string) => {
  const b = EASES[(name as EaseName) in EASES ? (name as EaseName) : "smooth"];
  return Easing.bezier(b[0], b[1], b[2], b[3]);
};
export const bezierText = (name: EaseName | string) => `cubic-bezier(${EASES[(name as EaseName) in EASES ? (name as EaseName) : "smooth"].join(", ")})`;

// 0 → 1 between two frames, clamped, eased.
export const progress = (frame: number, from: number, to: number, ease: EaseName | string = "smooth") =>
  interpolate(frame, [from, to], [0, 1], { easing: easing(ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// In/hold/out envelope for looping components: rises over [0, inEnd], holds, falls over [outStart, total].
export const envelope = (frame: number, total: number, inEnd: number, outStart: number, ease: EaseName | string = "smooth") =>
  frame < outStart ? progress(frame, 0, inEnd, ease) : 1 - progress(frame, outStart, total, ease);

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
