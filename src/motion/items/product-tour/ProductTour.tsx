import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import { areaOn, parseArea, type Area } from "../../placement";

export type ProductTourProps = {
  title: string;
  subtitle: string;
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  detail1: string;
  detail2: string;
  detail3: string;
  detail4: string;
  cta: string;
  url: string;
  brand: string;
  logo: string;
  screenshot: string; // 16:9: the left window
  screenshot2: string; // 16:9: the right window
  phoneShot: string; // 9:16: the left phone
  phoneShot2: string; // 9:16: the right phone
  stop1: string; // 16:9 stops, "x,y,w,h" of the window they sit on (1–2 on screenshot, 3–4 on screenshot2)
  stop2: string;
  stop3: string;
  stop4: string;
  stop1Tall: string; // 9:16 stops (1–2 on phoneShot, 3–4 on phoneShot2)
  stop2Tall: string;
  stop3Tall: string;
  stop4Tall: string;
  showSelection: boolean; // the accent ring around each stop (the camera still flies)
  stage: string; // shot 2: the canvas field
  accent: string; // the ring, the progress fill and the card dot
};

// ---------- timeline (frames of the 600-frame film) ----------
// Three shots, hard cuts: the title on black, one continuous camera over the canvas, the call to action on black.
export const SHOTS = [0, 75, 540] as const;
export const STOP_COUNT = 4;
// Inside the tour: a short establishing drift over the whole canvas, then four stops of 110 frames each
// (35 frames of travel, 75 of hold). Stop 4's hold ends on the cut to the end card.
export const TOUR = { open: 25, travel: 35, hold: 75 } as const;
export const departOf = (i: number) => SHOTS[1] + TOUR.open + i * (TOUR.travel + TOUR.hold);
export const arriveOf = (i: number) => departOf(i) + TOUR.travel;
export const holdEnd = (i: number) => (i < STOP_COUNT - 1 ? departOf(i + 1) : SHOTS[2]);

export const T = {
  hud: [0, 14] as const, // the corner label fades in (every shot)
  title: 0, // shot 1: first title word starts rising
  wordDur: 18,
  maxStagger: 8,
  subtitle: [6, 24] as const, // shot 1: the subtitle line rises as one
  barIn: 18, // shot 1: the progress segments draw in from here, STAGGER apart
  barDur: 20,
  win: [0, 22] as const, // tour: the windows settle in, WIN_STAGGER apart
  winStagger: 4,
  card: [-8, 22] as const, // card: starts this far before the camera lands, runs this long (spring)
  cardText: [0, 18] as const, // card lines: index, feature, detail rise from the card's start, STAGGER apart
  cardOut: 12, // card leaves as the camera departs (exit)
  ring: [-4, 20] as const, // ring draws on around the camera's landing
  ringOut: 10,
  cta: [0, 18] as const, // end card: the line rises as one, from the cut
  logo: [4, 22] as const,
  url: [8, 26] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
// The canvas is CANVAS_SCALE × the frame on both axes, so at scale 1 / CANVAS_SCALE (the overview) it exactly fills
// the frame. Windows are laid out in canvas px. `fillW/fillH` is how much of the frame a stop may take, `aimX/aimY`
// where its centre lands (up and right of the caption card on 16:9, above it on 9:16).
export const LAYOUT = {
  wide: {
    winW: 2400,
    aspect: 16 / 10,
    gap: 320,
    fillW: 0.6,
    fillH: 0.54,
    aimX: 0.6,
    aimY: 0.4,
    labels: ["Home", "Week view"],
    title: 180,
    titleMaxW: 1500,
    titleLines: 2,
    subtitle: 44,
    subMaxW: 1400,
    titleGap: 28,
    cta: 110,
    ctaMaxW: 1500,
    ctaLines: 2,
    logo: 52,
    url: 30,
    pillH: 72,
    stackGap: 48,
    card: { feature: 52, detail: 30, index: 20, minW: 560, maxW: 780, bottom: 96, padY: 36, padX: 44 },
    bar: 56, // progress bar: distance of its top from the bottom edge
  },
  tall: {
    winW: 1200,
    aspect: 9 / 19.5,
    gap: 240,
    fillW: 0.84,
    fillH: 0.4,
    aimX: 0.5,
    aimY: 0.36,
    labels: ["Today", "Today, dark"],
    title: 150,
    titleMaxW: 936,
    titleLines: 2,
    subtitle: 46,
    subMaxW: 860,
    titleGap: 32,
    cta: 104,
    ctaMaxW: 936,
    ctaLines: 3,
    logo: 60,
    url: 34,
    pillH: 80,
    stackGap: 56,
    card: { feature: 56, detail: 32, index: 22, minW: 936, maxW: 936, bottom: 128, padY: 40, padX: 44 },
    bar: 72,
  },
} as const;

export const MARGIN = 72;
export const HUD = { size: 18, top: 60, track: 0.12 } as const;
export const LABEL = { size: 18, above: 34 } as const; // window labels: Geist Mono, above each window's top-left
export const BAR = { gap: 12, track: 0.2 } as const; // progress: STROKE.bar tall pill segments
export const RING = { pad: 14 } as const;
export const CANVAS_SCALE = 3;
export const MAX_ZOOM = 3.5; // × the overview
export const DRIFT = { open: 1.04, scale: 1.03, pan: 0.015 } as const; // linear drift: overview push, per-stop push + pan (× W)
export const FLY = 0.45; // mid-flight pull-back strength for far-apart stops
export const BEZEL = 36; // phone bezel in canvas px
export const WIN_RISE = 40;
export const CARD_RISE = 60;
export const TRACK = { title: -0.045, cta: -0.04, sub: -0.015, feature: -0.03 } as const;
export const LINE_H = 1.02;
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

// ---------- stops: placements on the windows ----------
// Defaults are tuned to the sample Lumen screens: the site's hero and week preview, then the dark app's sidebar with
// Monday's deep-work block and its top-right toolbar; on the phones, the greeting, the day strip, the event cards and
// the Plan my week button.
export const STOPS_WIDE: Area[] = [
  { x: 0.29, y: 0.145, w: 0.42, h: 0.475 },
  { x: 0.245, y: 0.675, w: 0.4, h: 0.23 },
  { x: 0.008, y: 0.01, w: 0.36, h: 0.42 },
  { x: 0.68, y: 0.008, w: 0.315, h: 0.37 },
];
export const STOPS_TALL: Area[] = [
  { x: 0.04, y: 0.14, w: 0.72, h: 0.135 },
  { x: 0.04, y: 0.275, w: 0.92, h: 0.095 },
  { x: 0.04, y: 0.375, w: 0.92, h: 0.205 },
  { x: 0.04, y: 0.88, w: 0.92, h: 0.09 },
];
export const STOP_WHAT = {
  wide: [
    "the hero badge, headline, subtitle and buttons",
    "the week preview: date header and the Mon–Wed event cards",
    "the sidebar, its calendar list and Monday's deep-work block",
    "the Day/Week/Month switch, the Plan my week button and Thu–Fri",
  ],
  tall: ["the greeting and date", "the day strip", "the first two event cards", "the Plan my week button"],
} as const;
export const STOP_WINDOW = [0, 0, 1, 1] as const; // which window each stop sits on

export const stopKeys = (tall: boolean) =>
  (tall ? ["stop1Tall", "stop2Tall", "stop3Tall", "stop4Tall"] : ["stop1", "stop2", "stop3", "stop4"]) as (keyof ProductTourProps)[];
export const stopsOf = (p: ProductTourProps, tall: boolean): Area[] =>
  stopKeys(tall).map((k, i) => parseArea(p[k], (tall ? STOPS_TALL : STOPS_WIDE)[i]));
export const featuresOf = (p: ProductTourProps) => [p.feature1, p.feature2, p.feature3, p.feature4];
export const detailsOf = (p: ProductTourProps) => [p.detail1, p.detail2, p.detail3, p.detail4];
export const imagesOf = (p: ProductTourProps, tall: boolean) =>
  tall ? [p.phoneShot || SAMPLE.phone, p.phoneShot2 || SAMPLE.phoneDark] : [p.screenshot || SAMPLE.site, p.screenshot2 || SAMPLE.appDark];

// ---------- the camera ----------
// One transform over the canvas: a point (x, y) in canvas px lands on screen at ((x − cx)·s + W/2, (y − cy)·s + H/2).
export type Cam = { s: number; cx: number; cy: number };
const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

export const geometry = (W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? LAYOUT.tall : LAYOUT.wide;
  const CW = CANVAS_SCALE * W;
  const CH = CANVAS_SCALE * H;
  const ww = L.winW * u;
  const wh = ww / L.aspect;
  const gap = L.gap * u;
  const x0 = (CW - 2 * ww - gap) / 2;
  const y0 = (CH - wh) / 2;
  const wins = [
    { x: x0, y: y0, w: ww, h: wh },
    { x: x0 + ww + gap, y: y0, w: ww, h: wh },
  ];
  const sFit = Math.min(W / CW, H / CH); // the overview: the whole canvas in frame
  const sMin = Math.max(W / CW, H / CH); // any smaller and the view would leave the canvas
  const sMax = MAX_ZOOM * sFit;
  // Radii are tokens at the overview scale and scale with the camera: windows read RADIUS.button, phones RADIUS.hero.
  const radius = (tall ? RADIUS.hero : RADIUS.button) * u * CANVAS_SCALE;
  return { tall, L, W, H, u, CW, CH, wins, sFit, sMin, sMax, radius, bezel: tall ? BEZEL * u : 0 };
};
export type Geometry = ReturnType<typeof geometry>;

// The view never leaves the canvas: scale at least sMin (and at most sMax), centre at least half a view from each edge.
export const clampCam = (G: Geometry, c: Cam): Cam => {
  const s = clampTo(c.s, G.sMin, G.sMax);
  const hw = G.W / (2 * s);
  const hh = G.H / (2 * s);
  return { s, cx: clampTo(c.cx, hw, G.CW - hw), cy: clampTo(c.cy, hh, G.CH - hh) };
};

// At a stop the view is clamped to the target window (the phone screen on 9:16) instead of the canvas: the centre
// stays at least half a view inside the window's edges, so an area at a window edge shifts the aim inward.
export const clampWin = (G: Geometry, win: number, c: Cam): Cam => {
  const w = G.wins[win];
  const v = clampCam(G, c);
  const hw = G.W / (2 * v.s);
  const hh = G.H / (2 * v.s);
  return { s: v.s, cx: clampTo(v.cx, w.x + hw, w.x + w.w - hw), cy: clampTo(v.cy, w.y + hh, w.y + w.h - hh) };
};

// A stop's camera: the largest scale that fits the area into fillW × fillH of the frame (leaving room for the drift
// push under the zoom cap), centred on (aimX, aimY), then clamped. `to` is where the linear drift ends.
export const stopCam = (G: Geometry, area: Area, win: number) => {
  const { W, H, L } = G;
  const w = G.wins[win];
  const a = areaOn(area, w.x, w.y, w.w, w.h);
  const fit = Math.min((L.fillW * W) / a.w, (L.fillH * H) / a.h);
  // A landed stop only ever shows its own window: the scale is at least enough for the view to fit inside it.
  const sWin = Math.max(W / w.w, H / w.h);
  const s = clampTo(fit, Math.max(G.sMin, sWin), G.sMax / DRIFT.scale);
  const from = clampWin(G, win, { s, cx: a.x + a.w / 2 - (L.aimX * W - W / 2) / s, cy: a.y + a.h / 2 - (L.aimY * H - H / 2) / s });
  const to = clampWin(G, win, { s: from.s * DRIFT.scale, cx: from.cx + (DRIFT.pan * W) / from.s, cy: from.cy });
  return { from, to, fit, a, win, capped: fit > G.sMax / DRIFT.scale, raised: fit < sWin };
};
export const overviewCam = (G: Geometry) => {
  const from = clampCam(G, { s: G.sFit, cx: G.CW / 2, cy: G.CH / 2 });
  return { from, to: clampCam(G, { ...from, s: from.s * DRIFT.open }) };
};

const lerpCam = (G: Geometry, a: Cam, b: Cam, t: number) => clampCam(G, { s: mix(a.s, b.s, t), cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t) });

// The flight between two stops: the centre moves on the travel curve; the scale moves in log space and pulls back
// mid-flight when the stops are far apart (m = screens apart), so the viewer sees where they are going.
export const flyDip = (G: Geometry, a: Cam, b: Cam) => {
  const m = (Math.hypot(b.cx - a.cx, b.cy - a.cy) * Math.sqrt(a.s * b.s)) / G.W;
  return Math.max(0, Math.log(1 + FLY * m) - Math.abs(Math.log(b.s) - Math.log(a.s)) / 2);
};
const fly = (G: Geometry, a: Cam, b: Cam, t: number) => {
  const k = flyDip(G, a, b);
  const s = Math.exp(mix(Math.log(a.s), Math.log(b.s), t) - k * Math.sin(Math.PI * t));
  return clampCam(G, { s, cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t) });
};

export const camsOf = (G: Geometry, stops: Area[]) => {
  const all: { from: Cam; to: Cam }[] = [overviewCam(G)];
  stops.forEach((a, i) => all.push(stopCam(G, a, STOP_WINDOW[i])));
  return all;
};

export const camAt = (frame: number, G: Geometry, cams: { from: Cam; to: Cam }[]): Cam => {
  let seg = -1;
  for (let i = 0; i < STOP_COUNT; i++) if (frame >= departOf(i)) seg = i;
  if (seg < 0) return lerpCam(G, cams[0].from, cams[0].to, progress(frame, SHOTS[1], departOf(0), "linear"));
  const prev = cams[seg].to;
  const next = cams[seg + 1];
  if (frame < arriveOf(seg)) return fly(G, prev, next.from, progress(frame, departOf(seg), arriveOf(seg), "travel"));
  return clampWin(G, STOP_WINDOW[seg], lerpCam(G, next.from, next.to, progress(frame, arriveOf(seg), holdEnd(seg), "linear")));
};

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
export const labelOn = (bg: string) => (isDark(bg) ? CANVAS.ink.ink2 : CANVAS.paper.ink2);

// ---------- type layout: balanced rows, shrunk to fit ----------
// Average Inter advance per character at display tracking, with a margin so a row never overflows.
export const EM = { 400: 0.52, 500: 0.54, 600: 0.56 } as const;

const greedy = (words: string[], maxEm: number, em: number) => {
  const est = (ws: string[]) => ws.join(" ").length * em;
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
    const longest = Math.max(0, ...rows.map((r) => r.join(" ").length * em)) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size, em);
  }
  return { rows, size };
};

// ---------- pieces ----------
// Word-mask rise: each row is its own mask (padding keeps descenders inside, the negative margin gives the space
// back); every word rises from 115% below. stagger 0 lifts a row as one.
const Rise: React.FC<{ rows: string[][]; frame: number; start: number; stagger: number; lineH?: number }> = ({ rows, frame, start, stagger, lineH = LINE_H }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 -0.08em -0.14em" }}>
            <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: lineH }}>
              {words.map((w, i) => {
                const s = start + stagger * Math.min(first + i, T.maxStagger);
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

// The corner label every shot shares: tiny Geist Mono caps.
const Hud: React.FC<{ color: string; frame: number; right?: string }> = ({ color, frame, right }) => {
  const { u } = useLayout();
  const o = progress(frame, T.hud[0], T.hud[1], "enter");
  const style: React.CSSProperties = {
    position: "absolute",
    top: HUD.top * u,
    fontFamily: FONT_MONO,
    fontSize: HUD.size * u,
    letterSpacing: `${HUD.track}em`,
    lineHeight: 1,
    color,
    opacity: o,
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ ...style, left: MARGIN * u }}>PRODUCT TOUR</div>
      {right ? <div style={{ ...style, right: MARGIN * u, letterSpacing: "0.04em" }}>{right}</div> : null}
    </>
  );
};

// The motif: four progress segments along the bottom, at the same place in every shot (so both cuts match).
// `draw` 0–1 grows each track from its left end; `fill` 0–1 is the accent fill.
const ProgressBar: React.FC<{ track: string; fillColor: string; draw: number[]; fill: number[] }> = ({ track, fillColor, draw, fill }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? LAYOUT.tall : LAYOUT.wide;
  const h = STROKE.bar * u;
  const gap = BAR.gap * u;
  const segW = (W - 2 * MARGIN * u - (STOP_COUNT - 1) * gap) / STOP_COUNT;
  const y = H - L.bar * u;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {draw.map((d, i) => {
        const x = MARGIN * u + i * (segW + gap);
        const tw = segW * d;
        const fw = segW * Math.min(d, fill[i]);
        return (
          <g key={i}>
            {tw > 0.5 ? <rect x={x} y={y} width={tw} height={h} rx={h / 2} fill={track} /> : null}
            {fw > 0.5 ? <rect x={x} y={y} width={Math.max(fw, h)} height={h} rx={h / 2} fill={fillColor} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- shot 1: the title ----------
const Opener: React.FC<{ p: ProductTourProps; frame: number }> = ({ p, frame }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? LAYOUT.tall : LAYOUT.wide;
  const t = fitRows(p.title, L.titleMaxW * u, L.title * u, L.titleLines, EM[600]);
  const s = fitRows(p.subtitle, L.subMaxW * u, L.subtitle * u, 2, EM[400]);
  const draw = [0, 1, 2, 3].map((i) => progress(frame, T.barIn + i * STAGGER, T.barIn + i * STAGGER + T.barDur, "enter"));
  return (
    <>
      <Hud color={alpha(FILM.white, 0.5)} frame={frame} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: FILM.white }}>
        <div style={{ fontSize: t.size, fontWeight: 600, letterSpacing: `${TRACK.title}em`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Rise rows={t.rows} frame={frame} start={T.title} stagger={STAGGER} />
        </div>
        <div
          style={{
            marginTop: L.titleGap * u,
            fontSize: s.size,
            fontWeight: 400,
            letterSpacing: `${TRACK.sub}em`,
            color: alpha(FILM.white, 0.6),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Rise rows={s.rows} frame={frame} start={T.subtitle[0]} stagger={0} lineH={1.3} />
        </div>
      </div>
      <ProgressBar track={alpha(FILM.white, BAR.track)} fillColor={p.accent} draw={draw} fill={[0, 0, 0, 0]} />
    </>
  );
};

// ---------- shot 2: the tour ----------
const CaptionCard: React.FC<{ i: number; feature: string; detail: string; frame: number; accent: string }> = ({ i, feature, detail, frame, accent }) => {
  const { u, isVertical } = useLayout();
  const C = (isVertical ? LAYOUT.tall : LAYOUT.wide).card;
  const start = arriveOf(i) + T.card[0];
  const inT = progress(frame, start, start + T.card[1], "spring");
  const outT = i < STOP_COUNT - 1 ? progress(frame, holdEnd(i), holdEnd(i) + T.cardOut, "exit") : 0;
  if (frame < start || outT >= 1) return null;
  const line = (k: number) => {
    const s = start + T.cardText[0] + k * STAGGER;
    return `translateY(${((1 - progress(frame, s, s + T.cardText[1], "enter")) * 110).toFixed(3)}%)`;
  };
  const mask: React.CSSProperties = { overflow: "hidden", padding: "0.04em 0 0.14em", margin: "0 0 -0.1em" };
  return (
    <div
      style={{
        position: "absolute",
        left: MARGIN * u,
        ...(isVertical ? { right: MARGIN * u } : { minWidth: C.minW * u, maxWidth: C.maxW * u }),
        bottom: C.bottom * u,
        padding: `${C.padY * u}px ${C.padX * u}px`,
        background: FILM.white,
        borderRadius: RADIUS.card * u,
        border: `${STROKE.hair * u}px solid ${alpha(FILM.black, 0.1)}`,
        boxShadow: `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
        color: FILM.black,
        opacity: inT * (1 - outT),
        transform: `translateY(${(((1 - inT) * CARD_RISE + outT * 16) * u).toFixed(3)}px)`,
      }}
    >
      <div style={mask}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 * u, transform: line(0) }}>
          <div style={{ width: 10 * u, height: 10 * u, borderRadius: 5 * u, background: accent }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: C.index * u, lineHeight: 1, letterSpacing: "0.06em", color: alpha(FILM.black, 0.45) }}>
            {`0${i + 1} / 0${STOP_COUNT}`}
          </div>
        </div>
      </div>
      <div style={{ ...mask, marginTop: 16 * u }}>
        <div style={{ fontSize: C.feature * u, fontWeight: 600, letterSpacing: `${TRACK.feature}em`, lineHeight: 1.05, transform: line(1) }}>{feature}</div>
      </div>
      <div style={{ ...mask, marginTop: 10 * u }}>
        <div style={{ fontSize: C.detail * u, fontWeight: 400, lineHeight: 1.35, color: alpha(FILM.black, 0.6), transform: line(2) }}>{detail}</div>
      </div>
    </div>
  );
};

// The accent ring around the active stop, drawn on as a stroke from its top-left, in screen space so it keeps its
// weight through the zoom and rides the drift with the canvas.
const Ring: React.FC<{ box: { x: number; y: number; w: number; h: number }; t: number; out: number; color: string }> = ({ box, t, out, color }) => {
  const { u, width: W, height: H } = useLayout();
  const pad = RING.pad * u;
  const x = box.x - pad;
  const y = box.y - pad;
  const w = box.w + 2 * pad;
  const h = box.h + 2 * pad;
  const r = Math.min(RADIUS.button * u, w / 2, h / 2);
  const len = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill="none"
        stroke={color}
        strokeWidth={STROKE.ring * u}
        strokeDasharray={`${(len * t).toFixed(2)} ${len.toFixed(2)}`}
        opacity={1 - out}
      />
    </svg>
  );
};

const Tour: React.FC<{ p: ProductTourProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = geometry(W, H, u, isVertical);
  const stops = stopsOf(p, isVertical);
  const cams = camsOf(G, stops);
  const cam = camAt(frame, G, cams);
  const X = (x: number) => (x - cam.cx) * cam.s + W / 2;
  const Y = (y: number) => (y - cam.cy) * cam.s + H / 2;
  const local = frame - SHOTS[1];
  const ink = textOn(p.stage);
  const images = imagesOf(p, isVertical);
  const soft = `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;
  const features = featuresOf(p);
  const details = detailsOf(p);
  const showSelection = p.showSelection !== false;
  const zoom = `${Math.round((cam.s / G.sFit) * 100)}%`;

  return (
    <>
      {G.wins.map((w, i) => {
        const e = progress(local, T.win[0] + i * T.winStagger, T.win[1] + i * T.winStagger, "spring");
        const x = X(w.x);
        const y = Y(w.y);
        const ww = w.w * cam.s;
        const wh = w.h * cam.s;
        const b = G.bezel * cam.s;
        if (x - b > W || y - b - 60 * u > H || x + ww + b < 0 || y + wh + b < 0) return null;
        const rise = `translateY(${((1 - e) * WIN_RISE * u).toFixed(3)}px)`;
        return (
          <React.Fragment key={i}>
            <Screenshot
              src={images[i]}
              x={x}
              y={y}
              w={ww}
              h={wh}
              radius={G.radius * cam.s}
              line={alpha(FILM.black, 0.08)}
              shadow={G.tall ? `0 0 0 ${b}px ${FILM.black}, ${soft}` : soft}
              style={{ opacity: e, transform: rise }}
            />
            <div
              style={{
                position: "absolute",
                left: x - b,
                top: y - b - LABEL.above * u,
                fontFamily: FONT_MONO,
                fontSize: LABEL.size * u,
                lineHeight: 1,
                color: labelOn(p.stage),
                whiteSpace: "nowrap",
                opacity: e,
                transform: rise,
              }}
            >
              {`${p.brand} — ${G.L.labels[i]}`}
            </div>
          </React.Fragment>
        );
      })}
      {showSelection
        ? stops.map((a, i) => {
            const t = progress(frame, arriveOf(i) + T.ring[0], arriveOf(i) + T.ring[1], "enter");
            const out = i < STOP_COUNT - 1 ? progress(frame, holdEnd(i), holdEnd(i) + T.ringOut, "exit") : 0;
            if (t <= 0 || out >= 1) return null;
            const w = G.wins[STOP_WINDOW[i]];
            const c = areaOn(a, w.x, w.y, w.w, w.h);
            return <Ring key={i} box={{ x: X(c.x), y: Y(c.y), w: c.w * cam.s, h: c.h * cam.s }} t={t} out={out} color={p.accent} />;
          })
        : null}
      {features.map((f, i) => (
        <CaptionCard key={i} i={i} feature={f} detail={details[i]} frame={frame} accent={p.accent} />
      ))}
      <Hud color={alpha(ink, 0.5)} frame={T.hud[1]} right={zoom} />
      <ProgressBar
        track={alpha(ink, BAR.track)}
        fillColor={p.accent}
        draw={[1, 1, 1, 1]}
        fill={[0, 1, 2, 3].map((i) => progress(frame, departOf(i), holdEnd(i), "linear"))}
      />
    </>
  );
};

// ---------- shot 3: the call to action ----------
const EndCard: React.FC<{ p: ProductTourProps; frame: number }> = ({ p, frame }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? LAYOUT.tall : LAYOUT.wide;
  const local = frame - SHOTS[2];
  const c = fitRows(p.cta, L.ctaMaxW * u, L.cta * u, L.ctaLines, EM[500]);
  const lo = progress(local, T.logo[0], T.logo[1], "enter");
  const ur = progress(local, T.url[0], T.url[1], "enter");
  const pillH = L.pillH * u;
  return (
    <>
      <Hud color={alpha(FILM.white, 0.5)} frame={T.hud[1]} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: FILM.white }}>
        <div style={{ opacity: lo, transform: `translateY(${((1 - lo) * 16 * u).toFixed(3)}px)` }}>
          <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={FILM.white} tile={FILM.white} onTile={FILM.black} />
        </div>
        <div
          style={{
            marginTop: L.stackGap * u,
            fontSize: c.size,
            fontWeight: 500,
            letterSpacing: `${TRACK.cta}em`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Rise rows={c.rows} frame={local} start={T.cta[0]} stagger={0} />
        </div>
        <div
          style={{
            marginTop: L.stackGap * u,
            height: pillH,
            padding: `0 ${pillH * 0.42}px 0 ${pillH * 0.48}px`,
            borderRadius: pillH / 2,
            border: `${STROKE.hair * u}px solid ${alpha(FILM.white, 0.3)}`,
            display: "flex",
            alignItems: "center",
            gap: 14 * u,
            fontSize: L.url * u,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            opacity: ur,
            transform: `translateY(${((1 - ur) * 16 * u).toFixed(3)}px)`,
          }}
        >
          <span style={{ lineHeight: 1 }}>{p.url}</span>
          <svg width={L.url * 0.8 * u} height={L.url * 0.8 * u} viewBox="0 0 24 24" fill="none">
            <path d="M5 12h13M12.5 6l6 6-6 6" stroke={FILM.white} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <ProgressBar track={alpha(FILM.white, BAR.track)} fillColor={p.accent} draw={[1, 1, 1, 1]} fill={[1, 1, 1, 1]} />
    </>
  );
};

export const ProductTour: React.FC<ProductTourProps> = (p) => {
  const { index } = useShot(SHOTS);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: index === 1 ? p.stage : FILM.black, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <Opener p={p} frame={frame} /> : index === 1 ? <Tour p={p} frame={frame} /> : <EndCard p={p} frame={frame} />}
    </AbsoluteFill>
  );
};
