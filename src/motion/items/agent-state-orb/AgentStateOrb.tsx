import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type AgentStateOrbProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  error: string;
  state1: string;
  state2: string;
  state3: string;
  state4: string;
  state5: string;
  state6: string;
  ease: string;
};

// ---------- timeline (frames of a 180-frame loop) ----------
// The cursor clicks Thinking, Building, Generating, Waiting, Error, then back to Standby.
export const ORDER = [1, 2, 3, 4, 5, 0] as const;
export const CLICKS = [16, 41, 66, 91, 116, 141] as const;
export const MORPH = 12; // frames the orb and the chip take to change state
export const REST_FROM = 145; // cursor heads back to its rest point
export const REST_AT = 167; // ...and is still from here (the last 12 frames hold)

// ---------- geometry (px at 1080 on the short side) ----------
export const GEO = {
  "16:9": { orb: 470, font: 32, pad: 30, caption: 30 },
  "1:1": { orb: 470, font: 26, pad: 20, caption: 28 },
  "9:16": { orb: 620, font: 26, pad: 20, caption: 30 },
} as const;
export const CONTROL_H = 96; // container: radius 48 (hero) = a pill
export const CHIP_INSET = 16; // chip 64 tall, radius 32 (card) = a pill
export const CHAR_W = 0.56; // average Inter 500 advance, in em

// ---------- the dot sphere ----------
const N_DOTS = 700;
const SPHERE: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N_DOTS; i++) {
    const y = 1 - (2 * (i + 0.5)) / N_DOTS;
    const r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
  }
  return pts;
})();

const r2 = (n: number) => Math.round(n * 100) / 100;
const dotPath = (x: number, y: number, r: number) =>
  r < 0.15 ? "" : `M${r2(x - r)} ${r2(y)}a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0`;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const isDark = (c: string) => {
  const m = interpolateColors(0, [0, 1], [c, c]).match(/[\d.]+/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};

type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// Per-state look of one dot: intensity 0–1 and how much of it is accent. (x, y, z) are view-space.
const stateLook = (s: number, x: number, y: number, z: number, t: number): [number, number] => {
  switch (s) {
    case 1: {
      // Thinking: a bright band sweeps round the sphere on a tilted great circle.
      const a = t * 0.11;
      const d = Math.abs(x * Math.cos(a) * 0.8 + y * Math.sin(a) * 0.8 + z * 0.6);
      const band = Math.exp(-((d / 0.17) ** 2));
      return [0.22 + 0.78 * band, band > 0.5 ? 1 : 0];
    }
    case 2: {
      // Building: rows of dots fill up from the bottom, level by level.
      const level = ((t % 36) / 36) * 2.6 - 1.3;
      const edge = Math.exp(-(((y - level) / 0.09) ** 2));
      return [Math.max(y < level ? 0.78 : 0.18, edge), 0];
    }
    case 3: {
      // Generating: lines of text-like stripes flow down through the orb.
      const w = 0.5 + 0.5 * Math.sin(y * 13 + t * 0.32 + x * 2.2);
      return [0.18 + 0.82 * w * w, w > 0.86 ? 1 : 0];
    }
    case 4:
      // Waiting: calm and even, breathing slowly; the accent ring outside says "your turn".
      return [0.42 + 0.1 * Math.sin((t / 45) * Math.PI * 2), 0];
    case 5:
      // Error: flat and even; colour comes from the error tint.
      return [0.62, 0];
    default:
      // Standby: quiet, with a slow wave drifting through (periodic over the loop).
      return [0.3 + 0.08 * Math.sin((t / 90) * Math.PI * 2 + y * 2.4), 0];
  }
};

export const captionsFor = (labels: string[]) => [
  "Ready",
  `${labels[1]}…`,
  `${labels[2]}…`,
  `${labels[3]}…`,
  "Your turn",
  "Something went wrong",
];

export const AgentStateOrb: React.FC<AgentStateOrbProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const labels = [p.state1, p.state2, p.state3, p.state4, p.state5, p.state6];
  const captions = captionsFor(labels);
  const dark = isDark(p.background);

  // ---- segmented control layout: content-width slots, shrunk to fit if labels get long
  const rawW = labels.map((l) => l.length * CHAR_W * g.font + 2 * g.pad);
  const rawTotal = rawW.reduce((a, b) => a + b, 0);
  const sc = Math.min(1, (width * 0.9 / u - 2 * CHIP_INSET) / rawTotal);
  const fs = g.font * sc * u;
  const slotW = rawW.map((w) => w * sc * u);
  const slotX: number[] = [];
  slotW.reduce((acc, sw, i) => ((slotX[i] = acc), acc + sw), CHIP_INSET * u);
  const ctrlW = slotW.reduce((a, b) => a + b, 0) + 2 * CHIP_INSET * u;
  const ctrlH = CONTROL_H * u;

  // ---- vertical stack: orb, caption, control
  const D = g.orb * u;
  const R = D / 2;
  const capH = g.caption * u * 1.4;
  const stackH = D + 40 * u + capH + 60 * u + ctrlH;
  const top = (height - stackH) / 2 - 20 * u;
  const cx = width / 2;
  const orbTop = top;
  const capTop = orbTop + D + 40 * u;
  const ctrlTop = capTop + capH + 60 * u;
  const ctrlLeft = cx - ctrlW / 2;

  // ---- state weights and chip position, folded click by click
  let w = [1, 0, 0, 0, 0, 0];
  let chipL = slotX[0];
  let chipW = slotW[0];
  CLICKS.forEach((c, k) => {
    const s = ORDER[k];
    const t = progress(frame, c, c + MORPH, p.ease);
    w = w.map((v, i) => v * (1 - t) + (i === s ? t : 0));
    chipL = mix(chipL, slotX[s], t);
    chipW = mix(chipW, slotW[s], t);
  });
  const errW = w[5];
  const ec = CLICKS[4];
  const jitter = frame >= ec ? Math.sin((frame - ec) * 1.9) * 9 * u * Math.exp(-(frame - ec) / 7) : 0;

  // ---- dots, bucketed into a handful of paths
  const rot = (frame / 180) * Math.PI * 2; // one turn per loop, so the loop is seamless
  const tilt = -0.38;
  const cR = Math.cos(rot);
  const sR = Math.sin(rot);
  const cT = Math.cos(tilt);
  const sT = Math.sin(tilt);
  const inner = R * 0.84;
  const LEVELS = 5;
  const grey: string[] = Array.from({ length: LEVELS }, () => "");
  const acc: string[] = ["", ""];
  for (const [bx, by, bz] of SPHERE) {
    const x1 = bx * cR + bz * sR;
    const z1 = -bx * sR + bz * cR;
    const y = by * cT - z1 * sT;
    const z = by * sT + z1 * cT;
    if (z < -0.05) continue;
    const depth = clamp01((z + 0.05) / 1.05);
    let I = 0;
    let A = 0;
    for (let s = 0; s < 6; s++) {
      if (w[s] < 0.001) continue;
      const [i, a] = stateLook(s, x1, y, z, frame);
      I += w[s] * i;
      A += w[s] * a;
    }
    const v = I * (0.3 + 0.7 * depth);
    const r = inner * (0.011 + 0.021 * I) * (0.5 + 0.5 * depth);
    const d = dotPath(R + x1 * inner, R - y * inner, r);
    if (A > 0.5) acc[v > 0.45 ? 1 : 0] += d;
    else grey[Math.min(LEVELS - 1, Math.round(v * (LEVELS - 1)))] += d;
  }
  const greyFill = (l: number) => interpolateColors(errW, [0, 1], [interpolateColors(l / (LEVELS - 1), [0, 1], [p.ink3, p.ink]), p.error]);
  const greyOpacity = (l: number) => mix(0.45 + 0.55 * (l / (LEVELS - 1)), 0.3 + 0.7 * (l / (LEVELS - 1)), errW);

  // ---- cursor path
  const slotCenter = (s: number): Pt => [ctrlLeft + slotX[s] + slotW[s] / 2 + 6 * u, ctrlTop + ctrlH / 2 + 8 * u];
  const rest: Pt = [cx + ctrlW * 0.22, ctrlTop + ctrlH + 110 * u];
  const legs: { a: number; b: number; from: Pt; to: Pt }[] = [{ a: 1, b: CLICKS[0] - 3, from: rest, to: slotCenter(ORDER[0]) }];
  for (let k = 1; k < CLICKS.length; k++) legs.push({ a: CLICKS[k - 1] + 4, b: CLICKS[k] - 3, from: slotCenter(ORDER[k - 1]), to: slotCenter(ORDER[k]) });
  legs.push({ a: REST_FROM, b: REST_AT, from: slotCenter(ORDER[ORDER.length - 1]), to: rest });
  let cur: Pt = rest;
  for (const leg of legs) if (frame >= leg.a) cur = glide(leg.from, leg.to, progress(frame, leg.a, leg.b, "travel"));
  const press = Math.max(...CLICKS.map((c) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,.06)`;
  const hair = Math.max(1, u);
  const ringBreath = 0.5 + 0.5 * Math.sin((frame / 45) * Math.PI * 2);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* orb */}
      <div style={{ position: "absolute", left: cx - R, top: orbTop, width: D, height: D, transform: `translateX(${jitter}px)` }}>
        <svg width={D + 80 * u} height={D + 80 * u} style={{ position: "absolute", left: -40 * u, top: -40 * u, overflow: "visible" }}>
          <circle
            cx={R + 40 * u}
            cy={R + 40 * u}
            r={R + (16 + 6 * ringBreath) * u}
            fill="none"
            stroke={p.accent}
            strokeWidth={STROKE.ring * u}
            opacity={w[4] * (0.55 + 0.45 * ringBreath)}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: p.card, border: `${hair}px solid ${p.line}`, boxShadow: shadow }} />
        <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0 }}>
          {grey.map((d, l) => (d ? <path key={`g${l}`} d={d} fill={greyFill(l)} opacity={greyOpacity(l)} /> : null))}
          {acc.map((d, l) => (d ? <path key={`a${l}`} d={d} fill={p.accent} opacity={l ? 1 : 0.6} /> : null))}
        </svg>
      </div>

      {/* caption */}
      <div style={{ position: "absolute", left: 0, width, top: capTop, height: capH, display: "grid", placeItems: "center" }}>
        {captions.map((c, i) =>
          w[i] > 0.01 ? (
            <span
              key={i}
              style={{
                gridArea: "1 / 1",
                fontSize: g.caption * u,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: i === 5 ? interpolateColors(errW, [0, 1], [p.ink2, p.error]) : p.ink2,
                whiteSpace: "nowrap",
                opacity: w[i],
                filter: w[i] < 0.99 ? `blur(${(1 - w[i]) * 6 * u}px)` : undefined,
                transform: `translateY(${(1 - w[i]) * 8 * u}px)`,
              }}
            >
              {c}
            </span>
          ) : null,
        )}
      </div>

      {/* segmented control */}
      <div style={{ position: "absolute", left: ctrlLeft, top: ctrlTop, width: ctrlW, height: ctrlH, borderRadius: RADIUS.hero * u, background: p.fill }}>
        <div
          style={{
            position: "absolute",
            left: chipL,
            top: CHIP_INSET * u,
            width: chipW,
            height: ctrlH - 2 * CHIP_INSET * u,
            borderRadius: RADIUS.card * u,
            background: p.card,
            border: `${hair}px solid ${p.line}`,
            boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,.06)`,
          }}
        />
        {labels.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: slotX[i],
              top: 0,
              width: slotW[i],
              height: ctrlH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              color: interpolateColors(w[i], [0, 1], [p.ink2, p.ink]),
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
