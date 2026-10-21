import React from "react";
import { AbsoluteFill, Img, interpolateColors, spring, useVideoConfig } from "remotion";
import { CUSTOMER_LOGOS, FILM, customerLogo, useShot } from "../../film";
import { FONT_MONO, FONT_SANS, SPRING_CONFIG, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type CustomerQuoteProps = {
  quote: string;
  highlight: string; // a phrase inside the quote that gets the marker
  name: string;
  role: string;
  caption: string; // tiny mono label, top-right
  photo: string; // round headshot
  companyLogo: string; // the customer's logo, sized by height
  field: string; // the one flat field the whole film sits on
  ink: string; // type, hairlines and the quote mark
  accent: string; // the marker behind the highlight
};

// ---------- timeline (frames of the 240-frame film) ----------
// One continuous scene on one field; the beats are internal cuts (useShot), so nothing jumps between them.
// Beat 1: the quote mark and caption. Beat 2: the quote rises line by line, then the marker sweeps the highlight.
// Beat 3: the stack glides up and the attribution row rises in under a hairline divider.
export const SHOTS = [0, 36, 176] as const;
// Timings below are local to their beat.
export const T = {
  markFade: 10, // beat 1: quote mark fade (its scale runs on the spring)
  caption: [8, 26] as const, // beat 1: caption rise
  captionRise: 12,
  rule: [10, 28] as const, // beat 1: the hairline before the caption draws on
  wordStart: 2, // beat 2: first word starts rising
  wordDur: 16,
  lineGap: 6, // rows start this far apart
  maxStagger: 8, // word stagger steps per row before words start together
  markerGap: 4, // marker starts this long after the last word lands
  markerDur: 28,
  glide: [0, 28] as const, // beat 3: the stack glides up to make room
  divider: [8, 32] as const, // beat 3: hairline divider draws on
  row: 12, // beat 3: first attribution piece starts rising
  rowDur: 22,
  rowRise: 48, // px at 1080 each piece rises
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    colW: 1640, // the column everything left-aligns to, centred in the frame
    mark: 420,
    quote: 96,
    quoteMin: 68,
    maxLines: 4,
    gapMark: 36, // quote mark glyph → first line box
    gapDivider: 56, // last line box → divider
    gapRow: 48, // divider → attribution
    photo: 128,
    nameGap: 36, // photo → name
    name: 44,
    role: 32,
    roleGap: 6,
    logo: 56,
    caption: 22,
    captionTop: 72,
    stackGap: 0,
    logoGap: 0,
  },
  tall: {
    colW: 940,
    mark: 300,
    quote: 88,
    quoteMin: 62,
    maxLines: 7,
    gapMark: 40,
    gapDivider: 72,
    gapRow: 72,
    photo: 144,
    nameGap: 0,
    name: 48,
    role: 34,
    roleGap: 8,
    logo: 60,
    caption: 22,
    captionTop: 120,
    stackGap: 32, // photo → name
    logoGap: 56, // role → company logo
  },
} as const;

export const TYPE = { lineH: 1.12, track: -0.03, gap: 0.25, emPerChar: 0.55, nameLH: 1.15, roleLH: 1.3, nameTrack: -0.02 } as const;
// The quote mark is drawn as SVG text so its glyph can be placed by its top: Inter's “ hangs from cap height
// (~0.73em above the baseline) and is ~0.3em tall.
export const MARK = { capTop: 0.73, glyphH: 0.3, nudge: -0.03 } as const;
// The marker, in em of the quote's line box (1.12em): from just above cap height to just below the descenders,
// overshooting the phrase's first and last letters by `pad`.
export const MARKER = { top: 0.14, bottom: 1.06, pad: 0.08 } as const;
// Row masks are padded so the marker and descenders stay inside; the negative margin gives the space back exactly.
export const MASK = { y: 0.14, x: 0.2 } as const;
export const RING = { gap: 6, opacity: 0.25 } as const;
export const INK = { caption: 0.55, rule: 0.3, divider: 0.22, role: 0.6 } as const;

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
const same = (a: string, b: string) => (a || "").slice(0, 7).toUpperCase() === b.slice(0, 7).toUpperCase();
// Text on the marker comes from the marker's own brightness: a dark marker takes light type (deep green takes its
// own green ink), a light marker keeps a dark ink.
export const onMarker = (accent: string, ink: string) =>
  isDark(accent) ? (same(accent, FILM.green) ? FILM.greenInk : FILM.white) : isDark(ink) ? ink : FILM.black;
// The bundled customer logos come in ink and white; on a dark field the sample swaps to its white version.
export const logoFor = (src: string, field: string) => {
  if (!src || !isDark(field)) return src;
  for (const n of CUSTOMER_LOGOS) if (src === customerLogo(n, "ink")) return customerLogo(n, "white");
  return src;
};

// ---------- text model ----------
// Every word is its own inline-block span (one text node). A word the highlight cuts through ("week." for
// "four hours a week") splits into parts, each its own span, so the marker covers exactly the phrase.
export type Part = { text: string; hl: boolean };
export type Word = { text: string; parts: Part[] };

export const findHighlight = (quote: string, highlight: string): [number, number] | null => {
  const h = (highlight || "").trim();
  if (!h) return null;
  const i = (quote || "").toLowerCase().indexOf(h.toLowerCase());
  return i < 0 ? null : [i, i + h.length];
};

const isSpace = (ch: string) => /\s/.test(ch);
export const toWords = (quote: string, range: [number, number] | null): Word[] => {
  const out: Word[] = [];
  const q = quote || "";
  let i = 0;
  while (i < q.length) {
    if (isSpace(q[i])) {
      i++;
      continue;
    }
    const ws = i;
    while (i < q.length && !isSpace(q[i])) i++;
    const we = i;
    const text = q.slice(ws, we);
    const parts: Part[] = [];
    if (range && range[0] < we && range[1] > ws) {
      const a = Math.max(ws, range[0]);
      const b = Math.min(we, range[1]);
      if (a > ws) parts.push({ text: q.slice(ws, a), hl: false });
      parts.push({ text: q.slice(a, b), hl: true });
      if (b < we) parts.push({ text: q.slice(b, we), hl: false });
    } else parts.push({ text, hl: false });
    out.push({ text, parts });
  }
  return out;
};

// ---------- type layout: balanced rows, shrunk to fit ----------
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

// The fewest rows that fit, then the narrowest width that keeps that row count, so the rag comes out even.
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

// Starts at the base size and steps down (never below `min`) until the quote fits in `maxLines` rows.
export const fitQuote = (words: Word[], colW: number, base: number, min: number, maxLines: number) => {
  let size = base;
  let rows = wrapBalanced(words, colW / size);
  while (rows.length > maxLines && size > min) {
    size = Math.max(min, size * 0.94);
    rows = wrapBalanced(words, colW / size);
  }
  return { rows, size };
};

// Where the marker sits on each highlighted part, and when the sweep reaches it. Widths are estimates used only for
// timing; the rects themselves are laid out by the browser inside each part's span, so they line up exactly.
export type MarkerSpot = { padL: number; padR: number; s: number; w: number };
export const markerPlan = (rows: Word[][]) => {
  const spots: Record<string, MarkerSpot> = {};
  let total = 0;
  rows.forEach((row, r) => {
    const list: [number, number][] = [];
    row.forEach((word, i) =>
      word.parts.forEach((part, j) => {
        if (part.hl) list.push([i, j]);
      }),
    );
    list.forEach(([i, j], k) => {
      const padL = k === 0 ? MARKER.pad : 0;
      // A part followed by more highlight on this row ends its word, so its rect bridges the word gap.
      const padR = k === list.length - 1 ? MARKER.pad : TYPE.gap;
      const w = row[i].parts[j].text.length * TYPE.emPerChar + padL + padR;
      spots[`${r}-${i}-${j}`] = { padL, padR, s: total, w };
      total += w;
    });
  });
  return { spots, total };
};

const wordStartOf = (r: number, i: number) => T.wordStart + r * T.lineGap + STAGGER * Math.min(i, T.maxStagger);

// The whole composition in design units (px at 1080 on the short side). `W`, `H` are the frame in the same units.
export const layout = (p: Pick<CustomerQuoteProps, "quote" | "highlight">, tall: boolean, W: number, H: number) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const range = findHighlight(p.quote, p.highlight);
  const words = toWords(p.quote, range);
  const { rows, size } = fitQuote(words, L.colW, L.quote, L.quoteMin, L.maxLines);
  const plan = markerPlan(rows);
  const colX = (W - L.colW) / 2;
  const markH = MARK.glyphH * L.mark;
  const quoteH = rows.length * size * TYPE.lineH;
  const attrH = tall
    ? L.photo + L.stackGap + L.name * TYPE.nameLH + L.roleGap + L.role * TYPE.roleLH + L.logoGap + L.logo
    : L.photo;
  const heightA = markH + L.gapMark + quoteH;
  const heightB = heightA + L.gapDivider + L.gapRow + attrH;
  const topA = (H - heightA) / 2;
  const topB = (H - heightB) / 2;
  const riseEnd = Math.max(0, ...rows.map((row, r) => wordStartOf(r, row.length - 1) + T.wordDur));
  const marker = [riseEnd + T.markerGap, riseEnd + T.markerGap + T.markerDur] as const;
  return { L, range, rows, size, plan, colX, markH, quoteH, attrH, topA, topB, marker };
};

// ---------- pieces ----------
const Quote: React.FC<{ p: CustomerQuoteProps; lay: ReturnType<typeof layout>; local: number; top: number; u: number }> = ({ p, lay, local, top, u }) => {
  const mOn = onMarker(p.accent, p.ink);
  const sweep = progress(local, lay.marker[0], lay.marker[1], "travel") * lay.plan.total;
  return (
    <div
      style={{
        position: "absolute",
        left: lay.colX * u,
        top,
        fontFamily: FONT_SANS,
        fontSize: lay.size * u,
        fontWeight: 500,
        letterSpacing: `${TYPE.track}em`,
        lineHeight: TYPE.lineH,
        color: p.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {lay.rows.map((row, r) => (
        <div key={r} style={{ overflow: "hidden", padding: `${MASK.y}em ${MASK.x}em`, margin: `-${MASK.y}em 0 -${MASK.y}em -${MASK.x}em` }}>
          <div style={{ display: "flex", gap: `${TYPE.gap}em`, whiteSpace: "nowrap" }}>
            {row.map((word, i) => {
              const s = wordStartOf(r, i);
              const t = progress(local, s, s + T.wordDur, "enter");
              const style: React.CSSProperties = { display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` };
              if (word.parts.length === 1 && !word.parts[0].hl) {
                return (
                  <span key={i} style={style}>
                    {word.text}
                  </span>
                );
              }
              return (
                <span key={i} style={style}>
                  {word.parts.map((part, j) => {
                    const spot = part.hl ? lay.plan.spots[`${r}-${i}-${j}`] : undefined;
                    if (!spot) return <span key={j}>{part.text}</span>;
                    const f = Math.min(1, Math.max(0, (sweep - spot.s) / spot.w));
                    const color = same(mOn, p.ink) ? p.ink : interpolateColors(f, [0.35, 0.75], [p.ink, mOn]);
                    return (
                      <span key={j} style={{ position: "relative", display: "inline-block" }}>
                        {f > 0 ? (
                          <span
                            style={{
                              position: "absolute",
                              left: `${-spot.padL}em`,
                              right: `${-spot.padR}em`,
                              top: `${MARKER.top}em`,
                              bottom: `${TYPE.lineH - MARKER.bottom}em`,
                              background: p.accent,
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
};

const Photo: React.FC<{ src: string; name: string; size: number; ink: string; field: string; u: number }> = ({ src, name, size, ink, field, u }) => {
  const g = RING.gap * u;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          left: -g,
          top: -g,
          width: size + 2 * g,
          height: size + 2 * g,
          borderRadius: size / 2 + g,
          boxShadow: `inset 0 0 0 ${STROKE.hair * u}px ${alpha(ink, RING.opacity)}`,
        }}
      />
      <div style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", background: alpha(ink, 0.08) }}>
        {src ? (
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              background: ink,
              color: field,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: size * 0.42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {(name || "").trim().charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- film ----------
export const CustomerQuote: React.FC<CustomerQuoteProps> = (p) => {
  const { u, width, height, isVertical } = useLayout();
  const { fps } = useVideoConfig();
  const { index, frame } = useShot(SHOTS);
  const lay = layout(p, isVertical, width / u, height / u);
  const L = lay.L;
  const colX = lay.colX * u;
  const colR = width - (lay.colX + L.colW) * u; // right inset of the column's end

  // the stack: centred on the quote until beat 3, then glides up to centre with the attribution
  const glide = progress(frame - SHOTS[2], T.glide[0], T.glide[1], "travel");
  const top = mix(lay.topA, lay.topB, glide) * u;
  const quoteTop = top + (lay.markH + L.gapMark) * u;
  const dividerY = quoteTop + (lay.quoteH + L.gapDivider) * u;
  const rowTop = dividerY + L.gapRow * u;

  // beat 1: the quote mark on the spring, the caption rising
  const ms = L.mark * u;
  const sp = spring({ frame, fps, config: SPRING_CONFIG });
  const markFade = progress(frame, 0, T.markFade, "enter");
  const cap = progress(frame, T.caption[0], T.caption[1], "enter");
  const rule = progress(frame, T.rule[0], T.rule[1], "travel");

  // beat 3: divider and attribution
  const l3 = frame - SHOTS[2];
  const div = progress(l3, T.divider[0], T.divider[1], "travel");
  const piece = (k: number): React.CSSProperties => {
    const s = T.row + k * STAGGER;
    const t = progress(l3, s, s + T.rowDur, "enter");
    return { opacity: t, transform: `translateY(${((1 - t) * T.rowRise * u).toFixed(3)}px)` };
  };
  const logoSrc = logoFor(p.companyLogo, p.field);
  const name = (
    <div style={{ fontFamily: FONT_SANS, fontSize: L.name * u, fontWeight: 600, letterSpacing: `${TYPE.nameTrack}em`, lineHeight: TYPE.nameLH, color: p.ink, whiteSpace: "nowrap", ...piece(1) }}>
      {p.name}
    </div>
  );
  const role = (
    <div style={{ fontFamily: FONT_SANS, fontSize: L.role * u, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: TYPE.roleLH, color: alpha(p.ink, INK.role), whiteSpace: "nowrap", marginTop: L.roleGap * u, ...piece(2) }}>
      {p.role}
    </div>
  );
  const logo = logoSrc ? <Img src={logoSrc} style={{ height: L.logo * u, width: "auto", display: "block" }} /> : null;

  return (
    <AbsoluteFill style={{ background: p.field, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* caption, top-right on the column's end */}
      <div style={{ position: "absolute", top: L.captionTop * u, right: colR, display: "flex", alignItems: "center", gap: 16 * u }}>
        <div style={{ width: 48 * u, height: STROKE.hair * u, background: alpha(p.ink, INK.rule), transform: `scaleX(${rule.toFixed(4)})`, transformOrigin: "0 50%" }} />
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: L.caption * u,
            lineHeight: 1,
            color: alpha(p.ink, INK.caption),
            whiteSpace: "nowrap",
            opacity: cap,
            transform: `translateY(${((1 - cap) * T.captionRise * u).toFixed(3)}px)`,
          }}
        >
          {p.caption}
        </div>
      </div>

      {/* the opening quotation mark, glyph top on the stack top */}
      <svg
        width={ms * 0.6}
        height={ms * MARK.glyphH}
        style={{
          position: "absolute",
          left: colX,
          top,
          overflow: "visible",
          opacity: markFade,
          transform: `scale(${(0.9 + 0.1 * sp).toFixed(4)})`,
          transformOrigin: "0 0",
        }}
      >
        <text x={MARK.nudge * ms} y={MARK.capTop * ms} fontFamily={FONT_SANS} fontWeight={600} fontSize={ms} fill={p.ink}>
          “
        </text>
      </svg>

      {index >= 1 ? <Quote p={p} lay={lay} local={frame - SHOTS[1]} top={quoteTop} u={u} /> : null}

      {index >= 2 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: colX,
              top: dividerY,
              width: L.colW * u,
              height: STROKE.hair * u,
              background: alpha(p.ink, INK.divider),
              transform: `scaleX(${div.toFixed(4)})`,
              transformOrigin: "0 50%",
            }}
          />
          {isVertical ? (
            <div style={{ position: "absolute", left: colX, top: rowTop, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={piece(0)}>
                <Photo src={p.photo} name={p.name} size={L.photo * u} ink={p.ink} field={p.field} u={u} />
              </div>
              <div style={{ height: L.stackGap * u }} />
              {name}
              {role}
              {logo ? <div style={{ marginTop: L.logoGap * u, ...piece(3) }}>{logo}</div> : null}
            </div>
          ) : (
            <>
              <div style={{ position: "absolute", left: colX, top: rowTop, height: L.photo * u, display: "flex", alignItems: "center" }}>
                <div style={piece(0)}>
                  <Photo src={p.photo} name={p.name} size={L.photo * u} ink={p.ink} field={p.field} u={u} />
                </div>
                <div style={{ marginLeft: L.nameGap * u, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  {name}
                  {role}
                </div>
              </div>
              {logo ? (
                <div style={{ position: "absolute", right: colR, top: rowTop, height: L.photo * u, display: "flex", alignItems: "center", ...piece(3) }}>{logo}</div>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
