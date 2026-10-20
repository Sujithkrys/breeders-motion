import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CURSOR_COLORS, CodeTexture, Cursor, FILM, Logo, SAMPLE, Screenshot, SelectionBox, useShot } from "../../film";
import { FONT_SANS, STAGGER, alpha, mix, progress, useLayout } from "../../kit";
import { areaOn, areaValue, parseArea, parsePoint, pointOn, pointValue, type Area, type Point } from "../../placement";

export type StatementProps = {
  base: string; // shots 1, 2 and 4
  field: string; // shot 3
  line1: string;
  line2: string;
  line3: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  cursorName: string;
  showCursor: boolean;
  showSelection: boolean;
  clickPoint: string; // "x,y" on screenshot (16:9)
  selectArea: string; // "x,y,w,h" on screenshot (16:9)
  clickPointTall: string; // "x,y" on phoneShot (9:16)
  selectAreaTall: string; // "x,y,w,h" on phoneShot (9:16)
};

// ---------- timeline (frames of the 240-frame film; shots are hard cuts) ----------
export const SHOTS = [0, 48, 96, 168] as const;
// Timings below are local to their shot.
export const T = {
  wordStart: 2, // first word starts rising, frames after the cut
  wordDur: 16, // one word's rise
  maxStagger: 8, // stagger steps before words start together
  shotRise: 22, // screenshot travel
  shotFade: 12, // screenshot fade
  travel: 80, // px at 1080 the screenshot rises
  glide: [14, 44] as const, // cursor glide in
  click: 50, // press bump (frame 146 of the film)
  select: [51, 63] as const, // selection box grows from the button to its target
  logoStart: 2,
  logoDur: 18,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: { statement: 120, maxW: 1100, maxLines: 3, line3: 64, line3MaxW: 1400, shotW: 1240, radius: 32, logo: 80, cursor: 1.4 },
  tall: { statement: 124, maxW: 936, maxLines: 4, line3: 80, line3MaxW: 936, shotW: 620, radius: 48, logo: 120, cursor: 1.6 },
} as const;
export const TRACK = { statement: -0.04, line3: -0.035 } as const;
export const LINE_H = 1.08;
export const MARGIN = 72;
export const TEXTURE_OPACITY = 0.1;
export const SEEDS = [7, 23] as const;

// ---------- placements (user-movable; fractions of the visible screenshot slot) ----------
// The slot's shape as drawn: a 16:10 page frame at 16:9, a 9:19.5 phone screen at 9:16. The image fills the slot's
// width and crops from the top, so placements are fractions of the slot, not of the full upload.
export const SLOT_ASPECT = { wide: 16 / 10, tall: 9 / 19.5 } as const;
// Defaults, tuned to the samples: the CTA under the Lumen hero and the hero itself; the phone's bottom button and the
// whole phone screen.
export const CLICK_WIDE: Point = { x: 0.447, y: 0.573 };
export const SELECT_WIDE: Area = { x: 0.29, y: 0.135, w: 0.42, h: 0.5 };
export const CLICK_TALL: Point = { x: 0.5, y: 0.928 };
export const SELECT_TALL: Area = { x: 0, y: 0, w: 1, h: 1 };
export const PLACEMENT_DEFAULTS = {
  clickPoint: pointValue(CLICK_WIDE),
  selectArea: areaValue(SELECT_WIDE),
  clickPointTall: pointValue(CLICK_TALL),
  selectAreaTall: areaValue(SELECT_TALL),
} as const;
// The small pressed box the selection grows out of, centred on the click point (kept inside the slot).
export const PRESS_BOX = { wide: { w: 0.08, h: 0.053 }, tall: { w: 0.12, h: 0.04 } } as const;
// The reference page the size tag measures against: the 16:9 slot is a 1440×900 page, the phone a 390×844 screen.
export const REF_PAGE = { wide: { w: 1440, h: 900 }, tall: { w: 390, h: 844 } } as const;

const inside = (start: number, size: number) => Math.min(1 - size, Math.max(0, start));
export const placements = (p: StatementProps, tall: boolean) => {
  const click = tall ? parsePoint(p.clickPointTall, CLICK_TALL) : parsePoint(p.clickPoint, CLICK_WIDE);
  const to = tall ? parseArea(p.selectAreaTall, SELECT_TALL) : parseArea(p.selectArea, SELECT_WIDE);
  const box = tall ? PRESS_BOX.tall : PRESS_BOX.wide;
  const from: Area = { x: inside(click.x - box.w / 2, box.w), y: inside(click.y - box.h / 2, box.h), w: box.w, h: box.h };
  const ref = tall ? REF_PAGE.tall : REF_PAGE.wide;
  const label = `${Math.round(to.w * ref.w)} × ${Math.round(to.h * ref.h)}`;
  // Whether each placement is still the default, so the prompt can name the element it sits on.
  const clickIsDefault = pointValue(click) === pointValue(tall ? CLICK_TALL : CLICK_WIDE);
  const areaIsDefault = areaValue(to) === areaValue(tall ? SELECT_TALL : SELECT_WIDE);
  return { click, from, to, label, clickIsDefault, areaIsDefault };
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
const Rise: React.FC<{ rows: string[][]; local: number; left: boolean }> = ({ rows, local, left }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: left ? "0 0 -0.14em -0.08em" : "0 0 -0.14em" }}>
            <div style={{ display: "flex", justifyContent: left ? "flex-start" : "center", gap: "0.25em", whiteSpace: "nowrap", lineHeight: LINE_H }}>
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
const TypeShot: React.FC<{ text: string; seed: number; base: string; local: number }> = ({ text, seed, base, local }) => {
  const { u, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(base);
  const { rows, size } = fitRows(text, L.maxW * u, L.statement * u, L.maxLines);
  const type: React.CSSProperties = {
    fontFamily: FONT_SANS,
    fontSize: size,
    fontWeight: 500,
    letterSpacing: `${TRACK.statement}em`,
    color: ink,
  };
  return (
    <>
      <CodeTexture u={u} color={ink} opacity={TEXTURE_OPACITY} seed={seed} />
      {isVertical ? (
        <div style={{ ...type, position: "absolute", left: 90 * u, top: height * 0.5, width: L.maxW * u, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <Rise rows={rows} local={local} left />
        </div>
      ) : (
        <div style={{ ...type, position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Rise rows={rows} local={local} left={false} />
        </div>
      )}
    </>
  );
};

const CanvasShot: React.FC<{ p: StatementProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const pl = placements(p, isVertical);
  const ink = textOn(p.field);

  // line 3, top-left
  const { rows, size } = fitRows(p.line3, Math.min(L.line3MaxW * u, width - 2 * MARGIN * u), L.line3 * u, 2);

  // screenshot frame: 16:10 page at 16:9, a 9:19.5 phone screen at 9:16
  const w = L.shotW * u;
  const h = isVertical ? (w * 19.5) / 9 : (w * 10) / 16;
  const x = (width - w) / 2;
  const y0 = isVertical ? Math.max(220 * u, (height - h) / 2 + 60 * u) : (height - h) / 2 + 40 * u;
  const rise = progress(local, 0, T.shotRise, "enter");
  const fade = progress(local, 0, T.shotFade, "enter");
  const y = y0 + (1 - rise) * T.travel * u;
  const src = isVertical ? p.phoneShot || SAMPLE.phone : p.screenshot || SAMPLE.site;
  const shadow = `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;

  // cursor: glides in from the bottom-right on an arc, clicks at the click point (on the slot as it rises)
  const c = pointOn(pl.click, x, y, w, h);
  const target: Pt = [c.x, c.y];
  const start: Pt = [width + 40 * u, height + 60 * u];
  const cur = glide(start, target, progress(local, T.glide[0], T.glide[1], "travel"));
  const press = interpolate(local, [T.click - 3, T.click, T.click + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // selection: grows from the pressed element at the click point out to the selection area
  const s = progress(local, T.select[0], T.select[1], "enter");
  const r = areaOn(
    {
      x: mix(pl.from.x, pl.to.x, s),
      y: mix(pl.from.y, pl.to.y, s),
      w: mix(pl.from.w, pl.to.w, s),
      h: mix(pl.from.h, pl.to.h, s),
    },
    x,
    y,
    w,
    h,
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          top: MARGIN * u,
          fontFamily: FONT_SANS,
          fontSize: size,
          fontWeight: 500,
          letterSpacing: `${TRACK.line3}em`,
          color: ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Rise rows={rows} local={local} left />
      </div>
      <Screenshot src={src} x={x} y={y} w={w} h={h} radius={L.radius * u} line={alpha(FILM.black, 0.06)} shadow={shadow} style={{ opacity: fade }} />
      {p.showSelection !== false ? (
        <SelectionBox u={u} x={r.x} y={r.y} w={r.w} h={r.h} color={FILM.select} label={pl.label} t={local >= T.select[0] ? s : 0} />
      ) : null}
      {p.showCursor !== false ? <Cursor u={u} x={cur[0]} y={cur[1]} name={p.cursorName} color={CURSOR_COLORS.pink} press={press} scale={L.cursor} /> : null}
    </>
  );
};

const LogoShot: React.FC<{ p: StatementProps; local: number }> = ({ p, local }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.base);
  const t = progress(local, T.logoStart, T.logoStart + T.logoDur, "enter");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: t, transform: `scale(${(0.96 + 0.04 * t).toFixed(4)})` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.base} />
      </div>
    </AbsoluteFill>
  );
};

export const Statement: React.FC<StatementProps> = (p) => {
  const { index, local } = useShot(SHOTS);
  const bg = index === 2 ? p.field : p.base;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <TypeShot text={p.line1} seed={SEEDS[0]} base={p.base} local={local} /> : null}
      {index === 1 ? <TypeShot text={p.line2} seed={SEEDS[1]} base={p.base} local={local} /> : null}
      {index === 2 ? <CanvasShot p={p} local={local} /> : null}
      {index === 3 ? <LogoShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
