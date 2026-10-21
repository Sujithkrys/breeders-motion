import React from "react";
import { AbsoluteFill } from "remotion";
import { FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import { areaOn, parseArea, type Area } from "../../placement";

export type FeatureDropProps = {
  kicker: string; // shot 1 top-left caption, also the end card's corner caption
  date: string; // shot 1 top-right caption
  badge: string; // the "New" pill
  feature: string; // the feature name: shot 1 title, highlight chip, shot 3 list header
  subline: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  cta: string;
  url: string; // browser URL pill and the end card's button
  brand: string;
  logo: string;
  screenshot: string; // 16:9: inside the browser window
  phoneShot: string; // 9:16: inside the phone frame
  featureArea: string; // 16:9: where the camera pushes in, "x,y,w,h" of the screenshot slot
  featureAreaTall: string; // 9:16: the same on the phone screen
  showSelection: boolean; // the accent ring and feature chip around the area (the camera still pushes in)
  field: string; // shot 1
  stage: string; // shots 2–3
  end: string; // shot 4
  accent: string; // dot, ring, chip, checks
};

// ---------- timeline (frames of the 270-frame film) ----------
// Shot 1 → 2 and 3 → 4 are hard cuts. Shots 2 and 3 share one stage and one camera, so that cut is invisible: the
// zoomed product slides into a card.
export const SHOTS = [0, 60, 150, 222] as const;
// Timings below are local to their shot.
export const T = {
  // shot 1
  caption: [0, 16] as const,
  rule: [4, 30] as const,
  pill: [4, 22] as const,
  wordStart: 8,
  wordDur: 18,
  maxStagger: 8,
  sub: [18, 38] as const,
  // shot 2
  rise: [0, 30] as const, // window rises and untilts (spring)
  fade: [0, 10] as const,
  zoom: [30, 68] as const, // camera push into the feature area (travel)
  ring: [62, 80] as const,
  chip: [66, 84] as const,
  // shot 3
  move: [0, 26] as const, // the zoomed view becomes a card (travel)
  chipOut: [0, 10] as const,
  header: [8, 24] as const,
  rows: [14, 28, 42] as const,
  rowDur: 18,
  dim: 10,
  back: [60, 70] as const, // every row back to full
  // shot 4
  ctaStart: 2,
  button: [6, 24] as const,
  press: [24, 28, 36] as const, // down, bottom, released (film frames 246–258)
  logo: [10, 28] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    caption: 20, pill: 44, pillText: 22, dot: 10, feature: 150, featureMaxW: 1776, featureLines: 2, sub: 40, subMaxW: 1100,
    contentW: 1240, fill: 0.62, fillH: 0.58, chip: 22, card: { w: 1000, h: 820 }, benefit: 44, check: 48, rowPad: 28,
    cta: 110, ctaMaxW: 1500, ctaLines: 2, button: 84, buttonText: 34, logo: 40,
  },
  tall: {
    caption: 22, pill: 52, pillText: 26, dot: 12, feature: 120, featureMaxW: 936, featureLines: 3, sub: 44, subMaxW: 936,
    contentW: 600, fill: 0.86, fillH: 0.5, chip: 26, card: { w: 936, h: 980 }, benefit: 50, check: 56, rowPad: 30,
    cta: 110, ctaMaxW: 936, ctaLines: 3, button: 108, buttonText: 42, logo: 52,
  },
} as const;
export const MARGIN = 72;
export const RULE_GAP = 28; // caption baseline row → hairline
export const BAR = 52; // browser top bar
export const BEZEL = 16; // phone bezel (RADIUS.hero outside − 16 = RADIUS.card inside)
export const BROWSER_ASPECT = 16 / 10;
export const PHONE_ASPECT = 9 / 19.5;
export const CARD_TOP_TALL = 160;
export const CARD_MARGIN = 0.04; // shot-3 card crop: the area plus this fraction of its mean side, on every edge
export const CARD_MIN_MARGIN = 26; // …but at least this many px on screen, so the ring (pad 14 + stroke) fits
export const COVER_ROOM = { w: 0.9, h: 0.8 } as const; // zooming further to cover the frame is fine while the area fits this
export const MAX_ZOOM = 3.2;
export const CAMERA_DY = 24; // the area lands this far below centre, leaving room for the chip
export const RING = { pad: 14, from: 30 } as const;
export const CHIP = { gap: 12, padX: 14, from: 0.9 } as const;
export const EDGE = 40;
export const TILT = 10; // degrees
export const PERSPECTIVE = 2400;
export const RISE = 60;
export const DIM = 0.45;
export const PRESS = 0.04;
export const TRACK = { feature: -0.045, cta: -0.04, caption: 0.1 } as const;
export const LINE_H = { display: 1.0, body: 1.35, row: 1.25 } as const;

// ---------- placements ----------
// Defaults tuned to the samples: the week view's Wed–Fri columns with the "Plan my week" button, and the phone's day
// strip with the first two event cards.
export const FEATURE_AREA: Area = { x: 0.497, y: 0.664, w: 0.4, h: 0.235 };
export const FEATURE_AREA_TALL: Area = { x: 0.035, y: 0.272, w: 0.93, h: 0.31 };
export const AREA_WHAT = {
  wide: "the week view's Wed–Fri columns and the Plan my week button",
  tall: "the day strip and the first two event cards",
} as const;
export const featureAreaOf = (p: Pick<FeatureDropProps, "featureArea" | "featureAreaTall">, tall: boolean) =>
  tall ? parseArea(p.featureAreaTall, FEATURE_AREA_TALL) : parseArea(p.featureArea, FEATURE_AREA);

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
const soft = (u: number, a = 1) => `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04 * a)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06 * a)}`;

// ---------- camera geometry (shared with the prompt) ----------
type Rect = { x: number; y: number; w: number; h: number };
type Cam = { k: number; ox: number; oy: number }; // screen = world * k + o
const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });

// Puts world point P at screen point Q at scale k, then clamps per axis so no window edge or corner ever sits inside
// `view`: when the screenshot's inner rect (inset by the corner radius) is at least as big as the view it must cover
// it; when the whole device fits it must stay fully inside; in between, the device is centred (blending from
// "outer centred" to "inner centred", so the clamp never jumps as the zoom or the view changes).
const aim = (k: number, P: { x: number; y: number }, Q: { x: number; y: number }, view: Rect, inner: Rect, outer: Rect): Cam => {
  const axis = (o: number, inS: number, inL: number, outS: number, outL: number, vS: number, vL: number) => {
    if (k * inL >= vL) return clampTo(o, vS + vL - k * (inS + inL), vS - k * inS);
    if (k * outL <= vL) return clampTo(o, vS - k * outS, vS + vL - k * (outS + outL));
    const f = (k * outL - vL) / (k * (outL - inL));
    return mix(vS + vL / 2 - k * (outS + outL / 2), vS + vL / 2 - k * (inS + inL / 2), f);
  };
  return {
    k,
    ox: axis(Q.x - k * P.x, inner.x, inner.w, outer.x, outer.w, view.x, view.w),
    oy: axis(Q.y - k * P.y, inner.y, inner.h, outer.y, outer.h, view.y, view.h),
  };
};

export const geometry = (W: number, H: number, u: number, tall: boolean, area: Area, label: string) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const m = MARGIN * u;
  const cw = L.contentW * u;
  const ch = cw / (tall ? PHONE_ASPECT : BROWSER_ASPECT);
  const content: Rect = { x: (W - cw) / 2, y: tall ? (H - ch) / 2 : (H - ch - BAR * u) / 2 + BAR * u, w: cw, h: ch };
  // inner: the screenshot inset by its corner radius (rounded corners never show once covering);
  // outer: the whole device (window with its bar, or phone with its bezel).
  const r0 = RADIUS.card * u;
  const inner: Rect = { x: content.x + r0, y: content.y + r0, w: cw - 2 * r0, h: ch - 2 * r0 };
  const outer: Rect = tall
    ? { x: content.x - BEZEL * u, y: content.y - BEZEL * u, w: cw + 2 * BEZEL * u, h: ch + 2 * BEZEL * u }
    : { x: content.x, y: content.y - BAR * u, w: cw, h: ch + BAR * u };
  const sel = areaOn(area, content.x, content.y, cw, ch);
  const P = { x: sel.x + sel.w / 2, y: sel.y + sel.h / 2 };
  const full: Rect = { x: 0, y: 0, w: W, h: H };
  const e = EDGE * u;

  // shot 2: push in so the area fills `fill` of the width / `fillH` of the height (1×–MAX_ZOOM). The landed view is
  // never a partial window: either the whole device stays in frame ("whole"), or the screenshot covers the full frame
  // ("cover", zooming further if needed, as long as the area still fits). If covering would crop the area, accept less
  // zoom: the largest scale that keeps the whole device in frame.
  const fit2 = Math.min((L.fill * W) / sel.w, (L.fillH * H) / sel.h);
  const Sfit = Math.min(MAX_ZOOM, Math.max(1, fit2));
  const coverS = Math.max(W / inner.w, H / inner.h);
  const wholeS = Math.max(1, Math.min((W - 2 * e) / outer.w, (H - 2 * e) / outer.h));
  const coverOk = coverS <= MAX_ZOOM && coverS * sel.w <= COVER_ROOM.w * W && coverS * sel.h <= COVER_ROOM.h * H;
  const [S, zoomMode] =
    Sfit <= wholeS
      ? ([Sfit, "whole"] as const)
      : Sfit >= coverS
        ? ([Sfit, "cover"] as const)
        : coverOk
          ? ([coverS, "cover-min"] as const)
          : ([wholeS, "whole-max"] as const);
  const cam2 = aim(S, P, { x: W / 2, y: H / 2 + CAMERA_DY * u }, full, inner, outer);

  // shot 3: the view shrinks to a card cropped to the feature area plus an even margin (CARD_MARGIN of the area's mean
  // side, at least CARD_MIN_MARGIN on screen so the ring fits), scaled to fit the card box. The cropped world rect never
  // exceeds the inner rect, so the screenshot always covers the card and no stray page content sits at its edges.
  const box = tall ? { w: W - 2 * m, h: L.card.h * u } : { w: L.card.w * u, h: L.card.h * u };
  const fitCard = (mg: number) => {
    const ww = Math.min(sel.w + 2 * mg, inner.w);
    const wh = Math.min(sel.h + 2 * mg, inner.h);
    return { ww, wh, K: Math.min(MAX_ZOOM, box.w / ww, box.h / wh) };
  };
  const mg0 = CARD_MARGIN * ((sel.w + sel.h) / 2);
  const cardMargin = Math.max(mg0, (CARD_MIN_MARGIN * u) / fitCard(mg0).K);
  const fc = fitCard(cardMargin);
  const K = fc.K;
  const cardW = K * fc.ww;
  const cardH = K * fc.wh;
  const card: Rect = tall
    ? { x: (W - cardW) / 2, y: CARD_TOP_TALL * u, w: cardW, h: cardH }
    : { x: W - m - cardW, y: (H - cardH) / 2, w: cardW, h: cardH };
  const Q0 = { x: S * P.x + cam2.ox, y: S * P.y + cam2.oy };
  const Q1 = { x: card.x + card.w / 2, y: card.y + card.h / 2 };
  const cam3 = (t: number) => {
    const view = lerpRect(full, card, t);
    return { ...aim(mix(S, K, t), P, { x: mix(Q0.x, Q1.x, t), y: mix(Q0.y, Q1.y, t) }, view, inner, outer), view };
  };
  const ringOf = (c: Cam, pad: number): Rect => ({ x: c.k * sel.x + c.ox - pad, y: c.k * sel.y + c.oy - pad, w: c.k * sel.w + 2 * pad, h: c.k * sel.h + 2 * pad });

  // chip: above the ring, left-aligned; else below; else inside its top edge. Right-aligned when it would run off.
  // Decided once for the landed zoom, so it never flips mid-move.
  const chipH = L.chip * 1.8 * u;
  const chipW = (2 * CHIP.padX + label.length * L.chip * 0.56) * u;
  const ring2 = ringOf(cam2, RING.pad * u);
  let v: "above" | "below" | "inside" = "above";
  if (ring2.y - CHIP.gap * u - chipH < e) v = ring2.y + ring2.h + CHIP.gap * u + chipH > H - e ? "inside" : "below";
  const right = ring2.x + chipW > W - e;
  const chipAt = (r: Rect) => {
    const y = v === "above" ? r.y - CHIP.gap * u - chipH : v === "below" ? r.y + r.h + CHIP.gap * u : r.y + CHIP.gap * u;
    const x = right ? clampTo(r.x + r.w, e + chipW, W - e) - chipW : clampTo(r.x, e, W - e - chipW);
    return { x, y, w: chipW, h: chipH };
  };

  const zoomed = ringOf(cam2, 0);
  const carded = ringOf(cam3(1), 0);
  return { L, content, inner, outer, sel, S, K, zoomMode, cam2, card, cardMargin, cam3, ringOf, chipAt, chipV: v, chipRight: right, full, zoomed, carded };
};
export type Geometry = ReturnType<typeof geometry>;

// ---------- type layout: balanced rows, shrunk to fit ----------
// Inter at −0.04em averages ~0.5em per character (600 a touch wider); the estimate keeps a margin.
export const EM = { 500: 0.54, 600: 0.56 } as const;
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

// ---------- pieces ----------
// Word rise: each row is its own mask; padding keeps descenders inside the clip, the negative margin gives it back.
const Rise: React.FC<{ rows: string[][]; local: number; start: number; align: "left" | "center"; lineH: number }> = ({ rows, local, start, align, lineH }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: align === "left" ? "0 0 -0.14em -0.08em" : "0 0 -0.14em" }}>
            <div style={{ display: "flex", justifyContent: align === "left" ? "flex-start" : "center", gap: "0.25em", whiteSpace: "nowrap", lineHeight: lineH }}>
              {words.map((w, i) => {
                const s = start + STAGGER * Math.min(first + i, T.maxStagger);
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

const Caption: React.FC<{ text: string; size: number; color: string; style?: React.CSSProperties }> = ({ text, size, color, style }) => (
  <div
    style={{
      position: "absolute",
      fontFamily: FONT_MONO,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: `${TRACK.caption}em`,
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text.toUpperCase()}
  </div>
);

// A browser window (top bar, three dots, URL pill, hairline) or a phone (bezel, dynamic island) around the screenshot.
// (x, y, w) is the screen content rect; k is px per design unit at the current zoom, so the chrome is laid out at its
// zoomed size and stays sharp. `round` 0–1 fades the corners square as the view becomes a card.
const Device: React.FC<{
  tall: boolean;
  x: number;
  y: number;
  w: number;
  k: number;
  u: number;
  round: number;
  src: string;
  url: string;
  transform?: string;
  opacity?: number;
}> = ({ tall, x, y, w, k, u, round, src, url, transform, opacity = 1 }) => {
  const h = w / (tall ? PHONE_ASPECT : BROWSER_ASPECT);
  if (tall) {
    const b = BEZEL * k;
    const iw = 0.32 * w;
    const ih = 0.094 * w;
    return (
      <div
        style={{
          position: "absolute",
          left: x - b,
          top: y - b,
          width: w + 2 * b,
          height: h + 2 * b,
          borderRadius: RADIUS.hero * k * round,
          background: FILM.black,
          boxShadow: soft(u),
          transformOrigin: "50% 100%",
          transform,
          opacity,
        }}
      >
        <Screenshot src={src} x={b} y={b} w={w} h={h} radius={RADIUS.card * k * round} />
        <div style={{ position: "absolute", left: b + (w - iw) / 2, top: b + 0.028 * w, width: iw, height: ih, borderRadius: ih / 2, background: FILM.black }} />
      </div>
    );
  }
  const bar = BAR * k;
  const ph = 30 * k;
  const pw = Math.min(0.42 * w, 460 * k);
  const dot = 12 * k;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - bar,
        width: w,
        height: h + bar,
        borderRadius: RADIUS.card * k * round,
        overflow: "hidden",
        background: FILM.white,
        boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, ${soft(u)}`,
        transformOrigin: "50% 100%",
        transform,
        opacity,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: bar, background: FILM.white }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ position: "absolute", left: 22 * k + i * (dot + 8 * k), top: (bar - dot) / 2, width: dot, height: dot, borderRadius: dot / 2, background: alpha(FILM.black, 0.14) }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: (w - pw) / 2,
            top: (bar - ph) / 2,
            width: pw,
            height: ph,
            borderRadius: ph / 2,
            background: CANVAS.paper.fill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8 * k,
            overflow: "hidden",
          }}
        >
          <svg width={11 * k} height={13 * k} viewBox="0 0 11 13" style={{ display: "block", flexShrink: 0 }}>
            <rect x={0.75} y={5.25} width={9.5} height={7} rx={1.6} fill="none" stroke={CANVAS.paper.ink2} strokeWidth={STROKE.hair} />
            <path d="M3 5.25 V3.6 A2.5 2.5 0 0 1 8 3.6 V5.25" fill="none" stroke={CANVAS.paper.ink2} strokeWidth={STROKE.hair} />
          </svg>
          <span style={{ fontFamily: FONT_SANS, fontSize: 15 * k, fontWeight: 400, lineHeight: 1, color: CANVAS.paper.ink2, whiteSpace: "nowrap" }}>{url}</span>
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 0, width: w, height: Math.max(1, u), background: alpha(FILM.black, 0.08) }} />
      </div>
      <Screenshot src={src} x={0} y={bar} w={w} h={h} radius={0} />
    </div>
  );
};

// ---------- shot 1: the feature name ----------
const Intro: React.FC<{ p: FeatureDropProps; local: number }> = ({ p, local }) => {
  const { u, width: W, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.field);
  const dark = isDark(p.field);
  const m = MARGIN * u;
  const cap = progress(local, T.caption[0], T.caption[1], "enter");
  const rule = progress(local, T.rule[0], T.rule[1], "enter");
  const pill = progress(local, T.pill[0], T.pill[1], "spring");
  const sub = progress(local, T.sub[0], T.sub[1], "enter");
  const ruleY = m + (L.caption + RULE_GAP) * u;
  const { rows, size } = fitRows(p.feature, Math.min(L.featureMaxW * u, W - 2 * m), L.feature * u, L.featureLines, EM[600]);
  const capStyle = { top: m, opacity: cap, transform: `translateY(${((1 - cap) * 8 * u).toFixed(3)}px)` };
  return (
    <>
      <Caption text={p.kicker} size={L.caption * u} color={alpha(ink, 0.55)} style={{ left: m, ...capStyle }} />
      <Caption text={p.date} size={L.caption * u} color={alpha(ink, 0.55)} style={{ right: m, ...capStyle }} />
      <div
        style={{
          position: "absolute",
          left: m,
          top: ruleY,
          width: W - 2 * m,
          height: STROKE.hair * u,
          background: alpha(ink, 0.2),
          transformOrigin: "0 50%",
          transform: `scaleX(${rule.toFixed(4)})`,
        }}
      />
      <div style={{ position: "absolute", left: m, right: m, top: ruleY, bottom: m, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
        {p.badge ? (
          <div
            style={{
              height: L.pill * u,
              padding: `0 ${0.42 * L.pill * u}px`,
              borderRadius: RADIUS.button * u,
              background: dark ? alpha(FILM.white, 0.1) : FILM.white,
              boxShadow: dark ? `0 0 0 ${u}px ${alpha(FILM.white, 0.16)}` : `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, ${soft(u)}`,
              display: "flex",
              alignItems: "center",
              gap: L.dot * u,
              opacity: pill,
              transformOrigin: "0 50%",
              transform: `scale(${mix(0.9, 1, pill).toFixed(4)})`,
            }}
          >
            <div style={{ width: L.dot * u, height: L.dot * u, borderRadius: (L.dot * u) / 2, background: p.accent }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: L.pillText * u, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.01em", color: ink, whiteSpace: "nowrap" }}>{p.badge}</span>
          </div>
        ) : null}
        <div
          style={{
            marginTop: 36 * u,
            fontFamily: FONT_SANS,
            fontSize: size,
            fontWeight: 600,
            letterSpacing: `${TRACK.feature}em`,
            color: ink,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Rise rows={rows} local={local} start={T.wordStart} align="left" lineH={LINE_H.display} />
        </div>
        {p.subline ? (
          <div
            style={{
              marginTop: 28 * u,
              maxWidth: L.subMaxW * u,
              fontFamily: FONT_SANS,
              fontSize: L.sub * u,
              fontWeight: 400,
              lineHeight: LINE_H.body,
              letterSpacing: "-0.01em",
              color: alpha(ink, 0.6),
              opacity: sub,
              transform: `translateY(${((1 - sub) * 24 * u).toFixed(3)}px)`,
            }}
          >
            {p.subline}
          </div>
        ) : null}
      </div>
    </>
  );
};

// ---------- shot 3's left column (16:9) / lower half (9:16): three benefits ----------
const Benefits: React.FC<{ p: FeatureDropProps; local: number; G: Geometry }> = ({ p, local, G }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.stage);
  const m = MARGIN * u;
  const box: Rect = isVertical
    ? { x: m, y: G.card.y + G.card.h + 56 * u, w: W - 2 * m, h: H - (G.card.y + G.card.h + 56 * u) - m }
    : { x: m, y: m, w: G.card.x - 2 * m, h: H - 2 * m }; // centred on the card, which is centred vertically
  const head = progress(local, T.header[0], T.header[1], "enter");
  const back = progress(local, T.back[0], T.back[1], "enter");
  const items = [p.benefit1, p.benefit2, p.benefit3].filter((s) => s && s.trim());
  const line = `${STROKE.hair * u}px solid ${alpha(ink, 0.16 * head)}`;
  const c = L.check * u;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: L.caption * u, lineHeight: 1, letterSpacing: `${TRACK.caption}em`, color: alpha(ink, 0.55), opacity: head, marginBottom: 24 * u, whiteSpace: "nowrap" }}>
        {p.feature.toUpperCase()}
      </div>
      {items.map((text, i) => {
        const s = T.rows[i];
        const r = progress(local, s, s + T.rowDur, "enter");
        const pop = progress(local, s, s + T.rowDur, "spring");
        let dim = 0;
        for (let j = i + 1; j < items.length; j++) dim = Math.max(dim, progress(local, T.rows[j], T.rows[j] + T.dim, "enter"));
        const o = 1 - (1 - DIM) * dim * (1 - back);
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28 * u, padding: `${L.rowPad * u}px 0`, borderTop: line, borderBottom: i === items.length - 1 ? line : undefined }}>
            <svg
              width={c}
              height={c}
              viewBox="0 0 48 48"
              style={{ display: "block", flexShrink: 0, marginTop: (L.benefit * LINE_H.row * u - c) / 2, opacity: pop * o, transform: `scale(${mix(0.6, 1, pop).toFixed(4)})` }}
            >
              <circle cx={24} cy={24} r={24} fill={p.accent} />
              <path d="M15 24.5 L21.5 31 L33.5 18" fill="none" stroke={FILM.white} strokeWidth={(STROKE.ring * 48) / L.check} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ flex: 1, overflow: "hidden", fontFamily: FONT_SANS, fontSize: L.benefit * u, padding: "0.04em 0 0.16em", margin: "-0.04em 0 -0.16em" }}>
              <div
                style={{
                  fontWeight: 500,
                  lineHeight: LINE_H.row,
                  letterSpacing: "-0.025em",
                  color: ink,
                  opacity: o,
                  transform: `translateY(${((1 - r) * 115).toFixed(3)}%)`,
                }}
              >
                {text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- shots 2–3: the product, one stage and one camera ----------
const Product: React.FC<{ p: FeatureDropProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical: tall } = useLayout();
  const G = geometry(W, H, u, tall, featureAreaOf(p, tall), p.feature);
  const L = G.L;
  const showSel = p.showSelection !== false;
  const l2 = frame - SHOTS[1];
  const l3 = frame - SHOTS[2];
  const inCard = l3 >= 0;
  const t = inCard ? progress(l3, T.move[0], T.move[1], "travel") : 0;

  let cam: Cam;
  let view: Rect = G.full;
  if (inCard) {
    const c = G.cam3(t);
    cam = c;
    view = c.view;
  } else {
    const z = progress(l2, T.zoom[0], T.zoom[1], "travel");
    cam = { k: mix(1, G.S, z), ox: z * G.cam2.ox, oy: z * G.cam2.oy };
  }

  // entrance: rise + untilt on the spring, quick fade
  const rise = inCard ? 1 : progress(l2, T.rise[0], T.rise[1], "spring");
  const fade = inCard ? 1 : progress(l2, T.fade[0], T.fade[1], "enter");
  const transform =
    rise < 1 ? `perspective(${PERSPECTIVE * u}px) translateY(${((1 - rise) * RISE * u).toFixed(3)}px) rotateX(${((1 - rise) * TILT).toFixed(3)}deg)` : undefined;

  const dx = cam.k * G.content.x + cam.ox - view.x;
  const dy = cam.k * G.content.y + cam.oy - view.y;
  const src = tall ? p.phoneShot || SAMPLE.phone : p.screenshot || SAMPLE.site;

  // ring + chip
  const ringT = inCard ? 1 : progress(l2, T.ring[0], T.ring[1], "enter");
  const ring = G.ringOf(cam, mix(RING.from, RING.pad, ringT) * u);
  const chipT = inCard ? 1 - progress(l3, T.chipOut[0], T.chipOut[1], "exit") : progress(l2, T.chip[0], T.chip[1], "spring");
  const chip = G.chipAt(G.ringOf(cam, RING.pad * u));
  const chipScale = inCard ? 1 : mix(CHIP.from, 1, chipT);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: view.x,
          top: view.y,
          width: view.w,
          height: view.h,
          overflow: "hidden",
          borderRadius: RADIUS.card * u * t,
          boxShadow: t > 0 ? `0 0 0 ${u}px ${alpha(FILM.black, 0.08 * t)}, ${soft(u, t)}` : undefined,
        }}
      >
        <Device tall={tall} x={dx} y={dy} w={cam.k * G.content.w} k={cam.k * u} u={u} round={1 - t} src={src} url={p.url} transform={transform} opacity={fade} />
        {showSel && ringT > 0 ? (
          <div
            style={{
              position: "absolute",
              left: ring.x - view.x,
              top: ring.y - view.y,
              width: ring.w,
              height: ring.h,
              boxSizing: "border-box",
              border: `${STROKE.ring * u}px solid ${p.accent}`,
              borderRadius: RADIUS.button * u,
              opacity: ringT,
            }}
          />
        ) : null}
      </div>
      {showSel && chipT > 0 ? (
        <div
          style={{
            position: "absolute",
            ...(G.chipRight ? { right: W - (chip.x + chip.w) } : { left: chip.x }),
            top: chip.y,
            height: chip.h,
            padding: `0 ${CHIP.padX * u}px`,
            borderRadius: RADIUS.chip * u,
            background: p.accent,
            color: FILM.white,
            fontFamily: FONT_SANS,
            fontSize: L.chip * u,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: `${chip.h}px`,
            whiteSpace: "nowrap",
            opacity: chipT,
            transformOrigin: `${G.chipRight ? "100%" : "0%"} ${G.chipV === "above" ? "100%" : "0%"}`,
            transform: `scale(${chipScale.toFixed(4)})`,
          }}
        >
          {p.feature}
        </div>
      ) : null}
      {inCard ? <Benefits p={p} local={l3} G={G} /> : null}
    </>
  );
};

// ---------- shot 4: call to action ----------
const End: React.FC<{ p: FeatureDropProps; local: number }> = ({ p, local }) => {
  const { u, width: W, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.end);
  const m = MARGIN * u;
  const { rows, size } = fitRows(p.cta, Math.min(L.ctaMaxW * u, W - 2 * m), L.cta * u, L.ctaLines, EM[500]);
  const b = progress(local, T.button[0], T.button[1], "enter");
  const down = progress(local, T.press[0], T.press[1], "travel");
  const up = progress(local, T.press[1], T.press[2], "enter");
  const press = 1 - PRESS * (down - up);
  const lg = progress(local, T.logo[0], T.logo[1], "enter");
  const bh = L.button * u;
  const bt = L.buttonText * u;
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: size,
            fontWeight: 500,
            letterSpacing: `${TRACK.cta}em`,
            color: ink,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Rise rows={rows} local={local} start={T.ctaStart} align="center" lineH={LINE_H.display} />
        </div>
        {p.url ? (
          <div style={{ marginTop: 52 * u, opacity: b, transform: `translateY(${((1 - b) * 24 * u).toFixed(3)}px) scale(${press.toFixed(4)})` }}>
            <div
              style={{
                height: bh,
                padding: `0 ${0.44 * bh}px`,
                borderRadius: bh / 2,
                background: ink,
                color: p.end,
                display: "flex",
                alignItems: "center",
                gap: 0.4 * bt,
                fontFamily: FONT_SANS,
                fontSize: bt,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              <span>{p.url}</span>
              <svg width={bt * 0.8} height={bt * 0.8} viewBox="0 0 24 24" style={{ display: "block" }}>
                <path d="M4 12 H19 M13 6 L19 12 L13 18" fill="none" stroke={p.end} strokeWidth={(STROKE.ring * 24) / (L.buttonText * 0.8)} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: m, bottom: m, opacity: lg, transform: `translateY(${((1 - lg) * 12 * u).toFixed(3)}px)` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.end} />
      </div>
      {!isVertical ? (
        <Caption text={p.kicker} size={L.caption * u} color={alpha(ink, 0.5)} style={{ right: m, bottom: m + ((L.logo - L.caption) / 2) * u, opacity: lg }} />
      ) : null}
    </>
  );
};

export const FeatureDrop: React.FC<FeatureDropProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  const bg = index === 0 ? p.field : index === 3 ? p.end : p.stage;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <Intro p={p} local={local} /> : null}
      {index === 1 || index === 2 ? <Product p={p} frame={frame} /> : null}
      {index === 3 ? <End p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
