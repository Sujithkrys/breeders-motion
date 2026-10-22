import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { CANVAS, FONT_MONO, FONT_SANS, progress, useLayout } from "../../kit";
import { sampleLogoFor } from "../../film";
import type { Ratio } from "../../types";

export type FocusPullProps = {
  background: string;
  accent: string; // the small dot before the tagline
  logo: string;
  brand: string;
  tagline: string;
  zoom: number; // opening macro scale on the mark
  blur: number; // opening defocus, px at 1080 short side
};

// Frames on the 120-frame clip. The camera pull and the focus rack share one window on the travel curve; the wordmark
// rises as the mark comes sharp; a linear 2% push runs under everything and stops 20 frames before the end.
export const FOCUS = {
  duration: 120,
  pull: [4, 54] as const,
  word: [48, 70] as const,
  tag: [62, 84] as const,
  push: [40, 100] as const,
  pushTo: 1.02,
  // Where the macro shot is centred, as fractions of the mark from its centre: just past its right edge, upper third,
  // so the opening reads as an abstract soft shape rather than a logo.
  focus: { x: 0.54, y: -0.3 },
} as const;

export const FOCUS_SIZE: Record<Ratio, { mark: number; word: number; gap: number; tag: number; tagGap: number }> = {
  "16:9": { mark: 184, word: 144, gap: 48, tag: 22, tagGap: 72 },
  "1:1": { mark: 152, word: 116, gap: 40, tag: 20, tagGap: 60 },
  "9:16": { mark: 232, word: 132, gap: 56, tag: 24, tagGap: 56 },
};

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
// Ink colours come from the background: Ink-canvas greys on dark fields, Paper/Stone greys on light ones.
export const inkTokensFor = (bg: string) =>
  bg.toUpperCase() === CANVAS.stone.bg ? CANVAS.stone : lum(bg) < 0.4 ? CANVAS.ink : CANVAS.paper;

// Lockup geometry in px, relative to the frame centre. Shared with the prompt so it quotes the real sizes.
// Inter 600 at -0.03em averages ≈ 0.58em per character; the estimate only positions the lockup.
export const focusLayout = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const ratio: Ratio = width === height ? "1:1" : width > height ? "16:9" : "9:16";
  const vertical = ratio === "9:16";
  const S = FOCUS_SIZE[ratio];
  const M = S.mark * u;
  const gap = S.gap * u;
  const chars = Math.max(brand.length, 3);
  const avail = vertical ? width * 0.84 : width * (ratio === "1:1" ? 0.72 : 0.6) - M - gap;
  const word = Math.min(S.word * u, avail / (chars * 0.58));
  const wordW = chars * 0.58 * word;
  const wordH = word * 1.2;
  const hasTag = tagline.trim().length > 0;
  const tag = S.tag * u;
  const tagH = hasTag ? tag * 1.3 : 0;
  const tagGap = hasTag ? S.tagGap * u : 0;
  if (vertical) {
    const top = -(M + gap + wordH + tagGap + tagH) / 2;
    return { ratio, vertical, M, gap, word, wordW, wordH, tag, tagH, markX: 0, markY: top + M / 2, wordLeft: -wordW / 2, wordTop: top + M + gap, tagTop: top + M + gap + wordH + tagGap };
  }
  const lockW = M + gap + wordW;
  const top = -(M + tagGap + tagH) / 2;
  return { ratio, vertical, M, gap, word, wordW, wordH, tag, tagH, markX: -lockW / 2 + M / 2, markY: top + M / 2, wordLeft: -lockW / 2 + M + gap, wordTop: top + M / 2 - wordH / 2, tagTop: top + M + tagGap };
};

export const FocusPull: React.FC<FocusPullProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const t = inkTokensFor(p.background);
  const L = focusLayout(p.brand, p.tagline, width, height, u);

  // Camera: one pull from `zoom`× to 1×, interpolated in log space so every frame feels like the same step of zoom.
  // Zooming about a fixed pivot P keeps the move a pure dolly: at s0 the focus point F sits at the frame centre and at
  // 1× everything is in its final place. That needs P = F · s0 / (s0 − 1).
  const s0 = Math.max(1.5, p.zoom);
  const e = progress(frame, FOCUS.pull[0], FOCUS.pull[1], "travel");
  const scale = Math.exp(Math.log(s0) * (1 - e));
  const fx = L.markX + FOCUS.focus.x * L.M;
  const fy = L.markY + FOCUS.focus.y * L.M;
  const px = (fx * s0) / (s0 - 1);
  const py = (fy * s0) / (s0 - 1);
  // The focus rack runs on the same eased window, so the mark comes sharp exactly as the camera settles.
  const blur = p.blur * u * (1 - e);
  // A subtle linear push under the reveal, finished 20 frames before the end so the close holds perfectly still.
  const push = interpolate(frame, [FOCUS.push[0], FOCUS.push[1]], [1, FOCUS.pushTo], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const kWord = progress(frame, FOCUS.word[0], FOCUS.word[1], "enter");
  const kTag = progress(frame, FOCUS.tag[0], FOCUS.tag[1], "enter");
  const src = sampleLogoFor(p.logo, t.ink);
  const dot = 10 * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: "50% 50%" }}>
          <AbsoluteFill style={{ transform: `scale(${scale.toFixed(5)})`, transformOrigin: `${(width / 2 + px).toFixed(2)}px ${(height / 2 + py).toFixed(2)}px` }}>
            <div style={{ position: "absolute", left: width / 2, top: height / 2, width: 0, height: 0 }}>
              {/* the mark */}
              <div style={{ position: "absolute", left: L.markX - L.M / 2, top: L.markY - L.M / 2, width: L.M, height: L.M }}>
                <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              </div>

              {/* the wordmark rises out of a line mask once the mark is sharp */}
              <div
                style={{
                  position: "absolute",
                  left: L.vertical ? -width / 2 : L.wordLeft,
                  width: L.vertical ? width : undefined,
                  top: L.wordTop,
                  height: L.wordH,
                  overflow: "hidden",
                  display: "flex",
                  justifyContent: L.vertical ? "center" : "flex-start",
                }}
              >
                <div
                  style={{
                    fontSize: L.word,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    color: t.ink,
                    transform: `translateY(${((1 - kWord) * L.wordH * 1.05).toFixed(2)}px)`,
                  }}
                >
                  {p.brand}
                </div>
              </div>

              {/* mono tagline with one accent dot, centred under the lockup */}
              {p.tagline.trim() ? (
                <div
                  style={{
                    position: "absolute",
                    left: -width / 2,
                    width,
                    top: L.tagTop,
                    height: L.tagH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14 * u,
                    opacity: kTag,
                  }}
                >
                  <div style={{ width: dot, height: dot, borderRadius: dot, background: p.accent, flexShrink: 0 }} />
                  <div style={{ fontFamily: FONT_MONO, fontSize: L.tag, fontWeight: 400, letterSpacing: "0.12em", lineHeight: 1.3, whiteSpace: "nowrap", color: t.ink2 }}>
                    {p.tagline.toUpperCase()}
                  </div>
                </div>
              ) : null}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
