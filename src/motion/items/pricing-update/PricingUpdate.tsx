import React from "react";
import { AbsoluteFill, interpolate, interpolateColors } from "remotion";
import { Cursor, FILM, Logo, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type PricingUpdateProps = {
  kicker: string;
  headline: string;
  plan1: string;
  plan2: string;
  plan3: string;
  price1: string; // monthly, digits only (the currency is its own control)
  price2: string;
  price3: string;
  yearly1: string; // per month, billed yearly
  yearly2: string;
  yearly3: string;
  desc1: string;
  desc2: string;
  desc3: string;
  p1f1: string;
  p1f2: string;
  p1f3: string;
  p2f1: string;
  p2f2: string;
  p2f3: string;
  p3f1: string;
  p3f2: string;
  p3f3: string;
  freeNote: string;
  cta: string;
  url: string;
  currency: string;
  brand: string;
  logo: string;
  showCursor: boolean;
  open: string; // shot 1 field
  plans: string; // shots 2–3 field
  zoom: string; // shot 4 field
  end: string; // shot 5 field
  accent: string; // the price motif, "Popular", "Save", the ticks
};

// ---------- timeline (frames of the 480-frame film) ----------
// Hard cuts at these frames. Shots 2 and 3 are one continuous scene on the same field (the cut is invisible); shot 4
// carries the Free card across the cut (match cut) and shot 5 carries its price (match cut).
export const SHOTS = [0, 81, 240, 324, 414] as const;
export const T = {
  // shot 1 (local)
  kicker: [2, 20] as const,
  wordStart: 4,
  wordDur: 16,
  maxStagger: 8,
  rule: [8, 40] as const, // the hairline draws on, left to right
  motif: [18, 36] as const, // "from $0" under the rule
  openPush: 1.025, // shot 1 slow push-in, travel over the whole shot
  // shots 2–3 (global frames: one continuous scene)
  chrome: [81, 99] as const, // toggle and captions
  cardStart: 83,
  cardStagger: 4,
  cardDur: 26,
  cardRise: 140,
  countStart: 95, // prices count up from 0 (+cardStagger per card)
  countDur: 36,
  rowStart: 106, // feature rows (+cardStagger per card, +STAGGER per row)
  rowDur: 16,
  popular: [126, 144] as const,
  camPush: 1.04, // one slow push-in across shots 2–3, travel
  cursorIn: [196, 236] as const,
  press: [240, 243, 246, 250] as const, // down, held, up
  slide: [242, 260] as const, // toggle pill slides to Yearly
  billed: [246, 258] as const, // "Billed monthly" → "Billed yearly"
  rollStart: 246, // prices roll to yearly (+cardStagger per card)
  rollDur: 26,
  save: [262, 280] as const, // "Save n%" chip pops in
  cursorRest: [262, 286] as const,
  // shot 4 (local)
  zoom: [0, 30] as const,
  caption: [8, 26] as const,
  noteStart: 8,
  tickStart: 24,
  tickStagger: 8,
  tickDur: 14,
  tint: [26, 40] as const, // the Free price turns accent
  // shot 5 (local)
  fly: [0, 26] as const, // the price flies into the CTA line
  ctaStart: 2,
  from: [12, 28] as const,
  url: [14, 34] as const,
  logo: [20, 38] as const,
  endKicker: [6, 24] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export type CardL = {
  w: number;
  h: number;
  pad: number;
  name: number;
  nameTop: number;
  nameH: number;
  priceTop: number;
  price: number;
  per: number;
  desc: number;
  descTop: number;
  divTop: number;
  featTop: number;
  rowH: number;
  feat: number;
  check: number;
  btnH: number;
  btnText: number;
  chip: number;
  chipH: number;
};
const CARD_WIDE: CardL = { w: 470, h: 620, pad: 40, name: 30, nameTop: 40, nameH: 40, priceTop: 92, price: 120, per: 28, desc: 24, descTop: 238, divTop: 290, featTop: 312, rowH: 50, feat: 24, check: 28, btnH: 68, btnText: 24, chip: 20, chipH: 36 };
const CARD_TALL: CardL = { w: 840, h: 600, pad: 44, name: 32, nameTop: 44, nameH: 40, priceTop: 96, price: 120, per: 30, desc: 26, descTop: 242, divTop: 296, featTop: 314, rowH: 46, feat: 26, check: 30, btnH: 64, btnText: 26, chip: 22, chipH: 38 };

export const SIZE = {
  wide: {
    M: 80,
    caption: 20,
    headline: 112,
    headMaxW: 1560,
    headLines: 2,
    kicker: 22,
    logoSmall: 36,
    card: CARD_WIDE,
    gap: 28,
    step: 0, // 0 = a row; > 0 = a vertical stack this far apart
    fan: [0, 0, 0],
    toggleTop: 170,
    cardsTop: 290,
    seg: 168,
    toggleH: 64,
    togglePad: 6,
    toggleText: 24,
    saveH: 40,
    saveText: 20,
    cursor: 1.6,
    zoomScale: 1.3,
    zoomCx: 0.34, // the zoomed card's centre, as a fraction of the width
    note: 56,
    noteMaxW: 760,
    noteLines: 3,
    noteGap: 100, // card → note column
    cta: 120,
    from: 40,
    endPrice: 64,
    url: 30,
    urlH: 72,
    logo: 44,
  },
  tall: {
    M: 72,
    caption: 22,
    headline: 108,
    headMaxW: 936,
    headLines: 4,
    kicker: 24,
    logoSmall: 44,
    card: CARD_TALL,
    gap: 0,
    step: 470,
    fan: [-18, 0, 18],
    toggleTop: 140,
    cardsTop: 252,
    seg: 190,
    toggleH: 72,
    togglePad: 6,
    toggleText: 26,
    saveH: 44,
    saveText: 22,
    cursor: 1.8,
    zoomScale: 1.07,
    zoomCx: 0.5,
    note: 64,
    noteMaxW: 936,
    noteLines: 3,
    noteGap: 80, // card → note, vertical
    cta: 128,
    from: 44,
    endPrice: 80,
    url: 32,
    urlH: 80,
    logo: 56,
  },
} as const;
export type SizeL = (typeof SIZE)["wide"] | (typeof SIZE)["tall"];

export const TRACK = { display: -0.04, note: -0.03, card: -0.02 } as const;
export const LINE_H = { display: 1.02, note: 1.12 } as const;
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
const shadow = (u: number) => `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;

// Inter metrics, for lining up baselines: a box with line-height `lh` puts its baseline this far from its top.
const ASC = 0.969;
const DESC = 0.242;
const baselineFromTop = (lh: number) => (lh - (ASC + DESC)) / 2 + ASC;
export const PRICE_LH = 1.1; // the digit cells' height, in em

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const inkOn = (bg: string) => (isDark(bg) ? CANVAS.ink : CANVAS.paper);

// ---------- text measuring (Inter advance widths in em; no DOM measuring in a render) ----------
const W_LOWER: Record<string, number> = {
  a: 0.56, b: 0.61, c: 0.55, d: 0.61, e: 0.57, f: 0.37, g: 0.61, h: 0.6, i: 0.26, j: 0.27, k: 0.54, l: 0.26, m: 0.9,
  n: 0.6, o: 0.59, p: 0.61, q: 0.61, r: 0.39, s: 0.52, t: 0.37, u: 0.6, v: 0.55, w: 0.8, x: 0.54, y: 0.55, z: 0.53,
};
const W_OTHER: Record<string, number> = { " ": 0.27, ".": 0.28, ",": 0.28, "·": 0.28, "'": 0.24, "’": 0.24, "!": 0.3, "?": 0.52, "-": 0.42, "/": 0.38, ":": 0.28, "$": 0.62, "%": 0.86, I: 0.29, J: 0.5, M: 0.86, W: 0.98 };
export const DIGIT_W: Record<string, number> = { "0": 0.62, "1": 0.46, "2": 0.58, "3": 0.6, "4": 0.61, "5": 0.58, "6": 0.6, "7": 0.54, "8": 0.6, "9": 0.6, ".": 0.28, ",": 0.28 };
const charW = (c: string) => W_LOWER[c] ?? W_OTHER[c] ?? DIGIT_W[c] ?? (c >= "A" && c <= "Z" ? 0.7 : 0.6);
// Width in em at the given tracking; weight 600 runs ~3% wider than 400/500.
export const textEm = (s: string, track = 0, bold = false) => [...s].reduce((a, c) => a + charW(c) + track, 0) * (bold ? 1.03 : 1);
// Font size that keeps one line of `s` within `maxW`.
export const fitLine = (s: string, base: number, maxW: number, track = 0, bold = false) => Math.min(base, maxW / Math.max(0.01, textEm(s, track, bold)));

// ---------- type layout: sentences per row when they fit, else balanced rows, shrunk to fit ----------
const greedy = (words: string[], maxW: number, w: (ws: string[]) => number) => {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const x of words) {
    if (cur.length && w([...cur, x]) > maxW) {
      rows.push(cur);
      cur = [x];
    } else cur = [...cur, x];
  }
  if (cur.length) rows.push(cur);
  return rows;
};
const balanced = (words: string[], maxW: number, w: (ws: string[]) => number) => {
  if (!words.length) return [];
  const n = greedy(words, maxW, w).length;
  let lo = 0;
  let hi = maxW;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, mid, w).length <= n) hi = mid;
    else lo = mid;
  }
  return greedy(words, hi, w);
};
export const fitRows = (text: string, maxW: number, base: number, maxLines: number, track: number, bold: boolean, bySentence = true) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const sentences: string[][] = [];
  let cur: string[] = [];
  for (const x of words) {
    cur.push(x);
    if (/[.!?]$/.test(x)) {
      sentences.push(cur);
      cur = [];
    }
  }
  if (cur.length) sentences.push(cur);
  let size = base;
  for (let i = 0; i < 10; i++) {
    const w = (ws: string[]) => textEm(ws.join(" "), track, bold) * size;
    // Each sentence starts its own row (balanced within itself), so a two-sentence headline never breaks mid-thought.
    if (bySentence && sentences.length > 1) {
      const rows = sentences.flatMap((s) => balanced(s, maxW, w));
      if (rows.length <= maxLines && rows.every((r) => w(r) <= maxW)) return { rows, size };
    }
    const rows = balanced(words, maxW, w);
    if (rows.length <= maxLines && rows.every((r) => w(r) <= maxW)) return { rows, size };
    size *= 0.92;
  }
  return { rows: balanced(words, maxW, (ws) => textEm(ws.join(" "), track, bold) * size), size };
};
// Words in the first sentence (the grey half of a two-tone headline); 0 when there is only one sentence.
export const firstSentence = (text: string) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const i = words.findIndex((x) => /[.!?]$/.test(x));
  return i >= 0 && i < words.length - 1 ? i + 1 : 0;
};

// ---------- prices ----------
const clean = (s: string) => String(s ?? "").trim().slice(0, 5);
export const savePct = (monthly: string, yearly: string) => {
  const a = parseFloat(monthly);
  const b = parseFloat(yearly);
  if (!(a > 0) || !(b >= 0) || b >= a) return 0;
  return Math.round((1 - b / a) * 100);
};
export const prices = (p: PricingUpdateProps) => ({
  monthly: [clean(p.price1), clean(p.price2), clean(p.price3)],
  yearly: [clean(p.yearly1), clean(p.yearly2), clean(p.yearly3)],
});

// The motif: a one-line odometer. Each character column is its own clipped cell with one text node per digit; a
// digit column rolls through the digits in between, any other change (a new leading digit, a dot) swaps in one step.
// Columns are right-aligned, so "0" → "12" grows a tens column from nothing while the units spin.
const isDigit = (c: string) => c.length === 1 && c >= "0" && c <= "9";
const cellW = (c: string) => (c ? (DIGIT_W[c] ?? charW(c)) : 0);
const PAD = 0.14; // em of slack each side, so glyphs never clip; a negative margin gives it back
const mod10 = (n: number) => ((n % 10) + 10) % 10;

const Column: React.FC<{ a: string; b: string; t: number; dir: number; spins: number; size: number }> = ({ a, b, t, dir, spins, size }) => {
  let w: number;
  let cells: { ch: string; y: number }[];
  if (a === b) {
    if (!a) return null;
    w = cellW(a);
    cells = [{ ch: a, y: 0 }];
  } else if (isDigit(a) && isDigit(b)) {
    const na = Number(a);
    const nb = Number(b);
    const steps = dir > 0 ? mod10(nb - na) + 10 * spins : -(mod10(na - nb) + 10 * spins);
    const pos = na + steps * t;
    const base = Math.floor(pos + 1e-6);
    const frac = Math.max(0, pos - base);
    const cur = mod10(base);
    const next = mod10(base + 1);
    w = mix(cellW(String(cur)), cellW(String(next)), frac);
    cells = frac < 0.002 ? [{ ch: String(cur), y: 0 }] : [{ ch: String(cur), y: -frac }, { ch: String(next), y: 1 - frac }];
  } else {
    w = mix(cellW(a), cellW(b), t);
    cells = [
      { ch: t < 0.999 ? a : "", y: -dir * t },
      { ch: t > 0.001 ? b : "", y: dir * (1 - t) },
    ];
  }
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: (w + 2 * PAD) * size,
        margin: `0 ${-PAD * size}px`,
        height: PRICE_LH * size,
        overflow: "hidden",
      }}
    >
      {cells.map((c, k) =>
        c.ch ? (
          <span key={k} style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", transform: c.y ? `translateY(${(c.y * 100).toFixed(3)}%)` : undefined }}>
            {c.ch}
          </span>
        ) : null,
      )}
    </span>
  );
};

export const Price: React.FC<{ currency: string; from: string; to: string; t: number; dir: number; spins: number; size: number; color: string }> = ({
  currency,
  from,
  to,
  t,
  dir,
  spins,
  size,
  color,
}) => {
  const n = Math.max(from.length, to.length);
  const a = Array.from({ length: n }, (_, i) => from[i - (n - from.length)] ?? "");
  const b = Array.from({ length: n }, (_, i) => to[i - (n - to.length)] ?? "");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", height: PRICE_LH * size, fontFamily: FONT_SANS, fontSize: size, fontWeight: 600, lineHeight: `${PRICE_LH * size}px`, color, whiteSpace: "nowrap" }}>
      {currency ? <span style={{ marginRight: 0.02 * size }}>{currency}</span> : null}
      {a.map((ca, i) => (
        <Column key={i} a={ca} b={b[i]} t={t} dir={dir} spins={i === n - 1 ? spins : 0} size={size} />
      ))}
    </div>
  );
};

// Price state per card at a global frame: counting up from 0 on entry, then rolling to the yearly value on the click.
export const priceAt = (frame: number, i: number, monthly: string, yearly: string) => {
  const rs = T.rollStart + i * T.cardStagger;
  if (frame < rs) {
    const cs = T.countStart + i * T.cardStagger;
    return { from: "0", to: monthly, t: progress(frame, cs, cs + T.countDur, "enter"), dir: 1, spins: 1 };
  }
  const dir = parseFloat(yearly) > parseFloat(monthly) ? 1 : -1;
  return { from: monthly, to: yearly, t: progress(frame, rs, rs + T.rollDur, "travel"), dir, spins: 0 };
};

// ---------- geometry (shared with the prompt; pass u = 1 and the 1080-based frame for prompt numbers) ----------
export const plansGeometry = (W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const c = L.card;
  const cards = [0, 1, 2].map((i) =>
    L.step > 0
      ? { x: (W - c.w * u) / 2 + L.fan[i] * u, y: (L.cardsTop + i * L.step) * u }
      : { x: (W - (3 * c.w + 2 * L.gap) * u) / 2 + i * (c.w + L.gap) * u, y: L.cardsTop * u },
  );
  const tw = (2 * L.seg + 2 * L.togglePad) * u;
  const toggle = { x: (W - tw) / 2, y: L.toggleTop * u, w: tw, h: L.toggleH * u };
  const segCentre = (i: number) => ({ x: toggle.x + (L.togglePad + L.seg * i + L.seg / 2) * u, y: toggle.y + toggle.h / 2 });
  return { L, c, cards, toggle, segCentre };
};
// The camera of shots 2–3: one scale about the frame's centre.
export const camAt = (frame: number) => mix(1, T.camPush, progress(frame, SHOTS[1], SHOTS[3], "travel"));
export const toScreen = (x: number, y: number, cam: number, W: number, H: number) => ({ x: W / 2 + (x - W / 2) * cam, y: H / 2 + (y - H / 2) * cam });

export const zoomGeometry = (W: number, H: number, u: number, tall: boolean, note: string) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const c = L.card;
  const s = L.zoomScale;
  const cw = c.w * u * s;
  const ch = c.h * u * s;
  if (!tall) {
    const x = W * L.zoomCx - cw / 2;
    const y = (H - ch) / 2;
    const nx = x + cw + L.noteGap * u;
    const maxW = Math.min(L.noteMaxW * u, W - L.M * u - nx);
    const n = fitRows(note, maxW, L.note * u, L.noteLines, TRACK.note, false, false);
    const noteH = n.rows.length * n.size * LINE_H.note;
    const capH = 44 * u;
    const top = H / 2 - (capH + noteH) / 2;
    return { s, x, y, cw, ch, note: n, noteX: nx, noteY: top + capH, capY: top };
  }
  const x = (W - cw) / 2;
  const n = fitRows(note, Math.min(L.noteMaxW * u, cw), L.note * u, L.noteLines, TRACK.note, false, false);
  const noteH = n.rows.length * n.size * LINE_H.note;
  const capH = 48 * u;
  const total = ch + L.noteGap * u + capH + noteH;
  const y = (H - total) / 2;
  const capY = y + ch + L.noteGap * u;
  return { s, x, y, cw, ch, note: n, noteX: x, noteY: capY + capH, capY };
};

// Where the Free card's price sits inside the card (unscaled), so shots 4 and 5 can carry it across the cuts.
export const priceInCard = (c: CardL, u: number) => ({ x: c.pad * u, y: c.priceTop * u, size: c.price * u });

export const endGeometry = (W: number, H: number, u: number, tall: boolean, cta: string, currency: string, value: string) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const M = L.M * u;
  const priceEm = textEm(`${currency}${value}`, 0, true);
  const fromW = textEm("from", -0.01) * L.from * u;
  const sideW = fromW + 14 * u + priceEm * L.endPrice * u;
  const maxCta = tall ? W - 2 * M : W - 2 * M - sideW - 48 * u;
  const ctaSize = fitLine(cta, L.cta * u, maxCta, TRACK.display, true);
  const ctaW = textEm(cta, TRACK.display, true) * ctaSize;
  if (!tall) {
    const ctaTop = H / 2 - 120 * u;
    const base = ctaTop + baselineFromTop(1) * ctaSize;
    const fromX = M + ctaW + 40 * u;
    const priceX = fromX + fromW + 14 * u;
    return {
      M,
      ctaSize,
      ctaTop,
      fromX,
      fromY: base - baselineFromTop(1) * L.from * u,
      priceX,
      priceY: base - baselineFromTop(PRICE_LH) * L.endPrice * u,
      urlY: ctaTop + ctaSize + 64 * u,
    };
  }
  const ctaTop = H / 2 - 220 * u;
  const rowTop = ctaTop + ctaSize * 1.04 + 28 * u;
  const base = rowTop + baselineFromTop(PRICE_LH) * L.endPrice * u;
  return {
    M,
    ctaSize,
    ctaTop,
    fromX: M,
    fromY: base - baselineFromTop(1) * L.from * u,
    priceX: M + fromW + 14 * u,
    priceY: rowTop,
    urlY: rowTop + PRICE_LH * L.endPrice * u + 64 * u,
  };
};

// ---------- pieces ----------
// Word-mask rise: each row is its own mask; padding keeps descenders inside the clip, the negative margin gives it back.
const Rise: React.FC<{ rows: string[][]; local: number; start: number; color: (i: number) => string; lineH: number }> = ({ rows, local, start, color, lineH }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.22em -0.08em" }}>
            <div style={{ display: "flex", gap: "0.26em", whiteSpace: "nowrap", lineHeight: lineH }}>
              {words.map((w, i) => {
                const s = start + STAGGER * Math.min(first + i, T.maxStagger);
                const t = progress(local, s, s + T.wordDur, "enter");
                return (
                  <span key={i} style={{ display: "inline-block", color: color(first + i), transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>
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

const Mono: React.FC<{ children: string; size: number; color: string; style?: React.CSSProperties }> = ({ children, size, color, style }) => (
  <div style={{ position: "absolute", fontFamily: FONT_MONO, fontSize: size, lineHeight: 1, letterSpacing: "0.02em", color, whiteSpace: "nowrap", ...style }}>{children}</div>
);

const TICK = "M8.5 14.5 L12.3 18.2 L19.5 10.5";
const TICK_LEN = 16;
const Check: React.FC<{ d: number; ring: string; tick: string; accent: string; on: number }> = ({ d, ring, tick, accent, on }) => (
  <svg width={d} height={d} viewBox="0 0 28 28" style={{ flex: "none", display: "block" }}>
    <circle cx={14} cy={14} r={13.25} fill="none" stroke={ring} strokeWidth={STROKE.hair} />
    <path d={TICK} fill="none" stroke={tick} strokeWidth={STROKE.ring} strokeLinecap="round" strokeLinejoin="round" />
    {on > 0 ? (
      <>
        <circle cx={14} cy={14} r={14 * mix(0.6, 1, on)} fill={accent} opacity={Math.min(1, on * 2)} />
        <path
          d={TICK}
          fill="none"
          stroke={FILM.white}
          strokeWidth={STROKE.ring}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={TICK_LEN}
          strokeDashoffset={TICK_LEN * (1 - progress(on, 0.3, 1, "linear"))}
        />
      </>
    ) : null}
  </svg>
);

type CardModel = { name: string; desc: string; features: string[]; button: string; dark: boolean; popular: boolean; primary: boolean };
const LIGHT = { card: CANVAS.paper.card, ink: CANVAS.paper.ink, ink2: CANVAS.paper.ink2, line: alpha(CANVAS.paper.ink, 0.08), ring: alpha(CANVAS.paper.ink, 0.22), tick: CANVAS.paper.ink2 };
const DARK = { card: CANVAS.paper.ink, ink: CANVAS.ink.ink, ink2: CANVAS.ink.ink2, line: alpha(CANVAS.ink.ink, 0.12), ring: alpha(CANVAS.ink.ink, 0.28), tick: CANVAS.ink.ink2 };

const Card: React.FC<{
  u: number;
  c: CardL;
  m: CardModel;
  price: React.ReactNode;
  rows: number[];
  ticks: number[];
  pop: number;
  accent: string;
  x: number;
  y: number;
  scale: number;
  opacity?: number;
}> = ({ u, c, m, price, rows, ticks, pop, accent, x, y, scale, opacity = 1 }) => {
  const k = m.dark ? DARK : LIGHT;
  const inner = (c.w - 2 * c.pad) * u;
  const descSize = fitLine(m.desc, c.desc * u, inner, -0.01);
  // Free: the black primary button (it says the CTA); the ink Pro card: a white button; Team: a quiet grey one.
  const btn = m.dark
    ? { bg: CANVAS.ink.button, fg: CANVAS.ink.onButton }
    : m.primary
      ? { bg: CANVAS.paper.button, fg: CANVAS.paper.onButton }
      : { bg: CANVAS.paper.fill, fg: CANVAS.paper.ink };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: c.w * u,
        height: c.h * u,
        transformOrigin: "0 0",
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        borderRadius: RADIUS.card * u,
        background: k.card,
        boxShadow: `inset 0 0 0 ${u}px ${k.line}, ${shadow(u)}`,
        opacity,
        fontFamily: FONT_SANS,
        color: k.ink,
      }}
    >
      <div style={{ position: "absolute", left: c.pad * u, top: c.nameTop * u, height: c.nameH * u, fontSize: c.name * u, fontWeight: 500, letterSpacing: `${TRACK.card}em`, lineHeight: `${c.nameH * u}px`, whiteSpace: "nowrap" }}>
        {m.name}
      </div>
      {m.popular && pop > 0 ? (
        <div
          style={{
            position: "absolute",
            right: c.pad * u,
            top: (c.nameTop + (c.nameH - c.chipH) / 2) * u,
            height: c.chipH * u,
            padding: `0 ${14 * u}px`,
            borderRadius: RADIUS.chip * u,
            background: accent,
            color: FILM.white,
            fontSize: c.chip * u,
            fontWeight: 500,
            lineHeight: `${c.chipH * u}px`,
            whiteSpace: "nowrap",
            opacity: Math.min(1, pop * 1.6),
            transformOrigin: "100% 50%",
            transform: `scale(${mix(0.85, 1, pop).toFixed(4)})`,
          }}
        >
          Popular
        </div>
      ) : null}
      <div style={{ position: "absolute", left: c.pad * u, top: c.priceTop * u, display: "flex", alignItems: "flex-end" }}>
        {price}
        <span
          style={{
            fontSize: c.per * u,
            fontWeight: 500,
            lineHeight: 1,
            color: k.ink2,
            marginLeft: 8 * u,
            marginBottom: ((PRICE_LH - baselineFromTop(PRICE_LH)) * c.price - (1 - baselineFromTop(1)) * c.per) * u,
            whiteSpace: "nowrap",
          }}
        >
          /mo
        </span>
      </div>
      <div style={{ position: "absolute", left: c.pad * u, top: c.descTop * u, fontSize: descSize, lineHeight: 1.35, color: k.ink2, whiteSpace: "nowrap" }}>{m.desc}</div>
      <div style={{ position: "absolute", left: c.pad * u, top: c.divTop * u, width: inner, height: STROKE.hair * u, background: k.line }} />
      {m.features.map((f, r) => {
        const t = rows[r] ?? 1;
        if (t <= 0) return null;
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: c.pad * u,
              top: (c.featTop + r * c.rowH) * u,
              height: c.rowH * u,
              width: inner,
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              opacity: t,
              transform: `translateY(${((1 - t) * 16 * u).toFixed(2)}px)`,
            }}
          >
            <Check d={c.check * u} ring={k.ring} tick={k.tick} accent={accent} on={ticks[r] ?? 0} />
            <span style={{ fontSize: fitLine(f, c.feat * u, inner - (c.check + 14) * u, -0.01), lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{f}</span>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: c.pad * u,
          top: (c.h - c.pad - c.btnH) * u,
          width: inner,
          height: c.btnH * u,
          borderRadius: RADIUS.button * u,
          background: btn.bg,
          color: btn.fg,
          fontSize: fitLine(m.button, c.btnText * u, inner - 32 * u, -0.01),
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: `${c.btnH * u}px`,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {m.button}
      </div>
    </div>
  );
};

export const models = (p: PricingUpdateProps): CardModel[] => [
  { name: p.plan1, desc: p.desc1, features: [p.p1f1, p.p1f2, p.p1f3], button: p.cta, dark: false, popular: false, primary: true },
  { name: p.plan2, desc: p.desc2, features: [p.p2f1, p.p2f2, p.p2f3], button: `Get ${p.plan2}`, dark: true, popular: true, primary: false },
  { name: p.plan3, desc: p.desc3, features: [p.p3f1, p.p3f2, p.p3f3], button: `Get ${p.plan3}`, dark: false, popular: false, primary: false },
];

// ---------- shot 1: the hook ----------
const OpenScene: React.FC<{ p: PricingUpdateProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const k = inkOn(p.open);
  const M = L.M * u;
  const head = fitRows(p.headline, L.headMaxW * u, L.headline * u, L.headLines, TRACK.display, true);
  const grey = firstSentence(p.headline);
  const headH = head.rows.length * head.size * LINE_H.display;
  const blockH = L.kicker * u + 40 * u + headH;
  const top = (H - blockH) / 2 - (isVertical ? 60 : 20) * u;
  const kt = progress(local, T.kicker[0], T.kicker[1], "enter");
  const push = mix(1, T.openPush, progress(local, 0, SHOTS[1], "travel"));
  const rule = progress(local, T.rule[0], T.rule[1], "enter");
  const mt = progress(local, T.motif[0], T.motif[1], "enter");
  const ruleY = H - (isVertical ? 200 : 150) * u;
  const value = prices(p).monthly[0];
  return (
    <>
      <div style={{ position: "absolute", left: M, top: 64 * u, opacity: kt }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logoSmall * u} color={k.ink} tile={k.ink} onTile={p.open} />
      </div>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${M}px ${H / 2}px`, transform: `scale(${push.toFixed(4)})` }}>
        <Mono size={L.kicker * u} color={alpha(k.ink, 0.55)} style={{ left: M, top, opacity: kt, transform: `translateY(${((1 - kt) * 12 * u).toFixed(2)}px)` }}>
          {p.kicker}
        </Mono>
        <div
          style={{
            position: "absolute",
            left: M,
            top: top + L.kicker * u + 40 * u - 0.2 * head.size,
            fontFamily: FONT_SANS,
            fontSize: head.size,
            fontWeight: 600,
            letterSpacing: `${TRACK.display}em`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Rise rows={head.rows} local={local} start={T.wordStart} lineH={LINE_H.display} color={(i) => (i < grey ? k.ink2 : k.ink)} />
        </div>
      </div>
      <div style={{ position: "absolute", left: M, top: ruleY, width: W - 2 * M, height: STROKE.hair * u, background: alpha(k.ink, 0.2), transformOrigin: "0 50%", transform: `scaleX(${rule.toFixed(4)})` }} />
      <Mono size={L.caption * u} color={alpha(k.ink, 0.5)} style={{ left: M, top: ruleY + 28 * u, opacity: rule }}>
        {[p.plan1, p.plan2, p.plan3].filter(Boolean).join(" · ")}
      </Mono>
      <div style={{ position: "absolute", right: M, top: ruleY + 20 * u, display: "flex", alignItems: "flex-end", gap: 12 * u, opacity: mt, transform: `translateY(${((1 - mt) * 12 * u).toFixed(2)}px)` }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: L.caption * u, lineHeight: 1, color: alpha(k.ink, 0.5), marginBottom: ((PRICE_LH - baselineFromTop(PRICE_LH)) * 40 - (1 - baselineFromTop(1)) * L.caption) * u }}>from</span>
        <Price currency={p.currency} from={value} to={value} t={1} dir={1} spins={0} size={40 * u} color={p.accent} />
      </div>
    </>
  );
};

// ---------- shots 2–3: the plans, the toggle, the yearly roll ----------
const PlansScene: React.FC<{ p: PricingUpdateProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = plansGeometry(W, H, u, isVertical);
  const { L, c, toggle } = G;
  const k = inkOn(p.plans);
  const M = L.M * u;
  const cam = camAt(frame);
  const ms = models(p);
  const pr = prices(p);

  const chrome = progress(frame, T.chrome[0], T.chrome[1], "enter");
  const slide = progress(frame, T.slide[0], T.slide[1], "travel");
  const billed = progress(frame, T.billed[0], T.billed[1], "travel");
  const pct = savePct(pr.monthly[1], pr.yearly[1]);
  const save = progress(frame, T.save[0], T.save[1], "spring");
  const pop = progress(frame, T.popular[0], T.popular[1], "spring");

  // cursor, in screen space (it does not scale with the camera)
  const showCursor = p.showCursor !== false;
  const seg = G.segCentre(1);
  const tip = toScreen(seg.x + 8 * u, seg.y + 4 * u, cam, W, H);
  const g = progress(frame, T.cursorIn[0], T.cursorIn[1], "travel");
  const from = { x: W * 1.04, y: H * (isVertical ? 0.62 : 0.86) };
  const bow = Math.sin(Math.PI * g) * 0.1;
  const rest = progress(frame, T.cursorRest[0], T.cursorRest[1], "travel");
  const cx = from.x + (tip.x - from.x) * g - (tip.y - from.y) * bow + rest * 12 * u;
  const cy = from.y + (tip.y - from.y) * g + (tip.x - from.x) * bow + rest * 16 * u;
  const press = interpolate(frame, [...T.press], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const labelOn = CANVAS.paper.ink; // on the white pill
  const labelOff = k.ink2;
  const segLabel = (i: number, text: string) => {
    const active = i === 0 ? 1 - slide : slide;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: (L.togglePad + i * L.seg) * u,
          top: 0,
          width: L.seg * u,
          height: toggle.h,
          textAlign: "center",
          lineHeight: `${toggle.h}px`,
          fontSize: L.toggleText * u,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: interpolateColors(active, [0, 1], [labelOff, labelOn]),
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <>
      <Mono size={L.caption * u} color={alpha(k.ink, 0.5)} style={{ left: M, top: 72 * u, opacity: chrome }}>
        {`${p.brand} — Pricing`}
      </Mono>
      <Mono size={L.caption * u} color={alpha(k.ink, 0.5)} style={{ right: M, top: 72 * u, opacity: chrome * (1 - billed) }}>
        Billed monthly
      </Mono>
      {billed > 0 ? (
        <Mono size={L.caption * u} color={alpha(k.ink, 0.5)} style={{ right: M, top: 72 * u, opacity: chrome * billed }}>
          Billed yearly
        </Mono>
      ) : null}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${W / 2}px ${H / 2}px`, transform: `scale(${cam.toFixed(5)})` }}>
        {/* the Monthly / Yearly toggle */}
        <div
          style={{
            position: "absolute",
            left: toggle.x,
            top: toggle.y,
            width: toggle.w,
            height: toggle.h,
            borderRadius: toggle.h / 2,
            background: alpha(k.ink, 0.06),
            boxShadow: `inset 0 0 0 ${u}px ${alpha(k.ink, 0.08)}`,
            fontFamily: FONT_SANS,
            opacity: chrome,
            transform: `translateY(${((1 - chrome) * 24 * u).toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: (L.togglePad + slide * L.seg) * u,
              top: L.togglePad * u,
              width: L.seg * u,
              height: toggle.h - 2 * L.togglePad * u,
              borderRadius: toggle.h / 2,
              background: CANVAS.paper.card,
              boxShadow: shadow(u),
            }}
          />
          {segLabel(0, "Monthly")}
          {segLabel(1, "Yearly")}
        </div>
        {pct > 0 && save > 0 ? (
          <div
            style={{
              position: "absolute",
              left: toggle.x + toggle.w + 16 * u,
              top: toggle.y + (toggle.h - L.saveH * u) / 2,
              height: L.saveH * u,
              padding: `0 ${16 * u}px`,
              borderRadius: RADIUS.chip * u,
              background: p.accent,
              color: FILM.white,
              fontFamily: FONT_SANS,
              fontSize: L.saveText * u,
              fontWeight: 500,
              lineHeight: `${L.saveH * u}px`,
              whiteSpace: "nowrap",
              opacity: Math.min(1, save * 1.6),
              transformOrigin: "0% 50%",
              transform: `scale(${mix(0.85, 1, save).toFixed(4)})`,
            }}
          >
            {`Save ${pct}%`}
          </div>
        ) : null}
        {/* the three plans: a row at 16:9, a fanned stack at 9:16 (later cards on top) */}
        {ms.map((m, i) => {
          const s0 = T.cardStart + i * T.cardStagger;
          const e = progress(frame, s0, s0 + T.cardDur, "spring");
          if (e <= 0) return null;
          const st = priceAt(frame, i, pr.monthly[i], pr.yearly[i]);
          const ink = m.dark ? DARK.ink : LIGHT.ink;
          const rows = [0, 1, 2].map((r) => {
            const rs = T.rowStart + i * T.cardStagger + r * STAGGER;
            return progress(frame, rs, rs + T.rowDur, "enter");
          });
          return (
            <Card
              key={i}
              u={u}
              c={c}
              m={m}
              price={<Price currency={p.currency} {...st} size={c.price * u} color={ink} />}
              rows={rows}
              ticks={[0, 0, 0]}
              pop={pop}
              accent={p.accent}
              x={G.cards[i].x}
              y={G.cards[i].y + (1 - e) * T.cardRise * u}
              scale={1}
              opacity={Math.min(1, e * 1.6)}
            />
          );
        })}
      </div>
      {showCursor && g > 0 ? <Cursor u={u} x={cx} y={cy} color={CANVAS.paper.ink} press={press} scale={L.cursor} /> : null}
    </>
  );
};

// ---------- shot 4: the Free plan, zoomed ----------
const ZoomScene: React.FC<{ p: PricingUpdateProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const P = plansGeometry(W, H, u, isVertical);
  const Z = zoomGeometry(W, H, u, isVertical, p.freeNote);
  const k = inkOn(p.zoom);
  const m = models(p)[0];
  const value = prices(p).yearly[0];

  // match cut: the card starts exactly where shot 3 left it (camera included), then travels to its zoomed place
  const cam = camAt(SHOTS[3] - 1);
  const s0 = toScreen(P.cards[0].x, P.cards[0].y, cam, W, H);
  const z = progress(local, T.zoom[0], T.zoom[1], "travel");
  const x = mix(s0.x, Z.x, z);
  const y = mix(s0.y, Z.y, z);
  const s = mix(cam, Z.s, z);
  const tint = progress(local, T.tint[0], T.tint[1], "enter");
  const ticks = [0, 1, 2].map((r) => progress(local, T.tickStart + r * T.tickStagger, T.tickStart + r * T.tickStagger + T.tickDur, "spring"));
  const cap = progress(local, T.caption[0], T.caption[1], "enter");

  return (
    <>
      <Card
        u={u}
        c={L.card}
        m={m}
        price={<Price currency={p.currency} from={value} to={value} t={1} dir={1} spins={0} size={L.card.price * u} color={interpolateColors(tint, [0, 1], [LIGHT.ink, p.accent])} />}
        rows={[1, 1, 1]}
        ticks={ticks}
        pop={0}
        accent={p.accent}
        x={x}
        y={y}
        scale={s}
      />
      <Mono size={L.caption * u} color={alpha(k.ink, 0.55)} style={{ left: Z.noteX, top: Z.capY, opacity: cap, transform: `translateY(${((1 - cap) * 12 * u).toFixed(2)}px)` }}>
        {`${p.plan1} plan · ${p.currency}${value} / mo`}
      </Mono>
      <div
        style={{
          position: "absolute",
          left: Z.noteX,
          top: Z.noteY - 0.16 * Z.note.size,
          fontFamily: FONT_SANS,
          fontSize: Z.note.size,
          fontWeight: 500,
          letterSpacing: `${TRACK.note}em`,
          color: k.ink,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Rise rows={Z.note.rows} local={local} start={T.noteStart} lineH={LINE_H.note} color={() => k.ink} />
      </div>
    </>
  );
};

// ---------- shot 5: the CTA, with the price motif ----------
const EndScene: React.FC<{ p: PricingUpdateProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const k = inkOn(p.end);
  const value = prices(p).yearly[0];
  const E = endGeometry(W, H, u, isVertical, p.cta, p.currency, value);
  const Z = zoomGeometry(W, H, u, isVertical, p.freeNote);
  const pin = priceInCard(L.card, u);

  // match cut: the accent price starts at its shot-4 place and size, then shrinks into the CTA line
  const f = progress(local, T.fly[0], T.fly[1], "travel");
  const startSize = pin.size * Z.s;
  const px = mix(Z.x + pin.x * Z.s, E.priceX, f);
  const py = mix(Z.y + pin.y * Z.s, E.priceY, f);
  const ps = mix(1, (L.endPrice * u) / startSize, f);

  const fromT = progress(local, T.from[0], T.from[1], "enter");
  const urlT = progress(local, T.url[0], T.url[1], "enter");
  const logoT = progress(local, T.logo[0], T.logo[1], "enter");
  const kickT = progress(local, T.endKicker[0], T.endKicker[1], "enter");
  const urlSize = L.url * u;
  const urlH = L.urlH * u;
  return (
    <>
      <Mono size={L.caption * u} color={alpha(k.ink, 0.5)} style={{ left: E.M, top: 72 * u, opacity: kickT }}>
        {p.kicker}
      </Mono>
      <div
        style={{
          position: "absolute",
          left: E.M,
          top: E.ctaTop - 0.04 * E.ctaSize,
          fontFamily: FONT_SANS,
          fontSize: E.ctaSize,
          fontWeight: 600,
          letterSpacing: `${TRACK.display}em`,
          color: k.ink,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Rise rows={[(p.cta || "").trim().split(/\s+/).filter(Boolean)]} local={local} start={T.ctaStart} lineH={1} color={() => k.ink} />
      </div>
      <div
        style={{
          position: "absolute",
          left: E.fromX,
          top: E.fromY,
          fontFamily: FONT_SANS,
          fontSize: L.from * u,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: k.ink2,
          whiteSpace: "nowrap",
          opacity: fromT,
        }}
      >
        from
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px) scale(${ps.toFixed(4)})` }}>
        <Price currency={p.currency} from={value} to={value} t={1} dir={1} spins={0} size={startSize} color={p.accent} />
      </div>
      <div
        style={{
          position: "absolute",
          left: E.M,
          top: E.urlY,
          height: urlH,
          padding: `0 ${30 * u}px 0 ${32 * u}px`,
          borderRadius: urlH / 2,
          background: k.ink,
          color: p.end,
          display: "flex",
          alignItems: "center",
          gap: 14 * u,
          fontFamily: FONT_SANS,
          fontSize: urlSize,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          opacity: urlT,
          transform: `translateY(${((1 - urlT) * 20 * u).toFixed(2)}px)`,
        }}
      >
        <span style={{ lineHeight: 1 }}>{p.url}</span>
        <svg width={urlSize * 0.8} height={urlSize * 0.8} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M5 12 H19 M13 6 L19 12 L13 18" fill="none" stroke={p.end} strokeWidth={STROKE.ring} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: E.M, bottom: 64 * u, opacity: logoT, transform: `translateY(${((1 - logoT) * 16 * u).toFixed(2)}px)` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={k.ink} tile={k.ink} onTile={p.end} />
      </div>
    </>
  );
};

export const PricingUpdate: React.FC<PricingUpdateProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  const bg = [p.open, p.plans, p.plans, p.zoom, p.end][index];
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <OpenScene p={p} local={local} /> : index < 3 ? <PlansScene p={p} frame={frame} /> : index === 3 ? <ZoomScene p={p} local={local} /> : <EndScene p={p} local={local} />}
    </AbsoluteFill>
  );
};
