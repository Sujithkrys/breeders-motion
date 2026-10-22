import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame } from "remotion";
import { CANVAS, FONT_SANS, RADIUS, SPRING_CONFIG, STROKE, alpha, mix, progress, tokensFor, useLayout } from "../../kit";
import { FILM, sampleLogoFor } from "../../film";
import type { Ratio } from "../../types";

export type CoinFlipProps = {
  background: string;
  accent: string; // the coin's back face
  logo: string;
  brand: string;
  tagline: string;
  flips: number; // turns before landing (540° = 1.5)
  shape: string; // "coin" | "tile"
};

// Frames on the 120-frame clip. The coin spins in on one spring and drops from a lifted height onto the canvas;
// the wordmark slides out from behind it as it settles; the tagline fades in last; then a long still hold.
export const COIN = {
  duration: 120,
  fade: [0, 10] as const,
  flip: 64, // spring settles by this frame
  word: [54, 80] as const,
  tag: [70, 92] as const,
  thickness: 0.085, // of the coin's diameter
  layers: 6, // stacked edge layers between the faces
  lift: 300, // px toward the camera at the start (with the perspective below, ≈ 1.2× scale)
  perspective: 1800,
  logoOnCoin: 0.46, // logo box as a share of the diameter
  logoOnTile: 0.5,
  edgeShade: 0.12, // edge layers: the card colour mixed this far toward the ink
} as const;

export const COIN_SIZE: Record<Ratio, { coin: number; word: number; gap: number; tag: number; tagGap: number }> = {
  "16:9": { coin: 360, word: 128, gap: 64, tag: 30, tagGap: 14 },
  "1:1": { coin: 300, word: 104, gap: 52, tag: 26, tagGap: 12 },
  "9:16": { coin: 400, word: 128, gap: 72, tag: 32, tagGap: 16 },
};

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `#${A.map((v, i) => Math.round(mix(v, B[i], t)).toString(16).padStart(2, "0")).join("")}`;
};
export const isDarkBg = (bg: string) => lum(bg) < 0.4;
// Ink, card and line come from the background: Ink-canvas tokens on dark fields, Paper/Stone tokens on light ones.
export const coinTokensFor = (bg: string) => (bg.toUpperCase() === CANVAS.stone.bg ? CANVAS.stone : isDarkBg(bg) ? CANVAS.ink : CANVAS.paper);
export const edgeColourFor = (bg: string) => {
  const t = coinTokensFor(bg);
  return mixHex(t.card, t.ink, COIN.edgeShade);
};
export const ON_ACCENT = tokensFor("paper", "orange").onAccent;

// Lockup geometry in px relative to the frame centre, shared with the prompt.
// Inter 500 at -0.03em averages ≈ 0.56em per character; the estimate only positions the lockup.
export const coinLayout = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const ratio: Ratio = width === height ? "1:1" : width > height ? "16:9" : "9:16";
  const vertical = ratio === "9:16";
  const S = COIN_SIZE[ratio];
  const D = S.coin * u;
  const R = D / 2;
  const gap = S.gap * u;
  const chars = Math.max(brand.length, 3);
  const avail = vertical ? width * 0.84 : width * (ratio === "1:1" ? 0.86 : 0.62) - D - gap;
  const word = Math.min(S.word * u, avail / (chars * 0.56));
  const wordW = chars * 0.56 * word;
  const wordH = word * 1.2;
  const hasTag = tagline.trim().length > 0;
  const tag = S.tag * u;
  const tagH = hasTag ? tag * 1.3 : 0;
  const tagGap = hasTag ? S.tagGap * u : 0;
  if (vertical) {
    const top = -(D + gap + wordH + tagGap + tagH) / 2;
    return { ratio, vertical, D, R, gap, word, wordW, wordH, tag, tagH, coinX: 0, coinY: top + R, wordLeft: -wordW / 2, wordTop: top + D + gap, tagTop: top + D + gap + wordH + tagGap };
  }
  const lockW = D + gap + wordW;
  const blockH = wordH + tagGap + tagH;
  return { ratio, vertical, D, R, gap, word, wordW, wordH, tag, tagH, coinX: -lockW / 2 + R, coinY: 0, wordLeft: -lockW / 2 + D + gap, wordTop: -blockH / 2, tagTop: -blockH / 2 + wordH + tagGap };
};

export const CoinFlip: React.FC<CoinFlipProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, fps } = useLayout();
  const t = coinTokensFor(p.background);
  const dark = isDarkBg(p.background);
  const L = coinLayout(p.brand, p.tagline, width, height, u);
  const { D, R } = L;
  const tile = p.shape === "tile";
  const radius = tile ? RADIUS.hero * u : D / 2;

  // One spring drives the spin and the drop, so the coin lands flat exactly as it stops turning.
  const s = frame >= COIN.flip ? 1 : spring({ frame, fps, config: SPRING_CONFIG, durationInFrames: COIN.flip });
  const theta = Math.max(1, p.flips) * 360 * (1 - s);
  const lift = COIN.lift * u * (1 - s);
  const fade = progress(frame, COIN.fade[0], COIN.fade[1], "enter");
  const cos = Math.cos((theta * Math.PI) / 180);

  // Fake thickness: two faces and six edge layers spaced through the depth, each with its own full transform (no
  // preserve-3d), painted far-to-near by hand. A thin band at 90° fills the silhouette when the coin is edge-on.
  const T = D * COIN.thickness;
  const P = COIN.perspective * u;
  const base = `perspective(${P.toFixed(1)}px) translateZ(${lift.toFixed(2)}px) rotateY(${theta.toFixed(3)}deg)`;
  const edge = edgeColourFor(p.background);
  const face = (z: number, extra = ""): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: D,
    height: D,
    borderRadius: radius,
    transform: `${base} translateZ(${z.toFixed(2)}px)${extra}`,
  });
  const logoBox = D * (tile ? COIN.logoOnTile : COIN.logoOnCoin);
  const initial = p.brand.trim().charAt(0).toUpperCase();

  const front = (
    <div
      key="front"
      style={{
        ...face(T / 2),
        background: t.card,
        border: `${STROKE.hair * u}px solid ${t.line}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img src={sampleLogoFor(p.logo, t.ink)} style={{ width: logoBox, height: logoBox, objectFit: "contain", display: "block" }} />
    </div>
  );
  const back = (
    <div
      key="back"
      style={{
        ...face(-T / 2, " rotateY(180deg)"),
        background: p.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: ON_ACCENT,
        fontSize: D * 0.44,
        fontWeight: 600,
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
  const edges = Array.from({ length: COIN.layers }, (_, i) => {
    const z = -T / 2 + (T * (i + 1)) / (COIN.layers + 1);
    return <div key={`edge-${i}`} style={{ ...face(z), background: edge }} />;
  });
  const band = (
    <div
      key="band"
      style={{
        position: "absolute",
        left: (D - T) / 2,
        top: 0,
        width: T,
        height: D,
        borderRadius: Math.min(T / 2, RADIUS.chip * u),
        background: edge,
        transform: `${base} rotateY(90deg)`,
      }}
    />
  );
  const layers = cos >= 0 ? [back, ...edges, band, front] : [front, ...edges.slice().reverse(), band, back];

  // Contact shadow: the coin's footprint (narrow when edge-on), soft and wide while lifted, tightening as it lands.
  const footW = D * Math.max(Math.abs(cos), COIN.thickness);
  const spread = mix(1.1, 0.96, s);
  const shadowBlur = mix(24, 10, s) * u;
  const shadowA = mix(0.04, dark ? 0.5 : 0.14, s) * fade;
  const shadowY = mix(56, 14, s) * u;

  // Wordmark: slides out from behind the coin (right on 16:9 and 1:1, down on 9:16), clipped at the coin's centre line
  // so it only ever appears from under the coin.
  const kWord = progress(frame, COIN.word[0], COIN.word[1], "enter");
  const kTag = progress(frame, COIN.tag[0], COIN.tag[1], "enter");
  const word = (
    <div style={{ fontSize: L.word, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.2, whiteSpace: "nowrap", color: t.ink }}>{p.brand}</div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width / 2, top: height / 2, width: 0, height: 0 }}>
        {L.vertical ? (
          <div style={{ position: "absolute", left: -width / 2, width, top: L.coinY, height: L.wordTop + L.wordH - L.coinY, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                width,
                top: L.wordTop - L.coinY,
                display: "flex",
                justifyContent: "center",
                opacity: Math.min(1, kWord * 2),
                transform: `translateY(${(-(1 - kWord) * (L.wordTop - L.coinY + L.wordH)).toFixed(2)}px)`,
              }}
            >
              {word}
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", left: L.coinX, width, top: L.wordTop, height: L.wordH, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: L.wordLeft - L.coinX,
                top: 0,
                transform: `translateX(${(-(1 - kWord) * (L.wordLeft - L.coinX + L.wordW * 1.1)).toFixed(2)}px)`,
              }}
            >
              {word}
            </div>
          </div>
        )}

        {p.tagline.trim() ? (
          <div
            style={{
              position: "absolute",
              left: L.vertical ? -width / 2 : L.wordLeft,
              width: L.vertical ? width : undefined,
              top: L.tagTop,
              textAlign: L.vertical ? "center" : "left",
              fontSize: L.tag,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              color: t.ink2,
              opacity: kTag,
              transform: `translateY(${((1 - kTag) * 12 * u).toFixed(2)}px)`,
            }}
          >
            {p.tagline}
          </div>
        ) : null}

        {/* the coin, drawn above the wordmark so the name emerges from behind it */}
        <div style={{ position: "absolute", left: L.coinX - R, top: L.coinY - R, width: D, height: D }}>
          <div
            style={{
              position: "absolute",
              left: (D - footW * spread) / 2,
              top: (D - D * spread) / 2 + shadowY,
              width: footW * spread,
              height: D * spread,
              borderRadius: tile ? radius : "50%",
              background: alpha(FILM.black, shadowA),
              filter: `blur(${shadowBlur.toFixed(2)}px)`,
            }}
          />
          <div style={{ position: "absolute", left: 0, top: 0, width: D, height: D, opacity: fade }}>{layers}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
