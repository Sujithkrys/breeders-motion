import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type MusicPlayerProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string;
  onButton: string;
  accent: string;
  title: string;
  artist: string;
  bars: number;
  intensity: number; // 0.2–1, how hard the bars react
  ease: string;
};

export const TRACK_SECONDS = 222;
export const START_SECONDS = 84;
export const PLAY_FRAME = 30;
export const ENTER = { card: [0, 24] as const, art: [4, 28] as const, rise: 40 };
const BEAT = 15; // frames per beat: 120 bpm at 30fps

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};

// Layout scale per ratio: 16:9 and 1:1 sit side by side (art left, info right); 9:16 stacks.
export const scaleFor = (wide: boolean, square: boolean) => (square ? 0.78 : wide ? 1.12 : 1.15);

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Flat geometric sleeve: an ink square, two concentric grey discs rising from the lower left, one accent dot.
const Art: React.FC<{ size: number; p: MusicPlayerProps; radius: number }> = ({ size: A, p, radius }) => (
  <div style={{ width: A, height: A, borderRadius: radius, overflow: "hidden", flexShrink: 0 }}>
    <svg width={A} height={A} viewBox={`0 0 ${A} ${A}`} style={{ display: "block" }}>
      <rect width={A} height={A} fill={p.ink} />
      <circle cx={A * 0.32} cy={A * 1.02} r={A * 0.48} fill={p.ink2} />
      <circle cx={A * 0.32} cy={A * 1.02} r={A * 0.3} fill={p.ink3} />
      <circle cx={A * 0.7} cy={A * 0.33} r={A * 0.12} fill={p.accent} />
    </svg>
  </div>
);

const Icon: React.FC<{ d: string; size: number; sw: number; color: string; fill?: string }> = ({ d, size, sw, color, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d={d} fill={fill ?? "none"} stroke={color} strokeWidth={(sw * 24) / size} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MusicPlayer: React.FC<MusicPlayerProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, u, ratio } = useLayout();
  const square = ratio === "1:1";
  const wide = ratio !== "9:16";
  const k = scaleFor(ratio === "16:9", square) * u;
  const enter = progress(f, ENTER.card[0], ENTER.card[1], p.ease);
  const artIn = progress(f, ENTER.art[0], ENTER.art[1], p.ease);
  const playing = progress(f, PLAY_FRAME - 2, PLAY_FRAME + 4, "travel");
  const gain = progress(f, PLAY_FRAME, PLAY_FRAME + 18, "enter");
  const press = 1 - 0.1 * (progress(f, PLAY_FRAME - 6, PLAY_FRAME - 2, "travel") - progress(f, PLAY_FRAME - 2, PLAY_FRAME + 6, "travel"));
  const elapsed = START_SECONDS + Math.max(0, f - PLAY_FRAME) / fps;
  const frac = elapsed / TRACK_SECONDS;
  const dark = isDark(p.background);
  const ring = STROKE.ring * u;

  const artS = (wide ? 400 : 600) * k;
  const colW = wide ? 560 * k : artS;
  const waveH = (wide ? 104 : 96) * k;
  const N = Math.max(16, Math.min(64, Math.round(p.bars)));
  const slot = colW / N;
  const bw = slot * 0.56;
  const I = p.intensity;
  const sinceBeat = (Math.max(0, f - PLAY_FRAME) % BEAT) / BEAT;
  const beat = Math.exp(-sinceBeat * 5);
  const barH = Array.from({ length: N }, (_, i) => {
    const r1 = random(`mp-a${i}`);
    const r2 = random(`mp-b${i}`);
    const r3 = random(`mp-c${i}`);
    const shape = 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * ((i + 0.5) / N)), 0.7) * (0.6 + 0.4 * r1);
    const lev = 0.5 + 0.3 * Math.sin(f * (0.16 + r2 * 0.12) + r3 * 6.28) + 0.2 * Math.sin(f * 0.07 + i * 0.6);
    const kick = beat * (1 - (i / N) * 0.7);
    const live = Math.min(1, shape * (1 - I + I * (0.25 + 0.55 * lev + 0.45 * kick)));
    return Math.max(0.06, mix(0.06, live, gain));
  });

  const ICON = {
    shuffle: "M4 7h3.5c2 0 3 1 4.5 3.5S14.5 17 16.5 17H20 M4 17h3.5c1.2 0 2-.4 2.8-1.3 M13.7 8.3c.8-.9 1.6-1.3 2.8-1.3H20 M17.5 4.5L20 7l-2.5 2.5 M17.5 14.5L20 17l-2.5 2.5",
    repeat: "M5 11V9.5A2.5 2.5 0 0 1 7.5 7H19 M16.5 4.5L19 7l-2.5 2.5 M19 13v1.5a2.5 2.5 0 0 1-2.5 2.5H5 M7.5 19.5L5 17l2.5-2.5",
    heart: "M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z",
  };
  const btn = 74 * k;
  const skip = 40 * k;

  const info = (
    <div style={{ width: colW, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 15 * k, fontWeight: 400, letterSpacing: "0.12em", color: p.ink3 }}>NOW PLAYING</span>
        <Icon d={ICON.heart} size={32 * k} sw={ring} color={p.accent} fill={p.accent} />
      </div>
      <div style={{ fontSize: 52 * k, fontWeight: 500, letterSpacing: "-0.035em", color: p.ink, marginTop: 14 * k, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden" }}>{p.title}</div>
      <div style={{ fontSize: 28 * k, fontWeight: 400, color: p.ink2, marginTop: 6 * k, letterSpacing: "-0.01em" }}>{p.artist}</div>
      <svg width={colW} height={waveH} viewBox={`0 0 ${colW} ${waveH}`} style={{ display: "block", marginTop: 26 * k }}>
        {barH.map((h, i) => {
          const hh = h * waveH;
          return <rect key={i} x={i * slot + (slot - bw) / 2} y={(waveH - hh) / 2} width={bw} height={hh} rx={bw / 2} fill={p.accent} opacity={0.45 + 0.55 * h} />;
        })}
      </svg>
      <div style={{ position: "relative", height: STROKE.bar * k, marginTop: 22 * k, borderRadius: 999, background: p.fill }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: colW * frac, borderRadius: 999, background: p.ink }} />
        <div style={{ position: "absolute", left: colW * frac - 9 * k, top: (STROKE.bar / 2 - 9) * k, width: 18 * k, height: 18 * k, borderRadius: 999, background: p.ink }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 * k, fontFamily: FONT_MONO, fontSize: 18 * k, color: p.ink3, fontVariantNumeric: "tabular-nums" }}>
        <span>{clock(elapsed)}</span>
        <span>-{clock(TRACK_SECONDS - elapsed)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 * k, padding: `0 ${8 * k}px` }}>
        <Icon d={ICON.shuffle} size={32 * k} sw={ring} color={p.ink3} />
        <svg width={skip} height={skip} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M6.5 6v12" stroke={p.ink} strokeWidth={(ring * 24) / skip} strokeLinecap="round" />
          <path d="M18 6.5v11L9.5 12z" fill={p.ink} stroke={p.ink} strokeWidth={(STROKE.hair * u * 24) / skip} strokeLinejoin="round" />
        </svg>
        <div style={{ width: btn, height: btn, borderRadius: 999, background: p.button, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`, position: "relative" }}>
          <svg width={36 * k} height={36 * k} viewBox="0 0 24 24" style={{ position: "absolute", opacity: 1 - playing, transform: `scale(${mix(1, 0.6, playing)})` }}>
            <path d="M8.5 6.5v11l9-5.5z" fill={p.onButton} stroke={p.onButton} strokeWidth={(STROKE.hair * u * 24) / (36 * k)} strokeLinejoin="round" />
          </svg>
          <svg width={36 * k} height={36 * k} viewBox="0 0 24 24" style={{ position: "absolute", opacity: playing, transform: `scale(${mix(0.6, 1, playing)})` }}>
            <rect x={6.5} y={6} width={3.8} height={12} rx={1.2} fill={p.onButton} />
            <rect x={13.7} y={6} width={3.8} height={12} rx={1.2} fill={p.onButton} />
          </svg>
        </div>
        <svg width={skip} height={skip} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M17.5 6v12" stroke={p.ink} strokeWidth={(ring * 24) / skip} strokeLinecap="round" />
          <path d="M6 6.5v11l8.5-5.5z" fill={p.ink} stroke={p.ink} strokeWidth={(STROKE.hair * u * 24) / skip} strokeLinejoin="round" />
        </svg>
        <Icon d={ICON.repeat} size={32 * k} sw={ring} color={p.ink3} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: wide ? "center" : "stretch",
          gap: (wide ? 48 : 34) * k,
          padding: 40 * k,
          borderRadius: RADIUS.hero * k,
          background: p.card,
          border: `${1 * u}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          opacity: enter,
          transform: `translateY(${(1 - enter) * ENTER.rise * u}px)`,
        }}
      >
        <div style={{ transform: `scale(${mix(0.94, 1, artIn)})` }}>
          <Art size={artS} p={p} radius={RADIUS.card * k} />
        </div>
        {info}
      </div>
    </AbsoluteFill>
  );
};
