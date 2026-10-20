import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type MusicPlayerProps = {
  background: string;
  card: string;
  ink: string;
  accent: string;
  art1: string;
  art2: string;
  art3: string;
  title: string;
  artist: string;
  bars: number;
  intensity: number; // 0.2–1, how hard the bars react
  ease: string;
};

export const TRACK_SECONDS = 222;
export const START_SECONDS = 84;
export const PLAY_FRAME = 20;
const BEAT = 15; // frames per beat: 120 bpm at 30fps

const hexMix = (a: string, b: string, t: number) => {
  const rgb = (h: string) => {
    const s = h.replace("#", "");
    const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const x = rgb(a);
  const y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const Art: React.FC<{ size: number; p: MusicPlayerProps; f: number; radius: number }> = ({ size: A, p, f, radius }) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const drift = Math.sin(f / 40) * A * 0.012;
  const hill = (y0: number, amp: number, phase: number) => {
    let d = `M0 ${A}`;
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * A;
      d += ` L${x.toFixed(1)} ${(y0 + Math.sin((i / 24) * Math.PI * 1.6 + phase) * amp).toFixed(1)}`;
    }
    return `${d} L${A} ${A} Z`;
  };
  const deep = hexMix(p.art2, "#000000", 0.35);
  return (
    <svg width={A} height={A} viewBox={`0 0 ${A} ${A}`} style={{ display: "block", borderRadius: radius, flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={p.art1} />
          <stop offset="1" stopColor={p.art2} />
        </linearGradient>
        <radialGradient id={`sun${id}`} cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor={hexMix(p.art3, "#FFFFFF", 0.35)} />
          <stop offset="1" stopColor={p.art3} />
        </radialGradient>
        <radialGradient id={`glow${id}`}>
          <stop offset="0" stopColor={p.art3} stopOpacity={0.7} />
          <stop offset="1" stopColor={p.art3} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`sheen${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`clip${id}`}>
          <rect width={A} height={A} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip${id})`}>
        <rect width={A} height={A} fill={`url(#sky${id})`} />
        <circle cx={A * 0.64} cy={A * 0.4 + drift} r={A * 0.5} fill={`url(#glow${id})`} />
        <circle cx={A * 0.64} cy={A * 0.4 + drift} r={A * 0.2} fill={`url(#sun${id})`} />
        <path d={hill(A * 0.66, A * 0.05, f / 60)} fill={deep} opacity={0.45} />
        <path d={hill(A * 0.76, A * 0.06, 2 - f / 80)} fill={deep} opacity={0.75} />
        <path d={hill(A * 0.88, A * 0.035, 4 + f / 100)} fill={hexMix(deep, "#000000", 0.4)} />
        <rect width={A} height={A} fill={`url(#sheen${id})`} />
      </g>
    </svg>
  );
};

const Icon: React.FC<{ d: string; size: number; color: string; fill?: string }> = ({ d, size, color, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d={d} fill={fill ?? "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MusicPlayer: React.FC<MusicPlayerProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, u, ratio } = useLayout();
  const wide = ratio === "16:9";
  const k = wide ? u : ratio === "9:16" ? u : 0.72 * u;
  const enter = progress(f, 0, 24, p.ease);
  const artIn = progress(f, 4, 30, p.ease);
  const playing = progress(f, PLAY_FRAME - 2, PLAY_FRAME + 4, "travel");
  const gain = progress(f, PLAY_FRAME, PLAY_FRAME + 18, "enter");
  const press = 1 - 0.1 * (progress(f, PLAY_FRAME - 6, PLAY_FRAME - 2, "travel") - progress(f, PLAY_FRAME - 2, PLAY_FRAME + 6, "travel"));
  const elapsed = START_SECONDS + Math.max(0, f - PLAY_FRAME) / fps;
  const frac = elapsed / TRACK_SECONDS;
  const muted = alpha(p.ink, 0.55);

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

  const info = (
    <div style={{ width: colW, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 17 * k, fontWeight: 600, letterSpacing: "0.1em", color: p.accent }}>NOW PLAYING</span>
        <Icon d={ICON.heart} size={34 * k} color={p.accent} fill={alpha(p.accent, 0.9)} />
      </div>
      <div style={{ fontSize: (wide ? 52 : 50) * k, fontWeight: 650, letterSpacing: "-0.035em", color: p.ink, marginTop: 14 * k, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden" }}>{p.title}</div>
      <div style={{ fontSize: 28 * k, color: muted, marginTop: 6 * k, letterSpacing: "-0.01em" }}>{p.artist}</div>
      <svg width={colW} height={waveH} viewBox={`0 0 ${colW} ${waveH}`} style={{ display: "block", marginTop: 26 * k }}>
        {barH.map((h, i) => {
          const hh = h * waveH;
          return <rect key={i} x={i * slot + (slot - bw) / 2} y={(waveH - hh) / 2} width={bw} height={hh} rx={bw / 2} fill={p.accent} opacity={0.45 + 0.55 * h} />;
        })}
      </svg>
      <div style={{ position: "relative", height: 8 * k, marginTop: 22 * k, borderRadius: 4 * k, background: alpha(p.ink, 0.14) }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: colW * frac, borderRadius: 4 * k, background: p.ink }} />
        <div style={{ position: "absolute", left: colW * frac - 9 * k, top: -5 * k, width: 18 * k, height: 18 * k, borderRadius: "50%", background: p.ink, boxShadow: `0 ${2 * k}px ${8 * k}px rgba(0,0,0,0.3)` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 * k, fontFamily: FONT_MONO, fontSize: 18 * k, color: muted }}>
        <span>{clock(elapsed)}</span>
        <span>-{clock(TRACK_SECONDS - elapsed)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 * k, padding: `0 ${8 * k}px` }}>
        <Icon d={ICON.shuffle} size={32 * k} color={muted} />
        <svg width={40 * k} height={40 * k} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M6.5 6v12" stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
          <path d="M18 6.5v11L9.5 12z" fill={p.ink} stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
        <div style={{ width: btn, height: btn, borderRadius: "50%", background: p.ink, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`, position: "relative" }}>
          <svg width={36 * k} height={36 * k} viewBox="0 0 24 24" style={{ position: "absolute", opacity: 1 - playing, transform: `scale(${mix(1, 0.6, playing)})` }}>
            <path d="M8.5 6.5v11l9-5.5z" fill={p.card} stroke={p.card} strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
          <svg width={36 * k} height={36 * k} viewBox="0 0 24 24" style={{ position: "absolute", opacity: playing, transform: `scale(${mix(0.6, 1, playing)})` }}>
            <rect x={6.5} y={6} width={3.8} height={12} rx={1.2} fill={p.card} />
            <rect x={13.7} y={6} width={3.8} height={12} rx={1.2} fill={p.card} />
          </svg>
        </div>
        <svg width={40 * k} height={40 * k} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M17.5 6v12" stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
          <path d="M6 6.5v11l8.5-5.5z" fill={p.ink} stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
        <Icon d={ICON.repeat} size={32 * k} color={muted} />
      </div>
    </div>
  );

  const pad = 40 * k;
  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: wide ? "center" : "stretch",
          gap: (wide ? 48 : 34) * k,
          padding: pad,
          borderRadius: 44 * k,
          background: p.card,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
          boxShadow: `0 ${50 * k}px ${120 * k}px ${alpha(p.art2, 0.28)}, 0 ${20 * k}px ${50 * k}px rgba(0,0,0,0.25)`,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 50 * u}px)`,
        }}
      >
        <div style={{ transform: `scale(${mix(0.94, 1, artIn)})`, borderRadius: 26 * k, boxShadow: `0 ${24 * k}px ${50 * k}px ${alpha(p.art2, 0.4)}` }}>
          <Art size={artS} p={p} f={f} radius={26 * k} />
        </div>
        {info}
      </div>
    </AbsoluteFill>
  );
};
