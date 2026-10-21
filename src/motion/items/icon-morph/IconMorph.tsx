import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";

export type IconMorphProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink3: string;
  accent: string;
  label1: string;
  label2: string;
  label3: string;
  label4: string;
  speed: number; // frames per morph
  stroke: number; // stroke width in the icon's 24-unit grid
  ease: string;
};

// ---------- geometry (px at 1080 on the short side; multiply by u) ----------
export const GEO = {
  "16:9": { disc: 560, icon: 300, gapBelow: 64, mono: 22, labelGap: 56 },
  "1:1": { disc: 540, icon: 290, gapBelow: 60, mono: 22, labelGap: 48 },
  "9:16": { disc: 660, icon: 350, gapBelow: 76, mono: 26, labelGap: 56 },
} as const;

// ---------- timeline (180-frame loop) ----------
// Four 42-frame segments: each state holds, then morphs into the next over `speed` frames, ending on the segment
// boundary. The last morph (check → play) ends at frame 168, so play holds for the final 12 frames and on into frame 0.
export const SEG = 42;
export const N = 24; // points per sub-path; every icon is two closed sub-paths of N points

type Pt = [number, number];

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;

// Spreads N points around a closed polygon: every vertex is kept (so corners stay sharp) and the remaining points
// go to the edges in proportion to their length. Open strokes (the check) are written out-and-back.
const resample = (verts: Pt[]): Pt[] => {
  const V = verts.length;
  const lens = verts.map((a, i) => Math.hypot(verts[(i + 1) % V][0] - a[0], verts[(i + 1) % V][1] - a[1]));
  const total = lens.reduce((s, l) => s + l, 0);
  const spare = N - V;
  const raw = lens.map((l) => (l / total) * spare);
  const extra = raw.map(Math.floor);
  let left = spare - extra.reduce((s, e) => s + e, 0);
  raw
    .map((r, i) => ({ i, f: r - Math.floor(r) }))
    .sort((a, b) => b.f - a.f || a.i - b.i)
    .forEach(({ i }) => {
      if (left > 0) {
        extra[i] += 1;
        left -= 1;
      }
    });
  const out: Pt[] = [];
  verts.forEach((a, i) => {
    const b = verts[(i + 1) % V];
    const n = extra[i] + 1;
    for (let j = 0; j < n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  });
  return out;
};

// Each shape starts at its top-left vertex and runs clockwise, so points travel short distances when lerped.
const TRIANGLE: Pt[] = [[7.5, 4.5], [19.5, 12], [7.5, 19.5]];
const BAR_L: Pt[] = [[6, 4.5], [10, 4.5], [10, 19.5], [6, 19.5]];
const BAR_R: Pt[] = [[14, 4.5], [18, 4.5], [18, 19.5], [14, 19.5]];
const SQUARE: Pt[] = [[5, 5], [19, 5], [19, 19], [5, 19]];
const CHECK: Pt[] = [[4.5, 12.5], [9.5, 17.5], [19.5, 6.5], [9.5, 17.5]];

// play → pause → stop → check (→ play)
export const ICONS: [Pt[], Pt[]][] = [
  [resample(TRIANGLE), resample(TRIANGLE)],
  [resample(BAR_L), resample(BAR_R)],
  [resample(SQUARE), resample(SQUARE)],
  [resample(CHECK), resample(CHECK)],
];

const toPath = (pts: Pt[]) => `M${pts.map((q) => `${q[0].toFixed(3)} ${q[1].toFixed(3)}`).join("L")}Z`;
const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((q, i) => [mix(q[0], b[i][0], t), mix(q[1], b[i][1], t)]);

export const morphFrames = (speed: number) => Math.min(30, Math.max(10, Math.round(Number(speed) || 18)));

// Which state we are in, and how far into the morph to the next one.
export const stateAt = (frame: number, speed: number, ease: string) => {
  const M = morphFrames(speed);
  const k = Math.min(3, Math.floor(frame / SEG));
  const t = progress(frame, (k + 1) * SEG - M, (k + 1) * SEG, ease);
  return { k, next: (k + 1) % 4, t };
};

export const IconMorph: React.FC<IconMorphProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const labels = [p.label1, p.label2, p.label3, p.label4];
  const sw = Math.min(3.5, Math.max(1.5, Number(p.stroke) || 2.5));
  const dark = isDark(p.background);

  const { k, next, t } = stateAt(frame, p.speed, p.ease);
  const pathA = toPath(lerpPts(ICONS[k][0], ICONS[next][0], t));
  const pathB = toPath(lerpPts(ICONS[k][1], ICONS[next][1], t));
  const dip = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));

  // layout
  const disc = Math.min(g.disc * u, width * 0.8);
  const icon = (g.icon / g.disc) * disc;
  const mono = g.mono * u;
  const total = disc + g.gapBelow * u + mono + 28 * u; // disc, label row, dot
  const discTop = (height - total) / 2;
  const cx = width / 2;
  const rowTop = discTop + disc + g.gapBelow * u;
  const slot = Math.max(...labels.map((l) => l.length), 4) * 0.62 * mono + g.labelGap * u; // mono advance ≈ 0.6em + tracking
  const slotX = (i: number) => cx + (i - 1.5) * slot;
  const active = mix(k, next, t); // the dot runs back from the last label to the first on check → play
  const dotX = slotX(active);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          left: cx - disc / 2,
          top: discTop,
          width: disc,
          height: disc,
          borderRadius: 999,
          background: p.card,
          boxShadow: `inset 0 0 0 ${Math.max(1, u)}px ${p.line}${dark ? "" : `, ${shadow}`}`,
          transform: `scale(${1 - 0.02 * dip})`,
        }}
      />
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.ink}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "absolute", left: cx - icon / 2, top: discTop + (disc - icon) / 2, overflow: "visible", transform: `scale(${1 - 0.06 * dip})` }}
      >
        <path d={pathA} />
        <path d={pathB} />
      </svg>

      {/* state labels: the active one in ink, the rest in ink3, an accent dot marking the current state */}
      {labels.map((l, i) => {
        const near = Math.max(0, 1 - Math.abs(active - i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: slotX(i) - slot / 2,
              top: rowTop,
              width: slot,
              textAlign: "center",
              fontFamily: FONT_MONO,
              fontSize: mono,
              lineHeight: 1,
              letterSpacing: "0.12em",
              color: interpolateColors(near, [0, 1], [p.ink3, p.ink]),
              whiteSpace: "nowrap",
            }}
          >
            {l.toUpperCase()}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: dotX - 5 * u, top: rowTop + mono + 18 * u, width: 10 * u, height: 10 * u, borderRadius: 999, background: p.accent }} />
    </AbsoluteFill>
  );
};
