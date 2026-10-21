import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, progress, useLayout } from "../../kit";

export type WordsPreloaderProps = {
  background: string; // the page under the panel
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink3: string;
  panel: string; // the preloader panel
  onPanel: string; // its words
  panelMuted: string; // its tiny labels and the progress track
  accent: string;
  word1: string;
  word2: string;
  word3: string;
  word4: string;
  brand: string; // the fifth word, and the page's name
  pace: number; // frames per word
  ease: string; // the panel wipe
};

// Timing in frames on the 180-frame loop; sizes in px at 1080 on the short side.
export const PRE = {
  first: 6, // word 1 starts rising
  wordIn: 12, // a word rises into its mask (enter)
  hold: 18, // the brand holds before the wipe
  wipe: 26, // the panel wipes up and off
  bulge: 0.16, // the curved edge's sag at mid-wipe, as a fraction of the frame height
  ret: [150, 168] as const, // the empty panel rises back over the page (enter), ready for the next loop
  heroIn: 24,
  tracking: -0.045,
  base: { wide: 180, square: 160, vertical: 150 },
} as const;

export const paceOf = (pace: number) => Math.max(10, Math.min(16, Math.round(Number(pace) || 14)));
export const timeline = (pace: number) => {
  const step = paceOf(pace);
  const starts = [0, 1, 2, 3, 4].map((i) => PRE.first + i * step);
  const land = starts[4] + PRE.wordIn;
  const wipeA = land + PRE.hold;
  return { step, starts, land, wipeA, wipeB: wipeA + PRE.wipe };
};

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};

// Inter 400 at -0.045em averages ~0.5em per character; 0.56 keeps a margin.
export const wordSize = (words: string[], width: number, u: number, ratio: string) => {
  const longest = Math.max(1, ...words.map((w) => w.length));
  const base = (ratio === "16:9" ? PRE.base.wide : ratio === "1:1" ? PRE.base.square : PRE.base.vertical) * u;
  return Math.min(base, (width * 0.84) / (longest * 0.56));
};

export const WordsPreloader: React.FC<WordsPreloaderProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, ratio, isVertical } = useLayout();
  const words = [p.word1, p.word2, p.word3, p.word4, p.brand];
  const tl = timeline(p.pace);
  const size = wordSize(words, width, u, ratio);
  const side = ratio === "16:9" ? 96 * u : width * 0.08;
  const dark = isDark(p.background);

  // ---- the panel: a flat SVG path. Leaving, its bottom edge sags in the middle; returning, its top edge leads.
  const W = width;
  const H = height;
  const out = progress(frame, tl.wipeA, tl.wipeB, p.ease);
  const back = progress(frame, PRE.ret[0], PRE.ret[1], "enter");
  let d: string;
  if (frame >= PRE.ret[0]) {
    const y = H * (1 - back);
    const b = Math.sin(Math.PI * back) * PRE.bulge * H;
    d = `M0 ${H} L0 ${y} Q${W / 2} ${y - 2 * b} ${W} ${y} L${W} ${H} Z`;
  } else {
    const y = H * (1 - out);
    const b = Math.sin(Math.PI * out) * PRE.bulge * H;
    d = `M0 0 L${W} 0 L${W} ${y} Q${W / 2} ${y + 2 * b} 0 ${y} Z`;
  }
  const panelShown = frame < tl.wipeB || frame >= PRE.ret[0];

  // ---- words: each rises into one mask and leaves upward as the next arrives; the brand rides the wipe out.
  const lift = progress(frame, tl.wipeA, tl.wipeA + PRE.wipe * 0.4, "exit");
  const wordY = (i: number) => {
    const s = tl.starts[i];
    if (frame < s) return null;
    const pin = progress(frame, s, s + PRE.wordIn, "enter");
    // The last word never leaves on its own (it rides the wipe out), so it has no exit window: interpolate
    // rejects an infinite range.
    // The outgoing word moves with the incoming one, same window and curve, like one strip: the new word pushes the
    // old one up, so the two never overlap inside the mask.
    const pout = i < 4 ? progress(frame, tl.starts[i + 1], tl.starts[i + 1] + PRE.wordIn, "enter") : 0;
    if (pout >= 1) return null;
    return (1 - pin) * 110 - pout * 110;
  };

  // ---- the loading row: brand label, a counter and a hairline that fills in the accent, all gone before the wipe.
  const loaded = progress(frame, 0, tl.wipeA - 8, "travel");
  const rowOut = 1 - progress(frame, tl.wipeA - 8, tl.wipeA, "exit");
  const rowBack = progress(frame, PRE.ret[0] + 8, PRE.ret[1], "enter");
  const rowO = frame >= PRE.ret[0] ? rowBack : rowOut;
  const count = frame >= PRE.ret[0] ? 0 : Math.round(loaded * 100);
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 22 * u, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1, whiteSpace: "nowrap" };

  // ---- the page underneath.
  const hero = progress(frame, tl.wipeA + 8, tl.wipeA + 8 + PRE.heroIn, "enter");
  const heroO = frame >= PRE.ret[0] ? 1 : hero;
  const heroSize = Math.min(size * 1.15, (width * 0.84) / (Math.max(1, p.brand.length) * 0.56));
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const shotW = isVertical ? width - 2 * side : Math.min(width * 0.62, 1180 * u);
  const shotTop = isVertical ? H * 0.68 : H * 0.7;
  const bar = (w: number, h: number, c: string): React.CSSProperties => ({ width: w * u, height: h * u, borderRadius: RADIUS.chip * u, background: c });

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* page: nav, hero, a product card peeking up from the bottom */}
      <div style={{ position: "absolute", left: side, right: side, top: 64 * u, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: heroO }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 * u }}>
          <span style={{ width: 16 * u, height: 16 * u, borderRadius: 999, background: p.accent }} />
          <span style={{ fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink }}>{p.brand}</span>
        </div>
        <svg width={40 * u} height={40 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={(STROKE.ring * 24) / 40} strokeLinecap="round">
          <path d="M4 9h16M4 15h16" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: isVertical ? H * 0.3 : H * 0.2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28 * u,
          opacity: heroO,
          transform: `translateY(${((1 - heroO) * 40 * u).toFixed(2)}px)`,
        }}
      >
        <span style={{ ...mono, color: p.ink3 }}>{[p.word1, p.word2, p.word3, p.word4].filter((w) => w.trim()).join(" · ")}</span>
        <span style={{ fontSize: heroSize, fontWeight: 400, letterSpacing: `${PRE.tracking}em`, lineHeight: 1, color: p.ink, whiteSpace: "nowrap" }}>{p.brand}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: (W - shotW) / 2,
          top: shotTop + (1 - heroO) * 80 * u,
          width: shotW,
          height: H,
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxSizing: "border-box",
          boxShadow: shadow,
          padding: 40 * u,
          display: "flex",
          flexDirection: "column",
          gap: 18 * u,
          opacity: heroO,
        }}
      >
        <div style={{ display: "flex", gap: 10 * u }}>
          <span style={bar(14, 14, p.line)} />
          <span style={bar(14, 14, p.line)} />
          <span style={bar(14, 14, p.line)} />
        </div>
        <span style={bar(isVertical ? 420 : 520, 22, p.fill)} />
        <span style={bar(isVertical ? 300 : 380, 22, p.fill)} />
      </div>

      {/* the panel */}
      {panelShown && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <path d={d} fill={p.panel} />
        </svg>
      )}

      {/* the words, in one mask at the centre of the panel */}
      {frame < tl.wipeB && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${(-lift * 120 * u).toFixed(2)}px)` }}>
          <div style={{ position: "relative", width: width - 2 * side, height: `${1.3 * size}px`, overflow: "hidden" }}>
            {words.map((w, i) => {
              const y = wordY(i);
              if (y === null) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 1.3 * size,
                    lineHeight: `${1.3 * size}px`,
                    textAlign: "center",
                    fontSize: size,
                    fontWeight: 400,
                    letterSpacing: `${PRE.tracking}em`,
                    whiteSpace: "nowrap",
                    color: p.onPanel,
                    transform: `translateY(${y.toFixed(3)}%)`,
                  }}
                >
                  {w}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {/* loading row */}
      {panelShown && rowO > 0.001 && (
        <div style={{ position: "absolute", left: side, right: side, bottom: 64 * u, opacity: rowO }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 * u, color: p.panelMuted, ...mono }}>
            <span>{p.brand}</span>
            <span>{String(count).padStart(3, "0")}</span>
          </div>
          <svg width={width - 2 * side} height={STROKE.ring * u} style={{ display: "block" }}>
            <rect x={0} y={0} width={width - 2 * side} height={STROKE.ring * u} fill={alpha(p.panelMuted, 0.3)} />
            <rect x={0} y={0} width={(width - 2 * side) * (frame >= PRE.ret[0] ? 0 : loaded)} height={STROKE.ring * u} fill={p.accent} />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
