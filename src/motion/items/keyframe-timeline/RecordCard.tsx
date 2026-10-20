// The linked preview: "Loop", the record-store app from our Figma Motion film, as one card inside a Figma frame.
// v[r] is how far layer r is from its start state (0) to its designed state (1): Header, Sleeve, Vinyl, Tracks, Play.
import React from "react";
import { FONT_MONO, FONT_SANS } from "../../kit";

export type CardVariant = "tall" | "wide";

const INK = "#0E0F12";
const SUB = "#7B7E87";
const LINE = "#E8E8EC";
const SOFT = "#F2F2EF";
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
const GEO: Record<CardVariant, CardGeo> = {
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

// a flat accent sleeve with the film's "Night Swim" rings
const Sleeve: React.FC<{ size: number; accent: string }> = ({ size, accent }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <rect width={100} height={100} rx={2} fill={accent} />
    {[14, 22, 30, 38, 46].map((r) => (
      <circle key={r} cx={68} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={0.5} />
    ))}
    <circle cx={68} cy={32} r={7} fill="rgba(255,255,255,0.92)" />
    <text x={7} y={92} fontFamily={FONT_SANS} fontSize={8.5} fontWeight={600} letterSpacing={-0.2} fill="#FFFFFF">
      Night Swim
    </text>
  </svg>
);

// a black vinyl drawn in SVG; grooves and label turn, the sheen stays put
const Vinyl: React.FC<{ size: number; accent: string; rot: number }> = ({ size, accent, rot }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <circle cx={50} cy={50} r={50} fill={INK} />
    {[46, 41.5, 37, 32.5, 28, 23.5].map((r) => (
      <circle key={r} cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />
    ))}
    <path d="M50 50L84 14A50 50 0 0 1 95 30z" fill="rgba(255,255,255,0.06)" />
    <path d="M50 50L16 86A50 50 0 0 1 5 70z" fill="rgba(255,255,255,0.045)" />
    <g transform={`rotate(${rot} 50 50)`}>
      <circle cx={50} cy={50} r={17} fill={accent} />
      <text x={50} y={42.5} textAnchor="middle" fontFamily={FONT_SANS} fontSize={5} fontWeight={700} letterSpacing={-0.1} fill="rgba(255,255,255,0.9)">
        Loop
      </text>
      <circle cx={50} cy={60} r={1.2} fill="rgba(255,255,255,0.6)" />
    </g>
    <circle cx={50} cy={50} r={1.7} fill={INK} />
  </svg>
);

export const RecordCard: React.FC<{
  x: number;
  y: number;
  s: number;
  variant: CardVariant;
  accent: string;
  labelColor: string;
  badgeText: string;
  v: number[];
  rot: number;
}> = ({ x, y, s, variant, accent, labelColor, badgeText, v, rot }) => {
  const g = GEO[variant];
  const [vh, vs, vv, vt, vp] = v;
  // Start states stay faintly visible (an onion skin), so the card never reads as empty while keys are set.
  const ghost = (v: number) => 0.2 + 0.8 * v;
  const sleeveO = 0.35 + 0.65 * clamp01(vs * 1.4);
  const hair = `${Math.max(1, s)}px solid ${LINE}`;
  // centred on the selection box corners (box border is 1.5, handle is 9)
  const off = -5.25 * s;
  const handle = (l: boolean, t: boolean): React.CSSProperties => ({
    position: "absolute",
    left: l ? off : undefined,
    right: l ? undefined : off,
    top: t ? off : undefined,
    bottom: t ? undefined : off,
    width: 9 * s,
    height: 9 * s,
    background: "#FFFFFF",
    border: `${1.5 * s}px solid ${accent}`,
    boxSizing: "border-box",
  });

  return (
    <div style={{ position: "absolute", left: x, top: y, width: g.w * s, height: g.h * s, fontFamily: FONT_SANS }}>
      {/* Figma frame label */}
      <div style={{ position: "absolute", left: 0, top: -40 * s, height: 26 * s, display: "flex", alignItems: "center", gap: 9 * s, color: labelColor, fontSize: 16 * s, whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 14 * s, opacity: 0.7 }}>{"{ }"}</span>
        <span style={{ opacity: 0.85 }}>Loop / Record</span>
        <span style={{ fontSize: 12 * s, fontWeight: 600, color: badgeText, background: labelColor, borderRadius: 5 * s, padding: `${3 * s}px ${8 * s}px`, lineHeight: 1 }}>Motion</span>
      </div>

      {/* the card */}
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", borderRadius: 18 * s, border: hair, boxSizing: "border-box", overflow: "hidden", color: INK, boxShadow: `0 ${s}px ${2 * s}px rgba(0,0,0,0.04), 0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.06)` }}>
        {/* Header */}
        <div style={{ position: "absolute", left: g.head.x * s, top: g.head.y * s, display: "flex", alignItems: "center", gap: 12 * s, opacity: ghost(vh), transform: `translateY(${(1 - vh) * -14 * s}px)` }}>
          <span style={{ fontSize: 28 * s, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>Loop</span>
          <span style={{ fontSize: 12 * s, fontWeight: 500, color: SUB, background: SOFT, borderRadius: 99, padding: `${5 * s}px ${10 * s}px`, lineHeight: 1 }}>New this week</span>
        </div>

        {/* Vinyl, behind its sleeve */}
        <div style={{ position: "absolute", left: (g.sleeve.x + 8 + vv * g.vinyl.slide) * s, top: (g.sleeve.y + (g.sleeve.size - g.vinyl.size) / 2) * s, opacity: sleeveO, borderRadius: "50%", boxShadow: `0 ${10 * s}px ${24 * s}px rgba(0,0,0,0.18)` }}>
          <Vinyl size={g.vinyl.size * s} accent={accent} rot={rot} />
        </div>
        {/* Sleeve */}
        <div style={{ position: "absolute", left: g.sleeve.x * s, top: g.sleeve.y * s, borderRadius: 5 * s, overflow: "hidden", opacity: sleeveO, transform: `translateX(${(1 - vs) * -36 * s}px) rotate(${(1 - vs) * -5}deg)`, boxShadow: `0 ${12 * s}px ${28 * s}px rgba(0,0,0,0.16)` }}>
          <Sleeve size={g.sleeve.size * s} accent={accent} />
        </div>

        {/* Title (rides with Header) + Play */}
        <div style={{ position: "absolute", left: g.title.x * s, top: g.title.y * s, opacity: ghost(vh), transform: `translateY(${(1 - vh) * -14 * s}px)` }}>
          <div style={{ fontSize: 30 * s, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.1 }}>Night Swim</div>
          <div style={{ fontSize: 15 * s, color: SUB, marginTop: 6 * s }}>Mara Vale · Vinyl LP · 2026</div>
        </div>
        <div style={{ position: "absolute", left: (g.title.x + g.title.w - g.play) * s, top: (g.title.y - 2) * s, width: g.play * s, height: g.play * s, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", opacity: ghost(vp), transform: `scale(${0.6 + 0.4 * vp})` }}>
          <svg width={18 * s} height={18 * s} viewBox="0 0 10 10">
            <path d="M2.6 1.2l6 3.8-6 3.8z" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Tracks */}
        <div style={{ position: "absolute", left: g.tracks.x * s, top: g.tracks.y * s, width: g.tracks.w * s }}>
          {TRACKS.slice(0, g.tracks.n).map(([name, d], k) => {
            const kk = clamp01(vt * 1.6 - k * 0.3);
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", height: 44 * s, borderTop: hair, opacity: ghost(kk), transform: `translateX(${(1 - kk) * 28 * s}px)` }}>
                <span style={{ width: 34 * s, fontFamily: FONT_MONO, fontSize: 13 * s, color: SUB }}>0{k + 1}</span>
                <span style={{ fontSize: 16 * s, fontWeight: 500 }}>{name}</span>
                <span style={{ marginLeft: "auto", fontSize: 14 * s, color: SUB, fontVariantNumeric: "tabular-nums" }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Figma selection box with corner handles */}
      <div style={{ position: "absolute", inset: -7 * s, border: `${1.5 * s}px solid ${accent}`, pointerEvents: "none" }}>
        <div style={handle(true, true)} />
        <div style={handle(false, true)} />
        <div style={handle(true, false)} />
        <div style={handle(false, false)} />
      </div>
    </div>
  );
};
