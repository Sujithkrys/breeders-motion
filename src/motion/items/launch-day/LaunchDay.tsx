import React from "react";
import { AbsoluteFill, Img, interpolate } from "remotion";
import { FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import { parsePoint, pointOn, pointValue, type Point } from "../../placement";

export type LaunchDayProps = {
  dark: string; // shots 1 and 5 (countdown, live card)
  pop: string; // shot 2 (name)
  stage: string; // shot 3 (product)
  warm: string; // shot 4 (votes)
  accent: string; // ring arc, callout dots, upvote, rank label, live dot
  kicker: string;
  name: string;
  tagline: string;
  feature1: string;
  feature2: string;
  feature3: string;
  votes: number;
  rank: string;
  cta: string;
  url: string;
  date: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  showCallouts: boolean;
  point1: string; // "x,y" on screenshot (16:9)
  point2: string;
  point3: string;
  point1Tall: string; // "x,y" on phoneShot (9:16)
  point2Tall: string;
  point3Tall: string;
};

// ---------- timeline (450 frames, hard cuts) ----------
// 1 countdown (black) · 2 name (lime) · 3 product (canvas) · 4 votes (cream) · 5 live now (black)
// Shot 2 runs 78f and shot 3 132f so the tagline and the last callout each stay readable 1.5s after landing.
export const SHOTS = [0, 90, 168, 300, 390] as const;
// Timings are local to their shot.
export const T = {
  // shot 1
  rolls: [
    [0, 10],
    [30, 38],
    [60, 68],
  ] as const, // digit column snaps (travel): blank → 3, 3 → 2, 2 → 1
  second: 30, // the ring arc sweeps once per second (linear)
  kicker: [2, 20] as const,
  rule: [0, 24] as const,
  push1: 1.04,
  // shot 2
  wordStart: 2,
  wordDur: 18,
  maxStagger: 8,
  tagline: 6,
  tagDur: 14, // the tagline's words rise a little quicker so it lands by local frame 32
  push2: 1.03,
  // shot 3
  enter3: [0, 30] as const, // spring: rise + tilt
  rise: 380, // px at 1080 the window rises
  tilt: 12, // deg rotateX at the start
  push3: [24, 132] as const,
  push3Scale: 1.04,
  calls: [26, 40, 54] as const,
  callLine: [2, 14] as const, // after the dot
  callPill: [8, 28] as const, // after the dot (spring)
  callDot: 16,
  // shot 4
  press: 16,
  count: [16, 64] as const,
  countFrom: 0.6,
  avatars: 24,
  avatarDur: 20,
  chip: 43,
  push4: 1.04,
  // shot 5
  ring5: [0, 24] as const,
  date5: [2, 12] as const,
  cta5: 6,
  url5: [14, 34] as const,
  logo5: [16, 34] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    digit: 360,
    ring: 260,
    kicker: 22,
    name: 200,
    nameMaxW: 1600,
    nameLines: 2,
    tagline: 44,
    tagMaxW: 1100,
    tagLines: 2,
    winW: 1200,
    chrome: 56,
    pill: 28,
    pillH: 60,
    cardW: 1240,
    count: 150,
    avatar: 64,
    cta: 120,
    ctaMaxW: 1400,
    ctaLines: 1,
    ring5: 150,
    date5: 56,
    url: 34,
    urlH: 80,
    logo: 44,
    margin: 72,
    marksBottom: 56,
  },
  tall: {
    digit: 420,
    ring: 300,
    kicker: 24,
    name: 150,
    nameMaxW: 940,
    nameLines: 3,
    tagline: 48,
    tagMaxW: 900,
    tagLines: 3,
    winW: 560, // phone screen width
    chrome: 0,
    pill: 30,
    pillH: 66,
    cardW: 920,
    count: 150,
    avatar: 72,
    cta: 128,
    ctaMaxW: 940,
    ctaLines: 2,
    ring5: 170,
    date5: 64,
    url: 36,
    urlH: 88,
    logo: 56,
    margin: 64,
    marksBottom: 96,
  },
} as const;
export const TRACK = { digit: -0.04, name: -0.045, tagline: -0.02, count: -0.045, cta: -0.045 } as const;
export const LINE_H = 1.0;
export const DIGIT_CELL = 1.1; // digit column cell height, in em
export const BEZEL = 12; // phone bezel
export const TICKS = { gap: 16, minor: 9, major: 18 } as const; // ring bezel ticks, outside the ring

// ---------- placements (fractions of the visible screenshot slot) ----------
// The slot as drawn: a 16:10 page under the browser chrome at 16:9, a 9:19.5 phone screen at 9:16.
export const SLOT_ASPECT = { wide: 16 / 10, tall: 9 / 19.5 } as const;
// Defaults, tuned to the samples: the "+ Plan my week" button, Monday's "Deep work" block, Thursday's "Team sync"
// block; on the phone, the "Focus · no meetings" card, the "Design review" card and the "Plan my week" button.
export const POINTS_WIDE: Point[] = [
  { x: 0.836, y: 0.699 },
  { x: 0.308, y: 0.797 },
  { x: 0.67, y: 0.79 },
];
export const POINTS_TALL: Point[] = [
  { x: 0.5, y: 0.928 },
  { x: 0.3, y: 0.43 },
  { x: 0.72, y: 0.632 },
];
export const POINT_WHAT = {
  wide: ['the "+ Plan my week" button', 'Monday\'s "Deep work" block', 'Thursday\'s "Team sync" block'],
  tall: ['the "Plan my week" button', 'the "Focus · no meetings" card', 'the "Design review" card'],
} as const;
export const PLACEMENT_DEFAULTS = {
  point1: pointValue(POINTS_WIDE[0]),
  point2: pointValue(POINTS_WIDE[1]),
  point3: pointValue(POINTS_WIDE[2]),
  point1Tall: pointValue(POINTS_TALL[0]),
  point2Tall: pointValue(POINTS_TALL[1]),
  point3Tall: pointValue(POINTS_TALL[2]),
} as const;
export const pointsOf = (p: LaunchDayProps, tall: boolean): Point[] =>
  tall
    ? [parsePoint(p.point1Tall, POINTS_TALL[0]), parsePoint(p.point2Tall, POINTS_TALL[1]), parsePoint(p.point3Tall, POINTS_TALL[2])]
    : [parsePoint(p.point1, POINTS_WIDE[0]), parsePoint(p.point2, POINTS_WIDE[1]), parsePoint(p.point3, POINTS_WIDE[2])];

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
export const UI = CANVAS.paper; // the product UI pieces (window chrome, pills, vote card) are always light

// ---------- numbers ----------
export const thousands = (n: number) => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const compact = (n: number) => {
  const v = Math.max(0, Math.round(n));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
};
export const votesOf = (p: LaunchDayProps) => {
  const v = Number(p.votes);
  return Number.isFinite(v) ? Math.min(999999, Math.max(1, Math.round(v))) : 1240;
};
// Count size shrinks for long numbers so the vote card never overflows.
export const countSize = (base: number, votes: number) => base * Math.min(1, 5 / thousands(votes).length);

// ---------- type layout: balanced rows, shrunk to fit ----------
export const EM = { semibold: 0.56, regular: 0.52, mono: 0.6 } as const; // average advance per character
const est = (words: string[], em: number) => words.join(" ").length * em;
const greedy = (words: string[], maxEm: number, em: number) => {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if (cur.length && est([...cur, w], em) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else cur = [...cur, w];
  }
  if (cur.length) rows.push(cur);
  return rows;
};
const wrapBalanced = (text: string, maxEm: number, em: number) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const n = greedy(words, maxEm, em).length;
  let lo = 0;
  let hi = maxEm;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, mid, em).length <= n) hi = mid;
    else lo = mid;
  }
  return greedy(words, hi, em);
};
export const fitRows = (text: string, maxW: number, base: number, maxLines: number, em: number = EM.semibold) => {
  let size = base;
  let rows = wrapBalanced(text, maxW / size, em);
  for (let i = 0; i < 8; i++) {
    const longest = Math.max(0, ...rows.map((r) => est(r, em))) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size, em);
  }
  return { rows, size };
};

// ---------- shot 3 geometry (frame px; pass u = 1 for design units) ----------
export const productGeometry = (W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const sw = L.winW * u;
  const sh = tall ? (sw * 19.5) / 9 : sw / SLOT_ASPECT.wide;
  if (tall) {
    const bw = sw + 2 * BEZEL * u;
    const bh = sh + 2 * BEZEL * u;
    const x = (W - bw) / 2;
    const y = (H - bh) / 2 + 40 * u;
    return { frame: { x, y, w: bw, h: bh }, slot: { x: x + BEZEL * u, y: y + BEZEL * u, w: sw, h: sh } };
  }
  const wh = sh + L.chrome * u;
  const x = (W - sw) / 2;
  const y = (H - wh) / 2 + 12 * u;
  return { frame: { x, y, w: sw, h: wh }, slot: { x, y: y + L.chrome * u, w: sw, h: sh } };
};

// Callouts: each pill sits beside the screen on the point's side (left half → left), its near edge joined to the
// point by a hairline. Pills on one side are spaced so they never overlap, and kept inside the frame.
export const pillWidth = (text: string, fs: number) => text.length * EM.semibold * fs + 2 * 0.86 * fs + 0.36 * fs + 0.43 * fs;
export const calloutLayout = (labels: string[], pts: Point[], W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const { slot } = productGeometry(W, H, u, tall);
  const fs = L.pill * u;
  const ph = L.pillH * u;
  const edge = (tall ? 48 : 56) * u;
  const gutter = (tall ? 32 : 40) * u;
  const items = pts.map((pt, i) => {
    const at = pointOn(pt, slot.x, slot.y, slot.w, slot.h);
    const side: "left" | "right" = pt.x < 0.5 ? "left" : "right";
    const w = pillWidth(labels[i] || "", fs);
    let near =
      side === "right" ? Math.max(at.x + 72 * u, slot.x + slot.w + gutter) : Math.min(at.x - 72 * u, slot.x - gutter);
    near = side === "right" ? Math.min(near, W - edge - w) : Math.max(near, edge + w);
    return { i, at, side, near, w, y: at.y };
  });
  const gap = ph + 14 * u;
  const minY = 80 * u + ph / 2;
  const maxY = H - 150 * u - ph / 2;
  for (const side of ["left", "right"] as const) {
    const group = items.filter((c) => c.side === side).sort((a, b) => a.y - b.y);
    for (let k = 0; k < group.length; k++) group[k].y = Math.max(group[k].y, minY, k ? group[k - 1].y + gap : -Infinity);
    for (let k = group.length - 1; k >= 0; k--) group[k].y = Math.min(group[k].y, k < group.length - 1 ? group[k + 1].y - gap : maxY);
  }
  return { items, fs, ph, slot };
};

// ---------- pieces ----------
const Rise: React.FC<{ rows: string[][]; local: number; start: number; align: "center" | "left"; lineHeight: number; dur?: number }> = ({
  rows,
  local,
  start,
  align,
  lineHeight,
  dur = T.wordDur,
}) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em" }}>
            <div style={{ display: "flex", justifyContent: align === "left" ? "flex-start" : "center", gap: "0.25em", whiteSpace: "nowrap", lineHeight }}>
              {words.map((w, i) => {
                const s = start + STAGGER * Math.min(first + i, T.maxStagger);
                const t = progress(local, s, s + dur, "enter");
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

// Quiet corner captions: shot counter (or timecode) bottom-left, the launch date bottom-right.
const Marks: React.FC<{ left?: string; right?: string; ink: string; rule?: number }> = ({ left, right, ink, rule }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const m = L.margin * u;
  const b = L.marksBottom * u;
  const text: React.CSSProperties = {
    position: "absolute",
    bottom: b,
    fontFamily: FONT_MONO,
    fontSize: 20 * u,
    letterSpacing: "0.1em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: alpha(ink, 0.5),
  };
  return (
    <>
      {rule !== undefined ? (
        <div
          style={{
            position: "absolute",
            left: m,
            right: m,
            bottom: b + 40 * u,
            height: STROKE.hair * u,
            background: alpha(ink, 0.22),
            transformOrigin: "0 50%",
            transform: `scaleX(${rule.toFixed(4)})`,
          }}
        />
      ) : null}
      {left ? <div style={{ ...text, left: m }}>{left.toUpperCase()}</div> : null}
      {right ? <div style={{ ...text, right: m }}>{right.toUpperCase()}</div> : null}
    </>
  );
};

// A watch-bezel ring: 60 ticks (every fifth long) in one path, a dim track and an accent arc drawn to `t`.
const BezelRing: React.FC<{ cx: number; cy: number; r: number; t: number; ink: string; accent: string; ticks: number }> = ({
  cx,
  cy,
  r,
  t,
  ink,
  accent,
  ticks,
}) => {
  const { u, width, height } = useLayout();
  const d = React.useMemo(() => {
    let s = "";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const r1 = r + TICKS.gap * u;
      const r2 = r1 + (i % 5 === 0 ? TICKS.major : TICKS.minor) * u;
      s += `M${(cx + Math.cos(a) * r1).toFixed(2)} ${(cy + Math.sin(a) * r1).toFixed(2)}L${(cx + Math.cos(a) * r2).toFixed(2)} ${(cy + Math.sin(a) * r2).toFixed(2)}`;
    }
    return s;
  }, [cx, cy, r, u]);
  const c = 2 * Math.PI * r;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <path d={d} stroke={ink} strokeOpacity={0.22 * ticks} strokeWidth={STROKE.hair * u} fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke={ink} strokeOpacity={0.18} strokeWidth={STROKE.hair * u} fill="none" />
      {t > 0 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={accent}
          strokeWidth={STROKE.ring * u}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.min(1, t))}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ) : null}
    </svg>
  );
};

// ---------- shot 1: countdown ----------
const CountdownShot: React.FC<{ p: LaunchDayProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.dark);
  const cx = width / 2;
  const cy = height / 2;
  const R = L.ring * u;
  const size = L.digit * u;
  const cell = size * DIGIT_CELL;
  const pos = T.rolls.reduce((a, r) => a + progress(local, r[0], r[1], "travel"), 0);
  const v = 3 - pos; // visible cell: 3 = blank, 2 = "3", 1 = "2", 0 = "1"
  const sec = Math.min(2, Math.floor(local / T.second));
  const arc = Math.min(1, (local - sec * T.second) / T.second);
  const push = mix(1, T.push1, progress(local, 0, SHOTS[1], "travel"));
  const k = progress(local, T.kicker[0], T.kicker[1], "enter");
  const ticks = progress(local, 0, 12, "enter");
  const kickerY = cy - R - (TICKS.gap + TICKS.major) * u - 56 * u;
  return (
    <>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})` }}>
        <BezelRing cx={cx} cy={cy} r={R} t={arc} ink={ink} accent={p.accent} ticks={ticks} />
        <div
          style={{
            position: "absolute",
            left: cx - size * 0.45,
            top: cy - cell / 2,
            width: size * 0.9,
            height: cell,
            overflow: "hidden",
            fontFamily: FONT_SANS,
            fontWeight: 600,
            fontSize: size,
            letterSpacing: `${TRACK.digit}em`,
            color: ink,
            textAlign: "center",
          }}
        >
          <div style={{ transform: `translateY(${(-v * cell).toFixed(2)}px)` }}>
            {["1", "2", "3", ""].map((d, i) => (
              <div key={i} style={{ height: cell, lineHeight: `${cell}px` }}>
                {d}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: kickerY,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14 * u,
            opacity: k,
            transform: `translateY(${((1 - k) * 12 * u).toFixed(2)}px)`,
          }}
        >
          <div style={{ width: 10 * u, height: 10 * u, borderRadius: 999, background: p.accent }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: L.kicker * u, letterSpacing: "0.12em", lineHeight: 1, color: alpha(ink, 0.6), whiteSpace: "nowrap" }}>
            {p.kicker.toUpperCase()}
          </div>
        </div>
      </AbsoluteFill>
      <Marks left={`T–00:0${3 - sec}`} right={p.date} ink={ink} rule={progress(local, T.rule[0], T.rule[1], "enter")} />
    </>
  );
};

// ---------- shot 2: name ----------
const NameShot: React.FC<{ p: LaunchDayProps; local: number }> = ({ p, local }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.pop);
  const name = fitRows(p.name, L.nameMaxW * u, L.name * u, L.nameLines, EM.semibold);
  const tag = fitRows(p.tagline, L.tagMaxW * u, L.tagline * u, L.tagLines, EM.regular);
  const push = mix(1, T.push2, progress(local, 0, SHOTS[2] - SHOTS[1], "travel"));
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push.toFixed(5)})` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: name.size, letterSpacing: `${TRACK.name}em`, color: ink }}>
            <Rise rows={name.rows} local={local} start={T.wordStart} align="center" lineHeight={LINE_H} />
          </div>
          <div
            style={{
              marginTop: (isVertical ? 44 : 36) * u,
              fontFamily: FONT_SANS,
              fontWeight: 400,
              fontSize: tag.size,
              letterSpacing: `${TRACK.tagline}em`,
              color: alpha(ink, 0.62),
            }}
          >
            <Rise rows={tag.rows} local={local} start={T.tagline} align="center" lineHeight={1.3} dur={T.tagDur} />
          </div>
        </div>
      </AbsoluteFill>
      <Marks left="02 / 05" right={p.date} ink={ink} />
    </>
  );
};

// ---------- shot 3: product + callouts ----------
const ArrowUp: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M12 4 L21 18 L3 18 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={2} />
  </svg>
);

const ProductShot: React.FC<{ p: LaunchDayProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.stage);
  const { frame, slot } = productGeometry(width, height, u, isVertical);
  const s = progress(local, T.enter3[0], T.enter3[1], "spring");
  const push = mix(1, T.push3Scale, progress(local, T.push3[0], T.push3[1], "travel"));
  const shadow = `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.05)}, 0 ${10 * u}px ${28 * u}px ${alpha(FILM.black, 0.08)}`;
  const labels = [p.feature1, p.feature2, p.feature3];
  const lay = calloutLayout(labels, pointsOf(p, isVertical), width, height, u, isVertical);
  const show = p.showCallouts !== false;
  const src = isVertical ? p.phoneShot || SAMPLE.phone : p.screenshot || SAMPLE.site;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: L.margin * u,
          top: (isVertical ? 96 : 56) * u,
          fontFamily: FONT_MONO,
          fontSize: 20 * u,
          letterSpacing: "0.1em",
          lineHeight: 1,
          color: alpha(ink, 0.5),
          whiteSpace: "nowrap",
        }}
      >
        {p.name.toUpperCase()}
      </div>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, perspective: 2400 * u }}>
        <AbsoluteFill
          style={{
            transformOrigin: `${width / 2}px ${frame.y + frame.h}px`,
            transform: `translateY(${((1 - s) * T.rise * u).toFixed(2)}px) rotateX(${((1 - s) * T.tilt).toFixed(3)}deg)`,
          }}
        >
          {isVertical ? (
            <div
              style={{
                position: "absolute",
                left: frame.x,
                top: frame.y,
                width: frame.w,
                height: frame.h,
                borderRadius: RADIUS.hero * u,
                background: FILM.black,
                boxShadow: shadow,
              }}
            >
              <Screenshot src={src} x={BEZEL * u} y={BEZEL * u} w={slot.w} h={slot.h} radius={RADIUS.card * u} />
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                left: frame.x,
                top: frame.y,
                width: frame.w,
                height: frame.h,
                borderRadius: RADIUS.card * u,
                overflow: "hidden",
                background: UI.card,
                boxShadow: shadow,
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: L.chrome * u, borderBottom: `${u}px solid ${UI.line}` }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: (26 + i * 22) * u,
                      top: (L.chrome / 2 - 6) * u,
                      width: 12 * u,
                      height: 12 * u,
                      borderRadius: 999,
                      background: alpha(UI.ink3, 0.45),
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: frame.w / 2 - 230 * u,
                    top: (L.chrome / 2 - 17) * u,
                    width: 460 * u,
                    height: 34 * u,
                    borderRadius: 999,
                    background: UI.fill,
                    fontFamily: FONT_MONO,
                    fontSize: 16 * u,
                    lineHeight: `${34 * u}px`,
                    color: UI.ink2,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {p.url}
                </div>
              </div>
              <Screenshot src={src} x={0} y={L.chrome * u} w={slot.w} h={slot.h} radius={0} />
              <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.card * u, boxShadow: `inset 0 0 0 ${u}px ${alpha(FILM.black, 0.08)}` }} />
            </div>
          )}

          {show ? (
            <>
              <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                {lay.items.map((c) => {
                  const st = T.calls[c.i];
                  if (local < st) return null;
                  const d = progress(local, st, st + T.callDot, "spring");
                  const t = progress(local, st + T.callLine[0], st + T.callLine[1], "enter");
                  return (
                    <g key={c.i}>
                      <line
                        x1={c.at.x}
                        y1={c.at.y}
                        x2={mix(c.at.x, c.near, t)}
                        y2={mix(c.at.y, c.y, t)}
                        stroke={p.accent}
                        strokeWidth={STROKE.hair * u}
                        opacity={t > 0 ? 1 : 0}
                      />
                      <circle cx={c.at.x} cy={c.at.y} r={20 * u * d} fill="none" stroke={p.accent} strokeOpacity={0.3} strokeWidth={STROKE.hair * u} />
                      <circle cx={c.at.x} cy={c.at.y} r={8 * u * d} fill={p.accent} stroke={FILM.white} strokeWidth={STROKE.ring * u} />
                    </g>
                  );
                })}
              </svg>
              {lay.items.map((c) => {
                const st = T.calls[c.i] + T.callPill[0];
                const k = progress(local, st, T.calls[c.i] + T.callPill[1], "spring");
                if (k <= 0) return null;
                return (
                  <div
                    key={c.i}
                    style={{
                      position: "absolute",
                      left: c.near,
                      top: c.y - lay.ph / 2,
                      height: lay.ph,
                      transformOrigin: c.side === "right" ? "0 50%" : "100% 50%",
                      transform: `translateX(${c.side === "right" ? 0 : -100}%) scale(${(0.9 + 0.1 * k).toFixed(4)})`,
                      opacity: k,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.43 * lay.fs,
                      padding: `0 ${0.86 * lay.fs}px`,
                      borderRadius: 999,
                      background: UI.card,
                      boxShadow: `inset 0 0 0 ${u}px ${UI.line}, ${shadow}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ width: 0.36 * lay.fs, height: 0.36 * lay.fs, borderRadius: 999, background: p.accent, flexShrink: 0 }} />
                    <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: lay.fs, letterSpacing: "-0.01em", lineHeight: 1, color: UI.ink }}>
                      {labels[c.i]}
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
      <Marks left="03 / 05" right={p.date} ink={ink} />
    </>
  );
};

// ---------- shot 4: upvotes ----------
export const PEOPLE = [SAMPLE.avatar, ...SAMPLE.people.map((x) => x.photo)];

const VotesShot: React.FC<{ p: LaunchDayProps; local: number }> = ({ p, local }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.warm);
  const votes = votesOf(p);
  const push = mix(1, T.push4, progress(local, 0, SHOTS[4] - SHOTS[3], "travel"));
  const on = progress(local, T.press, T.press + 4, "enter");
  const dip = interpolate(local, [T.press - 2, T.press + 1, T.press + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const n = mix(votes * T.countFrom, votes, progress(local, T.count[0], T.count[1], "enter"));
  const fs = countSize(L.count * u, votes);
  const pad = 56 * u;
  const btnW = 150 * u;
  const btnH = 168 * u;
  const av = L.avatar * u;
  const overlap = 0.28 * av;
  const head = progress(local, 0, 18, "enter");

  const button = (
    <div
      style={{
        position: "relative",
        width: btnW,
        height: btnH,
        flexShrink: 0,
        borderRadius: RADIUS.button * u,
        boxShadow: `inset 0 0 0 ${STROKE.ring * u}px ${UI.line}`,
        background: UI.card,
        transform: `scale(${(1 - 0.05 * dip).toFixed(4)})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * u, background: p.accent, opacity: on }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 56 * u, height: 56 * u }}>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - on }}>
            <ArrowUp size={56 * u} color={p.accent} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: on }}>
            <ArrowUp size={56 * u} color={FILM.white} />
          </div>
        </div>
      </div>
    </div>
  );
  const count = (
    <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: fs, letterSpacing: `${TRACK.count}em`, lineHeight: 1, color: UI.ink, whiteSpace: "nowrap" }}>
      {thousands(n)}
    </div>
  );
  const crowd = (
    <div style={{ display: "flex", alignItems: "center", gap: 20 * u }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {PEOPLE.map((src, i) => {
          const k = progress(local, T.avatars + i * STAGGER, T.avatars + i * STAGGER + T.avatarDur, "spring");
          return (
            <div
              key={i}
              style={{
                width: av,
                height: av,
                marginLeft: i ? -overlap : 0,
                borderRadius: 999,
                overflow: "hidden",
                boxShadow: `0 0 0 ${4 * u}px ${UI.card}`,
                background: UI.fill,
                opacity: k,
                transform: `scale(${(0.6 + 0.4 * k).toFixed(4)})`,
              }}
            >
              <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
            </div>
          );
        })}
      </div>
      {(() => {
        const k = progress(local, T.chip, T.chip + 20, "spring");
        return (
          <div
            style={{
              height: 48 * u,
              padding: `0 ${18 * u}px`,
              borderRadius: 999,
              background: UI.ink,
              color: UI.onButton,
              fontFamily: FONT_MONO,
              fontSize: 22 * u,
              lineHeight: `${48 * u}px`,
              whiteSpace: "nowrap",
              opacity: k,
              transform: `scale(${(0.9 + 0.1 * k).toFixed(4)})`,
            }}
          >
            {`+${compact(votes)}`}
          </div>
        );
      })()}
    </div>
  );
  const card: React.CSSProperties = {
    width: L.cardW * u,
    borderRadius: RADIUS.card * u,
    background: UI.card,
    boxShadow: `inset 0 0 0 ${u}px ${UI.line}, 0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
    padding: pad,
    opacity: head,
    transform: `translateY(${((1 - head) * 24 * u).toFixed(2)}px)`,
  };
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push.toFixed(5)})` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 28 * u }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22 * u,
              letterSpacing: "0.12em",
              lineHeight: 1,
              color: p.accent,
              whiteSpace: "nowrap",
              opacity: head,
            }}
          >
            {p.rank.toUpperCase()}
          </div>
          {isVertical ? (
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 40 * u }}>
                {button}
                {count}
              </div>
              <div style={{ height: STROKE.hair * u, background: UI.line, margin: `${40 * u}px 0` }} />
              {crowd}
            </div>
          ) : (
            <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 48 * u }}>
                {button}
                {count}
              </div>
              {crowd}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Marks left="04 / 05" right={p.date} ink={ink} />
    </>
  );
};

// ---------- shot 5: live now ----------
const LiveShot: React.FC<{ p: LaunchDayProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.dark);
  const cx = width / 2;
  const cy = height / 2;
  const R = L.ring5 * u;
  const ring = progress(local, T.ring5[0], T.ring5[1], "enter");
  const dateSize = Math.min(L.date5 * u, (1.6 * R) / (Math.max(1, p.date.length) * EM.mono));
  const dt = progress(local, T.date5[0], T.date5[1], "travel");
  const cta = fitRows(p.cta, L.ctaMaxW * u, L.cta * u, L.ctaLines, EM.semibold);
  const outer = R + (TICKS.gap + TICKS.major) * u;
  const urlK = progress(local, T.url5[0], T.url5[1], "spring");
  const logoK = progress(local, T.logo5[0], T.logo5[1], "enter");
  return (
    <>
      <BezelRing cx={cx} cy={cy} r={R} t={ring} ink={ink} accent={p.accent} ticks={1} />
      <div
        style={{
          position: "absolute",
          left: cx - R,
          top: cy - dateSize * 0.65,
          width: 2 * R,
          height: dateSize * 1.3,
          overflow: "hidden",
          fontFamily: FONT_MONO,
          fontSize: dateSize,
          lineHeight: `${dateSize * 1.3}px`,
          letterSpacing: "0.02em",
          color: ink,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ transform: `translateY(${((dt - 1) * 110).toFixed(3)}%)` }}>{p.date}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: height - (cy - outer - 48 * u),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          fontFamily: FONT_SANS,
          fontWeight: 600,
          fontSize: cta.size,
          letterSpacing: `${TRACK.cta}em`,
          color: ink,
        }}
      >
        <Rise rows={cta.rows} local={local} start={T.cta5} align="center" lineHeight={LINE_H} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy + outer + 48 * u,
          display: "flex",
          justifyContent: "center",
          opacity: urlK,
          transform: `translateY(${((1 - urlK) * 24 * u).toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            height: L.urlH * u,
            padding: `0 ${36 * u}px`,
            borderRadius: 999,
            background: FILM.white,
            display: "flex",
            alignItems: "center",
            gap: 16 * u,
          }}
        >
          <div style={{ width: 14 * u, height: 14 * u, borderRadius: 999, background: p.accent }} />
          <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: L.url * u, letterSpacing: "-0.015em", lineHeight: 1, color: UI.ink, whiteSpace: "nowrap" }}>
            {p.url}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: L.margin * u, bottom: L.marksBottom * u, opacity: logoK }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.dark} />
      </div>
    </>
  );
};

export const LaunchDay: React.FC<LaunchDayProps> = (p) => {
  const { index, local } = useShot(SHOTS);
  const bg = [p.dark, p.pop, p.stage, p.warm, p.dark][index];
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <CountdownShot p={p} local={local} /> : null}
      {index === 1 ? <NameShot p={p} local={local} /> : null}
      {index === 2 ? <ProductShot p={p} local={local} /> : null}
      {index === 3 ? <VotesShot p={p} local={local} /> : null}
      {index === 4 ? <LiveShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
