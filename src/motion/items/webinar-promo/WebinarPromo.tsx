import React from "react";
import { AbsoluteFill, Img, spring } from "remotion";
import { FILM, Logo, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, SPRING_CONFIG, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type WebinarPromoProps = {
  month: string; // "NOV" on the tile's accent strip
  day: string; // "14", the big number
  kind: string; // "Live session"
  time: string; // "5 PM CET · 45 min"
  title: string;
  speakersLabel: string;
  speaker1Photo: string;
  speaker1Name: string;
  speaker1Role: string;
  speaker2Photo: string;
  speaker2Name: string;
  speaker2Role: string;
  speaker3Photo: string;
  speaker3Name: string;
  speaker3Role: string;
  agendaLabel: string;
  at1: string;
  topic1: string;
  at2: string;
  topic2: string;
  at3: string;
  topic3: string;
  cta: string;
  url: string;
  brand: string;
  logo: string;
  field: string; // shots 1–2, and the URL pill
  accent: string; // the tile's month strip and the live dot
};

// ---------- timeline (frames of the 450-frame film; hard cuts, except the tile, which carries across 1→2 and 4→5) ----------
// 1 open (date tile) · 2 title · 3 speakers · 4 agenda · 5 save your seat
export const SHOTS = [0, 75, 180, 310, 378] as const;
// Timings below are local to their shot.
export const T = {
  // shot 1
  drop: 2, // the tile drops in on the spring
  dropDur: 26, // spring stretched to this many frames
  dropFrom: 140, // px above its rest
  dropFade: 10,
  logoIn: [6, 24] as const,
  kind: [6, 24] as const, // live dot + kind caption rise
  timeStart: 10, // time rows rise
  rule: [16, 40] as const, // hairline under the time draws
  // shot 2
  toBadge: [2, 26] as const, // the tile shrinks into the top-right badge (travel)
  titleStart: 12,
  push: 0.03, // slow push-in on the title over the shot (linear)
  // shot 3
  header: [2, 26] as const, // caption + header hairline
  cardStart: 6,
  cardStagger: 2 * STAGGER,
  cardDur: 26, // spring stretched
  cardFade: 10,
  slide: 560, // px the cards slide in from the right
  // shot 4
  rowStart: 0,
  rowStagger: STAGGER,
  rowRule: [2, 24] as const, // hairline under each row, after the row's start
  // shot 5
  toEnd: [0, 20] as const, // the badge grows back into the tile at centre-left (travel)
  ctaStart: 4,
  pill: [10, 28] as const,
  pillRise: 24,
  endLogo: [14, 32] as const,
  // shared word rise
  wordDur: 18,
  rowDur: 16,
  maxStagger: 8,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
// The date tile, drawn at this size (times tileK) and scaled down as a whole for the badge.
export const TILE = { w: 400, h: 440, strip: 104, month: 40, day: 260 } as const;
export const SIZE = {
  wide: {
    edge: 72, // corner furniture: badge, logo, counters
    margin: 144, // content
    tileK: 1,
    badge: 0.3,
    gap: 96, // tile to text
    caption: 22,
    time: 88,
    timeMaxW: 960,
    ruleW: 520,
    logo: 44,
    title: 110,
    titleMaxW: 1400,
    titleLines: 3,
    card: { w: 480, h: 560, gap: 40, pad: 44 },
    photo: 200,
    name: 40,
    role: 28,
    glide: 160,
    rowsTop: 300,
    rowH: 210,
    atW: 240,
    at: 26,
    topic: 72,
    topicLines: 1,
    cta: 110,
    ctaMaxW: 1000,
    ctaLines: 2,
    url: 32,
    pillH: 84,
    counter: 20,
  },
  tall: {
    edge: 80,
    margin: 90,
    tileK: 1.15,
    badge: 0.28,
    gap: 88,
    caption: 24,
    time: 96,
    timeMaxW: 900,
    ruleW: 520,
    logo: 56,
    title: 116,
    titleMaxW: 900,
    titleLines: 4,
    card: { w: 900, h: 296, gap: 32, pad: 48 },
    photo: 200,
    name: 44,
    role: 30,
    glide: 160,
    rowsTop: 520,
    rowH: 330,
    atW: 0,
    at: 26,
    topic: 68,
    topicLines: 2,
    cta: 120,
    ctaMaxW: 900,
    ctaLines: 3,
    url: 36,
    pillH: 92,
    counter: 22,
  },
} as const;
export const TRACK = { display: -0.04, title: -0.045, day: -0.05, name: -0.025, topic: -0.035 } as const;
export const LINE_H = 1.0;
export const INK = { caption: 0.55, role: 0.6, counter: 0.45, rule: 0.25 } as const;
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

// Where the tile sits: open (shot 1), badge (shots 2–4), end (shot 5). x, y in px at 1080; s is the tile's scale.
type Place = { x: number; y: number; s: number };
export const places = (tall: boolean, W: number, H: number) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const tw = TILE.w * L.tileK;
  const th = TILE.h * L.tileK;
  const open: Place = tall ? { x: L.margin, y: 500, s: 1 } : { x: 330, y: (H - th) / 2, s: 1 };
  const badge: Place = { x: W - L.edge - tw * L.badge, y: L.edge, s: L.badge };
  const end: Place = tall ? { x: L.margin, y: 470, s: 1 } : { x: 240, y: (H - th) / 2, s: 1 };
  return { L, tw, th, open, badge, end, badgeW: tw * L.badge, badgeH: th * L.badge };
};
const between = (a: Place, b: Place, t: number): Place => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), s: mix(a.s, b.s, t) });

// ---------- colour ----------
export const same = (a: string, b: string) => (a || "").slice(0, 7).toUpperCase() === (b || "").slice(0, 7).toUpperCase();
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
// Type on a field: greenInk on deep green, white on other darks, black on lights.
export const inkOn = (bg: string) => (same(bg, FILM.green) ? FILM.greenInk : isDark(bg) ? FILM.white : FILM.black);
// Type on the accent strip: white on a dark accent; on a light accent, the field colour if it is dark (green on
// greenInk), else black.
export const onAccent = (accent: string, field: string) => (isDark(accent) ? FILM.white : isDark(field) ? field : FILM.black);
// The agenda sits on lavender, or canvas grey when the film's own field is lavender.
export const agendaField = (field: string) => (same(field, FILM.lavender) ? FILM.canvas : FILM.lavender);
export const fieldsFor = (field: string) => [field, field, FILM.cream, agendaField(field), FILM.white] as const;
export const CARD_INK = CANVAS.paper.ink;

// ---------- type layout: balanced rows, shrunk to fit ----------
// Inter 500–600 at -0.04em averages ~0.52em per character; 0.56 keeps a margin so a row never overflows.
const EM_PER_CHAR = 0.56;
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

const wrapBalanced = (text: string, maxEm: number) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
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
  for (let i = 0; i < 8; i++) {
    const longest = Math.max(0, ...rows.map(est)) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size);
  }
  return { rows, size };
};
export const rowsText = (rows: string[][]) => rows.map((r) => `"${r.join(" ")}"`).join(" / ");

// ---------- pieces ----------
// A word-mask rise. Each row is its own overflow mask (padding keeps descenders in, the negative margin gives the space
// back). `byRow` rises whole rows together, `STAGGER` apart, instead of word by word.
const Rise: React.FC<{ rows: string[][]; t0: number; dur: number; byRow?: boolean; lineH?: number }> = ({ rows, t0, dur, byRow = false, lineH = LINE_H }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em -0.08em" }}>
            <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: lineH }}>
              {words.map((w, i) => {
                const s = STAGGER * Math.min(byRow ? r : first + i, T.maxStagger);
                const t = progress(t0, s, s + dur, "enter");
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

// One element rising out of its mask; `t` 0–1.
const MaskRise: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => (
  <div style={{ overflow: "hidden", padding: "0.1em 0.1em 0.2em", margin: "-0.1em 0 -0.2em -0.1em" }}>
    <div style={{ transform: `translateY(${((1 - t) * 130).toFixed(3)}%)` }}>{children}</div>
  </div>
);

// The calendar date tile: white card, accent strip with the month in Geist Mono, the day in Inter 600. Drawn at full
// size and scaled from its top-left corner, so the badge is the same object. `radius` is the visual corner radius.
const DateTile: React.FC<{ p: WebinarPromoProps; place: Place; k: number; radius: number; opacity?: number }> = ({ p, place, k, radius, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: place.x,
      top: place.y,
      width: TILE.w * k,
      height: TILE.h * k,
      transformOrigin: "0 0",
      transform: `scale(${place.s.toFixed(4)})`,
      background: FILM.white,
      borderRadius: radius / Math.max(0.01, place.s),
      overflow: "hidden",
      opacity,
      boxShadow: `0 0 0 ${k}px ${alpha(FILM.black, 0.06)}, 0 ${k}px ${2 * k}px ${alpha(FILM.black, 0.04)}, 0 ${8 * k}px ${24 * k}px ${alpha(FILM.black, 0.06)}`,
    }}
  >
    <div
      style={{
        height: TILE.strip * k,
        background: p.accent,
        color: onAccent(p.accent, p.field),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_MONO,
        fontSize: TILE.month * k,
        fontWeight: 500,
        letterSpacing: "0.14em",
        paddingLeft: "0.14em",
        lineHeight: 1,
      }}
    >
      {(p.month || "").toUpperCase()}
    </div>
    <div
      style={{
        height: (TILE.h - TILE.strip) * k,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: TILE.day * k,
        fontWeight: 600,
        letterSpacing: `${TRACK.day}em`,
        paddingRight: `${-TRACK.day}em`,
        lineHeight: 1,
        color: CARD_INK,
      }}
    >
      {p.day}
    </div>
  </div>
);

const Counter: React.FC<{ n: number; ink: string }> = ({ n, ink }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  return (
    <div style={{ position: "absolute", left: L.edge * u, bottom: L.edge * u, fontFamily: FONT_MONO, fontSize: L.counter * u, lineHeight: 1, letterSpacing: "0.08em", color: alpha(ink, INK.counter) }}>
      {`0${n} / 05`}
    </div>
  );
};

// The live dot and the kind caption, in Geist Mono capitals.
const KindCaption: React.FC<{ p: WebinarPromoProps; ink: string; t: number; size: number }> = ({ p, ink, t, size }) => (
  <div style={{ fontSize: size, display: "flex", alignItems: "center", gap: size * 0.7 }}>
    <div style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: p.accent, opacity: t, transform: `scale(${(0.6 + 0.4 * t).toFixed(4)})` }} />
    <MaskRise t={t}>
      <div style={{ fontFamily: FONT_MONO, fontSize: size, lineHeight: 1, fontWeight: 500, letterSpacing: "0.12em", color: alpha(ink, INK.caption), whiteSpace: "nowrap" }}>
        {(p.kind || "").toUpperCase()}
      </div>
    </MaskRise>
  </div>
);

// Shots 3 and 4: a mono caption with a hairline running to the badge.
const Header: React.FC<{ label: string; ink: string; local: number }> = ({ label, ink, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const G = places(isVertical, width / u, height / u);
  const L = G.L;
  const t = progress(local, T.header[0], T.header[1], "enter");
  const line = progress(local, T.header[0] + 4, T.header[1] + 8, "travel");
  const cy = (G.badge.y + G.badgeH / 2) * u;
  return (
    <div style={{ position: "absolute", left: L.margin * u, width: (G.badge.x - 40 - L.margin) * u, top: cy - 20 * u, height: 40 * u, display: "flex", alignItems: "center", gap: 28 * u }}>
      <div style={{ fontSize: L.caption * u }}>
        <MaskRise t={t}>
          <div style={{ fontFamily: FONT_MONO, fontSize: L.caption * u, lineHeight: 1, fontWeight: 500, letterSpacing: "0.12em", color: alpha(ink, INK.caption), whiteSpace: "nowrap" }}>
            {(label || "").toUpperCase()}
          </div>
        </MaskRise>
      </div>
      <div style={{ flex: 1, height: STROKE.hair * u, background: alpha(ink, INK.rule), transform: `scaleX(${line.toFixed(4)})`, transformOrigin: "0 50%" }} />
    </div>
  );
};

// ---------- shot 1: the date ----------
const OpenShot: React.FC<{ p: WebinarPromoProps; local: number }> = ({ p, local }) => {
  const { u, width, height, fps, isVertical } = useLayout();
  const G = places(isVertical, width / u, height / u);
  const L = G.L;
  const ink = inkOn(p.field);
  const k = u * L.tileK;

  const drop = spring({ frame: local - T.drop, fps, config: SPRING_CONFIG, durationInFrames: T.dropDur });
  const fade = progress(local, T.drop, T.drop + T.dropFade, "enter");
  const place = { ...G.open, x: G.open.x * u, y: (G.open.y - (1 - drop) * T.dropFrom) * u };

  const kind = progress(local, T.kind[0], T.kind[1], "enter");
  const rule = progress(local, T.rule[0], T.rule[1], "travel");
  const logo = progress(local, T.logoIn[0], T.logoIn[1], "enter");
  const fit = fitRows(p.time, L.timeMaxW * u, L.time * u, 2);

  const block: React.CSSProperties = isVertical
    ? { left: L.margin * u, top: (G.open.y + G.th + L.gap) * u, width: L.timeMaxW * u }
    : { left: (G.open.x + G.tw + L.gap) * u, top: G.open.y * u, height: G.th * u, width: L.timeMaxW * u, justifyContent: "center" };

  return (
    <>
      <div style={{ position: "absolute", left: L.edge * u, top: L.edge * u, opacity: logo }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u * 0.8} color={ink} tile={ink} onTile={p.field} />
      </div>
      <DateTile p={p} place={place} k={k} radius={RADIUS.card * u} opacity={fade} />
      <div style={{ position: "absolute", ...block, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <KindCaption p={p} ink={ink} t={kind} size={L.caption * u} />
        <div style={{ height: 30 * u }} />
        <div style={{ fontFamily: FONT_SANS, fontSize: fit.size, fontWeight: 500, letterSpacing: `${TRACK.display}em`, color: ink, display: "flex", flexDirection: "column" }}>
          <Rise rows={fit.rows} t0={local - T.timeStart} dur={T.wordDur} byRow />
        </div>
        <div style={{ height: 40 * u }} />
        <div style={{ width: L.ruleW * u, height: STROKE.hair * u, background: alpha(ink, INK.rule), transform: `scaleX(${rule.toFixed(4)})`, transformOrigin: "0 50%" }} />
      </div>
      <Counter n={1} ink={ink} />
    </>
  );
};

// ---------- shot 2: the title; the tile shrinks into the corner badge ----------
const TitleShot: React.FC<{ p: WebinarPromoProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, width, height, isVertical } = useLayout();
  const G = places(isVertical, width / u, height / u);
  const L = G.L;
  const ink = inkOn(p.field);
  const k = u * L.tileK;

  const m = progress(local, T.toBadge[0], T.toBadge[1], "travel");
  const pl = between(G.open, G.badge, m);
  const place = { x: pl.x * u, y: pl.y * u, s: pl.s };
  const radius = mix(RADIUS.card, RADIUS.button, m) * u;

  const fit = fitRows(p.title, L.titleMaxW * u, L.title * u, L.titleLines);
  const kind = progress(local, T.titleStart - 6, T.titleStart + 12, "enter");
  const push = 1 + T.push * Math.min(1, local / length);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: L.margin * u,
          top: 0,
          bottom: 0,
          width: L.titleMaxW * u,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: (isVertical ? 80 : 40) * u,
          transformOrigin: "0 50%",
          transform: `scale(${push.toFixed(5)})`,
        }}
      >
        <KindCaption p={p} ink={ink} t={kind} size={L.caption * u} />
        <div style={{ height: 40 * u }} />
        <div style={{ fontFamily: FONT_SANS, fontSize: fit.size, fontWeight: 600, letterSpacing: `${TRACK.title}em`, color: ink, display: "flex", flexDirection: "column" }}>
          <Rise rows={fit.rows} t0={local - T.titleStart} dur={T.wordDur} />
        </div>
      </div>
      <DateTile p={p} place={place} k={k} radius={radius} />
      <Counter n={2} ink={ink} />
    </>
  );
};

// ---------- shot 3: speakers ----------
const Photo: React.FC<{ src: string; name: string; size: number }> = ({ src, name, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: CANVAS.paper.fill, flexShrink: 0, boxShadow: `0 0 0 ${size / 200}px ${alpha(FILM.black, 0.06)}` }}>
    {src ? (
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontWeight: 600, fontSize: size * 0.4, color: CANVAS.paper.ink2 }}>
        {(name || "").trim().charAt(0).toUpperCase()}
      </div>
    )}
  </div>
);

export const speakersOf = (p: WebinarPromoProps) => [
  { photo: p.speaker1Photo, name: p.speaker1Name, role: p.speaker1Role },
  { photo: p.speaker2Photo, name: p.speaker2Name, role: p.speaker2Role },
  { photo: p.speaker3Photo, name: p.speaker3Name, role: p.speaker3Role },
];

// Card positions at rest (before the slide and the glide), px at 1080.
export const cardSlots = (tall: boolean, W: number, H: number) => {
  const G = places(tall, W, H);
  const c = G.L.card;
  if (!tall) {
    const rowW = 3 * c.w + 2 * c.gap;
    const x0 = (W - rowW) / 2;
    const y = (H - c.h) / 2 + 50;
    return [0, 1, 2].map((i) => ({ x: x0 + i * (c.w + c.gap), y }));
  }
  const headerBottom = G.badge.y + G.badgeH + 20;
  const colH = 3 * c.h + 2 * c.gap;
  const y0 = headerBottom + (H - headerBottom - colH) / 2;
  return [0, 1, 2].map((i) => ({ x: (W - c.w) / 2, y: y0 + i * (c.h + c.gap) }));
};

const SpeakersShot: React.FC<{ p: WebinarPromoProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, width, height, fps, isVertical } = useLayout();
  const G = places(isVertical, width / u, height / u);
  const L = G.L;
  const field = FILM.cream;
  const ink = inkOn(field);
  const c = L.card;
  const slots = cardSlots(isVertical, width / u, height / u);
  // The camera glides across the cards for the whole shot, linear: the row drifts left (16:9) or the stack up (9:16).
  const g = mix(L.glide / 2, -L.glide / 2, Math.min(1, local / length));
  const people = speakersOf(p);

  return (
    <>
      {people.map((s, i) => {
        const start = T.cardStart + i * T.cardStagger;
        const sp = spring({ frame: local - start, fps, config: SPRING_CONFIG, durationInFrames: T.cardDur });
        const fade = progress(local, start, start + T.cardFade, "enter");
        const x = (slots[i].x + (isVertical ? 0 : g) + (1 - sp) * T.slide) * u;
        const y = (slots[i].y + (isVertical ? g : 0)) * u;
        const nameEl = (
          <div style={{ fontFamily: FONT_SANS, fontSize: L.name * u, fontWeight: 600, letterSpacing: `${TRACK.name}em`, lineHeight: 1.1, color: CARD_INK }}>{s.name}</div>
        );
        const roleEl = (
          <div style={{ fontFamily: FONT_SANS, fontSize: L.role * u, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.35, color: alpha(CARD_INK, INK.role), marginTop: 12 * u }}>{s.role}</div>
        );
        const index = (
          <div style={{ position: "absolute", top: c.pad * u, right: c.pad * u, fontFamily: FONT_MONO, fontSize: 20 * u, lineHeight: 1, letterSpacing: "0.08em", color: alpha(CARD_INK, INK.counter) }}>{`0${i + 1}`}</div>
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: c.w * u,
              height: c.h * u,
              opacity: fade,
              background: FILM.white,
              borderRadius: RADIUS.card * u,
              boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.05)}, 0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
              padding: c.pad * u,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: isVertical ? "row" : "column",
              justifyContent: isVertical ? "flex-start" : "space-between",
              alignItems: isVertical ? "center" : "flex-start",
              gap: isVertical ? 48 * u : 0,
            }}
          >
            <Photo src={s.photo} name={s.name} size={L.photo * u} />
            <div style={{ paddingRight: isVertical ? 40 * u : 0 }}>
              {nameEl}
              {roleEl}
            </div>
            {index}
          </div>
        );
      })}
      <Header label={p.speakersLabel} ink={ink} local={local} />
      <DateTile p={p} place={{ x: G.badge.x * u, y: G.badge.y * u, s: G.badge.s }} k={u * L.tileK} radius={RADIUS.button * u} />
      <Counter n={3} ink={ink} />
    </>
  );
};

// ---------- shot 4: agenda ----------
export const agendaOf = (p: WebinarPromoProps) => [
  { at: p.at1, topic: p.topic1 },
  { at: p.at2, topic: p.topic2 },
  { at: p.at3, topic: p.topic3 },
];

const AgendaShot: React.FC<{ p: WebinarPromoProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const W = width / u;
  const G = places(isVertical, W, height / u);
  const L = G.L;
  const field = agendaField(p.field);
  const ink = inkOn(field);
  const contentW = W - 2 * L.margin;
  const topicMaxW = contentW - L.atW;

  return (
    <>
      <Header label={p.agendaLabel} ink={ink} local={local} />
      {agendaOf(p).map((r, i) => {
        const s = T.rowStart + i * T.rowStagger;
        const t = progress(local, s, s + T.rowDur, "enter");
        const line = progress(local, s + T.rowRule[0], s + T.rowRule[1], "travel");
        const fit = fitRows(r.topic, topicMaxW * u, L.topic * u, L.topicLines);
        const at = (
          <div style={{ width: isVertical ? undefined : L.atW * u, flexShrink: 0, fontSize: L.at * u }}>
            <MaskRise t={t}>
              <div style={{ fontFamily: FONT_MONO, fontSize: L.at * u, lineHeight: 1, letterSpacing: "0.06em", color: alpha(ink, INK.caption), whiteSpace: "nowrap" }}>{r.at}</div>
            </MaskRise>
          </div>
        );
        const topic = (
          <div style={{ fontFamily: FONT_SANS, fontSize: fit.size, fontWeight: 500, letterSpacing: `${TRACK.topic}em`, color: ink, display: "flex", flexDirection: "column" }}>
            <Rise rows={fit.rows} t0={local - s} dur={T.rowDur} byRow lineH={1.05} />
          </div>
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: L.margin * u,
              top: (L.rowsTop + i * L.rowH) * u,
              width: contentW * u,
              height: L.rowH * u,
              display: "flex",
              flexDirection: isVertical ? "column" : "row",
              alignItems: isVertical ? "flex-start" : "center",
              justifyContent: isVertical ? "flex-end" : "flex-start",
              gap: isVertical ? 22 * u : 0,
              paddingBottom: isVertical ? 44 * u : 0,
              boxSizing: "border-box",
            }}
          >
            {at}
            {topic}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: STROKE.hair * u, background: alpha(ink, INK.rule), transform: `scaleX(${line.toFixed(4)})`, transformOrigin: "0 50%" }} />
          </div>
        );
      })}
      <DateTile p={p} place={{ x: G.badge.x * u, y: G.badge.y * u, s: G.badge.s }} k={u * L.tileK} radius={RADIUS.button * u} />
      <Counter n={4} ink={ink} />
    </>
  );
};

// ---------- shot 5: save your seat; the badge grows back into the tile ----------
const EndShot: React.FC<{ p: WebinarPromoProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const G = places(isVertical, width / u, height / u);
  const L = G.L;
  const field = FILM.white;
  const ink = inkOn(field);
  const k = u * L.tileK;

  const m = progress(local, T.toEnd[0], T.toEnd[1], "travel");
  const pl = between(G.badge, G.end, m);
  const radius = mix(RADIUS.button, RADIUS.card, m) * u;

  const fit = fitRows(p.cta, L.ctaMaxW * u, L.cta * u, L.ctaLines);
  const pill = progress(local, T.pill[0], T.pill[1], "enter");
  const foot = progress(local, T.endLogo[0], T.endLogo[1], "enter");
  const pillInk = inkOn(p.field);

  const block: React.CSSProperties = isVertical
    ? { left: L.margin * u, top: (G.end.y + G.th + L.gap) * u, width: L.ctaMaxW * u }
    : { left: (G.end.x + G.tw + L.gap) * u, top: G.end.y * u, height: G.th * u, width: L.ctaMaxW * u, justifyContent: "center" };
  const when = `${p.month} ${p.day} · ${p.time}`.toUpperCase();

  return (
    <>
      <DateTile p={p} place={{ x: pl.x * u, y: pl.y * u, s: pl.s }} k={k} radius={radius} />
      <div style={{ position: "absolute", ...block, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: fit.size, fontWeight: 600, letterSpacing: `${TRACK.title}em`, color: ink, display: "flex", flexDirection: "column" }}>
          <Rise rows={fit.rows} t0={local - T.ctaStart} dur={T.rowDur} />
        </div>
        <div style={{ height: 44 * u }} />
        <div
          style={{
            height: L.pillH * u,
            padding: `0 ${L.pillH * 0.42 * u}px`,
            borderRadius: L.pillH * u,
            background: p.field,
            boxShadow: `inset 0 0 0 ${u}px ${alpha(FILM.black, 0.06)}`,
            display: "flex",
            alignItems: "center",
            gap: 16 * u,
            opacity: pill,
            transform: `translateY(${((1 - pill) * T.pillRise * u).toFixed(3)}px)`,
          }}
        >
          <div style={{ width: 14 * u, height: 14 * u, borderRadius: "50%", background: p.accent }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: L.url * u, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: pillInk, whiteSpace: "nowrap" }}>{p.url}</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: L.edge * u,
          right: L.edge * u,
          bottom: L.edge * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: foot,
          transform: `translateY(${((1 - foot) * 16 * u).toFixed(3)}px)`,
        }}
      >
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={field} />
        <div style={{ fontFamily: FONT_MONO, fontSize: L.counter * u, lineHeight: 1, letterSpacing: "0.08em", color: alpha(ink, INK.caption), whiteSpace: "nowrap" }}>{when}</div>
      </div>
    </>
  );
};

export const WebinarPromo: React.FC<WebinarPromoProps> = (p) => {
  const { index, local, length } = useShot(SHOTS);
  const bg = fieldsFor(p.field)[index];
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <OpenShot p={p} local={local} /> : null}
      {index === 1 ? <TitleShot p={p} local={local} length={length} /> : null}
      {index === 2 ? <SpeakersShot p={p} local={local} length={length} /> : null}
      {index === 3 ? <AgendaShot p={p} local={local} /> : null}
      {index === 4 ? <EndShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
