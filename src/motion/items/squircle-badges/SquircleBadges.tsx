import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, STROKE, mix, progress, useLayout } from "../../kit";

export type SquircleBadgesProps = {
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
  onAccent: string;
  label1: string;
  label2: string;
  label3: string;
  label4: string;
  curvature: number; // resting superellipse exponent
  hoverScale: number; // % growth on hover
  ease: string;
};

// ---------- geometry (px at 1080 on the short side; multiply by u) ----------
// 16:9 lays the badges in one row; 1:1 and 9:16 in a 2 × 2 grid.
export const GEO = {
  "16:9": { grid: false, h: 150, font: 60, pad: 62, gap: 40, mono: 22 },
  "1:1": { grid: true, h: 176, font: 70, pad: 70, gap: 44, mono: 22 },
  "9:16": { grid: true, h: 196, font: 78, pad: 78, gap: 52, mono: 26 },
} as const;
export const CHAR_W = 0.58; // average Inter 500 advance, in em
export const HOVER_N = 2.2; // exponent under the cursor: close to a circular corner
export const CORNER_PTS = 16; // points per corner, 64 per badge
export const LIVE_DOT = 0.2; // dot diameter as a fraction of the badge height
export const PULSE = 50; // frames per pulse of the live dot (3 per loop)

// ---------- timeline (150-frame loop) ----------
// The cursor visits each badge in turn, then returns to rest by frame 128; the last 12 frames are still.
export const LEGS: { a: number; b: number; from: number; to: number }[] = [
  { a: 6, b: 22, from: -1, to: 0 },
  { a: 34, b: 46, from: 0, to: 1 },
  { a: 58, b: 70, from: 1, to: 2 },
  { a: 82, b: 94, from: 2, to: 3 },
  { a: 106, b: 128, from: 3, to: -1 },
];
export const HOVER_IN = 14;
export const HOVER_OUT = 12;

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const badgeWidth = (label: string, isLive: boolean, g: (typeof GEO)[keyof typeof GEO]) =>
  Math.max(g.h * 1.25, 2 * g.pad + label.length * CHAR_W * g.font + (isLive ? g.h * (LIVE_DOT + 0.14) : 0));

// A rectangle with superellipse corners: |x/r|^n + |y/r|^n = 1 in each corner, straight edges between.
// n = 2 is a circular corner; higher n squares it off. The corner radius is half the height, so n ≈ 2 reads as a pill.
export const squirclePath = (w: number, h: number, n: number) => {
  const r = Math.min(h, w) / 2;
  const e = 2 / n;
  const corner = (cx: number, cy: number, sx: number, sy: number, from: number, to: number) => {
    const pts: string[] = [];
    for (let j = 0; j < CORNER_PTS; j++) {
      const th = mix(from, to, j / (CORNER_PTS - 1));
      const c = Math.pow(Math.abs(Math.cos(th)), e);
      const s = Math.pow(Math.abs(Math.sin(th)), e);
      pts.push(`${(cx + sx * r * c).toFixed(2)} ${(cy + sy * r * s).toFixed(2)}`);
    }
    return pts;
  };
  const q = Math.PI / 2;
  const all = [
    ...corner(w - r, r, 1, -1, q, 0), // top right
    ...corner(w - r, h - r, 1, 1, 0, q), // bottom right
    ...corner(r, h - r, -1, 1, q, 0), // bottom left
    ...corner(r, r, -1, -1, 0, q), // top left
  ];
  return `M${all.join("L")}Z`;
};

export const SquircleBadges: React.FC<SquircleBadgesProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const labels = [p.label1, p.label2, p.label3, p.label4];
  const nRest = Math.min(6, Math.max(3, Number(p.curvature) || 4));
  const grow = Math.min(0.12, Math.max(0, (Number(p.hoverScale) || 0) / 100));

  // ---- widths, shrunk to fit if labels get long
  const raw = labels.map((l, i) => badgeWidth(l, i === 3, g));
  const span = g.grid ? 2 * Math.max(...raw) + g.gap : raw.reduce((a, b) => a + b, 0) + g.gap * 3;
  const sc = Math.min(1, (width * 0.86) / u / span);
  const k = sc * u;
  const h = g.h * k;
  const ws = raw.map((r) => r * k);
  const gap = g.gap * k;
  const mono = g.mono * u;

  // ---- badge centres
  const groupH = g.grid ? 2 * h + gap : h;
  const readGap = 64 * u;
  const groupTop = (height - (groupH + readGap + mono)) / 2;
  const cx = width / 2;
  const centres: Pt[] = labels.map((_, i) => {
    if (g.grid) {
      const cell = Math.max(...ws);
      return [cx + ((i % 2) - 0.5) * (cell + gap), groupTop + h / 2 + Math.floor(i / 2) * (h + gap)];
    }
    const before = ws.slice(0, i).reduce((a, b) => a + b, 0) + gap * i;
    return [cx - (span * k) / 2 + before + ws[i] / 2, groupTop + h / 2];
  });

  // ---- hover weights from the cursor's visits
  const hover = labels.map((_, i) => {
    const arrive = LEGS.find((l) => l.to === i)!;
    const leave = LEGS.find((l) => l.from === i)!;
    return clamp01(progress(frame, arrive.b - 4, arrive.b - 4 + HOVER_IN, p.ease) - progress(frame, leave.a, leave.a + HOVER_OUT, "travel"));
  });
  const hot = Math.max(...hover);
  const shownN = mix(nRest, HOVER_N, hot);

  // ---- cursor
  const last = centres[3];
  const rest: Pt = g.grid ? [last[0] + ws[3] * 0.3, last[1] + h * 0.5 + 80 * u] : [cx + (span * k) * 0.2, groupTop + h + 120 * u];
  const at = (i: number): Pt => (i < 0 ? rest : [centres[i][0] + ws[i] * 0.16, centres[i][1] + h * 0.12]);
  let cur: Pt = rest;
  for (const l of LEGS) if (frame >= l.a) cur = glide(at(l.from), at(l.to), progress(frame, l.a, l.b, "travel"));

  const styles = [
    { bg: p.card, fg: p.ink, stroke: p.line },
    { bg: p.fill, fg: p.ink2, stroke: "" },
    { bg: p.button, fg: p.onButton, stroke: "" },
    { bg: p.accent, fg: p.onAccent, stroke: "" },
  ];
  const pulse = (frame % PULSE) / PULSE;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {labels.map((label, i) => {
        const w = ws[i];
        const n = mix(nRest, HOVER_N, hover[i]);
        const st = styles[i];
        const live = i === 3;
        const dot = h * LIVE_DOT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: centres[i][0] - w / 2,
              top: centres[i][1] - h / 2,
              width: w,
              height: h,
              transform: `translateY(${-8 * u * hover[i]}px) scale(${1 + grow * hover[i]})`,
            }}
          >
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={squirclePath(w, h, n)} fill={st.bg} stroke={st.stroke || "none"} strokeWidth={STROKE.hair * u} />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: h * 0.14,
                fontSize: g.font * k,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                color: st.fg,
                whiteSpace: "nowrap",
              }}
            >
              {live ? (
                <svg width={dot} height={dot} viewBox="-10 -10 20 20" style={{ overflow: "visible", flexShrink: 0 }}>
                  <circle r={mix(5, 11, pulse)} fill="none" stroke={p.onAccent} strokeWidth={1.4} opacity={0.6 * (1 - pulse)} />
                  <circle r={5} fill={p.onAccent} />
                </svg>
              ) : null}
              <span>{label}</span>
            </div>
          </div>
        );
      })}

      {/* live readout of the exponent under the cursor */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: groupTop + groupH + readGap,
          textAlign: "center",
          fontFamily: FONT_MONO,
          fontSize: mono,
          lineHeight: 1,
          letterSpacing: "0.12em",
          color: p.ink3,
        }}
      >
        {`SUPERELLIPSE · N ${shownN.toFixed(2)}`}
      </div>

      {/* cursor */}
      <svg width={30 * u} height={41 * u} viewBox="0 0 16 22" style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible" }}>
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
