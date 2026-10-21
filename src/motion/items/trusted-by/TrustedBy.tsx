import React from "react";
import { AbsoluteFill, Img, spring } from "remotion";
import { CUSTOMER_LOGOS, FILM, Logo, customerLogo, useShot } from "../../film";
import { FONT_MONO, FONT_SANS, SPRING_CONFIG, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type TrustedByProps = {
  field: string; // shots 1–2: headline and logo wall
  band: string; // shot 3: the stats strip
  caption: string;
  lead: string;
  count: number;
  countSuffix: string;
  noun: string;
  logo1: string;
  logo2: string;
  logo3: string;
  logo4: string;
  logo5: string;
  logo6: string;
  logo7: string;
  logo8: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  brand: string;
  logo: string;
};

// ---------- timeline (frames of the 240-frame film; shots are hard cuts) ----------
export const SHOTS = [0, 60, 180] as const;
// Timings below are local to their shot.
export const T = {
  caption: [0, 18] as const, // shot 1: mono caption fades and rises 8px
  wordStart: 6, // shot 1: first headline word starts rising
  wordDur: 18,
  count: 30, // shot 1: the number counts up over this many frames from its own rise
  push: 0.03, // shots 1–2: slow linear push-in (scale gain over the shot)
  gridDraw: 18, // shot 2: each hairline draws on over this many frames
  gridStagger: 3,
  header: [4, 22] as const, // shot 2: header row above the wall
  logoStart: 12, // shot 2: first logo starts (diagonal stagger, 3f per diagonal)
  logoRise: 16, // px the logos rise on the spring
  sweep: [70, 112] as const, // shot 2 (film frames 130–172): highlight sweeps across the wall, linear
  dimIn: [64, 74] as const, // the wall dims to 55% as the sweep begins…
  dimOut: [106, 118] as const, // …and returns to 70% after it
  sepDraw: [0, 18] as const, // shot 3: hairline separators draw on
  valueStart: 4, // shot 3: first value rises (3f stagger)
  valueDur: 18,
  labelStart: 10, // shot 3: first label fades and rises 12px (3f stagger)
  labelDur: 18,
  brandIn: [16, 34] as const, // shot 3: brand logo fades in and scales 0.96 → 1
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    headline: 120,
    headMaxW: 1640,
    caption: 20,
    captionGap: 40,
    gridW: 1560,
    cols: 4,
    rows: 2,
    cellH: 220,
    gridDY: 24,
    logoH: 52,
    header: 18,
    value: 120,
    label: 22,
    statsW: 1560,
    sepH: 260,
    brand: 40,
    brandBottom: 72,
  },
  tall: {
    headline: 130,
    headMaxW: 936,
    caption: 22,
    captionGap: 48,
    gridW: 936,
    cols: 2,
    rows: 4,
    cellH: 250,
    gridDY: 40,
    logoH: 60,
    header: 20,
    value: 130,
    label: 24,
    statsW: 936,
    rowH: 300,
    brand: 52,
    brandBottom: 120,
  },
} as const;
export const MARGIN = 56; // corner marks
export const CORNER = 18; // corner mark size (Geist Mono)
export const TRACK = { headline: -0.045, value: -0.045 } as const;
export const LINE_H = 1.0;
export const OVERSHOOT = 16; // hairlines run past the grid's outer edge, like crop marks on a spec sheet
export const OPACITY = { rest: 0.7, dim: 0.55, line: 0.22, caption: 0.5, label: 0.55, corner: 0.45, index: 0.35, cellFill: 0.045 } as const;

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);

// ---------- customer logos ----------
// Slots 1–8 default to the bundled sample set. While a slot still holds a sample path (ink or white), the film swaps
// it to the tone that reads on the field; anything the user uploads is shown as-is.
export const LOGO_KEYS = ["logo1", "logo2", "logo3", "logo4", "logo5", "logo6", "logo7", "logo8"] as const;
export const LOGO_NAMES = ["northwind", "halcyon", "quanta", "fieldwork", "orbital", "parallel", "kite", "monolith"] as const;
const sampleName = (v: string) => CUSTOMER_LOGOS.find((n) => v === customerLogo(n, "ink") || v === customerLogo(n, "white"));
export const isSampleLogo = (v: string) => sampleName(v) !== undefined;
export const resolveLogo = (value: string, dark: boolean) => {
  const name = sampleName(value);
  return name ? customerLogo(name, dark ? "white" : "ink") : value;
};

// ---------- numbers ----------
export const countOf = (v: unknown) => Math.max(0, Math.min(9999999, Math.round(Number(v) || 0)));
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// ---------- headline layout ----------
// Inter 500 at -0.045em averages ~0.52em per character, Inter 600 figures ~0.6em; a margin keeps rows from overflowing.
const EM_WORD = 0.54;
const EM_NUM = 0.6;
const GAP = 0.25; // word gap, em
type Tok = { text: string; num: boolean };
const tokW = (t: Tok) => t.text.length * (t.num ? EM_NUM : EM_WORD);
const rowW = (r: Tok[]) => r.reduce((s, t) => s + tokW(t), 0) + GAP * Math.max(0, r.length - 1);
const words = (s: string): Tok[] => s.trim().split(/\s+/).filter(Boolean).map((text) => ({ text, num: false }));
const greedy = (toks: Tok[], maxEm: number) => {
  const rows: Tok[][] = [];
  let cur: Tok[] = [];
  for (const t of toks) {
    if (cur.length && rowW([...cur, t]) > maxEm) {
      rows.push(cur);
      cur = [t];
    } else cur = [...cur, t];
  }
  if (cur.length) rows.push(cur);
  return rows;
};

// 16:9: one line when it fits, otherwise the lead over the number and noun. 9:16: lead, number and noun stacked.
// Rows shrink together until the longest one fits.
export const headlineRows = (p: Pick<TrustedByProps, "lead" | "count" | "countSuffix" | "noun">, tall: boolean, maxW: number, base: number) => {
  const num: Tok = { text: `${fmt(countOf(p.count))}${p.countSuffix || ""}`, num: true };
  const lead = words(p.lead);
  const noun = words(p.noun);
  const layout = (size: number): Tok[][] => {
    const m = maxW / size;
    if (tall) return [...greedy(lead, m), [num], ...greedy(noun, m)].filter((r) => r.length);
    const one = [...lead, num, ...noun];
    if (rowW(one) <= m) return [one];
    return [...greedy(lead, m), ...greedy([num, ...noun], m)].filter((r) => r.length);
  };
  let size = base;
  let rows = layout(size);
  for (let i = 0; i < 10; i++) {
    const longest = Math.max(0, ...rows.map(rowW)) * size;
    if (longest <= maxW && rows.length <= (tall ? 4 : 2)) break;
    size *= 0.92;
    rows = layout(size);
  }
  return { rows, size, numText: num.text };
};

// A single line of mono or display text shrunk to a width.
export const fitSize = (text: string, base: number, maxW: number, em: number) => Math.min(base, maxW / Math.max(1, text.length * em));

// ---------- wall geometry ----------
export const wall = (tall: boolean, width: number, height: number, u: number) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const w = L.gridW * u;
  const cellW = w / L.cols;
  const cellH = L.cellH * u;
  const h = cellH * L.rows;
  const x = (width - w) / 2;
  const y = (height - h) / 2 + L.gridDY * u;
  const cells = Array.from({ length: L.cols * L.rows }, (_, i) => {
    const col = i % L.cols;
    const row = Math.floor(i / L.cols);
    // Sweep order: left → right across the columns (16:9); down the rows, left before right (9:16).
    const key = tall ? row + col * 0.5 : col + row * 0.5;
    return { i, col, row, x: x + col * cellW, y: y + row * cellH, w: cellW, h: cellH, diag: col + row, key };
  });
  const maxKey = Math.max(...cells.map((c) => c.key));
  return { L, x, y, w, h, cellW, cellH, cells, maxKey };
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));

// ---------- pieces ----------
const Corners: React.FC<{ index: number; brand: string; ink: string }> = ({ index, brand, ink }) => {
  const { u } = useLayout();
  const st: React.CSSProperties = {
    position: "absolute",
    top: MARGIN * u,
    fontFamily: FONT_MONO,
    fontSize: CORNER * u,
    letterSpacing: "0.12em",
    color: alpha(ink, OPACITY.corner),
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ ...st, left: MARGIN * u }}>{`0${index + 1} / 0${SHOTS.length}`}</div>
      {brand ? <div style={{ ...st, right: MARGIN * u }}>{brand.toUpperCase()}</div> : null}
    </>
  );
};

// Shot 1: caption, then the headline rising word by word; the number counts up as one text node.
const HeadlineShot: React.FC<{ p: TrustedByProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.field);
  const { rows, size, numText } = headlineRows(p, isVertical, L.headMaxW * u, L.headline * u);
  const total = countOf(p.count);
  const cap = progress(local, T.caption[0], T.caption[1], "enter");
  const push = 1 + T.push * progress(local, 0, length, "linear");
  let k = 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push.toFixed(5)})` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {p.caption ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              marginBottom: L.captionGap * u,
              opacity: cap,
              transform: `translateY(${((1 - cap) * 8 * u).toFixed(3)}px)`,
            }}
          >
            <div style={{ width: 10 * u, height: 10 * u, borderRadius: 999, background: FILM.orange }} />
            <div style={{ fontFamily: FONT_MONO, fontSize: L.caption * u, letterSpacing: "0.12em", color: alpha(ink, OPACITY.caption), lineHeight: 1, whiteSpace: "nowrap" }}>
              {p.caption.toUpperCase()}
            </div>
          </div>
        ) : null}
        <div style={{ fontFamily: FONT_SANS, fontSize: size, fontWeight: 500, letterSpacing: `${TRACK.headline}em`, color: ink, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {rows.map((r, ri) => (
            <div key={ri} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: `${GAP}em`, whiteSpace: "nowrap", lineHeight: LINE_H }}>
                {r.map((t, ti) => {
                  const s = T.wordStart + STAGGER * Math.min(k++, 8);
                  const rise = progress(local, s, s + T.wordDur, "enter");
                  const tr = `translateY(${((1 - rise) * 115).toFixed(3)}%)`;
                  if (!t.num) {
                    return (
                      <span key={ti} style={{ display: "inline-block", transform: tr }}>
                        {t.text}
                      </span>
                    );
                  }
                  // The hidden final value reserves the width; the live value sits right-aligned over it, so the row
                  // never reflows while the digits change.
                  const n = total * progress(local, s, s + T.count, "enter");
                  return (
                    <span key={ti} style={{ display: "inline-block", position: "relative", fontWeight: 600, transform: tr }}>
                      <span style={{ visibility: "hidden" }}>{numText}</span>
                      <span style={{ position: "absolute", right: 0, top: 0 }}>{`${fmt(n)}${p.countSuffix || ""}`}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Shot 2: the hairline spec grid draws on, the logos rise in on a diagonal, then a highlight sweeps across.
const WallShot: React.FC<{ p: TrustedByProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, width, height, isVertical, fps } = useLayout();
  const dark = isDark(p.field);
  const ink = textOn(p.field);
  const g = wall(isVertical, width, height, u);
  const L = g.L;
  const push = 1 + T.push * progress(local, 0, length, "linear");
  const hair = STROKE.hair * u;
  const o = OVERSHOOT * u;

  // hairlines: horizontals left → right, then verticals top → bottom
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let r = 0; r <= L.rows; r++) lines.push({ x1: g.x - o, y1: g.y + r * g.cellH, x2: g.x + g.w + o, y2: g.y + r * g.cellH });
  for (let c = 0; c <= L.cols; c++) lines.push({ x1: g.x + c * g.cellW, y1: g.y - o, x2: g.x + c * g.cellW, y2: g.y + g.h + o });

  // highlight sweep (linear position), with the wall dimming to 55% while it runs
  const pos = mix(-1, g.maxKey + 1, progress(local, T.sweep[0], T.sweep[1], "linear"));
  const dim = progress(local, T.dimIn[0], T.dimIn[1], "travel") * (1 - progress(local, T.dimOut[0], T.dimOut[1], "travel"));
  const rest = mix(OPACITY.rest, OPACITY.dim, dim);
  const lit = (key: number) => (local < T.sweep[0] || local > T.sweep[1] ? 0 : smooth(1 - Math.abs(pos - key) / 0.9));

  const head = progress(local, T.header[0], T.header[1], "enter");
  const headStyle: React.CSSProperties = {
    position: "absolute",
    top: g.y - o - 26 * u - L.header * u,
    fontFamily: FONT_MONO,
    fontSize: L.header * u,
    letterSpacing: "0.12em",
    color: alpha(ink, OPACITY.caption),
    lineHeight: 1,
    whiteSpace: "nowrap",
    opacity: head,
    transform: `translateY(${((1 - head) * 8 * u).toFixed(3)}px)`,
  };
  const indexFade = progress(local, T.gridDraw, T.gridDraw + 16, "enter");
  const logoMaxW = g.cellW * 0.72;

  return (
    <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})` }}>
      {p.caption ? <div style={{ ...headStyle, left: g.x }}>{p.caption.toUpperCase()}</div> : null}
      <div style={{ ...headStyle, right: width - g.x - g.w }}>{`${fmt(countOf(p.count))}${p.countSuffix || ""} ${p.noun}`.trim().toUpperCase()}</div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {g.cells.map((c) => {
          const h = lit(c.key);
          return h > 0.001 ? <rect key={`f${c.i}`} x={c.x} y={c.y} width={c.w} height={c.h} fill={alpha(ink, OPACITY.cellFill * h)} /> : null;
        })}
        <g stroke={alpha(ink, OPACITY.line)} strokeWidth={hair} fill="none">
          {lines.map((l, i) => {
            const t = progress(local, i * T.gridStagger, i * T.gridStagger + T.gridDraw, "enter");
            return t > 0 ? <line key={i} x1={l.x1} y1={l.y1} x2={mix(l.x1, l.x2, t)} y2={mix(l.y1, l.y2, t)} /> : null;
          })}
        </g>
        <g fill={alpha(ink, OPACITY.index)} fontFamily={FONT_MONO} fontSize={14 * u} letterSpacing={1.6 * u} opacity={indexFade}>
          {g.cells.map((c) => (
            <text key={`t${c.i}`} x={c.x + 18 * u} y={c.y + 32 * u}>
              {`0${c.i + 1}`}
            </text>
          ))}
        </g>
      </svg>
      {g.cells.map((c) => {
        const src = resolveLogo(String(p[LOGO_KEYS[c.i]] || ""), dark);
        if (!src) return null;
        const s = clamp01(spring({ frame: local - (T.logoStart + c.diag * STAGGER), fps, config: SPRING_CONFIG }));
        const op = s * mix(rest, 1, lit(c.key));
        return (
          <div
            key={c.i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: op,
              transform: `translateY(${((1 - s) * T.logoRise * u).toFixed(3)}px)`,
            }}
          >
            <Img src={src} style={{ height: L.logoH * u, width: "auto", maxWidth: logoMaxW, objectFit: "contain", display: "block" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Shot 3: three proof numbers between hairlines, then the brand logo.
const StatsShot: React.FC<{ p: TrustedByProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const ink = textOn(p.band);
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const stats = [
    { value: p.stat1Value, label: p.stat1Label },
    { value: p.stat2Value, label: p.stat2Label },
    { value: p.stat3Value, label: p.stat3Label },
  ];
  const hair = STROKE.hair * u;
  const sep = progress(local, T.sepDraw[0], T.sepDraw[1], "enter");
  const w = L.statsW * u;
  const x0 = (width - w) / 2;
  // geometry per stat
  const wide = SIZE.wide;
  const tall = SIZE.tall;
  const colW = isVertical ? w : w / 3;
  const rowH = isVertical ? tall.rowH * u : wide.sepH * u;
  const blockH = isVertical ? rowH * 3 : rowH;
  const y0 = (height - blockH) / 2 - (isVertical ? 40 : 30) * u;
  const boxes = stats.map((_, i) => (isVertical ? { x: x0, y: y0 + i * rowH, w, h: rowH } : { x: x0 + i * colW, y: y0, w: colW, h: rowH }));
  const seps = isVertical
    ? [1, 2].map((i) => ({ x1: x0, y1: y0 + i * rowH, x2: x0 + w * sep, y2: y0 + i * rowH }))
    : [1, 2].map((i) => ({ x1: x0 + i * colW, y1: y0, x2: x0 + i * colW, y2: y0 + rowH * sep }));
  const b = progress(local, T.brandIn[0], T.brandIn[1], "enter");

  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {sep > 0 ? (
          <g stroke={alpha(ink, OPACITY.line)} strokeWidth={hair}>
            {seps.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
            ))}
          </g>
        ) : null}
      </svg>
      {stats.map((s, i) => {
        const box = boxes[i];
        const vs = T.valueStart + i * STAGGER;
        const ls = T.labelStart + i * STAGGER;
        const rise = progress(local, vs, vs + T.valueDur, "enter");
        const lab = progress(local, ls, ls + T.labelDur, "enter");
        const vSize = fitSize(s.value, L.value * u, box.w * 0.84, 0.62);
        const lSize = fitSize(s.label, L.label * u, box.w * 0.84, 0.62);
        return (
          <div
            key={i}
            style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ overflow: "hidden", padding: "0.04em 0.08em 0.16em", margin: "0 0 -0.12em" }}>
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: vSize,
                  fontWeight: 600,
                  letterSpacing: `${TRACK.value}em`,
                  lineHeight: LINE_H,
                  color: ink,
                  whiteSpace: "nowrap",
                  transform: `translateY(${((1 - rise) * 115).toFixed(3)}%)`,
                }}
              >
                {s.value}
              </div>
            </div>
            {s.label ? (
              <div
                style={{
                  marginTop: 22 * u,
                  fontFamily: FONT_MONO,
                  fontSize: lSize,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  color: alpha(ink, OPACITY.label),
                  whiteSpace: "nowrap",
                  opacity: lab,
                  transform: `translateY(${((1 - lab) * 12 * u).toFixed(3)}px)`,
                }}
              >
                {s.label}
              </div>
            ) : null}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: L.brandBottom * u,
          display: "flex",
          justifyContent: "center",
          opacity: b,
          transform: `scale(${(0.96 + 0.04 * b).toFixed(4)})`,
        }}
      >
        <Logo src={p.logo || undefined} name={p.brand} size={L.brand * u} color={ink} tile={ink} onTile={p.band} />
      </div>
    </AbsoluteFill>
  );
};

export const TrustedBy: React.FC<TrustedByProps> = (p) => {
  const { index, local, length } = useShot(SHOTS);
  const bg = index === 2 ? p.band : p.field;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <HeadlineShot p={p} local={local} length={length} /> : null}
      {index === 1 ? <WallShot p={p} local={local} length={length} /> : null}
      {index === 2 ? <StatsShot p={p} local={local} /> : null}
      <Corners index={index} brand={p.brand} ink={textOn(bg)} />
    </AbsoluteFill>
  );
};

