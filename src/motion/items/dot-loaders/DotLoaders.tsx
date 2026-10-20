import React from "react";
import { AbsoluteFill, interpolateColors, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, easing, useLayout } from "../../kit";

export type DotLoadersProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  title1: string;
  title2: string;
  accentTile: number; // 1–8
  ease: string;
};

// ---------- layout (px at 1080 on the short side) ----------
export const GRID = {
  "16:9": { cols: 4, tile: 272, gap: 28, title: 72, titleGap: 72 },
  "1:1": { cols: 4, tile: 204, gap: 20, title: 56, titleGap: 56 },
  "9:16": { cols: 2, tile: 330, gap: 26, title: 60, titleGap: 64 },
} as const;
export const LOADERS = ["Typing", "Snake", "Wave", "Equaliser", "Ring", "Merge", "Twinkle", "Pulse"] as const;
// Every loader's period divides 150, so the whole grid loops seamlessly.
export const PERIODS = [30, 25, 30, 30, 30, 50, 30, 30] as const;
const DIM = 0.12; // resting dots

const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const r2 = (n: number) => Math.round(n * 100) / 100;
const dotD = (x: number, y: number, r: number) =>
  r < 0.05 ? "" : `M${r2(x - r)} ${r2(y)}a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0`;
const isDark = (c: string) => {
  const m = interpolateColors(0, [0, 1], [c, c]).match(/[\d.]+/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};

// 3×3 matrix in a 100-unit box.
const G3 = [30, 50, 70];
const cell = (i: number): [number, number] => [G3[i % 3], G3[Math.floor(i / 3)]];
// Perimeter order of the 3×3 grid, clockwise from top-left.
const RING8 = [0, 1, 2, 5, 8, 7, 6, 3];

type Dot = { x: number; y: number; r: number; o: number };

// One loader's dots at time t (frames). `e` is the chosen easing curve.
const loaderDots = (kind: number, t: number, e: (x: number) => number): Dot[] => {
  switch (kind) {
    case 0: // Typing: three dots hop in turn
      return [0, 1, 2].map((i) => {
        const ph = mod(t - i * 5, 30) / 30;
        const hump = ph < 0.5 ? Math.sin(Math.PI * e(ph / 0.5)) : 0;
        return { x: 30 + i * 20, y: 50 - 10 * hump, r: 6.5, o: 0.35 + 0.65 * hump };
      });
    case 1: {
      // Snake: a lit head steps round the perimeter with a fading tail
      const head = Math.floor((t * 8) / 25) % 8;
      return Array.from({ length: 9 }, (_, i) => {
        const k = RING8.indexOf(i);
        const back = k < 0 ? 9 : mod(head - k, 8);
        const o = back === 0 ? 1 : back === 1 ? 0.55 : back === 2 ? 0.25 : DIM;
        const [x, y] = cell(i);
        return { x, y, r: 6.5, o };
      });
    }
    case 2: // Wave: a diagonal swell runs across the matrix
      return Array.from({ length: 9 }, (_, i) => {
        const [x, y] = cell(i);
        const s = 0.5 + 0.5 * Math.sin(TAU * (t / 30) - ((i % 3) + Math.floor(i / 3)) * 0.9);
        return { x, y, r: 4 + 3.5 * e(s), o: 0.2 + 0.8 * s };
      });
    case 3: {
      // Equaliser: five columns of four dots, each column rising and falling
      const out: Dot[] = [];
      for (let c = 0; c < 5; c++) {
        const lv = 1 + Math.round(3 * e(0.5 + 0.5 * Math.sin(TAU * (t / 30) + c * 1.15)));
        for (let r = 0; r < 4; r++) out.push({ x: 24 + c * 13, y: 69.5 - r * 13, r: 4.6, o: r < lv ? 1 : DIM });
      }
      return out;
    }
    case 4: {
      // Ring: twelve dots, a comet of light running round
      const head = (t * 12) / 30;
      return Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * TAU - Math.PI / 2;
        const back = mod(head - i, 12);
        const I = Math.max(0, 1 - back / 6);
        return { x: 50 + Math.cos(a) * 30, y: 50 + Math.sin(a) * 30, r: 4.2 + 1.6 * I, o: DIM + (1 - DIM) * I * I };
      });
    }
    case 5: {
      // Merge: two dots orbit, meet in the middle and part again
      const ph = mod(t, 50) / 50;
      const sep = 20 * e(0.5 + 0.5 * Math.cos(TAU * ph));
      const a = (t / 25) * Math.PI;
      const r = 6 + 3.5 * (1 - sep / 20);
      return [1, -1].map((sg) => ({ x: 50 + sg * Math.cos(a) * sep, y: 50 + sg * Math.sin(a) * sep, r, o: 1 }));
    }
    case 6: // Twinkle: each dot glints on its own phase
      return Array.from({ length: 9 }, (_, i) => {
        const [x, y] = cell(i);
        const s = Math.max(0, Math.sin(TAU * (t / 30 + random(`twinkle-${i}`))));
        return { x, y, r: 6, o: DIM + (1 - DIM) * s * s };
      });
    default: {
      // Pulse: a ring of light expands from the centre dot to the corners
      return Array.from({ length: 9 }, (_, i) => {
        const [x, y] = cell(i);
        const d = Math.hypot(x - 50, y - 50) / 20;
        const s = Math.max(0, Math.sin(TAU * (t / 30 - d * 0.2)));
        return { x, y, r: 3.5 + 3.5 * s, o: 0.18 + 0.82 * s };
      });
    }
  }
};

// Batch a loader's dots into a few paths by opacity, so the grid stays light.
const BUCKETS = [DIM, 0.25, 0.45, 0.65, 0.85, 1];
const toPaths = (dots: Dot[]) => {
  const paths = BUCKETS.map(() => "");
  for (const d of dots) {
    let b = 0;
    for (let i = 0; i < BUCKETS.length; i++) if (Math.abs(BUCKETS[i] - d.o) < Math.abs(BUCKETS[b] - d.o)) b = i;
    paths[b] += dotD(d.x, d.y, d.r);
  }
  return paths;
};

export const DotLoaders: React.FC<DotLoadersProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GRID[ratio];
  const e = easing(p.ease);
  const dark = isDark(p.background);
  const accentIdx = Math.min(8, Math.max(1, Math.round(Number(p.accentTile) || 5))) - 1;

  const rows = Math.ceil(LOADERS.length / g.cols);
  const T = g.tile * u;
  const gap = g.gap * u;
  const gridW = g.cols * T + (g.cols - 1) * gap;
  const gridH = rows * T + (rows - 1) * gap;
  const titleH = g.title * u * 1.15;
  const totalH = gridH + g.titleGap * u + titleH;
  const left = (width - gridW) / 2;
  const top = (height - totalH) / 2;
  const hair = Math.max(1, u);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,.06)`;
  const glyph = T * 0.46;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {LOADERS.map((name, i) => {
        const col = i % g.cols;
        const row = Math.floor(i / g.cols);
        const paths = toPaths(loaderDots(i, frame, e));
        const colour = i === accentIdx ? p.accent : p.ink;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: left + col * (T + gap),
              top: top + row * (T + gap),
              width: T,
              height: T,
              borderRadius: RADIUS.card * u,
              background: p.card,
              border: `${hair}px solid ${p.line}`,
              boxShadow: shadow,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 24 * u,
                top: 22 * u,
                fontFamily: FONT_MONO,
                fontSize: 15 * u,
                letterSpacing: "0.1em",
                color: p.ink3,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <svg width={glyph} height={glyph} viewBox="0 0 100 100" style={{ position: "absolute", left: (T - glyph) / 2 - hair, top: (T - glyph) / 2 - hair }}>
              {paths.map((d, b) => (d ? <path key={b} d={d} fill={colour} opacity={BUCKETS[b]} /> : null))}
            </svg>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: top + gridH + g.titleGap * u,
          height: titleH,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: g.title * u,
          fontWeight: 400,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: p.ink }}>{p.title1}</span>
        <span style={{ color: p.ink2, marginLeft: g.title * u * 0.26 }}>{p.title2}</span>
      </div>
    </AbsoluteFill>
  );
};
