import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CURSOR_COLORS, Cursor, FILM, Logo, useShot } from "../../film";
import { FONT_SANS, RADIUS, STAGGER, alpha, progress, useLayout } from "../../kit";

export type ThreePointsProps = {
  field: string; // shots 1 and 2
  c1: string;
  c2: string;
  c3: string;
  end: string; // shot 3
  title: string;
  point1: string;
  point2: string;
  point3: string;
  brand: string;
  logo: string;
  cursorName: string;
};

// ---------- timeline (frames of the 240-frame film; shots are hard cuts) ----------
export const SHOTS = [0, 54, 168] as const;
// Timings below are local to their shot.
export const T = {
  wordStart: 2, // first title word starts rising, frames after the cut
  wordDur: 16, // one word's rise
  maxStagger: 8, // stagger steps before words start together
  cardStart: 2, // first card starts rising
  cardStagger: 4, // frames between cards
  cardDur: 24, // one card's spring rise
  cardFade: 12, // one card's fade
  glide: [36, 56] as const, // cursor glide in (frames 90–110 of the film)
  click: 56, // press bump as it lands (frame 110)
  lift: [57, 81] as const, // card 2 lifts on the spring (frames 111–135)
  logoStart: 2,
  logoDur: 18,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: { title: 120, titleMaxW: 1300, titleLines: 2, top: 72, small: 44, smallLines: 1, cardH: 380, gap: 24, bottom: 200, point: 36, logo: 80, cursor: 1.4 },
  tall: { title: 110, titleMaxW: 936, titleLines: 3, top: 140, small: 56, smallLines: 2, cardH: 300, gap: 20, bottom: 200, point: 44, logo: 110, cursor: 1.6 },
} as const;
export const MARGIN = 72;
export const PAD = 32; // card text padding
export const RISE = 24; // px each card rises on entry
export const LIFT = { up: 24, slide: 16, scale: 1.02, dim: 0.85 } as const; // up: 16:9, slide (right): 9:16
export const TRACK = { title: -0.04, small: -0.03, point: -0.02 } as const;
export const LINE_H = 1.08;
export const POINT_LINE_H = 1.15;
// Where the cursor lands on card 2, as fractions of the card.
export const TARGET = { wide: [0.58, 0.46] as const, tall: [0.66, 0.5] as const };
export const liftShadow = (u: number, l: number) =>
  `0 ${2 * u * l}px ${4 * u}px ${alpha(FILM.black, 0.06 * l)}, 0 ${24 * u * l}px ${48 * u}px ${alpha(FILM.black, 0.16 * l)}`;

// Card rectangles in design units (u = 1): a row of three at 16:9 aligned to the title margin, a stack of three at 9:16.
export type Rect = { x: number; y: number; w: number; h: number };
export const cardRects = (W: number, H: number, tall: boolean): Rect[] => {
  const L = tall ? SIZE.tall : SIZE.wide;
  if (tall) {
    const w = W - 2 * MARGIN;
    const y0 = H - L.bottom - (3 * L.cardH + 2 * L.gap);
    return [0, 1, 2].map((i) => ({ x: MARGIN, y: y0 + i * (L.cardH + L.gap), w, h: L.cardH }));
  }
  const w = (W - 2 * MARGIN - 2 * L.gap) / 3;
  const y = H - L.bottom - L.cardH;
  return [0, 1, 2].map((i) => ({ x: MARGIN + i * (w + L.gap), y, w, h: L.cardH }));
};

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);

// ---------- type layout: balanced rows, shrunk to fit ----------
// Inter 500 at -0.04em averages ~0.5em per character; 0.54 keeps a margin so a row never overflows.
const EM_PER_CHAR = 0.54;
const est = (words: string[]) => words.join(" ").length * EM_PER_CHAR;

const greedy = (words: string[], maxEm: number) => {
  const rows: string[][] = [];
  let cur: string[] = [];
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
const wrapBalanced = (text: string, maxEm: number) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
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

export const fitRows = (text: string, maxW: number, base: number, maxLines: number) => {
  let size = base;
  let rows = wrapBalanced(text, maxW / size);
  for (let i = 0; i < 7; i++) {
    const longest = Math.max(0, ...rows.map(est)) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size);
  }
  return { rows, size };
};

// ---------- pieces ----------
// Each row is its own mask: padding keeps descenders inside the clip, the negative margin gives the space back.
const Rise: React.FC<{ rows: string[][]; local: number }> = ({ rows, local }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em -0.08em" }}>
            <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: LINE_H }}>
              {words.map((w, i) => {
                const s = T.wordStart + STAGGER * Math.min(first + i, T.maxStagger);
                const t = progress(local, s, s + T.wordDur, "enter");
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

type Pt = [number, number];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// A slight arc between two points, as a hand moves a mouse.
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// ---------- shots ----------
const TitleShot: React.FC<{ p: ThreePointsProps; local: number }> = ({ p, local }) => {
  const { u, width, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const { rows, size } = fitRows(p.title, Math.min(L.titleMaxW * u, width - 2 * MARGIN * u), L.title * u, L.titleLines);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGIN * u,
        top: L.top * u,
        fontFamily: FONT_SANS,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: `${TRACK.title}em`,
        color: textOn(p.field),
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Rise rows={rows} local={local} />
    </div>
  );
};

const CardsShot: React.FC<{ p: ThreePointsProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.field);

  // the title, cut small to the top-left (static: the cut does the work)
  const small = fitRows(p.title, width - 2 * MARGIN * u, L.small * u, L.smallLines);

  const rects = cardRects(width / u, height / u, isVertical);
  const colors = [p.c1, p.c2, p.c3];
  const points = [p.point1, p.point2, p.point3];
  const lift = progress(local, T.lift[0], T.lift[1], "spring");
  const dx = isVertical ? LIFT.slide * u * lift : 0;
  const dy = isVertical ? 0 : -LIFT.up * u * lift;

  // cursor: glides in from the bottom-right on an arc, lands on card 2 and rides with it as it lifts
  const r2 = rects[1];
  const tg = isVertical ? TARGET.tall : TARGET.wide;
  const target: Pt = [(r2.x + tg[0] * r2.w) * u, (r2.y + tg[1] * r2.h) * u];
  const start: Pt = [width + 40 * u, height + 60 * u];
  const g = glide(start, target, progress(local, T.glide[0], T.glide[1], "travel"));
  const press = interpolate(local, [T.click - 3, T.click, T.click + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          top: L.top * u,
          fontFamily: FONT_SANS,
          fontSize: small.size,
          fontWeight: 500,
          letterSpacing: `${TRACK.small}em`,
          lineHeight: LINE_H,
          color: ink,
          whiteSpace: "nowrap",
        }}
      >
        {small.rows.map((r, i) => (
          <div key={i}>{r.join(" ")}</div>
        ))}
      </div>
      {rects.map((r, i) => {
        const s = T.cardStart + T.cardStagger * i;
        const rise = progress(local, s, s + T.cardDur, "spring");
        const fade = progress(local, s, s + T.cardFade, "enter");
        const lifted = i === 1;
        const tx = lifted ? dx : 0;
        const ty = (1 - rise) * RISE * u + (lifted ? dy : 0);
        const sc = lifted ? 1 + (LIFT.scale - 1) * lift : 1;
        const dim = lifted ? 1 : 1 - (1 - LIFT.dim) * lift;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r.x * u,
              top: r.y * u,
              width: r.w * u,
              height: r.h * u,
              borderRadius: RADIUS.card * u,
              background: colors[i],
              opacity: fade * dim,
              transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${sc.toFixed(4)})`,
              boxShadow: lifted && lift > 0 ? liftShadow(u, lift) : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: PAD * u,
                right: PAD * u,
                bottom: PAD * u,
                fontFamily: FONT_SANS,
                fontSize: L.point * u,
                fontWeight: 500,
                letterSpacing: `${TRACK.point}em`,
                lineHeight: POINT_LINE_H,
                color: textOn(colors[i]),
              }}
            >
              {points[i]}
            </div>
          </div>
        );
      })}
      {local >= T.glide[0] ? (
        <Cursor u={u} x={g[0] + dx} y={g[1] + dy} name={p.cursorName} color={CURSOR_COLORS.pink} press={press} scale={L.cursor} />
      ) : null}
    </>
  );
};

const LogoShot: React.FC<{ p: ThreePointsProps; local: number }> = ({ p, local }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.end);
  const t = progress(local, T.logoStart, T.logoStart + T.logoDur, "enter");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: t, transform: `scale(${(0.96 + 0.04 * t).toFixed(4)})` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.end} />
      </div>
    </AbsoluteFill>
  );
};

export const ThreePoints: React.FC<ThreePointsProps> = (p) => {
  const { index, local } = useShot(SHOTS);
  const bg = index === 2 ? p.end : p.field;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <TitleShot p={p} local={local} /> : null}
      {index === 1 ? <CardsShot p={p} local={local} /> : null}
      {index === 2 ? <LogoShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
