import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Cursor, FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STATE, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import { parseArea, type Area } from "../../placement";

export type HowItWorksProps = {
  title: string; // shot 1 hook
  step1: string;
  step2: string;
  step3: string;
  detail1: string;
  detail2: string;
  detail3: string;
  result: string; // the toast on step 3's screenshot
  cta: string; // end card title, underlined by the track
  url: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  resultArea: string; // 16:9: "x,y,w,h" of the screenshot slot the camera pushes toward
  resultAreaTall: string; // 9:16: the same on the phone screen
  showCursor: boolean; // the cursor clicking the toggles and dragging the row (the UI still plays without it)
  accent: string; // the track fill, toggles, dragged row, underline
  hook: string; // shot 1 field
  field1: string; // step 1 field
  field2: string; // step 2 field
  field3: string; // step 3 field
  end: string; // end card field
};

// ---------- timeline (frames of the 540-frame film; every shot is a hard cut) ----------
export const SHOTS = [0, 75, 210, 345, 465] as const; // step 3 runs 120f so the end card (75f) holds the CTA 1.5s+
// The motif: three dots on a hairline track. Dots sit at the centres of three equal segments, so each step fills to
// its dot and the end card completes the line, which becomes the CTA's underline.
export const DOTS = [1 / 6, 1 / 2, 5 / 6] as const;

// Timings below are local to their shot.
export const T = {
  hook: { words: 0, wordDur: 16, cap: 4, line: [8, 34] as const, dotDur: 14, labelDelay: 4, labelDur: 16, marks: [18, 38] as const },
  step: { numeral: [0, 24] as const, words: 4, wordDur: 16, cap: 6, detail: [16, 36] as const, fill: [6, 32] as const, pop: [30, 46] as const, card: [6, 30] as const, push: 0.03 },
  connect: {
    enter: [22, 46] as const,
    clicks: [50, 78, 106] as const,
    moves: [[58, 76], [86, 104]] as const,
    toggle: 14,
    done: [112, 128] as const,
    rest: [112, 130] as const,
  },
  reorder: {
    enter: [22, 46] as const,
    press: 48,
    lift: [48, 60] as const,
    drag: [54, 84] as const,
    admin: [56, 72] as const, // Admin steps down as the dragged row passes it
    meetings: [66, 82] as const, // then Meetings
    drop: [90, 104] as const,
    saved: [96, 112] as const,
    rest: [100, 124] as const,
  },
  result: { zoom: [23, 89] as const, toast: [85, 101] as const }, // 135f beats scaled to the 120f shot
  end: { words: 0, wordDur: 16, cap: 4, line: [6, 30] as const, dotDur: 12, dotsOut: [34, 44] as const, marks: [12, 30] as const },
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    margin: 96, mono: 20,
    hookTitle: 130, hookMaxW: 1500, hookLines: 2, hookTrack: 760, hookGap: 88, hookR: 9, hookLogo: 32,
    numeral: 220, stepTitle: 72, stepMaxW: 680, stepLines: 2, detail: 34, detailMaxW: 640,
    track: 320, trackR: 6, trackFill: STROKE.ring,
    cardFit: 900, cursor: 1.4, phoneW: 0, windowW: 960, // cards scale 800→900 so their smallest text is ≥20u
    cta: 120, ctaMaxW: 1500, ctaLines: 2, endR: 9, logo: 44,
  },
  tall: {
    margin: 72, mono: 22,
    hookTitle: 116, hookMaxW: 936, hookLines: 4, hookTrack: 720, hookGap: 96, hookR: 9, hookLogo: 40,
    numeral: 200, stepTitle: 88, stepMaxW: 936, stepLines: 3, detail: 40, detailMaxW: 900,
    track: 300, trackR: 6, trackFill: STROKE.ring,
    cardFit: 936, cursor: 1.4, phoneW: 520, windowW: 0,
    cta: 116, ctaMaxW: 936, ctaLines: 3, endR: 9, logo: 56,
  },
} as const;
export const LINE_H = 1.02;
export const BODY_LH = 1.4;
export const TRACKING = { display: -0.045, step: -0.035, numeral: -0.05, body: -0.01 } as const;
export const NUM_OVERLAP = 0.82; // the step title starts this far (in numeral ems) below the numeral's top, just under its digits
export const TEXT_GAP = 28;
export const CARD_W = 800; // every UI card is designed 800 wide, then scaled to fit
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

// ---------- the UI cards (design px, 800 wide) ----------
export const CONNECT = { h: 528, header: 112, row: 112, footer: 448, pad: 40, toggle: { x: 684, w: 76, h: 44, knob: 36 } } as const;
export const SOURCES = [
  { name: "Work calendar", sub: "you@work.com" },
  { name: "Personal", sub: "Personal account" },
  { name: "Team", sub: "Shared · 6 people" },
] as const;
export const REORDER = { h: 488, header: 112, top: 132, tile: 96, step: 116, pad: 28, barMax: 160 } as const;
// Rows in their starting slots: Deep work starts at the bottom and is dragged to the top.
export const PRIORITIES = [
  { label: "Deep work", hours: 12, from: 2, to: 0 },
  { label: "Meetings", hours: 6, from: 0, to: 1 },
  { label: "Admin", hours: 3, from: 1, to: 2 },
] as const;
export const WINDOW = { chrome: 52, aspect: 10 / 16 } as const; // 16:10 screenshot slot under a 52px browser bar
export const PHONE_ASPECT = 19.5 / 9;
// Placement slot shapes (width / height), as drawn.
export const SLOT_ASPECT = { wide: 16 / 10, tall: 9 / 19.5 } as const;

// ---------- the camera push on step 3 ----------
// Defaults tuned to the samples: the Mon–Thu events in the site's week view; the first two event cards on the phone.
export const RESULT_AREA: Area = { x: 0.245, y: 0.66, w: 0.52, h: 0.24 };
export const RESULT_AREA_TALL: Area = { x: 0.05, y: 0.385, w: 0.55, h: 0.19 };
export const MAX_ZOOM = 2.4;
export const FILL = 0.9; // the area fills at most this much of the slot's width and height

export const resultAreaOf = (p: Pick<HowItWorksProps, "resultArea" | "resultAreaTall">, tall: boolean) =>
  tall ? parseArea(p.resultAreaTall, RESULT_AREA_TALL) : parseArea(p.resultArea, RESULT_AREA);

const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));
// Scale S fits the area into FILL of the slot (1×–MAX_ZOOM), the translate centres it, then is clamped per axis so the
// view never leaves the image.
export const zoomFor = (a: Area, sw: number, sh: number) => {
  const S = Math.min(MAX_ZOOM, Math.max(1, Math.min(FILL / a.w, FILL / a.h)));
  const tx = clampTo(sw / 2 - S * (a.x + a.w / 2) * sw, sw - S * sw, 0);
  const ty = clampTo(sh / 2 - S * (a.y + a.h / 2) * sh, sh - S * sh, 0);
  return { S, tx, ty };
};

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const inkOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
// UI cards: white on light fields, the Ink card on dark ones.
export const cardOn = (bg: string) => (isDark(bg) ? CANVAS.ink : CANVAS.paper);

// ---------- type layout: balanced rows, shrunk to fit ----------
// Average advance per character at display tracking; slightly generous so a row never overflows.
export const EM = { semibold: 0.56, medium: 0.54 } as const;
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
export const fitRows = (text: string, maxW: number, base: number, maxLines: number, em: number) => {
  let size = base;
  let rows = wrapBalanced(text, maxW / size, em);
  for (let i = 0; i < 7; i++) {
    const longest = Math.max(0, ...rows.map((r) => est(r, em))) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size, em);
  }
  return { rows, size };
};

// ---------- geometry shared with the prompt (pass u = 1 for design px) ----------
export const hookLayout = (title: string, W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const t = fitRows(title, L.hookMaxW * u, L.hookTitle * u, L.hookLines, EM.semibold);
  const titleH = t.rows.length * t.size * LINE_H;
  const blockH = titleH + L.hookGap * u + 2 * L.hookR * u + 28 * u + L.mono * u * 1.2;
  const top = (H - blockH) / 2;
  const trackW = L.hookTrack * u;
  return { L, rows: t.rows, size: t.size, top, trackX: (W - trackW) / 2, trackY: top + titleH + L.hookGap * u + L.hookR * u, trackW };
};

export const stepLayout = (title: string, detail: string, W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const t = fitRows(title, L.stepMaxW * u, L.stepTitle * u, L.stepLines, EM.medium);
  const titleH = t.rows.length * t.size * LINE_H;
  const dLines = Math.max(1, Math.ceil((detail.trim().length * 0.52 * L.detail) / L.detailMaxW));
  const detailH = dLines * L.detail * u * BODY_LH;
  const numH = L.numeral * u * NUM_OVERLAP;
  const total = numH + titleH + TEXT_GAP * u + detailH;
  const trackY = (L.margin + 8) * u;
  const top = tall ? trackY + 84 * u : (H - total) / 2 + 24 * u;
  return {
    L,
    rows: t.rows,
    size: t.size,
    x: L.margin * u,
    trackY,
    numTop: top,
    titleTop: top + numH,
    detailTop: top + numH + titleH + TEXT_GAP * u,
    bottom: top + total,
  };
};

// Where a UI card (designed CARD_W × h) sits: the right column at 16:9; below the text, full width, at 9:16.
export const cardBox = (h: number, W: number, H: number, u: number, tall: boolean, textBottom: number) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  if (!tall) return { cx: W - L.margin * u - (L.cardFit * u) / 2, cy: H / 2 + 24 * u, k: L.cardFit / CARD_W };
  const top = textBottom + 64 * u;
  const regionH = H - L.margin * u - top;
  const k = Math.min(L.cardFit / CARD_W, regionH / (h * u));
  return { cx: W / 2, cy: top + regionH / 2, k };
};

// Step 3's frame: a 16:10 browser window at 16:9, a phone screen at 9:16.
export const resultBox = (W: number, H: number, u: number, tall: boolean, textBottom: number) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  if (!tall) {
    const sw = L.windowW * u;
    const sh = sw * WINDOW.aspect;
    return { w: sw, h: sh + WINDOW.chrome * u, sw, sh, chrome: WINDOW.chrome * u, cx: W - L.margin * u - sw / 2, cy: H / 2 + 24 * u };
  }
  const top = textBottom + 64 * u;
  const regionH = H - L.margin * u - top;
  const sh = Math.min(L.phoneW * u * PHONE_ASPECT, regionH);
  const sw = sh / PHONE_ASPECT;
  return { w: sw, h: sh, sw, sh, chrome: 0, cx: W / 2, cy: top + regionH / 2 };
};

// First frame on which an eased 0→1 run reaches `pos` (a dot pops when the line reaches it).
export const crossAt = (from: number, to: number, ease: string, pos: number) => {
  for (let f = from; f <= to; f++) if (progress(f, from, to, ease) >= pos) return f;
  return to;
};

// ---------- pieces ----------
type Pt = [number, number];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// A slight arc between two points, as a hand moves a mouse.
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// Word rise: each row is its own mask (padding keeps descenders inside, the negative margin gives the space back).
// `last` renders inside a wrapper exactly as wide as the last row's text (the underline hangs off it).
const Rise: React.FC<{ rows: string[][]; local: number; start: number; dur: number; cap: number; align: "flex-start" | "center"; last?: React.ReactNode }> = ({
  rows,
  local,
  start,
  dur,
  cap,
  align,
  last,
}) => {
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align }}>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ position: "relative" }}>
            <div style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em -0.08em" }}>
              <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: LINE_H }}>
                {words.map((w, i) => {
                  const s = start + STAGGER * Math.min(first + i, cap);
                  const t = progress(local, s, s + dur, "enter");
                  return (
                    <span key={i} style={{ display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>
                      {w}
                    </span>
                  );
                })}
              </div>
            </div>
            {r === rows.length - 1 ? last : null}
          </div>
        );
      })}
    </div>
  );
};

const circle = (cx: number, cy: number, r: number, style: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  left: cx - r,
  top: cy - r,
  width: 2 * r,
  height: 2 * r,
  borderRadius: r,
  ...style,
});

// The motif: hairline track, accent fill, three dots. (x, y) is the line's left end and centre line.
const Track: React.FC<{
  u: number;
  x: number;
  y: number;
  w: number;
  r: number;
  draw: number; // 0–1 of the hairline drawn
  fill: number; // 0–1 of the accent fill
  fillW: number; // fill thickness, design px
  dotIn: readonly number[]; // hollow dot scale
  reach: readonly number[]; // accent dot scale
  ink: string;
  field: string;
  accent: string;
}> = ({ u, x, y, w, r, draw, fill, fillW, dotIn, reach, ink, field, accent }) => {
  const hair = STROKE.hair * u;
  const fw = fillW * u;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y - hair / 2, width: w * draw, height: hair, background: alpha(ink, 0.25) }} />
      {fill > 0 ? <div style={{ position: "absolute", left: x, top: y - fw / 2, width: w * fill, height: fw, borderRadius: fw / 2, background: accent }} /> : null}
      {DOTS.map((pos, i) => {
        const cx = x + pos * w;
        return (
          <React.Fragment key={i}>
            {dotIn[i] > 0 ? (
              <div style={circle(cx, y, r * u, { background: field, boxShadow: `inset 0 0 0 ${hair}px ${alpha(ink, 0.3)}`, transform: `scale(${dotIn[i].toFixed(4)})` })} />
            ) : null}
            {reach[i] > 0 ? <div style={circle(cx, y, r * u, { background: accent, transform: `scale(${reach[i].toFixed(4)})` })} /> : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

const mono = (size: number, color: string): React.CSSProperties => ({ fontFamily: FONT_MONO, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap" });

// A card that springs in (fade + rise) and, for steps 1–2, takes a slow linear push.
const Stage: React.FC<{ u: number; cx: number; cy: number; w: number; h: number; k: number; local: number; push: number; children: React.ReactNode }> = ({
  u,
  cx,
  cy,
  w,
  h,
  k,
  local,
  push,
  children,
}) => {
  const e = progress(local, T.step.card[0], T.step.card[1], "spring");
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        opacity: Math.min(1, e * 1.4),
        transformOrigin: "50% 50%",
        transform: `translateY(${((1 - e) * 60 * u).toFixed(3)}px) scale(${(k * push).toFixed(4)})`,
      }}
    >
      {children}
    </div>
  );
};

const surface = (u: number, tk: (typeof CANVAS)[keyof typeof CANVAS], dark: boolean): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  borderRadius: RADIUS.card * u,
  background: tk.card,
  boxShadow: dark
    ? `0 0 0 ${u}px ${tk.line}`
    : `0 0 0 ${u}px ${alpha(FILM.black, 0.06)}, 0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
});

const CardHeader: React.FC<{ u: number; tk: (typeof CANVAS)[keyof typeof CANVAS]; title: string; sub: string }> = ({ u, tk, title, sub }) => (
  <>
    <div style={{ position: "absolute", left: 40 * u, top: 32 * u, fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, color: tk.ink, whiteSpace: "nowrap" }}>{title}</div>
    <div style={{ position: "absolute", left: 40 * u, top: 74 * u, ...mono(18 * u, tk.ink3) }}>{sub}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 112 * u, height: u, background: tk.line }} />
  </>
);

// Step 1: three calendar sources, toggled on one by one.
const ConnectCard: React.FC<{ u: number; local: number; field: string; accent: string; showCursor: boolean; cursor: number }> = ({ u, local, field, accent, showCursor, cursor }) => {
  const dark = isDark(field);
  const tk = cardOn(field);
  const C = T.connect;
  const tg = CONNECT.toggle;
  const rowY = (i: number) => CONNECT.header + CONNECT.row / 2 + i * CONNECT.row;
  const on = C.clicks.map((c) => progress(local, c, c + C.toggle, "spring"));
  const count = C.clicks.filter((c) => local >= c + 4).length;
  const done = progress(local, C.done[0], C.done[1], "enter");

  // cursor path (design px): in from off-frame, toggle → toggle → toggle, then off to rest
  const tip = (i: number): Pt => [tg.x + tg.w / 2 + 2, rowY(i) + 4];
  const start: Pt = [980, 640];
  const rest: Pt = [700, 580];
  let cur: Pt = start;
  if (local <= C.enter[1]) cur = glide(start, tip(0), progress(local, C.enter[0], C.enter[1], "travel"));
  else if (local <= C.moves[0][1]) cur = glide(tip(0), tip(1), progress(local, C.moves[0][0], C.moves[0][1], "travel"));
  else if (local <= C.moves[1][1]) cur = glide(tip(1), tip(2), progress(local, C.moves[1][0], C.moves[1][1], "travel"));
  else cur = glide(tip(2), rest, progress(local, C.rest[0], C.rest[1], "travel"));
  const press = Math.max(...C.clicks.map((c) => interpolate(local, [c - 2, c + 1, c + 7], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  return (
    <>
      <div style={surface(u, tk, dark)} />
      <CardHeader u={u} tk={tk} title="Connect calendars" sub="3 sources found" />
      <div style={{ position: "absolute", right: 40 * u, top: 42 * u, ...mono(20 * u, count === 3 ? tk.ink : tk.ink3) }}>{`${count} / 3 connected`}</div>
      {SOURCES.map((s, i) => {
        const cy = rowY(i);
        return (
          <React.Fragment key={i}>
            {i > 0 ? <div style={{ position: "absolute", left: 40 * u, right: 40 * u, top: (CONNECT.header + i * CONNECT.row) * u, height: u, background: tk.line }} /> : null}
            <div style={{ position: "absolute", left: 40 * u, top: (cy - 28) * u, width: 56 * u, height: 56 * u, borderRadius: RADIUS.button * u, background: tk.fill }}>
              <svg width={28 * u} height={28 * u} viewBox="0 0 28 28" style={{ position: "absolute", left: 14 * u, top: 14 * u }}>
                <g fill="none" stroke={tk.ink2} strokeWidth={STROKE.ring} strokeLinecap="round">
                  <rect x={3} y={6} width={22} height={19} rx={5} />
                  <line x1={3} y1={12} x2={25} y2={12} />
                  <line x1={9} y1={3} x2={9} y2={8} />
                  <line x1={19} y1={3} x2={19} y2={8} />
                </g>
              </svg>
            </div>
            <div style={{ position: "absolute", left: 120 * u, top: (cy - 31) * u, fontSize: 28 * u, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.1, color: tk.ink, whiteSpace: "nowrap" }}>{s.name}</div>
            <div style={{ position: "absolute", left: 120 * u, top: (cy + 9) * u, ...mono(18 * u, tk.ink3) }}>{s.sub}</div>
            <div style={{ position: "absolute", left: tg.x * u, top: (cy - tg.h / 2) * u, width: tg.w * u, height: tg.h * u, borderRadius: (tg.h / 2) * u, background: alpha(tk.ink, 0.12) }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: (tg.h / 2) * u, background: accent, opacity: on[i] }} />
              <div
                style={{
                  position: "absolute",
                  left: (4 + on[i] * (tg.w - tg.knob - 8)) * u,
                  top: 4 * u,
                  width: tg.knob * u,
                  height: tg.knob * u,
                  borderRadius: (tg.knob / 2) * u,
                  background: FILM.white,
                  boxShadow: `0 ${u}px ${3 * u}px ${alpha(FILM.black, 0.18)}`,
                }}
              />
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: CONNECT.footer * u, height: u, background: tk.line }} />
      <div style={{ position: "absolute", left: 40 * u, top: (CONNECT.footer + 31) * u, ...mono(18 * u, tk.ink3) }}>Read-only · syncs every 5 min</div>
      <div style={{ position: "absolute", right: 40 * u, top: (CONNECT.footer + 28) * u, display: "flex", alignItems: "center", gap: 10 * u, opacity: done }}>
        <div style={{ width: 10 * u, height: 10 * u, borderRadius: 5 * u, background: STATE.success }} />
        <div style={{ fontSize: 20 * u, fontWeight: 500, lineHeight: 1.2, color: tk.ink2, whiteSpace: "nowrap" }}>All connected</div>
      </div>
      {showCursor && local >= C.enter[0] ? <Cursor u={u} x={cur[0] * u} y={cur[1] * u} color={CANVAS.paper.ink} press={press} scale={cursor} /> : null}
    </>
  );
};

// Step 2: three priority rows; Deep work lifts from the bottom and springs to the top.
const ReorderCard: React.FC<{ u: number; local: number; field: string; accent: string; showCursor: boolean; cursor: number }> = ({ u, local, field, accent, showCursor, cursor }) => {
  const dark = isDark(field);
  const tk = cardOn(field);
  const R = T.reorder;
  const slot = (i: number) => REORDER.top + i * REORDER.step;
  const drag = progress(local, R.drag[0], R.drag[1], "spring");
  const lift = progress(local, R.lift[0], R.lift[1], "spring") * (1 - progress(local, R.drop[0], R.drop[1], "spring"));
  const moved = [drag, progress(local, R.meetings[0], R.meetings[1], "spring"), progress(local, R.admin[0], R.admin[1], "spring")];
  const y = PRIORITIES.map((r, i) => mix(slot(r.from), slot(r.to), moved[i]));
  const saved = progress(local, R.saved[0], R.saved[1], "enter");

  // the six-dot handle sits 28–40px into the tile; the tip lands on its middle
  const handle = (top: number): Pt => [REORDER.pad + 34, top + REORDER.tile / 2 + 4];
  const start: Pt = [980, 600];
  const rest: Pt = [660, 560];
  let cur: Pt = start;
  if (local <= R.enter[1]) cur = glide(start, handle(slot(2)), progress(local, R.enter[0], R.enter[1], "travel"));
  else if (local < R.rest[0]) cur = handle(y[0]);
  else cur = glide(handle(slot(0)), rest, progress(local, R.rest[0], R.rest[1], "travel"));
  const press = interpolate(local, [R.press - 2, R.press + 1, R.drop[0], R.drop[0] + 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tileW = CARD_W - 2 * REORDER.pad;
  const row = (i: number) => {
    const r = PRIORITIES[i];
    const dragged = i === 0;
    const l = dragged ? lift : 0;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: REORDER.pad * u,
          top: y[i] * u,
          width: tileW * u,
          height: REORDER.tile * u,
          borderRadius: RADIUS.button * u,
          background: tk.fill,
          transform: `scale(${(1 + 0.025 * l).toFixed(4)})`,
          boxShadow: l > 0 ? `0 ${12 * l * u}px ${28 * l * u}px ${alpha(FILM.black, 0.12 * l)}` : undefined,
        }}
      >
        {l > 0 ? <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * u, background: tk.card, boxShadow: `inset 0 0 0 ${STROKE.ring * u}px ${accent}`, opacity: l }} /> : null}
        <svg width={12 * u} height={20 * u} viewBox="0 0 12 20" style={{ position: "absolute", left: 28 * u, top: (REORDER.tile / 2 - 10) * u }}>
          <g fill={tk.ink3}>
            {[0, 1, 2].map((rr) => [2, 10].map((cx) => <circle key={`${rr}-${cx}`} cx={cx} cy={2 + rr * 8} r={2} />))}
          </g>
        </svg>
        <div style={{ position: "absolute", left: 64 * u, top: (REORDER.tile / 2 - 16) * u, fontSize: 28 * u, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15, color: tk.ink, whiteSpace: "nowrap" }}>{r.label}</div>
        <div
          style={{
            position: "absolute",
            right: 112 * u,
            top: (REORDER.tile / 2 - STROKE.bar / 2) * u,
            width: (r.hours / 12) * REORDER.barMax * u,
            height: STROKE.bar * u,
            borderRadius: (STROKE.bar / 2) * u,
            background: dragged ? accent : alpha(tk.ink, 0.18),
          }}
        />
        <div style={{ position: "absolute", right: 28 * u, top: (REORDER.tile / 2 - 10) * u, ...mono(20 * u, tk.ink2) }}>{`${r.hours} h`}</div>
      </div>
    );
  };

  return (
    <>
      <div style={surface(u, tk, dark)} />
      <CardHeader u={u} tk={tk} title="This week's priorities" sub="Drag to reorder" />
      <div style={{ position: "absolute", right: 40 * u, top: 40 * u, display: "flex", alignItems: "center", gap: 10 * u, opacity: saved }}>
        <div style={{ width: 10 * u, height: 10 * u, borderRadius: 5 * u, background: STATE.success }} />
        <div style={{ fontSize: 20 * u, fontWeight: 500, lineHeight: 1.2, color: tk.ink2, whiteSpace: "nowrap" }}>Order saved</div>
      </div>
      {row(2)}
      {row(1)}
      {row(0)}
      {showCursor && local >= R.enter[0] ? <Cursor u={u} x={cur[0] * u} y={cur[1] * u} color={CANVAS.paper.ink} press={press} scale={cursor} /> : null}
    </>
  );
};

const SHADOW_PX = (u: number) => `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.08)}`;

// Step 3: the user's screenshot (browser window) or phone screen; the camera pushes toward the result area.
const ResultFrame: React.FC<{ p: HowItWorksProps; u: number; local: number; tall: boolean; box: ReturnType<typeof resultBox> }> = ({ p, u, local, tall, box }) => {
  const tk = cardOn(p.field3);
  const dark = isDark(p.field3);
  const area = resultAreaOf(p, tall);
  const { S, tx, ty } = zoomFor(area, box.sw, box.sh);
  const z = progress(local, T.result.zoom[0], T.result.zoom[1], "travel");
  const s = mix(1, S, z);
  const src = tall ? p.phoneShot || SAMPLE.phone : p.screenshot || SAMPLE.site;
  const radius = (tall ? RADIUS.hero : RADIUS.card) * u;
  const toast = progress(local, T.result.toast[0], T.result.toast[1], "spring");
  const toastH = 64 * u;
  return (
    <>
      <div style={{ ...surface(u, tk, dark), borderRadius: radius, overflow: "hidden" }}>
        {!tall ? (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: box.chrome - u, height: u, background: tk.line }} />
            {[0, 1, 2].map((i) => (
              <div key={i} style={circle((28 + i * 20) * u, box.chrome / 2, 6 * u, { background: alpha(tk.ink, 0.15) })} />
            ))}
            <div
              style={{
                position: "absolute",
                left: box.sw / 2 - 160 * u,
                top: box.chrome / 2 - 15 * u,
                width: 320 * u,
                height: 30 * u,
                borderRadius: RADIUS.chip * u,
                background: tk.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={mono(20 * u, tk.ink3)}>{p.url}</div>
            </div>
          </>
        ) : null}
        <div style={{ position: "absolute", left: 0, top: box.chrome, width: box.sw, height: box.sh, overflow: "hidden" }}>
          <Screenshot src={src} x={z * tx} y={z * ty} w={box.sw * s} h={box.sh * s} radius={0} />
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 ${u}px ${alpha(FILM.black, 0.08)}` }} />
      </div>
      {toast > 0 ? (
        <div
          style={{
            position: "absolute",
            ...(tall ? { left: box.w / 2, transform: `translate(-50%, ${((1 - toast) * 16 * u).toFixed(3)}px)` } : { left: 28 * u, transform: `translateY(${((1 - toast) * 16 * u).toFixed(3)}px)` }),
            top: box.h - toastH - (tall ? 40 : 28) * u,
            height: toastH,
            padding: `0 ${24 * u}px`,
            borderRadius: RADIUS.button * u,
            background: tk.card,
            boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, ${SHADOW_PX(u)}`,
            display: "flex",
            alignItems: "center",
            gap: 14 * u,
            opacity: toast,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: 12 * u, height: 12 * u, borderRadius: 6 * u, background: p.accent }} />
          <div style={{ fontSize: 24 * u, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.2, color: tk.ink }}>{p.result}</div>
        </div>
      ) : null}
    </>
  );
};

// ---------- shot 1: the hook ----------
const HookShot: React.FC<{ p: HowItWorksProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = hookLayout(p.title, W, H, u, isVertical);
  const L = G.L;
  const ink = inkOn(p.hook);
  const draw = progress(local, T.hook.line[0], T.hook.line[1], "travel");
  const pops = DOTS.map((pos) => crossAt(T.hook.line[0], T.hook.line[1], "travel", pos));
  const dotIn = pops.map((c) => progress(local, c, c + T.hook.dotDur, "spring"));
  const marks = progress(local, T.hook.marks[0], T.hook.marks[1], "enter");
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: G.top, fontSize: G.size, fontWeight: 600, letterSpacing: `${TRACKING.display}em`, color: ink }}>
        <Rise rows={G.rows} local={local} start={T.hook.words} dur={T.hook.wordDur} cap={T.hook.cap} align="center" />
      </div>
      <Track u={u} x={G.trackX} y={G.trackY} w={G.trackW} r={L.hookR} draw={draw} fill={0} fillW={L.trackFill} dotIn={dotIn} reach={[0, 0, 0]} ink={ink} field={p.hook} accent={p.accent} />
      {DOTS.map((pos, i) => {
        const t = progress(local, pops[i] + T.hook.labelDelay, pops[i] + T.hook.labelDelay + T.hook.labelDur, "enter");
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: G.trackX + pos * G.trackW,
              top: G.trackY + L.hookR * u + 28 * u,
              transform: `translate(-50%, ${((1 - t) * 12 * u).toFixed(3)}px)`,
              opacity: t,
              ...mono(L.mono * u * 0.9, alpha(ink, 0.5)),
              letterSpacing: "0.12em",
            }}
          >
            {`STEP 0${i + 1}`}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: L.margin * u, top: L.margin * u, opacity: marks }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.hookLogo * u} color={ink} tile={ink} onTile={p.hook} />
      </div>
      <div style={{ position: "absolute", right: L.margin * u, top: L.margin * u + (L.hookLogo * u - L.mono * u) / 2, opacity: marks, ...mono(L.mono * u, alpha(ink, 0.5)) }}>{p.url}</div>
    </>
  );
};

// ---------- shots 2–4: the three steps ----------
const StepShot: React.FC<{ p: HowItWorksProps; n: 0 | 1 | 2; local: number; length: number }> = ({ p, n, local, length }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const field = [p.field1, p.field2, p.field3][n];
  const title = [p.step1, p.step2, p.step3][n];
  const detail = [p.detail1, p.detail2, p.detail3][n];
  const G = stepLayout(title, detail, W, H, u, isVertical);
  const L = G.L;
  const ink = inkOn(field);
  const S = T.step;
  const showCursor = p.showCursor !== false;

  const numIn = progress(local, S.numeral[0], S.numeral[1], "enter");
  const detIn = progress(local, S.detail[0], S.detail[1], "enter");
  const fill = mix(n === 0 ? 0 : DOTS[n - 1], DOTS[n], progress(local, S.fill[0], S.fill[1], "travel"));
  const reach = DOTS.map((_, i) => (i < n ? 1 : i === n ? progress(local, S.pop[0], S.pop[1], "spring") : 0));
  const push = 1 + S.push * progress(local, 0, length, "linear");
  const trackW = L.track * u;

  let card: React.ReactNode;
  if (n === 2) {
    const box = resultBox(W, H, u, isVertical, G.bottom);
    card = (
      <Stage u={u} cx={box.cx} cy={box.cy} w={box.w} h={box.h} k={1} local={local} push={1}>
        <ResultFrame p={p} u={u} local={local} tall={isVertical} box={box} />
      </Stage>
    );
  } else {
    const h = n === 0 ? CONNECT.h : REORDER.h;
    const b = cardBox(h, W, H, u, isVertical, G.bottom);
    const Card = n === 0 ? ConnectCard : ReorderCard;
    card = (
      <Stage u={u} cx={b.cx} cy={b.cy} w={CARD_W * u} h={h * u} k={b.k} local={local} push={push}>
        <Card u={u} local={local} field={field} accent={p.accent} showCursor={showCursor} cursor={L.cursor} />
      </Stage>
    );
  }

  return (
    <>
      <Track u={u} x={G.x} y={G.trackY} w={trackW} r={L.trackR} draw={1} fill={fill} fillW={L.trackFill} dotIn={[1, 1, 1]} reach={reach} ink={ink} field={field} accent={p.accent} />
      <div style={{ position: "absolute", left: G.x + trackW + 28 * u, top: G.trackY - (L.mono * u) / 2, ...mono(L.mono * u, alpha(ink, 0.5)) }}>{`Step ${n + 1} of 3`}</div>
      <div style={{ position: "absolute", right: L.margin * u, top: G.trackY - (L.mono * u) / 2, ...mono(L.mono * u, alpha(ink, 0.5)) }}>{p.url}</div>
      <div
        style={{
          position: "absolute",
          left: G.x - 0.04 * L.numeral * u,
          top: G.numTop,
          fontSize: L.numeral * u,
          fontWeight: 600,
          letterSpacing: `${TRACKING.numeral}em`,
          lineHeight: 1,
          color: alpha(ink, 0.1),
          opacity: numIn,
          transform: `translateY(${((1 - numIn) * 40 * u).toFixed(3)}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {`0${n + 1}`}
      </div>
      <div style={{ position: "absolute", left: G.x, top: G.titleTop, fontSize: G.size, fontWeight: 500, letterSpacing: `${TRACKING.step}em`, color: ink }}>
        <Rise rows={G.rows} local={local} start={S.words} dur={S.wordDur} cap={S.cap} align="flex-start" />
      </div>
      <div
        style={{
          position: "absolute",
          left: G.x,
          top: G.detailTop,
          width: L.detailMaxW * u,
          fontSize: L.detail * u,
          fontWeight: 400,
          lineHeight: BODY_LH,
          letterSpacing: `${TRACKING.body}em`,
          color: alpha(ink, 0.6),
          opacity: detIn,
          transform: `translateY(${((1 - detIn) * 20 * u).toFixed(3)}px)`,
        }}
      >
        {detail}
      </div>
      {card}
    </>
  );
};

// ---------- shot 5: the end card; the track completes and becomes the CTA's underline ----------
export const endLayout = (cta: string, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const t = fitRows(cta, L.ctaMaxW * u, L.cta * u, L.ctaLines, EM.semibold);
  const h = t.rows.length * t.size * LINE_H;
  return { L, rows: t.rows, size: t.size, top: (H - h) / 2 - 24 * u };
};

const EndShot: React.FC<{ p: HowItWorksProps; local: number }> = ({ p, local }) => {
  const { u, height: H, isVertical } = useLayout();
  const G = endLayout(p.cta, H, u, isVertical);
  const L = G.L;
  const ink = inkOn(p.end);
  const E = T.end;
  const fill = progress(local, E.line[0], E.line[1], "travel");
  const out = 1 - progress(local, E.dotsOut[0], E.dotsOut[1], "exit");
  const reach = DOTS.map((pos) => {
    const c = crossAt(E.line[0], E.line[1], "travel", pos);
    return progress(local, c, c + E.dotDur, "spring") * out;
  });
  const marks = progress(local, E.marks[0], E.marks[1], "enter");
  const r = L.endR * u;
  const bar = STROKE.bar * u;
  const hair = STROKE.hair * u;
  // In the last row's wrapper (exactly the row's text width), so the underline matches the words it sits under.
  const underline = (
    <div style={{ position: "absolute", left: 0, right: "0.08em", top: "100%", marginTop: "0.06em", height: 2 * r }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: r - hair / 2, height: hair, background: alpha(ink, 0.2) }} />
      <div style={{ position: "absolute", left: 0, width: `${(fill * 100).toFixed(3)}%`, top: r - bar / 2, height: bar, borderRadius: bar / 2, background: p.accent }} />
      {DOTS.map((pos, i) => (
        <React.Fragment key={i}>
          {out > 0 ? (
            <div
              style={{
                position: "absolute",
                left: `${(pos * 100).toFixed(3)}%`,
                top: 0,
                width: 2 * r,
                height: 2 * r,
                marginLeft: -r,
                borderRadius: r,
                background: p.end,
                boxShadow: `inset 0 0 0 ${hair}px ${alpha(ink, 0.3)}`,
                transform: `scale(${out.toFixed(4)})`,
              }}
            />
          ) : null}
          {reach[i] > 0 ? (
            <div style={{ position: "absolute", left: `${(pos * 100).toFixed(3)}%`, top: 0, width: 2 * r, height: 2 * r, marginLeft: -r, borderRadius: r, background: p.accent, transform: `scale(${reach[i].toFixed(4)})` }} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: G.top, fontSize: G.size, fontWeight: 600, letterSpacing: `${TRACKING.display}em`, color: ink }}>
        <Rise rows={G.rows} local={local} start={E.words} dur={E.wordDur} cap={E.cap} align="center" last={underline} />
      </div>
      <div style={{ position: "absolute", left: L.margin * u, bottom: L.margin * u, opacity: marks, transform: `translateY(${((1 - marks) * 16 * u).toFixed(3)}px)` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.end} />
      </div>
      <div
        style={{
          position: "absolute",
          right: L.margin * u,
          bottom: L.margin * u + (L.logo * u - L.mono * u * 1.1) / 2,
          opacity: marks,
          transform: `translateY(${((1 - marks) * 16 * u).toFixed(3)}px)`,
          ...mono(L.mono * u * 1.1, alpha(ink, 0.6)),
        }}
      >
        {p.url}
      </div>
    </>
  );
};

export const HowItWorks: React.FC<HowItWorksProps> = (p) => {
  const { index, local, length } = useShot(SHOTS);
  const fields = [p.hook, p.field1, p.field2, p.field3, p.end];
  return (
    <AbsoluteFill style={{ background: fields[index], fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? (
        <HookShot p={p} local={local} />
      ) : index === 4 ? (
        <EndShot p={p} local={local} />
      ) : (
        <StepShot p={p} n={(index - 1) as 0 | 1 | 2} local={local} length={length} />
      )}
    </AbsoluteFill>
  );
};
