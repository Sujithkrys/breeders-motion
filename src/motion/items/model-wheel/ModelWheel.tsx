import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type ModelWheelProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  label: string;
  items: string; // comma-separated
  momentum: number; // overshoot past the row before the snap, in rows
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
export const G = {
  pitch: 112, // row spacing at the centre of the drum
  step: 18, // degrees per row on the drum
  bandW: 1180,
  bandH: 100,
  name: 60,
  icon: 40,
  inset: 40, // content inset inside the band
  check: 32,
  labelSize: 18,
} as const;
export const RADIUS_DRUM = G.pitch / ((G.step * Math.PI) / 180); // ≈ 357
const VISIBLE = 4.2; // rows either side

// ---------- data ----------
export const parseItems = (s: string) => {
  const list = String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
  while (list.length < 3) list.push(["Fast", "Balanced", "Thorough"][list.length]);
  return list;
};

// ---------- timeline (frames at 180) ----------
export const T = {
  flick1A: 16, flick1B: 64, snap1B: 78,
  flick2A: 100, flick2B: 148, snap2B: 162,
  chkOut1A: 16, chkIn1A: 70,
  chkOut2A: 100, chkIn2A: 150,
} as const;
export const flicks = (n: number) => {
  const f1 = Math.max(2, Math.round(n * 0.6));
  return { f1, f2: n - f1 };
};

// Wheel position in rows. Two momentum flicks that together travel exactly one full turn of the list, so the loop
// ends on the row it started on. Each flick decelerates slightly past its row, then snaps back.
export const wheelPos = (frame: number, n: number, momentum: number, ease: string) => {
  const { f1 } = flicks(n);
  const o = Math.min(0.4, Math.max(0, Number(momentum) || 0));
  if (frame < T.flick1B) return progress(frame, T.flick1A, T.flick1B, ease) * (f1 + o);
  if (frame < T.flick2A) return f1 + o * (1 - progress(frame, T.flick1B, T.snap1B, "travel"));
  if (frame < T.flick2B) return f1 + progress(frame, T.flick2A, T.flick2B, ease) * (n - f1 + o);
  return n + o * (1 - progress(frame, T.flick2B, T.snap2B, "travel"));
};

// ---------- colour ----------
const rgb = (hex: string): [number, number, number] => {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixColor = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(", ")})`;
};

// ---------- glyphs (24-unit, stroked, no brand marks) ----------
export const GLYPHS = [
  "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z", // bolt
  "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4", // sliders
  "M12 3 3 8l9 5 9-5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5", // layers
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5 5-2z", // compass
  "M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z", // spark
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18", // half circle
  "M12 3 4 7.5v9L12 21l8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9", // cube
  "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z", // grid
];

type Row = { key: number; name: string; glyph: string; y: number; sx: number; sy: number; tone: number; op: number };

export const ModelWheel: React.FC<ModelWheelProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, u } = useLayout();
  const k = Math.min(1, (width * 0.88) / (G.bandW * u));
  const s = u * k;
  const items = parseItems(p.items);
  const n = items.length;
  const pos = wheelPos(frame, n, p.momentum, p.ease);

  const R = RADIUS_DRUM * s;
  const focal = 3 * R;
  const rows: Row[] = [];
  for (let j = Math.floor(pos) - 5; j <= Math.floor(pos) + 5; j++) {
    const d = j - pos;
    if (Math.abs(d) > VISIBLE) continue;
    const th = (d * G.step * Math.PI) / 180;
    const depth = R * (1 - Math.cos(th));
    const sc = focal / (focal + depth);
    const idx = ((j % n) + n) % n;
    rows.push({
      key: j,
      name: items[idx],
      glyph: GLYPHS[idx % GLYPHS.length],
      y: R * Math.sin(th) * sc,
      sx: sc,
      sy: sc * Math.cos(th),
      tone: Math.min(1, Math.max(0, (Math.abs(d) - 0.6) / 1.4)), // 0 = ink2, 1 = ink3
      op: Math.pow(Math.max(0, Math.cos(th)), 1.6) * Math.min(1, (VISIBLE - Math.abs(d)) / 0.8),
    });
  }

  const chk =
    1 -
    progress(frame, T.chkOut1A, T.chkOut1A + 12, "exit") +
    progress(frame, T.chkIn1A, T.chkIn1A + 18, "enter") -
    progress(frame, T.chkOut2A, T.chkOut2A + 12, "exit") +
    progress(frame, T.chkIn2A, T.chkIn2A + 18, "enter");

  const bandW = G.bandW * s;
  const bandH = G.bandH * s;
  const rowH = G.pitch * s;
  const iconSw = (STROKE.ring * 24) / G.icon;

  const rowContent = (r: Row, selected: boolean) => (
    <div
      key={r.key}
      style={{
        position: "absolute",
        left: 0,
        top: -rowH / 2,
        width: bandW,
        height: rowH,
        display: "flex",
        alignItems: "center",
        gap: 24 * s,
        paddingLeft: G.inset * s,
        boxSizing: "border-box",
        transform: `translateY(${r.y}px) scale(${r.sx}, ${r.sy})`,
        opacity: selected ? 1 : r.op,
        color: selected ? p.ink : mixColor(p.ink2, p.ink3, r.tone),
        whiteSpace: "nowrap",
      }}
    >
      <svg width={G.icon * s} height={G.icon * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={iconSw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d={r.glyph} />
      </svg>
      <span style={{ fontSize: G.name * s, fontWeight: selected ? 600 : 500, letterSpacing: "-0.035em", lineHeight: 1 }}>{r.name}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: bandW, height: 0 }}>
        {/* tiny mono label above the drum */}
        <div
          style={{
            position: "absolute",
            left: G.inset * s,
            top: -R - 64 * s,
            fontFamily: FONT_MONO,
            fontSize: G.labelSize * s,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: p.ink3,
            whiteSpace: "nowrap",
          }}
        >
          {p.label}
        </div>

        {/* rows outside the band */}
        {rows.map((r) => rowContent(r, false))}

        {/* selection band: rows inside it are redrawn in ink 600 */}
        <div style={{ position: "absolute", left: 0, top: -bandH / 2, width: bandW, height: bandH, borderRadius: RADIUS.card * s, background: p.fill, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: bandH / 2, width: bandW, height: 0 }}>{rows.map((r) => rowContent(r, true))}</div>
        </div>

        {/* accent check, hidden while the wheel moves */}
        <svg
          width={G.check * s}
          height={G.check * s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={p.accent}
          strokeWidth={(STROKE.ring * 24) / G.check}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", right: G.inset * s, top: (-G.check / 2) * s, opacity: Math.max(0, Math.min(1, chk)), transform: `scale(${mix(0.85, 1, Math.max(0, Math.min(1, chk)))})` }}
        >
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
