// The linked preview: "Loop", the record-store app from our Figma Motion film, as one card inside a Figma frame.
// v[r] is how far layer r is from its start state (0) to its designed state (1): Header, Sleeve, Vinyl, Tracks, Play.
// The art is the accent plus greys: an accent sleeve, a black vinyl with a grey label, ink type on the card.
import React from "react";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha } from "../../kit";

export type CardVariant = "tall" | "wide";

// the colours the card needs, all from the system tokens
export type CardTokens = {
  bg: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  button: string;
  onButton: string;
  accent: string;
  onAccent: string;
  shadow: boolean;
};

// The vinyl is a physical object: always a black disc with a paper-grey label, on any canvas.
const VINYL = CANVAS.ink.bg;
const VINYL_LABEL = CANVAS.paper.fill;
const VINYL_LABEL_INK = CANVAS.paper.ink2;

const TRACKS: [string, string][] = [
  ["Low Tide", "3:42"],
  ["Glass Harbour", "4:05"],
  ["Swim Home", "3:18"],
];

// card geometry in design px (multiplied by s)
type CardGeo = {
  w: number;
  h: number;
  sleeve: { x: number; y: number; size: number };
  vinyl: { size: number; slide: number };
  head: { x: number; y: number };
  title: { x: number; y: number; w: number };
  play: number;
  tracks: { x: number; y: number; w: number; n: number };
};
export const CARD_GEO: Record<CardVariant, CardGeo> = {
  tall: {
    w: 456,
    h: 600,
    sleeve: { x: 32, y: 90, size: 236 },
    vinyl: { size: 220, slide: 130 },
    head: { x: 32, y: 30 },
    title: { x: 32, y: 354, w: 392 },
    play: 56,
    tracks: { x: 32, y: 440, w: 392, n: 3 },
  },
  wide: {
    w: 952,
    h: 264,
    sleeve: { x: 24, y: 24, size: 216 },
    vinyl: { size: 200, slide: 124 },
    head: { x: 404, y: 26 },
    title: { x: 404, y: 76, w: 524 },
    play: 52,
    tracks: { x: 404, y: 152, w: 524, n: 2 },
  },
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// a flat accent sleeve with the film's "Night Swim" rings; `sw` is a hairline in viewBox units
const Sleeve: React.FC<{ size: number; c: CardTokens; sw: number }> = ({ size, c, sw }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <rect width={100} height={100} fill={c.accent} />
    {[14, 22, 30, 38, 46].map((r) => (
      <circle key={r} cx={68} cy={32} r={r} fill="none" stroke={alpha(c.onAccent, 0.3)} strokeWidth={sw} />
    ))}
    <circle cx={68} cy={32} r={7} fill={c.onAccent} />
    <text x={7} y={92} fontFamily={FONT_SANS} fontSize={8.5} fontWeight={500} letterSpacing={-0.2} fill={c.onAccent}>
      Night Swim
    </text>
  </svg>
);

// a black vinyl drawn in SVG; grooves and label turn, the reflections stay put
const Vinyl: React.FC<{ size: number; rot: number; sw: number }> = ({ size, rot, sw }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <circle cx={50} cy={50} r={50} fill={VINYL} />
    {[46, 41.5, 37, 32.5, 28, 23.5].map((r) => (
      <circle key={r} cx={50} cy={50} r={r} fill="none" stroke={alpha(VINYL_LABEL, 0.08)} strokeWidth={sw} />
    ))}
    <path d="M50 50L84 14A50 50 0 0 1 95 30z" fill={alpha(VINYL_LABEL, 0.06)} />
    <path d="M50 50L16 86A50 50 0 0 1 5 70z" fill={alpha(VINYL_LABEL, 0.045)} />
    <g transform={`rotate(${rot} 50 50)`}>
      <circle cx={50} cy={50} r={17} fill={VINYL_LABEL} />
      <text x={50} y={42.5} textAnchor="middle" fontFamily={FONT_SANS} fontSize={5} fontWeight={600} letterSpacing={-0.1} fill={VINYL_LABEL_INK}>
        Loop
      </text>
      <circle cx={50} cy={60} r={1.2} fill={VINYL_LABEL_INK} />
    </g>
    <circle cx={50} cy={50} r={1.7} fill={VINYL} />
  </svg>
);

export const RecordCard: React.FC<{
  x: number;
  y: number;
  s: number; // geometry scale (u × the layout's card scale)
  u: number; // radii and strokes stay on the system scale
  variant: CardVariant;
  c: CardTokens;
  v: number[];
  rot: number;
}> = ({ x, y, s, u, variant, c, v, rot }) => {
  const g = CARD_GEO[variant];
  const [vh, vs, vv, vt, vp] = v;
  // Start states stay faintly visible (an onion skin), so the card never reads as empty while keys are set.
  const ghost = (k: number) => 0.2 + 0.8 * k;
  const sleeveO = 0.35 + 0.65 * clamp01(vs * 1.4);
  const hairPx = STROKE.hair * u;
  const hair = `${hairPx}px solid ${c.line}`;
  const handle = 9 * s;
  const off = -(handle + hairPx) / 2; // handles centred on the selection box's border corners
  const corner = (l: boolean, t: boolean): React.CSSProperties => ({
    position: "absolute",
    left: l ? off : undefined,
    right: l ? undefined : off,
    top: t ? off : undefined,
    bottom: t ? undefined : off,
    width: handle,
    height: handle,
    background: c.card,
    border: `${hairPx}px solid ${c.accent}`,
    boxSizing: "border-box",
  });
  const objShadow = `0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.12)`;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: g.w * s, height: g.h * s, fontFamily: FONT_SANS }}>
      {/* Figma frame label */}
      <div style={{ position: "absolute", left: 0, top: -40 * s, height: 26 * s, display: "flex", alignItems: "center", gap: 9 * s, color: c.ink2, fontSize: 16 * s, whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 14 * s }}>{"{ }"}</span>
        <span>Loop / Record</span>
        <span style={{ fontSize: 12 * s, fontWeight: 500, color: c.bg, background: c.ink, borderRadius: RADIUS.chip * u, padding: `${3 * s}px ${8 * s}px`, lineHeight: 1 }}>Motion</span>
      </div>

      {/* the card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.card,
          borderRadius: RADIUS.card * u,
          border: hair,
          boxSizing: "border-box",
          overflow: "hidden",
          color: c.ink,
          boxShadow: c.shadow ? `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)` : undefined,
        }}
      >
        {/* Header */}
        <div style={{ position: "absolute", left: g.head.x * s, top: g.head.y * s, display: "flex", alignItems: "center", gap: 12 * s, opacity: ghost(vh), transform: `translateY(${(1 - vh) * -14 * s}px)` }}>
          <span style={{ fontSize: 28 * s, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}>Loop</span>
          <span style={{ fontSize: 12 * s, fontWeight: 500, color: c.ink2, background: c.fill, borderRadius: 999, padding: `${5 * s}px ${10 * s}px`, lineHeight: 1 }}>New this week</span>
        </div>

        {/* Vinyl, behind its sleeve */}
        <div style={{ position: "absolute", left: (g.sleeve.x + 8 + vv * g.vinyl.slide) * s, top: (g.sleeve.y + (g.sleeve.size - g.vinyl.size) / 2) * s, opacity: sleeveO, borderRadius: 999, boxShadow: objShadow }}>
          <Vinyl size={g.vinyl.size * s} rot={rot} sw={(hairPx * 100) / (g.vinyl.size * s)} />
        </div>
        {/* Sleeve */}
        <div style={{ position: "absolute", left: g.sleeve.x * s, top: g.sleeve.y * s, borderRadius: RADIUS.chip * u, overflow: "hidden", opacity: sleeveO, transform: `translateX(${(1 - vs) * -36 * s}px) rotate(${(1 - vs) * -5}deg)`, boxShadow: objShadow }}>
          <Sleeve size={g.sleeve.size * s} c={c} sw={(hairPx * 100) / (g.sleeve.size * s)} />
        </div>

        {/* Title (rides with Header) + Play */}
        <div style={{ position: "absolute", left: g.title.x * s, top: g.title.y * s, opacity: ghost(vh), transform: `translateY(${(1 - vh) * -14 * s}px)` }}>
          <div style={{ fontSize: 30 * s, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Night Swim</div>
          <div style={{ fontSize: 15 * s, color: c.ink2, marginTop: 6 * s }}>Mara Vale · Vinyl LP · 2026</div>
        </div>
        <div style={{ position: "absolute", left: (g.title.x + g.title.w - g.play) * s, top: (g.title.y - 2) * s, width: g.play * s, height: g.play * s, borderRadius: 999, background: c.button, display: "flex", alignItems: "center", justifyContent: "center", opacity: ghost(vp), transform: `scale(${0.6 + 0.4 * vp})` }}>
          <svg width={18 * s} height={18 * s} viewBox="0 0 10 10">
            <path d="M2.6 1.2l6 3.8-6 3.8z" fill={c.onButton} />
          </svg>
        </div>

        {/* Tracks */}
        <div style={{ position: "absolute", left: g.tracks.x * s, top: g.tracks.y * s, width: g.tracks.w * s }}>
          {TRACKS.slice(0, g.tracks.n).map(([name, d], k) => {
            const kk = clamp01(vt * 1.6 - k * 0.3);
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", height: 44 * s, borderTop: hair, opacity: ghost(kk), transform: `translateX(${(1 - kk) * 28 * s}px)` }}>
                <span style={{ width: 34 * s, fontFamily: FONT_MONO, fontSize: 13 * s, color: c.ink2 }}>0{k + 1}</span>
                <span style={{ fontSize: 16 * s, fontWeight: 500 }}>{name}</span>
                <span style={{ marginLeft: "auto", fontSize: 14 * s, color: c.ink2, fontVariantNumeric: "tabular-nums" }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Figma selection box with corner handles */}
      <div style={{ position: "absolute", inset: -7 * s, border: `${hairPx}px solid ${c.accent}`, pointerEvents: "none" }}>
        <div style={corner(true, true)} />
        <div style={corner(false, true)} />
        <div style={corner(true, false)} />
        <div style={corner(false, false)} />
      </div>
    </div>
  );
};
