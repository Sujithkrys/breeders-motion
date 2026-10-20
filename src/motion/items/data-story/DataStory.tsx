import React from "react";
import { AbsoluteFill, spring } from "remotion";
import { FILM, Logo, useShot } from "../../film";
import { FONT_MONO, FONT_SANS, RADIUS, SPRING_CONFIG, STAGGER, STROKE, alpha, progress, useLayout } from "../../kit";

export type DataStoryProps = {
  paper: string; // shots 1, 3 and 4
  deep: string; // shot 2
  lead: string;
  baseLabel: string;
  curveLabel: string;
  curveNote: string;
  mosaicLabel: string;
  caption: string;
  value: number;
  suffix: string;
  brand: string;
  logo: string;
};

// ---------- timeline (frames of the 270-frame film; shots are hard cuts) ----------
export const SHOTS = [0, 66, 138, 192] as const;
// Timings below are local to their shot, as [from, to] frames.
export const T = {
  word: { start: 2, dur: 16, maxStagger: 8 }, // heading word rise
  bar: [10, 40] as const, // baseline bar draws on (travel)
  baseIn: [32, 50] as const, // bar caption
  axes: [0, 18] as const, // axes grow from the origin
  labelIn: [2, 20] as const, // chart label
  curve: [10, 54] as const, // curve draws on (travel)
  dotIn: 6, // the orange tip dot fades in over this many frames as the draw starts
  noteIn: [50, 64] as const, // orange note beside the final dot
  tiles: { start: 2, stagger: 2, fade: 10 }, // mosaic: delay = stagger × (row + column)
  mosaicLabelIn: [16, 34] as const,
  numIn: [2, 22] as const, // number fades and rises
  count: [4, 34] as const, // counts 1 → value
  captionIn: [22, 40] as const,
  logoIn: [30, 48] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    margin: 72,
    lead: 40,
    leadMaxW: 900,
    bar: 480,
    label: 20,
    curveLabel: 22,
    note: 22,
    dot: 10,
    chart: { left: 180, right: 180, top: 250, bottom: 150 },
    cols: 6,
    rows: 3,
    tile: 190,
    gap: 12,
    number: 420,
    caption: 22,
    captionMaxW: 1100,
    logo: 36,
  },
  tall: {
    margin: 90,
    lead: 56,
    leadMaxW: 620,
    bar: 760,
    label: 24,
    curveLabel: 28,
    note: 28,
    dot: 12,
    chart: { left: 108, right: 108, top: 360, bottom: 360 },
    cols: 3,
    rows: 4,
    tile: 232,
    gap: 12,
    number: 360,
    caption: 28,
    captionMaxW: 760,
    logo: 44,
  },
} as const;
export type Layout = (typeof SIZE)["wide"] | (typeof SIZE)["tall"];
export const GRID = 120; // background grid pitch in shot 1
export const GAP = { caption: 28, mosaicLabel: 40, note: 28 } as const;
export const RISE = { caption: 8, note: 12, number: 40 } as const;
export const OPACITY = { grid: 0.06, axis: 0.3, caption: 0.55 } as const;
export const TRACK = { lead: -0.02, number: -0.05, mono: 0.02 } as const;
// Exponential growth: y = lift + (1 − lift)(e^(kx) − 1)/(e^k − 1) for x in [0, endX] of the chart width.
export const CURVE = { k: 4.2, lift: 0.04, endX: 0.92, samples: 64 } as const;

// Mosaic colours, row by row: fixed, so every render is the same. 16:9 is 4×3, 9:16 is 3×4.
export type TileName = "black" | "lavender" | "orange" | "lime" | "green";
export const MOSAIC: Record<"wide" | "tall", TileName[][]> = {
  wide: [
    ["black", "lavender", "orange", "lime", "green", "black"],
    ["lavender", "green", "lime", "black", "orange", "lavender"],
    ["green", "lime", "black", "orange", "lavender", "lime"],
  ],
  tall: [
    ["black", "lavender", "orange"],
    ["lime", "green", "black"],
    ["lavender", "orange", "lime"],
    ["green", "black", "lavender"],
  ],
};

// ---------- colour ----------
const rgb = (hex: string): [number, number, number] | null => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const isDark = (hex: string) => {
  const c = rgb(hex);
  if (!c) return true;
  return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
// Curve and axis ink on the deep field: the film's pale green on green, white on other darks, black on light fields.
export const deepInk = (deep: string) => (!isDark(deep) ? FILM.black : (deep || "").toUpperCase() === FILM.green.toUpperCase() ? FILM.greenInk : FILM.white);
const near = (a: string, b: string) => {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return false;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 60;
};
// A tile that would vanish into the paper field (lavender tiles on lavender paper) swaps to white, or grey on white.
export const tileColor = (name: TileName, paper: string) => {
  const c = FILM[name];
  if (!near(c, paper)) return c;
  return isDark(paper) || !near(paper, FILM.white) ? FILM.white : FILM.canvas;
};

// ---------- number ----------
export const clampValue = (v: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(99, Math.max(2, n)) : 10;
};
// Whole-number steps from 1 to value on the enter curve.
export const countAt = (local: number, value: number) => 1 + Math.floor((value - 1) * progress(local, T.count[0], T.count[1], "enter") + 1e-6);
// Inter 500 tabular digits are ~0.6em wide; shrink only if the number and suffix would crowd the frame.
export const numberSize = (value: number, suffix: string, L: Layout, frameW: number) => {
  const chars = String(clampValue(value)).length + Math.max(0, suffix.length);
  return Math.min(L.number, (frameW - 2 * L.margin) / (Math.max(1, chars) * 0.62));
};

// ---------- chart geometry ----------
type Pt = [number, number];
export const chartRect = (L: Layout, width: number, height: number, u: number) => ({
  left: L.chart.left * u,
  right: width - L.chart.right * u,
  top: L.chart.top * u,
  bottom: height - L.chart.bottom * u,
});
const curvePoints = (r: ReturnType<typeof chartRect>): Pt[] => {
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  const den = Math.exp(CURVE.k) - 1;
  return Array.from({ length: CURVE.samples + 1 }, (_, i) => {
    const x = i / CURVE.samples;
    const y = CURVE.lift + (1 - CURVE.lift) * ((Math.exp(CURVE.k * x) - 1) / den);
    return [r.left + x * CURVE.endX * w, r.bottom - y * h];
  });
};

// ---------- pieces ----------
const mono = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: size,
  fontWeight: 400,
  letterSpacing: `${TRACK.mono}em`,
  lineHeight: 1.35,
  color,
});

// Each word rises inside its own mask; padding keeps descenders inside the clip, negative margins give the space back.
const WordRise: React.FC<{ text: string; local: number }> = ({ text, local }) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.25em" }}>
      {words.map((w, i) => {
        const s = T.word.start + STAGGER * Math.min(i, T.word.maxStagger);
        const t = progress(local, s, s + T.word.dur, "enter");
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.04em 0.06em 0.18em", margin: "0 -0.06em -0.14em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

// ---------- shots ----------
// 1 · paper with a hairline grid; the heading rises; a black baseline bar draws on with its mono caption.
const BaseShot: React.FC<{ p: DataStoryProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L: Layout = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.paper);
  const cx = width / 2;
  const cy = height / 2;
  const pitch = GRID * u;
  // The whole grid is one path, aligned so the frame's centre lines are grid lines.
  let d = "";
  for (let x = cx % pitch; x <= width; x += pitch) d += `M${x.toFixed(2)} 0V${height}`;
  for (let y = cy % pitch; y <= height; y += pitch) d += `M0 ${y.toFixed(2)}H${width}`;
  const bw = L.bar * u;
  const bx = cx - bw / 2;
  const t = progress(local, T.bar[0], T.bar[1], "travel");
  const cap = progress(local, T.baseIn[0], T.baseIn[1], "enter");
  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={d} fill="none" stroke={ink} strokeOpacity={OPACITY.grid} strokeWidth={STROKE.hair * u} />
        {t > 0 ? <line x1={bx} x2={bx + bw * t} y1={cy} y2={cy} stroke={ink} strokeWidth={STROKE.bar * u} strokeLinecap="butt" /> : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: L.margin * u,
          top: L.margin * u,
          width: L.leadMaxW * u,
          fontFamily: FONT_SANS,
          fontSize: L.lead * u,
          fontWeight: 500,
          letterSpacing: `${TRACK.lead}em`,
          lineHeight: 1.15,
          color: ink,
        }}
      >
        <WordRise text={p.lead} local={local} />
      </div>
      <div
        style={{
          ...mono(L.label * u, alpha(ink, OPACITY.caption)),
          position: "absolute",
          left: bx,
          top: cy + GAP.caption * u,
          maxWidth: bw,
          whiteSpace: "nowrap",
          overflow: "hidden",
          opacity: cap,
          transform: `translateY(${((1 - cap) * RISE.caption * u).toFixed(3)}px)`,
        }}
      >
        {p.baseLabel}
      </div>
    </>
  );
};

// 2 · flat deep field: hairline axes grow, an exponential curve draws on to an orange dot and note.
const CurveShot: React.FC<{ p: DataStoryProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L: Layout = isVertical ? SIZE.tall : SIZE.wide;
  const ink = deepInk(p.deep);
  const r = chartRect(L, width, height, u);
  const pts = curvePoints(r);
  const path = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("");
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const t = progress(local, T.curve[0], T.curve[1], "travel");
  // The tip, found on the same arc-length table the dash uses, so the dot sits exactly on the stroke's end.
  const at = len * t;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < at) i++;
  const f = Math.min(1, Math.max(0, (at - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])));
  const tip: Pt = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
  const end = pts[pts.length - 1];

  const ax = progress(local, T.axes[0], T.axes[1], "enter");
  const lab = progress(local, T.labelIn[0], T.labelIn[1], "enter");
  const dot = progress(local, T.curve[0], T.curve[0] + T.dotIn, "enter");
  const note = progress(local, T.noteIn[0], T.noteIn[1], "enter");
  return (
    <>
      <div
        style={{
          ...mono(L.curveLabel * u, ink),
          position: "absolute",
          left: L.margin * u,
          top: L.margin * u,
          whiteSpace: "nowrap",
          opacity: lab,
          transform: `translateY(${((1 - lab) * RISE.caption * u).toFixed(3)}px)`,
        }}
      >
        {p.curveLabel}
      </div>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M${r.left} ${r.bottom - (r.bottom - r.top) * ax}V${r.bottom}H${r.left + (r.right - r.left) * ax}`}
          fill="none"
          stroke={ink}
          strokeOpacity={OPACITY.axis}
          strokeWidth={STROKE.hair * u}
        />
        {t > 0 ? (
          <path
            d={path}
            fill="none"
            stroke={ink}
            strokeWidth={STROKE.ring * u}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${len + 2} ${len + 2}`}
            strokeDashoffset={(len + 2) * (1 - t)}
          />
        ) : null}
        {local >= T.curve[0] ? <circle cx={tip[0]} cy={tip[1]} r={L.dot * u} fill={FILM.orange} opacity={dot} /> : null}
      </svg>
      <div
        style={{
          ...mono(L.note * u, FILM.orange),
          position: "absolute",
          right: width - end[0] + GAP.note * u,
          top: end[1],
          whiteSpace: "nowrap",
          opacity: note,
          transform: `translate(${((1 - note) * RISE.note * u).toFixed(3)}px, -50%)`,
        }}
      >
        {p.curveNote}
      </div>
    </>
  );
};

// 3 · paper: a fixed-colour mosaic of flat tiles sweeps in on a diagonal; mono caption under it.
const MosaicShot: React.FC<{ p: DataStoryProps; local: number }> = ({ p, local }) => {
  const { u, fps, isVertical } = useLayout();
  const L: Layout = isVertical ? SIZE.tall : SIZE.wide;
  const grid = MOSAIC[isVertical ? "tall" : "wide"];
  const ink = textOn(p.paper);
  const tile = L.tile * u;
  const gap = L.gap * u;
  const cap = progress(local, T.mosaicLabelIn[0], T.mosaicLabelIn[1], "enter");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {grid.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap }}>
            {row.map((name, ci) => {
              const delay = T.tiles.start + T.tiles.stagger * (ri + ci);
              const s = spring({ frame: Math.max(0, local - delay), fps, config: SPRING_CONFIG });
              const o = progress(local, delay, delay + T.tiles.fade, "enter");
              return (
                <div
                  key={ci}
                  style={{
                    width: tile,
                    height: tile,
                    borderRadius: RADIUS.chip * u,
                    background: tileColor(name, p.paper),
                    opacity: o,
                    transform: `scale(${(0.9 + 0.1 * s).toFixed(4)})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div
        style={{
          ...mono(L.label * u, alpha(ink, OPACITY.caption)),
          marginTop: GAP.mosaicLabel * u,
          whiteSpace: "nowrap",
          opacity: cap,
          transform: `translateY(${((1 - cap) * RISE.caption * u).toFixed(3)}px)`,
        }}
      >
        {p.mosaicLabel}
      </div>
    </AbsoluteFill>
  );
};

// 4 · paper: one huge number counts up in whole steps, mono caption, logo bottom-left.
const NumberShot: React.FC<{ p: DataStoryProps; local: number }> = ({ p, local }) => {
  const { u, width, isVertical } = useLayout();
  const L: Layout = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.paper);
  const value = clampValue(p.value);
  const n = countAt(local, value);
  const size = numberSize(value, p.suffix, L, width / u) * u;
  const inT = progress(local, T.numIn[0], T.numIn[1], "enter");
  const cap = progress(local, T.captionIn[0], T.captionIn[1], "enter");
  const logo = progress(local, T.logoIn[0], T.logoIn[1], "enter");
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: size,
            fontWeight: 500,
            letterSpacing: `${TRACK.number}em`,
            lineHeight: 1,
            color: ink,
            whiteSpace: "nowrap",
            opacity: inT,
            transform: `translateY(${((1 - inT) * RISE.number * u).toFixed(3)}px)`,
          }}
        >
          {/* One text node: the exporter draws each text node on its own and ignores tabular figures, so split
              digits and suffix drift apart in the video. The number stays centred as it counts. */}
          {`${n}${p.suffix}`}
        </div>
        <div
          style={{
            ...mono(L.caption * u, alpha(ink, OPACITY.caption)),
            marginTop: GAP.caption * u,
            maxWidth: L.captionMaxW * u,
            textAlign: "center",
            opacity: cap,
            transform: `translateY(${((1 - cap) * RISE.caption * u).toFixed(3)}px)`,
          }}
        >
          {p.caption}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: L.margin * u, bottom: L.margin * u, opacity: logo }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.paper} />
      </div>
    </>
  );
};

export const DataStory: React.FC<DataStoryProps> = (p) => {
  const { index, local } = useShot(SHOTS);
  const bg = index === 1 ? p.deep : p.paper;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <BaseShot p={p} local={local} /> : null}
      {index === 1 ? <CurveShot p={p} local={local} /> : null}
      {index === 2 ? <MosaicShot p={p} local={local} /> : null}
      {index === 3 ? <NumberShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
