import React from "react";
import { AbsoluteFill, Img, interpolateColors, spring, useVideoConfig } from "remotion";
import { FILM, Logo, SAMPLE, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, SPRING_CONFIG, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type FundingAnnouncementProps = {
  kicker: string; // tiny mono label: shot 1 under the logo, then the running head of shots 2–5
  amount: string; // "$24M": counts up from zero as one text node
  round: string;
  lead: string;
  mission: string;
  highlight: string; // a phrase inside the mission that gets the marker
  investor1: string;
  investor2: string;
  investor3: string;
  investor4: string;
  investor5: string;
  investor6: string;
  hiring: string;
  url: string;
  thanks: string;
  brand: string;
  logo: string;
  accent: string; // the one accent: the pixel, the amount block, the marker, the end tile
};

// ---------- timeline (frames of the 570-frame film; every shot is a hard cut) ----------
// The motif is one accent square, a "pixel": it sits after the brand name in shot 1, carries across the cut into
// shot 2 at the same position (match cut) and grows into the amount block, recurs as tiny squares in shots 4 and 5,
// and in shot 6 the block shrinks back into the tile behind the logo.
export const SHOTS = [0, 75, 180, 300, 390, 480] as const;
export const SHOT_COUNT = SHOTS.length;
// Timings below are local to their shot.
export const T = {
  wordDur: 16, // one word's rise
  maxStagger: 8, // stagger steps per row before words start together
  lineGap: 6, // rows start this far apart
  head: [2, 14] as const, // running head fade (shots 3–5)
  // shot 1: the logo, the pixel, the kicker
  lockup: [4, 24] as const,
  lockupRise: 16, // px at 1080
  pixel: 16, // the pixel's spring starts
  kicker: [12, 30] as const,
  // shot 2: the pixel grows into the block, the amount counts up
  grow: [0, 26] as const,
  amount: [18, 36] as const, // the amount's mask rise
  count: [18, 60] as const, // $0 → $24M
  rule: [22, 44] as const,
  round: 26,
  lead: 34,
  head2: [24, 36] as const,
  push2: [26, 105] as const,
  // shot 3: the mission, then the marker
  mission: 4,
  markerGap: 4,
  markerDur: 28,
  // shot 4: the investor wall
  lines: [0, 22] as const,
  caption: [4, 22] as const,
  logos: 8, // the first diagonal starts; each diagonal is one STAGGER later
  // shot 5: team and hiring
  avatars: 0,
  hiring: 0,
  hiringCap: 8, // normal stagger: the 90-frame shot leaves the line 1.5s+ after it lands
  pill: 12,
  // shot 6: the block shrinks into the logo tile
  shrink: [0, 26] as const,
  mark: [16, 34] as const,
  name: [18, 36] as const,
  thanks: 8,
  thanksCap: 8,
} as const;
export const PUSH = 1.03; // camera push-in, shots 2 and 4
export const GLIDE = 28; // px at 1080 the mission glides up across shot 3

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    margin: 72, // running head side margin
    headTop: 64,
    head: 20,
    logo: 88, // shots 1 and 6: mark height; the name is 0.82× this
    lockupDy: -50, // the lockup's centre sits this far from the frame's middle
    kicker: 22,
    kickerGap: 60, // mark bottom → kicker
    amount: 300,
    amountPad: 80, // amount inset inside the block
    infoPad: 96, // round + lead column inset on the black half
    round: 80,
    lead: 40,
    ruleW: 160,
    mission: 92,
    missionMin: 72,
    missionW: 1500,
    missionLines: 3,
    gridW: 1440,
    cellH: 230,
    investorH: 60,
    gridDy: 30,
    caption: 20,
    captionGap: 52,
    index: 16,
    avatar: 136,
    overlap: -14, // negative: a small even gap between avatars, so monogram initials never touch
    ring: 4,
    seatGap: 20,
    hiring: 56,
    hiringW: 1500,
    hiringLines: 2,
    gapAvatars: 56,
    gapPill: 44,
    pillH: 64,
    pillText: 26,
    thanks: 72,
    thanksW: 1400,
    thanksLines: 2,
    thanksGap: 56,
  },
  tall: {
    margin: 80,
    headTop: 96,
    head: 22,
    logo: 104,
    lockupDy: -80,
    kicker: 24,
    kickerGap: 64,
    amount: 280,
    amountPad: 80,
    infoPad: 80,
    round: 96,
    lead: 48,
    ruleW: 160,
    mission: 96,
    missionMin: 76,
    missionW: 920,
    missionLines: 6,
    gridW: 920,
    cellH: 260,
    investorH: 64,
    gridDy: 40,
    caption: 22,
    captionGap: 56,
    index: 18,
    avatar: 150,
    overlap: -14, // negative: a small even gap between avatars, so monogram initials never touch
    ring: 4,
    seatGap: 22,
    hiring: 76,
    hiringW: 920,
    hiringLines: 3,
    gapAvatars: 64,
    gapPill: 56,
    pillH: 80,
    pillText: 32,
    thanks: 84,
    thanksW: 920,
    thanksLines: 3,
    thanksGap: 64,
  },
} as const;
export type Sizes = (typeof SIZE)["wide"] | (typeof SIZE)["tall"];
export const sizesFor = (tall: boolean): Sizes => (tall ? SIZE.tall : SIZE.wide);

export const TYPE = { lineH: 1.1, track: -0.035, displayTrack: -0.045, amountTrack: -0.05, gap: 0.25, emPerChar: 0.55 } as const;
// Logo name: Inter 500 at -0.02em averages ~0.58em a character (estimate used only to centre the lockup).
export const NAME_EM = 0.58;
// Inter's baseline sits 0.364em below the middle of a line-height-1 box: the pixel stands on it like a full stop.
export const BASELINE = 0.364;
export const PIXEL = { size: 0.2, gap: 0.1 } as const; // in em of the brand name
export const TILE = { pad: 0.28, gap: 0.36 } as const; // end tile: padding around the mark, tile → name (× mark height)
export const MARKER = { top: 0.14, bottom: 1.04, pad: 0.08 } as const; // in em of the mission's 1.1em line box
export const MASK = { y: 0.14, x: 0.2 } as const;
export const INK = { head: 0.5, caption: 0.55, lead: 0.7, rule: 0.3, line: 0.18, index: 0.4 } as const;

export const PEOPLE = [SAMPLE.avatar, ...SAMPLE.people.map((p) => p.photo)];
export const investorsOf = (p: FundingAnnouncementProps) => [p.investor1, p.investor2, p.investor3, p.investor4, p.investor5, p.investor6];

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
// Type on a field or on the accent comes from its brightness: white on dark, near-black on light.
export const inkOn = (bg: string) => (isDark(bg) ? FILM.white : CANVAS.paper.ink);
// The six fields, in shot order.
export const FIELDS = [FILM.black, FILM.black, FILM.cream, FILM.white, FILM.canvas, FILM.black] as const;

// ---------- amount: counts up as one text node ----------
type Amount = { pre: string; value: number; dec: number; grouped: boolean; suf: string };
export const parseAmount = (s: string): Amount | null => {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec((s || "").trim());
  if (!m) return null;
  const clean = m[2].replace(/,/g, "");
  const value = parseFloat(clean);
  if (!Number.isFinite(value)) return null;
  return { pre: m[1], value, dec: clean.includes(".") ? clean.split(".")[1].length : 0, grouped: m[2].includes(","), suf: m[3] };
};
export const amountAt = (s: string, t: number) => {
  const a = parseAmount(s);
  if (!a || t >= 1) return s;
  let str = (a.value * Math.max(0, t)).toFixed(a.dec);
  if (a.grouped) {
    const [i, d] = str.split(".");
    str = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? `.${d}` : "");
  }
  return `${a.pre}${str}${a.suf}`;
};
// Inter 600 advance estimates, minus the -0.05em tracking, so a long amount shrinks to fit its block.
const charEm = (ch: string) => (/\d/.test(ch) ? 0.64 : /[A-Z]/.test(ch) ? 0.82 : /[a-z]/.test(ch) ? 0.6 : /[.,]/.test(ch) ? 0.3 : ch === " " ? 0.28 : 0.66);
export const amountEm = (s: string) => Math.max(1, [...(s || "")].reduce((n, ch) => n + charEm(ch) + TYPE.amountTrack, 0));

// ---------- text model: words, with the highlight split out ----------
export type Part = { text: string; hl: boolean };
export type Word = { text: string; parts: Part[] };

export const findHighlight = (text: string, highlight: string): [number, number] | null => {
  const h = (highlight || "").trim();
  if (!h) return null;
  const i = (text || "").toLowerCase().indexOf(h.toLowerCase());
  if (i < 0) return null;
  // Trailing punctuation on the last word ("back.") rides with the phrase, so the marker covers the whole word.
  let e = i + h.length;
  while (e < (text || "").length && /[.,;:!?)"'”’]/.test(text[e])) e++;
  return [i, e];
};

export const toWords = (text: string, range: [number, number] | null = null): Word[] => {
  const out: Word[] = [];
  const q = text || "";
  let i = 0;
  while (i < q.length) {
    if (/\s/.test(q[i])) {
      i++;
      continue;
    }
    const ws = i;
    while (i < q.length && !/\s/.test(q[i])) i++;
    const we = i;
    const word = q.slice(ws, we);
    const parts: Part[] = [];
    if (range && range[0] < we && range[1] > ws) {
      const a = Math.max(ws, range[0]);
      const b = Math.min(we, range[1]);
      if (a > ws) parts.push({ text: q.slice(ws, a), hl: false });
      parts.push({ text: q.slice(a, b), hl: true });
      if (b < we) parts.push({ text: q.slice(b, we), hl: false });
    } else parts.push({ text: word, hl: false });
    out.push({ text: word, parts });
  }
  return out;
};

const est = (words: Word[]) => (words.reduce((n, w) => n + w.text.length, 0) + Math.max(0, words.length - 1)) * TYPE.emPerChar;
const greedy = (words: Word[], maxEm: number) => {
  const rows: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    if (cur.length && est([...cur, w]) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else cur = [...cur, w];
  }
  if (cur.length) rows.push(cur);
  return rows;
};
// The fewest rows that fit, then the narrowest width that keeps that row count, so rows come out balanced.
const wrapBalanced = (words: Word[], maxEm: number) => {
  if (!words.length) return [];
  const n = greedy(words, maxEm).length;
  let lo = 0;
  let hi = maxEm;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, mid).length <= n) hi = mid;
    else lo = mid;
  }
  return greedy(words, hi);
};
// Starts at the base size and steps down (never below `min`) until the text fits in `maxLines` rows of `maxW`.
export const fitRows = (words: Word[], maxW: number, base: number, min: number, maxLines: number) => {
  let size = base;
  let rows = wrapBalanced(words, maxW / size);
  while ((rows.length > maxLines || Math.max(0, ...rows.map(est)) * size > maxW) && size > min) {
    size = Math.max(min, size * 0.94);
    rows = wrapBalanced(words, maxW / size);
  }
  return { rows, size };
};
export const rowsText = (rows: Word[][]) => rows.map((r) => `"${r.map((w) => w.text).join(" ")}"`).join(" / ");

export const wordStart = (start: number, r: number, i: number, cap: number = T.maxStagger) => start + r * T.lineGap + STAGGER * Math.min(i, cap);
export const riseEnd = (rows: Word[][], start: number, cap: number = T.maxStagger) =>
  Math.max(start, ...rows.map((row, r) => wordStart(start, r, Math.max(0, row.length - 1), cap) + T.wordDur));

// Where the marker sits on each highlighted part, and when the sweep reaches it. Widths are estimates used only for
// timing; the rects are laid out by the browser inside each part's span, so they line up exactly with the type.
export type MarkerSpot = { padL: number; padR: number; s: number; w: number };
export type MarkerPlan = { spots: Record<string, MarkerSpot>; total: number };
export const markerPlan = (rows: Word[][]): MarkerPlan => {
  const spots: Record<string, MarkerSpot> = {};
  let total = 0;
  rows.forEach((row, r) => {
    const list: [number, number][] = [];
    row.forEach((word, i) => word.parts.forEach((part, j) => (part.hl ? list.push([i, j]) : null)));
    list.forEach(([i, j], k) => {
      const padL = k === 0 ? MARKER.pad : 0;
      const padR = k === list.length - 1 ? MARKER.pad : TYPE.gap; // bridges the word gap to the next part
      const w = row[i].parts[j].text.length * TYPE.emPerChar + padL + padR;
      spots[`${r}-${i}-${j}`] = { padL, padR, s: total, w };
      total += w;
    });
  });
  return { spots, total };
};

// ---------- geometry, in design units (W × H is the frame at 1080 on the short side) ----------
export type Rect = { x: number; y: number; w: number; h: number };
export const mixRect = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });

// Shot 1: [mark][name][pixel], centred as a group. The mark is sized by height (a square mark is assumed for
// centring); the lockup is drawn right-anchored to the pixel, so the name → pixel gap is exact whatever the upload.
export const lockupOpen = (brand: string, tall: boolean, W: number, H: number) => {
  const L = sizesFor(tall);
  const S = L.logo;
  const fs = S * 0.82;
  const name = (brand || "").trim();
  const nameW = name ? name.length * NAME_EM * fs : 0;
  const gapName = name ? S * 0.32 : 0;
  const ps = PIXEL.size * fs;
  const pg = name ? PIXEL.gap * fs : S * 0.16;
  const total = S + gapName + nameW + pg + ps;
  const left = (W - total) / 2;
  const cy = H / 2 + L.lockupDy;
  const px = left + total - ps;
  const py = name ? cy + BASELINE * fs - ps : cy + S / 2 - ps;
  return { S, fs, left, cy, right: px - pg, pixel: { x: px, y: py, w: ps, h: ps } as Rect };
};

// Shots 2 and 6: the block, the left half (16:9) or the top half (9:16), full bleed.
export const blockRect = (tall: boolean, W: number, H: number): Rect => (tall ? { x: 0, y: 0, w: W, h: H / 2 } : { x: 0, y: 0, w: W / 2, h: H });

// Shot 6: [accent tile with the mark][name], centred as a group, on the same centre line as shot 1's lockup.
export const lockupEnd = (brand: string, tall: boolean, W: number, H: number) => {
  const L = sizesFor(tall);
  const S = L.logo;
  const fs = S * 0.82;
  const name = (brand || "").trim();
  const tile = S * (1 + 2 * TILE.pad);
  const gap = name ? TILE.gap * S : 0;
  const nameW = name ? name.length * NAME_EM * fs : 0;
  const total = tile + gap + nameW;
  const left = (W - total) / 2;
  const cy = H / 2 + L.lockupDy;
  return { S, fs, cy, tile: { x: left, y: cy - tile / 2, w: tile, h: tile } as Rect, nameX: left + tile + gap };
};

// Shot 4: a hairline grid of six cells, 3 × 2 (16:9) or 2 × 3 (9:16).
export const grid = (tall: boolean, W: number, H: number) => {
  const L = sizesFor(tall);
  const cols = tall ? 2 : 3;
  const rows = tall ? 3 : 2;
  const cellW = L.gridW / cols;
  const gh = rows * L.cellH;
  const x = (W - L.gridW) / 2;
  const y = (H - gh) / 2 + L.gridDy;
  return { cols, rows, cellW, cellH: L.cellH, x, y, w: L.gridW, h: gh };
};

// Shot 5: avatars row, hiring line, url pill, stacked and centred.
export const team = (hiring: string, tall: boolean, W: number, H: number) => {
  const L = sizesFor(tall);
  const t = fitRows(toWords(hiring), L.hiringW, L.hiring, L.hiring * 0.75, L.hiringLines);
  const textH = t.rows.length * t.size * TYPE.lineH;
  const groupH = L.avatar + L.gapAvatars + textH + L.gapPill + L.pillH;
  const top = (H - groupH) / 2 + L.headTop / 2;
  const rowW = PEOPLE.length * L.avatar - (PEOPLE.length - 1) * L.overlap + L.seatGap + L.avatar;
  return { ...t, textH, top, rowX: (W - rowW) / 2, rowW, textTop: top + L.avatar + L.gapAvatars, pillTop: top + L.avatar + L.gapAvatars + textH + L.gapPill };
};

// ---------- pieces ----------
const springAt = (local: number, start: number, fps: number) => spring({ frame: Math.max(0, local - start), fps, config: SPRING_CONFIG });

type Mark = { plan: MarkerPlan; sweep: number; accent: string; on: string; px: number }; // px: the type's font size
// Word-mask rise: each row is its own overflow-hidden mask (padded so descenders and the marker stay inside; the
// negative margin gives the space back), every word its own span rising from 115%.
const Rise: React.FC<{
  rows: Word[][];
  size: number;
  local: number;
  start: number;
  cap?: number;
  align: "left" | "center";
  ink: string;
  track?: number;
  weight?: number;
  mark?: Mark;
}> = ({ rows, size, local, start, cap = T.maxStagger, align, ink, track = TYPE.track, weight = 500, mark }) => (
  <div
    style={{
      fontFamily: FONT_SANS,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: `${track}em`,
      lineHeight: TYPE.lineH,
      color: ink,
      display: "flex",
      flexDirection: "column",
      alignItems: align === "left" ? "flex-start" : "center",
    }}
  >
    {rows.map((row, r) => (
      <div key={r} style={{ overflow: "hidden", padding: `${MASK.y}em ${MASK.x}em`, margin: `-${MASK.y}em -${MASK.x}em` }}>
        <div style={{ display: "flex", gap: `${TYPE.gap}em`, whiteSpace: "nowrap" }}>
          {row.map((word, i) => {
            const s = wordStart(start, r, i, cap);
            const t = progress(local, s, s + T.wordDur, "enter");
            const style: React.CSSProperties = { display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` };
            if (!mark || (word.parts.length === 1 && !word.parts[0].hl)) {
              return (
                <span key={i} style={style}>
                  {word.text}
                </span>
              );
            }
            return (
              <span key={i} style={style}>
                {word.parts.map((part, j) => {
                  const spot = part.hl ? mark.plan.spots[`${r}-${i}-${j}`] : undefined;
                  if (!spot) return <span key={j}>{part.text}</span>;
                  const f = Math.min(1, Math.max(0, (mark.sweep - spot.s) / spot.w));
                  const color = interpolateColors(f, [0.35, 0.75], [ink, mark.on]);
                  return (
                    <span key={j} style={{ position: "relative", display: "inline-block" }}>
                      {f > 0 ? (
                        <span
                          style={{
                            position: "absolute",
                            // Sized from this part's own rendered span (left 0 / right 0), plus an even overshoot in
                            // px, so the rect always matches the word as drawn, whatever the estimate said.
                            left: -spot.padL * mark.px,
                            right: -spot.padR * mark.px,
                            top: MARKER.top * mark.px,
                            bottom: (TYPE.lineH - MARKER.bottom) * mark.px,
                            background: mark.accent,
                            transform: `scaleX(${f.toFixed(4)})`,
                            transformOrigin: "0 50%",
                          }}
                        />
                      ) : null}
                      <span style={{ position: "relative", color }}>{part.text}</span>
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

const mono = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: "0.1em",
  color,
  whiteSpace: "nowrap",
});

// Running head (shots 2–5): the kicker top-left, a shot counter top-right, tiny mono capitals.
export const counterText = (index: number) => `${String(index + 1).padStart(2, "0")} / ${String(SHOT_COUNT).padStart(2, "0")}`;
const Head: React.FC<{ left: string; right: string; leftInk: string; rightInk: string; opacity: number; L: Sizes; u: number }> = ({ left, right, leftInk, rightInk, opacity, L, u }) => (
  <>
    <div style={{ ...mono(L.head * u, leftInk), position: "absolute", left: L.margin * u, top: L.headTop * u, opacity }}>{left.toUpperCase()}</div>
    <div style={{ ...mono(L.head * u, rightInk), position: "absolute", right: L.margin * u, top: L.headTop * u, opacity }}>{right}</div>
  </>
);

type ShotProps = { p: FundingAnnouncementProps; local: number; length: number };

// Shot 1: the logo, the pixel after the name, the kicker.
const OpenShot: React.FC<ShotProps> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const { fps } = useVideoConfig();
  const L = sizesFor(isVertical);
  const o = lockupOpen(p.brand, isVertical, width / u, height / u);
  const t = progress(local, T.lockup[0], T.lockup[1], "enter");
  const ps = springAt(local, T.pixel, fps);
  const k = progress(local, T.kicker[0], T.kicker[1], "enter");
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: width - o.right * u,
          top: (o.cy - o.S / 2) * u,
          height: o.S * u,
          display: "flex",
          alignItems: "center",
          opacity: t,
          transform: `translateY(${((1 - t) * T.lockupRise * u).toFixed(3)}px)`,
        }}
      >
        <Logo src={p.logo || undefined} name={p.brand} size={o.S * u} color={FILM.white} tile={FILM.white} onTile={FILM.black} />
      </div>
      <div
        style={{
          position: "absolute",
          left: o.pixel.x * u,
          top: o.pixel.y * u,
          width: o.pixel.w * u,
          height: o.pixel.h * u,
          background: p.accent,
          transform: `scale(${ps.toFixed(4)})`,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: (o.cy + o.S / 2 + L.kickerGap) * u, display: "flex", justifyContent: "center" }}>
        <div style={{ overflow: "hidden", padding: `${0.2 * L.kicker * u}px 0` }}>
          <div style={{ ...mono(L.kicker * u, alpha(FILM.white, INK.caption)), letterSpacing: "0.12em", transform: `translateY(${((1 - k) * 115).toFixed(3)}%)` }}>
            {(p.kicker || "").toUpperCase()}
          </div>
        </div>
      </div>
    </>
  );
};

// Shot 2: the pixel grows into the block; the amount counts up on it; round and lead on the black.
const AmountShot: React.FC<ShotProps> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = sizesFor(isVertical);
  const W = width / u;
  const H = height / u;
  const onAccent = inkOn(p.accent);
  const o = lockupOpen(p.brand, isVertical, W, H);
  const block = blockRect(isVertical, W, H);
  const r = mixRect(o.pixel, block, progress(local, T.grow[0], T.grow[1], "travel"));
  const cam = mix(1, PUSH, progress(local, T.push2[0], T.push2[1], "travel"));

  const avail = block.w - 2 * L.amountPad;
  const aSize = Math.min(L.amount, avail / amountEm(p.amount));
  const aRise = progress(local, T.amount[0], T.amount[1], "enter");
  const count = progress(local, T.count[0], T.count[1], "enter");

  // round + lead: on the black half (16:9) or the bottom half (9:16)
  const info: Rect = isVertical ? { x: L.infoPad, y: H / 2, w: W - 2 * L.infoPad, h: H / 2 } : { x: W / 2 + L.infoPad, y: 0, w: W / 2 - 2 * L.infoPad, h: H };
  const round = fitRows(toWords(p.round), info.w, L.round, L.round * 0.7, 2);
  const lead = fitRows(toWords(p.lead), info.w, L.lead, L.lead * 0.8, 2);
  const rule = progress(local, T.rule[0], T.rule[1], "travel");
  const head = progress(local, T.head2[0], T.head2[1], "enter");

  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam.toFixed(5)})` }}>
        <div style={{ position: "absolute", left: r.x * u, top: r.y * u, width: r.w * u, height: r.h * u, background: p.accent }} />
        <div
          style={{
            position: "absolute",
            left: (block.x + L.amountPad) * u,
            top: block.y * u,
            width: avail * u,
            height: block.h * u,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ overflow: "hidden", padding: "0.08em 0.06em 0.14em", margin: "-0.08em -0.06em -0.14em" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: aSize * u,
                fontWeight: 600,
                letterSpacing: `${TYPE.amountTrack}em`,
                lineHeight: 1,
                color: onAccent,
                whiteSpace: "nowrap",
                transform: `translateY(${((1 - aRise) * 110).toFixed(3)}%)`,
              }}
            >
              {local >= T.amount[0] ? amountAt(p.amount, count) : ""}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: info.x * u,
            top: info.y * u,
            width: info.w * u,
            height: info.h * u,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div style={{ width: L.ruleW * u, height: STROKE.hair * u, background: alpha(FILM.white, INK.rule), transform: `scaleX(${rule.toFixed(4)})`, transformOrigin: "0 50%" }} />
          <div style={{ height: 40 * u }} />
          <Rise rows={round.rows} size={round.size * u} local={local} start={T.round} align="left" ink={FILM.white} track={TYPE.displayTrack} />
          <div style={{ height: 24 * u }} />
          <Rise rows={lead.rows} size={lead.size * u} local={local} start={T.lead} align="left" ink={alpha(FILM.white, INK.lead)} track={-0.015} weight={400} />
        </div>
      </div>
      <Head
        left={p.kicker}
        right={counterText(1)}
        leftInk={alpha(onAccent, INK.caption)}
        rightInk={isVertical ? alpha(onAccent, INK.caption) : alpha(FILM.white, INK.head)}
        opacity={head}
        L={L}
        u={u}
      />
    </>
  );
};

// Shot 3: the mission, row by row, then the marker sweeps the highlight. The block glides up across the shot.
const MissionShot: React.FC<ShotProps> = ({ p, local, length }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = sizesFor(isVertical);
  const W = width / u;
  const H = height / u;
  const ink = inkOn(FIELDS[2]);
  const m = missionLayout(p, isVertical, W, H);
  const sweep = progress(local, m.marker[0], m.marker[1], "travel") * m.plan.total;
  const glide = progress(local, 0, length, "linear");
  return (
    <>
      <div style={{ position: "absolute", left: m.x * u, top: (m.top + (0.5 - glide) * GLIDE) * u }}>
        <Rise
          rows={m.rows}
          size={m.size * u}
          local={local}
          start={T.mission}
          align="left"
          ink={ink}
          mark={m.range ? { plan: m.plan, sweep, accent: p.accent, on: inkOn(p.accent), px: m.size * u } : undefined}
        />
      </div>
      <Head left={p.kicker} right={counterText(2)} leftInk={alpha(ink, INK.head)} rightInk={alpha(ink, INK.head)} opacity={progress(local, T.head[0], T.head[1], "enter")} L={L} u={u} />
    </>
  );
};
export const missionLayout = (p: Pick<FundingAnnouncementProps, "mission" | "highlight">, tall: boolean, W: number, H: number) => {
  const L = sizesFor(tall);
  const range = findHighlight(p.mission, p.highlight);
  const { rows, size } = fitRows(toWords(p.mission, range), L.missionW, L.mission, L.missionMin, L.missionLines);
  const plan = markerPlan(rows);
  const h = rows.length * size * TYPE.lineH;
  const end = riseEnd(rows, T.mission);
  return {
    range,
    rows,
    size,
    plan,
    x: (W - L.missionW) / 2,
    top: (H - h) / 2 + (tall ? 0 : 12),
    marker: [end + T.markerGap, end + T.markerGap + T.markerDur] as const,
    riseEnd: end,
  };
};

// Shot 4: the investor wall. Hairlines draw on, logos assemble on a diagonal stagger.
const InvestorShot: React.FC<ShotProps> = ({ p, local, length }) => {
  const { u, width, height, isVertical } = useLayout();
  const { fps } = useVideoConfig();
  const L = sizesFor(isVertical);
  const ink = inkOn(FIELDS[3]);
  const g = grid(isVertical, width / u, height / u);
  const lines = progress(local, T.lines[0], T.lines[1], "travel");
  const cam = mix(1, PUSH, progress(local, 0, length, "travel"));
  const cap = progress(local, T.caption[0], T.caption[1], "enter");
  const logos = investorsOf(p);
  const sw = STROKE.hair * u;
  const lineCol = alpha(ink, INK.line);
  const segs: [number, number, number, number][] = [];
  for (let r = 0; r <= g.rows; r++) segs.push([g.x, g.y + r * g.cellH, g.x + g.w * lines, g.y + r * g.cellH]);
  for (let c = 1; c < g.cols; c++) segs.push([g.x + c * g.cellW, g.y, g.x + c * g.cellW, g.y + g.h * lines]);
  const cellT = (i: number) => springAt(local, T.logos + (Math.floor(i / g.cols) + (i % g.cols)) * STAGGER, fps);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam.toFixed(5)})` }}>
        <div style={{ position: "absolute", left: g.x * u, top: (g.y - L.captionGap) * u, display: "flex", alignItems: "center", gap: 14 * u, opacity: cap, transform: `translateY(${((1 - cap) * 12 * u).toFixed(3)}px)` }}>
          <div style={{ width: 10 * u, height: 10 * u, background: p.accent }} />
          <div style={mono(L.caption * u, alpha(ink, INK.caption))}>WITH PARTICIPATION FROM</div>
        </div>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <g stroke={lineCol} strokeWidth={sw}>
            {segs.map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1 * u} y1={y1 * u} x2={x2 * u} y2={y2 * u} />
            ))}
          </g>
          <g fill={alpha(ink, INK.index)} fontFamily={FONT_MONO} fontSize={L.index * u} letterSpacing={0.08 * L.index * u}>
            {logos.map((_, i) => (
              <text key={i} x={(g.x + (i % g.cols) * g.cellW + 20) * u} y={(g.y + Math.floor(i / g.cols) * g.cellH + 20 + L.index * 0.75) * u} opacity={Math.min(1, cellT(i) * 1.4)}>
                {String(i + 1).padStart(2, "0")}
              </text>
            ))}
          </g>
        </svg>
        {logos.map((src, i) => {
          const t = cellT(i);
          const c = i % g.cols;
          const r = Math.floor(i / g.cols);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (g.x + c * g.cellW) * u,
                top: (g.y + r * g.cellH) * u,
                width: g.cellW * u,
                height: g.cellH * u,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: Math.min(1, t * 1.4),
                transform: `translateY(${((1 - t) * 24 * u).toFixed(3)}px) scale(${(0.96 + 0.04 * t).toFixed(4)})`,
              }}
            >
              {src ? <Img src={src} style={{ height: L.investorH * u, width: "auto", maxWidth: g.cellW * 0.66 * u, objectFit: "contain", display: "block" }} /> : null}
            </div>
          );
        })}
      </div>
      <Head left={p.kicker} right={counterText(3)} leftInk={alpha(ink, INK.head)} rightInk={alpha(ink, INK.head)} opacity={progress(local, T.head[0], T.head[1], "enter")} L={L} u={u} />
    </>
  );
};

// Shot 5: the team (five avatars and an open seat), the hiring line, the url pill.
const TeamShot: React.FC<ShotProps> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const { fps } = useVideoConfig();
  const L = sizesFor(isVertical);
  const field = FIELDS[4];
  const ink = inkOn(field);
  const tm = team(p.hiring, isVertical, width / u, height / u);
  const A = L.avatar * u;
  const pill = springAt(local, T.pill, fps);
  const seat = springAt(local, T.avatars + PEOPLE.length * STAGGER, fps);
  const seatR = A / 2 - L.ring * u;
  return (
    <>
      {PEOPLE.map((src, i) => {
        const t = springAt(local, T.avatars + i * STAGGER, fps);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (tm.rowX + i * (L.avatar - L.overlap)) * u,
              top: tm.top * u,
              width: A,
              height: A,
              borderRadius: A / 2,
              overflow: "hidden",
              background: field,
              boxShadow: `0 0 0 ${L.ring * u}px ${field}`,
              opacity: Math.min(1, t * 1.4),
              transform: `translateY(${((1 - t) * 32 * u).toFixed(3)}px)`,
            }}
          >
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        );
      })}
      <svg
        width={A}
        height={A}
        style={{
          position: "absolute",
          left: (tm.rowX + PEOPLE.length * (L.avatar - L.overlap) + L.overlap + L.seatGap) * u,
          top: tm.top * u,
          opacity: Math.min(1, seat * 1.4),
          transform: `translateY(${((1 - seat) * 32 * u).toFixed(3)}px)`,
        }}
      >
        <circle cx={A / 2} cy={A / 2} r={seatR} fill="none" stroke={alpha(ink, 0.3)} strokeWidth={STROKE.ring * u} strokeDasharray={`${8 * u} ${8 * u}`} />
        <g stroke={alpha(ink, 0.55)} strokeWidth={STROKE.ring * u} strokeLinecap="round">
          <line x1={A / 2 - 0.16 * A} y1={A / 2} x2={A / 2 + 0.16 * A} y2={A / 2} />
          <line x1={A / 2} y1={A / 2 - 0.16 * A} x2={A / 2} y2={A / 2 + 0.16 * A} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: tm.textTop * u, display: "flex", justifyContent: "center" }}>
        <Rise rows={tm.rows} size={tm.size * u} local={local} start={T.hiring} cap={T.hiringCap} align="center" ink={ink} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: tm.pillTop * u, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            height: L.pillH * u,
            padding: `0 ${L.pillH * 0.44 * u}px`,
            borderRadius: (L.pillH / 2) * u,
            background: FILM.white,
            boxShadow: `inset 0 0 0 ${u}px ${alpha(ink, 0.1)}, 0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
            display: "flex",
            alignItems: "center",
            gap: L.pillText * 0.55 * u,
            opacity: Math.min(1, pill * 1.4),
            transform: `translateY(${((1 - pill) * 24 * u).toFixed(3)}px) scale(${(0.96 + 0.04 * pill).toFixed(4)})`,
          }}
        >
          <div style={{ width: L.pillText * 0.42 * u, height: L.pillText * 0.42 * u, background: p.accent }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: L.pillText * u, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: CANVAS.paper.ink, whiteSpace: "nowrap" }}>{p.url}</div>
          <svg width={L.pillText * 0.7 * u} height={L.pillText * 0.7 * u} viewBox="0 0 20 20" style={{ display: "block" }}>
            <path d="M3 10 H16 M11 5 L16 10 L11 15" fill="none" stroke={CANVAS.paper.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Head left={p.kicker} right={counterText(4)} leftInk={alpha(ink, INK.head)} rightInk={alpha(ink, INK.head)} opacity={progress(local, T.head[0], T.head[1], "enter")} L={L} u={u} />
    </>
  );
};

// Shot 6: the block shrinks back into the tile behind the logo; thank-you line; held still.
const EndShot: React.FC<ShotProps> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = sizesFor(isVertical);
  const W = width / u;
  const H = height / u;
  const e = lockupEnd(p.brand, isVertical, W, H);
  const r = mixRect(blockRect(isVertical, W, H), e.tile, progress(local, T.shrink[0], T.shrink[1], "travel"));
  const onAccent = inkOn(p.accent);
  const mk = progress(local, T.mark[0], T.mark[1], "enter");
  const nm = progress(local, T.name[0], T.name[1], "enter");
  const th = fitRows(toWords(p.thanks), L.thanksW, L.thanks, L.thanks * 0.75, L.thanksLines);
  return (
    <>
      <div style={{ position: "absolute", left: r.x * u, top: r.y * u, width: r.w * u, height: r.h * u, background: p.accent }} />
      <div
        style={{
          position: "absolute",
          left: e.tile.x * u,
          top: e.tile.y * u,
          width: e.tile.w * u,
          height: e.tile.h * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: mk,
          transform: `scale(${(0.96 + 0.04 * mk).toFixed(4)})`,
        }}
      >
        <Logo src={p.logo || undefined} name={p.brand} size={e.S * u} color={onAccent} tile={onAccent} onTile={p.accent} showName={false} />
      </div>
      {(p.brand || "").trim() ? (
        <div
          style={{
            position: "absolute",
            left: e.nameX * u,
            top: (e.cy - e.fs / 2) * u,
            fontFamily: FONT_SANS,
            fontSize: e.fs * u,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: FILM.white,
            whiteSpace: "nowrap",
            opacity: nm,
            transform: `translateY(${((1 - nm) * 12 * u).toFixed(3)}px)`,
          }}
        >
          {p.brand.trim()}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: (e.tile.y + e.tile.h + L.thanksGap) * u, display: "flex", justifyContent: "center" }}>
        <Rise rows={th.rows} size={th.size * u} local={local} start={T.thanks} cap={T.thanksCap} align="center" ink={FILM.white} track={TYPE.displayTrack} />
      </div>
    </>
  );
};

// ---------- film ----------
export const FundingAnnouncement: React.FC<FundingAnnouncementProps> = (p) => {
  const { index, local, length } = useShot(SHOTS);
  const s = { p, local, length };
  return (
    <AbsoluteFill style={{ background: FIELDS[index], fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <OpenShot {...s} /> : null}
      {index === 1 ? <AmountShot {...s} /> : null}
      {index === 2 ? <MissionShot {...s} /> : null}
      {index === 3 ? <InvestorShot {...s} /> : null}
      {index === 4 ? <TeamShot {...s} /> : null}
      {index === 5 ? <EndShot {...s} /> : null}
    </AbsoluteFill>
  );
};
