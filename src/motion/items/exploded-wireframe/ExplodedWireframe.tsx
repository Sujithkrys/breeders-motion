import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type ExplodedWireframeProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  label1: string; // top layer
  label2: string;
  label3: string;
  label4: string; // bottom layer (case)
  highlight: number; // 1–4, counted from the top
  spread: number; // gap between exploded layers, model units
  ease: string;
};

// ---------- model (isometric units; x right-down, y left-down, z up) ----------
// Bottom to top. `z0` is the assembled base height; everything nests inside the case and the screen covers it.
export const LAYERS = [
  { key: "case", half: 150, h: 44, z0: 0 },
  { key: "battery", half: 118, h: 22, z0: 12 },
  { key: "board", half: 136, h: 8, z0: 34 },
  { key: "screen", half: 146, h: 10, z0: 44 },
] as const;
const CASE_TOP = 44;
export const exploded = (gap: number) => {
  const b1 = CASE_TOP + gap;
  const b2 = b1 + LAYERS[1].h + gap;
  const b3 = b2 + LAYERS[2].h + gap;
  return [0, b1, b2, b3];
};
export const clampSpread = (n: number) => Math.min(80, Math.max(30, Number(n) || 56));
export const SC = 1.45; // px per model unit at 1080
export const LEAD = 70; // leader length past the device's widest corner, model units
export const LABEL_W = 240; // px reserved per label
export const LABEL_SIZE = 18;
const COS = Math.cos(Math.PI / 6);

// ---------- timeline (frames at 180) ----------
export const T = {
  explodeA: 14, // top layer first, then down the stack every STAGGER frames
  move: 36,
  labelsA: 46,
  hlA: 58,
  outA: 112, // labels and highlight leave
  reassembleA: 124, // bottom layer first
} as const;

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

type V3 = [number, number, number];

export const ExplodedWireframe: React.FC<ExplodedWireframeProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u } = useLayout();
  const gap = clampSpread(p.spread);
  const zExp = exploded(gap);
  const zTopMax = zExp[3] + LAYERS[3].h;
  const totalW = 2 * ((150 * 2 * COS + LEAD) * SC + 16 + LABEL_W);
  const totalH = (146 + zTopMax + 150) * SC;
  const k = Math.min(1, (width * 0.92) / (totalW * u), (height * 0.84) / (totalH * u));
  const s = u * k;
  const sc = SC * s;
  const hl = Math.min(4, Math.max(1, Math.round(Number(p.highlight) || 2)));
  const hlIndex = 4 - hl; // LAYERS index
  const labels = [p.label4, p.label3, p.label2, p.label1]; // by LAYERS index

  // per-layer lift: 0 assembled → 1 exploded
  const lift = LAYERS.map((_, i) => {
    if (i === 0) return 0;
    const outOrder = 3 - i; // screen first
    const inOrder = i - 1; // battery first
    const a = progress(frame, T.explodeA + outOrder * STAGGER, T.explodeA + outOrder * STAGGER + T.move, p.ease);
    const b = progress(frame, T.reassembleA + inOrder * STAGGER, T.reassembleA + inOrder * STAGGER + T.move, p.ease);
    return a * (1 - b);
  });
  const zNow = LAYERS.map((L, i) => mix(L.z0, zExp[i], lift[i]));
  const E = Math.max(...lift);

  // keep the stack centred as it grows
  const top = -146 - (zNow[3] + LAYERS[3].h);
  const bottom = 150;
  const cx = width / 2;
  const cy = height / 2 - ((top + bottom) / 2) * sc;
  const P = (v: V3): [number, number] => [cx + (v[0] - v[1]) * COS * sc, cy + ((v[0] + v[1]) * 0.5 - v[2]) * sc];
  const poly = (pts: V3[]) =>
    pts
      .map(P)
      .map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`)
      .join(" ");
  const topRect = (x0: number, y0: number, x1: number, y1: number, z: number) => poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
  const ellipse = (x: number, y: number, z: number, r: number) => {
    const c = P([x, y, z]);
    return { cx: c[0], cy: c[1], rx: Math.SQRT2 * COS * r * sc, ry: Math.SQRT2 * 0.5 * r * sc };
  };

  const hair = STROKE.hair * s;
  const hlOn = progress(frame, T.hlA, T.hlA + 20, "enter") * (1 - progress(frame, T.outA, T.outA + 14, "exit"));

  const tone = (i: number) => {
    const a = i === hlIndex ? hlOn : 0;
    return { a, edge: mixColor(p.ink2, p.accent, a), detail: mixColor(p.ink3, p.accent, a) };
  };
  const shape = (key: string, pts: string, col: string, closed = true) =>
    closed ? (
      <polygon key={key} points={pts} fill="none" stroke={col} strokeWidth={hair} strokeLinejoin="round" />
    ) : (
      <polyline key={key} points={pts} fill="none" stroke={col} strokeWidth={hair} strokeLinejoin="round" strokeLinecap="round" />
    );
  const rhombus = (h: number, z: number) => [P([-h, -h, z]), P([h, -h, z]), P([h, h, z]), P([-h, h, z])];
  const ringPath = (outer: number, inner: number, z: number) => {
    const ring = (pts: [number, number][]) => `M${pts.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("L")}Z`;
    return ring(rhombus(outer, z)) + ring(rhombus(inner, z).reverse());
  };

  // The case is painted in two passes so the layers nested inside it are hidden by its rim and walls when assembled,
  // yet drawn over it once they lift clear: base (top face + tray floor) → layers still inside → rim + front walls.
  const L0 = LAYERS[0];
  const caseBase = () => {
    const { a, detail } = tone(0);
    const h = L0.half;
    return (
      <g key="case-base">
        <polygon points={topRect(-h, -h, h, h, CASE_TOP)} fill={p.background} stroke="none" />
        <polygon points={topRect(-138, -138, 138, 138, CASE_TOP)} fill={p.fill} stroke={detail} strokeWidth={hair} strokeLinejoin="round" />
        {a > 0.001 ? <polygon points={topRect(-138, -138, 138, 138, CASE_TOP)} fill={alpha(p.accent, 0.08 * a)} stroke="none" /> : null}
      </g>
    );
  };
  const caseFront = () => {
    const { a, edge, detail } = tone(0);
    const h = L0.half;
    const z1 = CASE_TOP;
    return (
      <g key="case-front">
        <polygon points={poly([[h, -h, 0], [h, h, 0], [h, h, z1], [h, -h, z1]])} fill={p.fill} stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        <polygon points={poly([[-h, h, 0], [h, h, 0], [h, h, z1], [-h, h, z1]])} fill={p.fill} stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        <path d={ringPath(h, 138, z1)} fill={a > 0.001 ? mixColor(p.background, p.accent, 0.08 * a) : p.background} fillRule="evenodd" stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        {shape("port1", poly([[h, -40, 14], [h, -8, 14], [h, -8, 26], [h, -40, 26]]), detail)}
        {shape("port2", poly([[h, 8, 14], [h, 40, 14], [h, 40, 26], [h, 8, 26]]), detail)}
        {shape("groove", poly([[-110, h, 20], [110, h, 20], [110, h, 24], [-110, h, 24]]), detail)}
      </g>
    );
  };

  const layerNodes = (i: number) => {
    const L = LAYERS[i];
    const z0 = zNow[i];
    const z1 = z0 + L.h;
    const h = L.half;
    const { a, edge, detail } = tone(i);
    const top = topRect(-h, -h, h, h, z1);
    const right = poly([[h, -h, z0], [h, h, z0], [h, h, z1], [h, -h, z1]]);
    const left = poly([[-h, h, z0], [h, h, z0], [h, h, z1], [-h, h, z1]]);
    const d: React.ReactNode[] = [];
    if (L.key === "battery") {
      d.push(shape("cell", topRect(-104, -104, 104, 104, z1), detail));
      d.push(shape("tab", topRect(-30, -118, 30, -104, z1), detail));
      d.push(shape("plus1", topRect(-14, -2, 14, 2, z1), detail));
      d.push(shape("plus2", topRect(-2, -14, 2, 14, z1), detail));
    } else if (L.key === "board") {
      d.push(shape("chip", topRect(-36, -36, 36, 36, z1), detail));
      d.push(shape("die", topRect(-22, -22, 22, 22, z1), detail));
      d.push(shape("mem", topRect(56, -100, 104, -64, z1), detail));
      d.push(shape("io", topRect(-104, 60, -60, 96, z1), detail));
      d.push(shape("trace1", poly([[36, -10, z1], [70, -10, z1], [70, -64, z1]]), detail, false));
      d.push(shape("trace2", poly([[-36, 10, z1], [-82, 10, z1], [-82, 60, z1]]), detail, false));
      for (let q = 0; q < 5; q++) {
        const e = ellipse(-40 + q * 20, 112, z1, 4);
        d.push(<ellipse key={`via${q}`} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={detail} strokeWidth={hair} />);
      }
    } else {
      d.push(shape("display", topRect(-132, -132, 132, 132, z1), detail));
      const cam = ellipse(-139, -139, z1, 3);
      d.push(<ellipse key="cam" cx={cam.cx} cy={cam.cy} rx={cam.rx} ry={cam.ry} fill={detail} />);
    }
    return (
      <g key={L.key}>
        <polygon points={right} fill={p.fill} stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        <polygon points={left} fill={p.fill} stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        <polygon points={top} fill={p.background} stroke={edge} strokeWidth={hair} strokeLinejoin="round" />
        {a > 0.001 ? <polygon points={top} fill={alpha(p.accent, 0.08 * a)} stroke="none" /> : null}
        {d}
      </g>
    );
  };
  const inside = (i: number) => zNow[i] < CASE_TOP - 0.01;

  // dotted alignment guides at the three visible corners, from the case rim to the screen
  const guides = E > 0.001
    ? ([
        [-146, 146],
        [146, 146],
        [146, -146],
      ] as const).map(([x, y], gi) => {
        const a = P([x, y, CASE_TOP]);
        const b = P([x, y, zNow[3]]);
        return <line key={`g${gi}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={p.ink3} strokeWidth={hair} strokeDasharray={`${2 * s} ${5 * s}`} opacity={E} />;
      })
    : null;

  // leaders + labels: top and third layers to the right, the others to the left
  const reach = (150 * 2 * COS + LEAD) * sc;
  const leaders: React.ReactNode[] = [];
  const labelDivs: React.ReactNode[] = [];
  LAYERS.forEach((L, i) => {
    const order = 3 - i; // top label first
    const inP = progress(frame, T.labelsA + order * STAGGER, T.labelsA + order * STAGGER + 20, "enter");
    const outP = progress(frame, T.outA + order * STAGGER, T.outA + order * STAGGER + 14, "exit");
    const draw = inP * (1 - outP);
    if (draw < 0.001) return;
    const right = i === 3 || i === 1;
    const zm = zNow[i] + L.h / 2;
    const corner = right ? P([L.half, -L.half, zm]) : P([-L.half, L.half, zm]);
    const endX = right ? cx + reach : cx - reach;
    const x2 = mix(corner[0], endX, inP);
    const isHl = i === hlIndex;
    const num = String(4 - i).padStart(2, "0");
    leaders.push(
      <g key={`l${i}`} opacity={1 - outP}>
        <line x1={corner[0]} y1={corner[1]} x2={x2} y2={corner[1]} stroke={p.ink3} strokeWidth={hair} />
        <circle cx={corner[0]} cy={corner[1]} r={STROKE.ring * s} fill={isHl ? mixColor(p.ink3, p.accent, hlOn) : p.ink3} />
      </g>,
    );
    labelDivs.push(
      <div
        key={`t${i}`}
        style={{
          position: "absolute",
          left: right ? endX + 16 * s : endX - 16 * s - LABEL_W * s,
          top: corner[1] - 14 * s,
          width: LABEL_W * s,
          height: 28 * s,
          display: "flex",
          alignItems: "center",
          justifyContent: right ? "flex-start" : "flex-end",
          gap: 12 * s,
          fontFamily: FONT_MONO,
          fontSize: LABEL_SIZE * s,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          opacity: draw,
          transform: `translateX(${(1 - inP) * (right ? -12 : 12) * s}px)`,
        }}
      >
        <span style={{ color: p.ink3 }}>{num}</span>
        <span style={{ color: isHl ? mixColor(p.ink2, p.ink, hlOn) : p.ink2 }}>{labels[i]}</span>
      </div>,
    );
  });

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {caseBase()}
        {inside(1) ? layerNodes(1) : null}
        {inside(2) ? layerNodes(2) : null}
        {caseFront()}
        {inside(1) ? null : layerNodes(1)}
        {inside(2) ? null : layerNodes(2)}
        {guides}
        {layerNodes(3)}
        {leaders}
      </svg>
      {labelDivs}
    </AbsoluteFill>
  );
};
