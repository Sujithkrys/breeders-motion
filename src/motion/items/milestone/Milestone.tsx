import React from "react";
import { AbsoluteFill, random } from "remotion";
import { FILM, Logo, SAMPLE, useShot } from "../../film";
import { FONT_MONO, FONT_SANS, STAGGER, STROKE, alpha, easing, mix, progress, useLayout } from "../../kit";

export type MilestoneProps = {
  value: number; // the milestone, 10–9,999,999
  caption: string; // mono line above the number
  label: string; // line under the number (shot 2)
  thanks: string; // end card
  brand: string;
  logo: string;
  date: string;
  field: string; // shots 1–2
  accent: string; // lit dots + underline
  end: string; // shot 3
};

// ---------- timeline (frames of the 240-frame film; shot 3 is a hard cut) ----------
export const SHOTS = [0, 120, 190] as const;
export const T = {
  numberIn: [0, 12] as const, // number fades in (its columns sit dim until they roll)
  marksIn: [4, 22] as const, // caption and corner marks
  roll: [10, 100] as const, // odometer: the ones column starts at 10, every column lands at 100
  colStagger: STAGGER, // each column to the left starts 3f later
  push: [120, 190] as const, // camera push-in, linear
  label: 124, // first label word starts rising
  underline: [128, 150] as const,
  twinkleIn: [120, 140] as const, // twinkle amplitude ramps in from zero, so the cut into shot 2 is seamless
  wordDur: 18,
  maxStagger: 8,
  thanks: 2, // local to shot 3
  stamp: [6, 24] as const,
  rule: [4, 26] as const,
  logo: [8, 26] as const,
  date: [11, 29] as const,
} as const;

// ---------- dot field ----------
export const DOTS = {
  max: 880, // circles, one inline SVG (≤ 900)
  r: 3.5, // radius, px at 1080
  jitter: 0.32, // ± fraction of a cell
  base: 0.1, // unlit: ink at 10% over the field
  start: 6, // first (centre) dot starts lighting
  spread: 74, // frames from centre to corner
  wobble: 10, // frames of angular lumpiness in the front, growing with distance
  jitterF: 14, // frames of per-dot jitter
  dur: 12, // one dot lighting
  twinkle: 0.06, // share of dots that twinkle in shot 2
  twinkleAmp: 0.55, // opacity dip at full amplitude
  periodMin: 40,
  periodRange: 36,
} as const;
export const PUSH = 1.06;

// ---------- type ----------
// Inter metrics at line-height 1: digits run from 0.137em (cap height) to the baseline at 0.864em.
export const GLYPH = { top: 0.137, base: 0.864 } as const;
// Odometer columns: Inter 600 figures with −0.05em tracking built into a fixed width (no letter-spacing on the nodes).
export const DIGIT_EM = 0.6;
export const COMMA_EM = 0.26;
export const DIM = 0.28; // a column's opacity before it starts rolling
export const TRACK = { number: -0.05, label: -0.02, thanks: -0.045, mono: 0.12 } as const;
export const LH = { label: 1.3, thanks: 1.0 } as const;
export const MONO = { caption: 24, mark: 20, date: 22 } as const;
export const INK = { caption: 0.55, mark: 0.5, label: 0.75, rule: 0.22 } as const;
export const GAP = { caption: 36, line: 34, label: 34, rule: 36 } as const;
export const SIZE = {
  wide: { number: 260, numberMaxW: 1500, label: 52, labelMaxW: 1500, labelLines: 2, thanks: 150, thanksMaxW: 1500, thanksLines: 2, logo: 56, centreDy: -40, margin: 72 },
  tall: { number: 220, numberMaxW: 940, label: 52, labelMaxW: 900, labelLines: 3, thanks: 130, thanksMaxW: 936, thanksLines: 3, logo: 64, centreDy: -70, margin: 72 },
} as const;
export const VALUE = { min: 10, max: 9999999, fallback: 10000 } as const;

// ---------- value ----------
export const clampValue = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(VALUE.max, Math.max(VALUE.min, n)) : VALUE.fallback;
};
export const formatValue = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const numberEm = (s: string) => s.split("").reduce((w, ch) => w + (ch === "," ? COMMA_EM : DIGIT_EM), 0);
// A real count: the value rises from 0 to the target over T.roll on "enter", and column k (0 = ones) sits at
// value / 10^k, so higher digits only turn over when the column to their right carries, like a mechanical counter.
export const countAt = (frame: number, target: number) => progress(frame, T.roll[0], T.roll[1], "enter") * target;

// ---------- colour ----------
const rgbOf = (hex: string): [number, number, number] | null => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return Number.isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const isDark = (hex: string) => {
  const c = rgbOf(hex);
  if (!c) return true;
  return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
// Solid blend of two colours (so a dot is one fill, not two stacked layers).
export const blend = (a: string, b: string, t: number) => {
  const x = rgbOf(a) ?? [0, 0, 0];
  const y = rgbOf(b) ?? [0, 0, 0];
  const c = x.map((v, i) => Math.round(mix(v, y[i], t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};
export const hexOf = (a: string, b: string, t: number) => {
  const x = rgbOf(a) ?? [0, 0, 0];
  const y = rgbOf(b) ?? [0, 0, 0];
  return `#${x.map((v, i) => Math.round(mix(v, y[i], t)).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

// ---------- type layout: balanced rows, shrunk to fit ----------
const greedy = (words: string[], maxEm: number, emPerChar: number) => {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if (cur.length && [...cur, w].join(" ").length * emPerChar > maxEm) {
      rows.push(cur);
      cur = [w];
    } else cur = [...cur, w];
  }
  if (cur.length) rows.push(cur);
  return rows;
};
const wrapBalanced = (text: string, maxEm: number, emPerChar: number) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const n = greedy(words, maxEm, emPerChar).length;
  let lo = 0;
  let hi = maxEm;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, mid, emPerChar).length <= n) hi = mid;
    else lo = mid;
  }
  return greedy(words, hi, emPerChar);
};
export const fitRows = (text: string, maxW: number, base: number, maxLines: number, emPerChar: number) => {
  let size = base;
  let rows = wrapBalanced(text, maxW / size, emPerChar);
  for (let i = 0; i < 7; i++) {
    const longest = Math.max(0, ...rows.map((r) => r.join(" ").length * emPerChar)) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size, emPerChar);
  }
  return { rows, size };
};
export const EM_PER_CHAR = { label: 0.53, thanks: 0.56 } as const;

// ---------- geometry (shared by the component and the prompt; W×H in px, u = 1px at 1080) ----------
export const geometry = (W: number, H: number, u: number, tall: boolean, p: Pick<MilestoneProps, "value" | "label" | "thanks">) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const v = clampValue(p.value);
  const str = formatValue(v);
  const em = numberEm(str);
  const fs = Math.min(L.number * u, (L.numberMaxW * u) / em);
  const numW = em * fs;
  const cx = W / 2;
  const cy = H / 2 + L.centreDy * u;
  const numTop = cy - fs / 2;
  const glyphTop = numTop + GLYPH.top * fs;
  const baseline = numTop + GLYPH.base * fs;
  const captionTop = glyphTop - GAP.caption * u - MONO.caption * u;
  const lineTop = baseline + GAP.line * u;
  const labelTop = lineTop + STROKE.bar * u + GAP.label * u;
  const label = fitRows(p.label, L.labelMaxW * u, L.label * u, L.labelLines, EM_PER_CHAR.label);
  const thanks = fitRows(p.thanks, L.thanksMaxW * u, L.thanks * u, L.thanksLines, EM_PER_CHAR.thanks);
  return { L, v, str, fs, numW, cx, cy, numTop, glyphTop, baseline, captionTop, lineTop, labelTop, label, thanks };
};

// Jittered grid filling the frame, ≤ DOTS.max cells, deterministic.
export const dotGrid = (W: number, H: number) => {
  const cols = Math.max(4, Math.round(Math.sqrt((DOTS.max * W) / H)));
  const rows = Math.max(4, Math.floor(DOTS.max / cols));
  return { cols, rows, sx: W / cols, sy: H / rows };
};
type Dot = { x: number; y: number; at: number; tw: boolean; phase: number; period: number };
const buildDots = (W: number, H: number): Dot[] => {
  const { cols, rows, sx, sy } = dotGrid(W, H);
  const cx = W / 2;
  const cy = H / 2;
  const maxD = Math.hypot(cx, cy);
  const dots: Dot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = (c + 0.5) * sx + (random(`ms-x${i}`) - 0.5) * 2 * DOTS.jitter * sx;
      const y = (r + 0.5) * sy + (random(`ms-y${i}`) - 0.5) * 2 * DOTS.jitter * sy;
      const d = Math.min(1, Math.hypot(x - cx, y - cy) / maxD);
      const ang = Math.atan2(y - cy, x - cx);
      const wobble = DOTS.wobble * d * (0.5 + 0.5 * Math.sin(ang * 3 + 1.3));
      dots.push({
        x,
        y,
        at: DOTS.start + d * DOTS.spread + wobble + random(`ms-d${i}`) * DOTS.jitterF,
        tw: random(`ms-t${i}`) < DOTS.twinkle,
        phase: random(`ms-p${i}`) * Math.PI * 2,
        period: DOTS.periodMin + random(`ms-q${i}`) * DOTS.periodRange,
      });
    }
  }
  return dots;
};

// ---------- pieces ----------
// Each row is its own mask: padding keeps descenders inside the clip, the negative margin gives the space back.
const Rise: React.FC<{ rows: string[][]; frame: number; start: number; lineHeight: number }> = ({ rows, frame, start, lineHeight }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.25em", whiteSpace: "nowrap", lineHeight }}>
              {words.map((w, i) => {
                const s = start + STAGGER * Math.min(first + i, T.maxStagger);
                const t = progress(frame, s, s + T.wordDur, "enter");
                return (
                  <span key={i} style={{ display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

// One odometer column: a box exactly one line tall (fs px, line-height fs px), overflow hidden, positioned by its
// parent row only. Inside, a strip of two stacked one-line cells (current digit, next digit) moves up in px, so the
// box never grows with its content and only one line ever shows. Each digit is its own text node.
// One digit window. `digit` is the resting digit and `frac` (0–1) how far it has turned toward the next one.
const Column: React.FC<{ digit: number; frac: number; opacity: number; fs: number }> = ({ digit, frac, opacity, fs }) => {
  const next = (digit + 1) % 10;
  const cell: React.CSSProperties = { display: "block", width: "100%", height: fs, lineHeight: `${fs}px`, textAlign: "center", whiteSpace: "nowrap" };
  return (
    <div style={{ position: "relative", flex: "none", width: DIGIT_EM * fs, height: fs, overflow: "hidden", opacity }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 2 * fs, transform: `translateY(${(-frac * fs).toFixed(2)}px)` }}>
        <div style={cell}>{String(digit)}</div>
        {frac > 0.001 ? <div style={cell}>{String(next)}</div> : null}
      </div>
    </div>
  );
};

// Digits and turn amounts for a count of `v`, ones column first. Like a mechanical counter: the ones digit rests,
// then snaps over the last 45% of each step; a higher column turns only while every column to its right shows 9 and
// is turning over, so the reading is never ahead of the count (no "19,404" on the way to 10,000).
export const odometerColumns = (v: number, n: number) => {
  const whole = Math.floor(v + 1e-6);
  const raw = Math.max(0, Math.min(1, v - whole));
  const cols: { digit: number; frac: number }[] = [];
  let carry = SNAP(Math.max(0, (raw - 0.55) / 0.45));
  for (let k = 0; k < n; k++) {
    const digit = Math.floor(whole / 10 ** k) % 10;
    cols.push({ digit, frac: carry });
    carry = digit === 9 ? carry : 0;
  }
  return cols;
};

const Odometer: React.FC<{ str: string; frame: number; fs: number; color: string }> = ({ str, frame, fs, color }) => {
  const n = str.replace(/,/g, "").length;
  const value = Number(str.replace(/,/g, ""));
  const v = countAt(frame, value);
  const cols = odometerColumns(v, n);
  let col = 0;
  let leftOpacity = 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", height: fs, overflow: "hidden", fontFamily: FONT_SANS, fontSize: fs, fontWeight: 600, lineHeight: `${fs}px`, letterSpacing: 0, color }}>
      {str.split("").map((ch, i) => {
        if (ch === ",") {
          return (
            <div key={i} style={{ flex: "none", width: COMMA_EM * fs, height: fs, lineHeight: `${fs}px`, textAlign: "center", overflow: "hidden", opacity: leftOpacity }}>
              ,
            </div>
          );
        }
        const k = n - 1 - col++;
        const { digit, frac } = cols[k];
        // Leading zeros stay dim until the count reaches their column, then light as the first digit turns in.
        const reached = Math.min(1, v / 10 ** k);
        leftOpacity = k === 0 ? 1 : reached >= 1 ? 1 : mix(DIM, 1, frac);
        return <Column key={i} digit={digit} frac={frac} opacity={leftOpacity} fs={fs} />;
      })}
    </div>
  );
};

// Built once: ~880 dots evaluate the enter curve every frame.
const ENTER = easing("enter");
const SNAP = easing("travel");

const dotPath = (list: Dot[], r: number) =>
  list.map((d) => `M${(d.x - r).toFixed(1)} ${d.y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`).join("");

// The field: unlit and fully lit dots are one path each; only dots mid-transition or twinkling are their own circles,
// so the DOM stays small while ~880 dots are drawn.
const DotField: React.FC<{ frame: number; field: string; ink: string; accent: string }> = ({ frame, field, ink, accent }) => {
  const { u, width: W, height: H } = useLayout();
  const dots = React.useMemo(() => buildDots(W, H), [W, H]);
  const r = DOTS.r * u;
  const baseColor = hexOf(field, ink, DOTS.base);
  const amp = DOTS.twinkleAmp * progress(frame, T.twinkleIn[0], T.twinkleIn[1], "linear");
  const unlit: Dot[] = [];
  const lit: Dot[] = [];
  const live: React.ReactNode[] = [];
  dots.forEach((d, i) => {
    const t = ENTER(Math.min(1, Math.max(0, (frame - d.at) / DOTS.dur)));
    const twinkling = d.tw && amp > 0 && t >= 1;
    if (t <= 0) unlit.push(d);
    else if (t >= 1 && !twinkling) lit.push(d);
    else {
      const o = twinkling ? 1 - amp * (0.5 - 0.5 * Math.cos(d.phase + ((frame - SHOTS[1]) * Math.PI * 2) / d.period)) : 1;
      live.push(<circle key={i} cx={d.x} cy={d.y} r={r} fill={blend(baseColor, accent, t)} opacity={o} />);
    }
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {unlit.length ? <path d={dotPath(unlit, r)} fill={baseColor} /> : null}
      {lit.length ? <path d={dotPath(lit, r)} fill={accent} /> : null}
      {live}
    </svg>
  );
};

const mono = (u: number, size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: size * u,
  fontWeight: 400,
  letterSpacing: `${TRACK.mono}em`,
  lineHeight: 1,
  color,
  whiteSpace: "nowrap",
});

// ---------- shots ----------
const FieldShot: React.FC<{ p: MilestoneProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = geometry(W, H, u, isVertical, p);
  const ink = textOn(p.field);
  const m = G.L.margin * u;
  const push = 1 + (PUSH - 1) * progress(frame, T.push[0], T.push[1], "linear");
  const numIn = progress(frame, T.numberIn[0], T.numberIn[1], "enter");
  const marks = progress(frame, T.marksIn[0], T.marksIn[1], "enter");
  const line = progress(frame, T.underline[0], T.underline[1], "enter");
  return (
    <>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: `${G.cx}px ${G.cy}px` }}>
        <DotField frame={frame} field={p.field} ink={ink} accent={p.accent} />
        {p.caption.trim() ? (
          <div
            style={{
              ...mono(u, MONO.caption, alpha(ink, INK.caption)),
              position: "absolute",
              left: 0,
              width: W,
              top: G.captionTop,
              textAlign: "center",
              opacity: marks,
              transform: `translateY(${((1 - marks) * 12 * u).toFixed(2)}px)`,
            }}
          >
            {p.caption.toUpperCase()}
          </div>
        ) : null}
        <div style={{ position: "absolute", left: G.cx - G.numW / 2, top: G.numTop, opacity: numIn }}>
          <Odometer str={G.str} frame={frame} fs={G.fs} color={ink} />
        </div>
        {frame >= T.underline[0] ? (
          <div
            style={{
              position: "absolute",
              left: G.cx - G.numW / 2,
              top: G.lineTop,
              width: G.numW,
              height: STROKE.bar * u,
              borderRadius: 999,
              background: p.accent,
              transform: `scaleX(${line.toFixed(4)})`,
              transformOrigin: "0 50%",
            }}
          />
        ) : null}
        {frame >= T.label ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: G.labelTop,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: FONT_SANS,
              fontSize: G.label.size,
              fontWeight: 500,
              letterSpacing: `${TRACK.label}em`,
              color: alpha(ink, INK.label),
            }}
          >
            <Rise rows={G.label.rows} frame={frame} start={T.label} lineHeight={LH.label} />
          </div>
        ) : null}
      </AbsoluteFill>
      {/* Corner marks sit outside the camera. */}
      <div style={{ ...mono(u, MONO.mark, alpha(ink, INK.mark)), position: "absolute", left: m, top: m, opacity: marks }}>{p.brand.toUpperCase()}</div>
      <div style={{ ...mono(u, MONO.mark, alpha(ink, INK.mark)), position: "absolute", right: m, top: m, opacity: marks }}>{p.date.toUpperCase()}</div>
    </>
  );
};

const EndShot: React.FC<{ p: MilestoneProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = geometry(W, H, u, isVertical, p);
  const ink = textOn(p.end);
  const m = G.L.margin * u;
  const logoH = G.L.logo * u;
  const stamp = progress(local, T.stamp[0], T.stamp[1], "enter");
  const rule = progress(local, T.rule[0], T.rule[1], "enter");
  const logo = progress(local, T.logo[0], T.logo[1], "enter");
  const date = progress(local, T.date[0], T.date[1], "enter");
  const rise = (t: number) => ({ opacity: t, transform: `translateY(${((1 - t) * 16 * u).toFixed(2)}px)` });
  return (
    <>
      <div
        style={{
          ...mono(u, MONO.mark, alpha(ink, INK.caption)),
          position: "absolute",
          left: m,
          top: m,
          opacity: stamp,
        }}
      >
        {`${G.str} — ${p.caption}`.toUpperCase()}
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateY(${-20 * u}px)`,
            fontFamily: FONT_SANS,
            fontSize: G.thanks.size,
            fontWeight: 600,
            letterSpacing: `${TRACK.thanks}em`,
            color: ink,
          }}
        >
          <Rise rows={G.thanks.rows} frame={local} start={T.thanks} lineHeight={LH.thanks} />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: m,
          top: H - m - logoH - GAP.rule * u,
          width: W - 2 * m,
          height: STROKE.hair * u,
          background: alpha(ink, INK.rule),
          transform: `scaleX(${rule.toFixed(4)})`,
          transformOrigin: "0 50%",
        }}
      />
      <div style={{ position: "absolute", left: m, top: H - m - logoH, height: logoH, display: "flex", alignItems: "center", ...rise(logo) }}>
        <Logo src={p.logo || undefined} name={p.brand} size={logoH} color={ink} tile={ink} onTile={p.end} />
      </div>
      <div style={{ position: "absolute", right: m, top: H - m - logoH, height: logoH, display: "flex", alignItems: "center", ...rise(date) }}>
        <span style={mono(u, MONO.date, alpha(ink, INK.caption))}>{p.date.toUpperCase()}</span>
      </div>
    </>
  );
};

export const Milestone: React.FC<MilestoneProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  const props: MilestoneProps = { ...p, brand: p.brand || SAMPLE.brand, caption: p.caption || "", date: p.date || "" };
  const bg = index === 2 ? p.end : p.field;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index < 2 ? <FieldShot p={props} frame={frame} /> : <EndShot p={props} local={local} />}
    </AbsoluteFill>
  );
};
