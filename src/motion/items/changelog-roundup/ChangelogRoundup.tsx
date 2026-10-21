import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { FILM, Logo, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type ChangelogRoundupProps = {
  title: string; // "What's new"
  month: string; // "October"
  update1: string;
  update2: string;
  update3: string;
  update4: string;
  detail1: string;
  detail2: string;
  detail3: string;
  detail4: string;
  visual1: string; // one of VISUALS
  visual2: string;
  visual3: string;
  visual4: string;
  image1: string; // optional picture for card 1 ("" = none); replaces the mini interface
  image2: string;
  image3: string;
  image4: string;
  brand: string;
  logo: string;
  field: string; // shots 2 and 3 (the opener is always black)
  accent: string; // used only inside the mini interfaces
};

// ---------- timeline (frames of the 300-frame film) ----------
// Shot 1 is a black title card; shot 2 plays the four update cards; shot 3 shares shot 2's field, so the cut into
// the overview is invisible: the cards themselves shrink into the grid.
export const SHOTS = [0, 48, 248] as const;
export const COUNT = 4;
// Each card owns 50 frames. The next one springs in 8 frames before the window ends, while the current one leaves.
export const CARD = { len: 50, overlap: 8, enter: 22, fadeIn: 10, exit: 14, inFrom: 520, outTo: 200 } as const;
export const cardStart = (i: number) => SHOTS[1] + CARD.len * i; // 48, 98, 148, 198
export const enterAt = (i: number) => (i === 0 ? SHOTS[1] : cardStart(i) - CARD.overlap);
export const exitAt = (i: number) => cardStart(i + 1) - CARD.exit; // cards 1–3 only
export const T = {
  // shot 1 (local)
  caption: [0, 14] as const,
  title: 4,
  month: 9,
  wordDur: 16,
  monthDur: 22,
  bar: 14, // first progress segment starts drawing
  segDur: 18,
  push: 0.03, // the type block pushes in 1 → 1.03, linear over the shot
  // shot 2 (local to each card's entry)
  cardTitle: 4,
  detail: [8, 24] as const,
  numberIn: 16,
  numberOut: 12,
  label: 6, // two-tone label, from the cut
  // shot 3 (local)
  fade: [0, 12] as const, // index, label and progress bar leave
  compact: [0, 18] as const, // details fade, cards shorten
  shrink: [0, 24] as const, // card 4 into its cell
  fly: 4, // cards 1–3 start, STAGGER apart
  flyDur: 22,
  flyFrom: 80,
  overTitle: 6,
  overMonth: 12,
  logo: [14, 32] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
// card: w × h at full size, hc once compacted for the overview; title/detail tops; the vignette panel inset 24 from
// the sides and bottom, its top moving from panelTop to panelTopC as the detail line leaves.
export const SIZE = {
  wide: {
    card: { w: 1040, h: 660, hc: 596, pad: 52, inset: 24, panelTop: 268, panelTopC: 204, title: 64, detail: 32, titleTop: 100, detailTop: 188 },
    margin: 72,
    caption: 20,
    barLabel: 18,
    openTitle: 90,
    openMonth: 200,
    number: 260,
    label: 40,
    overTitle: 52,
    overMonth: 128,
    logo: 48,
  },
  tall: {
    card: { w: 940, h: 1000, hc: 864, pad: 48, inset: 24, panelTop: 360, panelTopC: 224, title: 84, detail: 40, titleTop: 104, detailTop: 212 },
    margin: 72,
    caption: 22,
    barLabel: 18,
    openTitle: 96,
    openMonth: 200,
    number: 260,
    label: 48,
    overTitle: 64,
    overMonth: 160,
    logo: 64,
  },
} as const;
export const TRACK = { title: -0.035, month: -0.045, card: -0.035, number: -0.04 } as const;
export const NUMBER_INK = 0.08;
export const STAGE_RIGHT = 96; // 16:9: the card's right margin
export const STAGE_TALL_Y = 580; // 9:16: the card's top
export const NUMBER_TALL_Y = 280; // 9:16: the big index, above the card
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

// Every mini interface is drawn edge to edge on a 720 × 260 box, scaled so it fills VIS_FILL of its panel's width
// (or as much as the panel's height allows). Its smallest text is 18 units, so ≥18px at 1080 once scaled up.
export const VIS_BOX = { w: 720, h: 260 } as const;
export const VIS_FILL = 0.9;
export const VIS_MIN_TEXT = 18;
// An uploaded card image replaces the mini interface and pushes in 1 → 1 + IMAGE_PUSH, linear over the card's window.
export const IMAGE_PUSH = 0.03;
export const visScale = (tall: boolean) => {
  const C = (tall ? SIZE.tall : SIZE.wide).card;
  const pw = C.w - 2 * C.inset;
  const ph = C.h - C.inset - C.panelTop;
  return Math.min((VIS_FILL * pw) / VIS_BOX.w, (ph - 24) / VIS_BOX.h);
};

export const VISUALS = ["toggle", "chart", "search", "avatars", "keys", "calendar"] as const;
export type Visual = (typeof VISUALS)[number];
export const VISUAL_OPTIONS = [
  { label: "Toggle", value: "toggle" },
  { label: "Bar chart", value: "chart" },
  { label: "Search", value: "search" },
  { label: "Avatars", value: "avatars" },
  { label: "Shortcut keys", value: "keys" },
  { label: "Calendar", value: "calendar" },
];
export const visualOf = (v: string): Visual => ((VISUALS as readonly string[]).includes(v) ? (v as Visual) : "toggle");

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
const P = CANVAS.paper; // the cards and their mini interfaces are always light UI

// ---------- type fitting ----------
// Inter at display tracking averages ~0.53em per character; 0.56 keeps a margin so a line never overflows.
const EM = 0.56;
export const fitSize = (text: string, maxW: number, base: number) => Math.min(base, maxW / Math.max(1, (text || "").trim().length * EM));
export const pad2 = (n: number) => String(n).padStart(2, "0");

// ---------- layout (design units; multiply by u) ----------
export const geometry = (Wf: number, Hf: number, tall: boolean) => {
  const S = tall ? SIZE.tall : SIZE.wide;
  const C = S.card;
  const m = S.margin;
  const stage = tall ? { x: (Wf - C.w) / 2, y: STAGE_TALL_Y } : { x: Wf - STAGE_RIGHT - C.w, y: (Hf - C.h) / 2 - 16 };
  const bar = { x0: m, x1: Wf - m, y: tall ? Hf - 110 : Hf - m, gap: 16 };
  const segW = (bar.x1 - bar.x0 - (COUNT - 1) * bar.gap) / COUNT;
  const captionY = tall ? 96 : m;
  const open = { x: m, y: tall ? 720 : 300, maxW: Wf - 2 * m };
  const number = { x: m, y: tall ? NUMBER_TALL_Y : stage.y + 60 };
  const label = { x: m, y: tall ? stage.y + C.h + 48 : number.y + S.number + 24, maxW: tall ? Wf - 2 * m : stage.x - 48 - m };
  // overview: a 2 × 2 grid of compacted cards
  const gap = 24;
  const gx0 = tall ? m : 720;
  const gx1 = Wf - m;
  const cw = (gx1 - gx0 - gap) / 2;
  const cs = cw / C.w;
  const ch = C.hc * cs;
  const gh = 2 * ch + gap;
  const titleH = S.overTitle * 1.1 + 8 + S.overMonth;
  let gy0: number;
  let over: { x: number; y: number; maxW: number };
  if (tall) {
    const top = 150;
    const bottom = bar.y - S.logo - 40;
    const stack = titleH + 72 + gh;
    const y0 = top + (bottom - top - stack) / 2;
    over = { x: m, y: y0, maxW: Wf - 2 * m };
    gy0 = y0 + titleH + 72;
  } else {
    gy0 = (Hf - gh) / 2;
    over = { x: m, y: gy0 + 4, maxW: gx0 - 48 - m };
  }
  const cells = [0, 1, 2, 3].map((k) => ({ x: gx0 + (k % 2) * (cw + gap), y: gy0 + Math.floor(k / 2) * (ch + gap), s: cs }));
  const logo = { x: m, y: bar.y - S.logo };
  return { S, C, m, stage, bar, segW, captionY, open, number, label, cells, cw, ch, gy0, over, logo };
};

export const updatesOf = (p: ChangelogRoundupProps) => [
  { title: p.update1, detail: p.detail1, visual: visualOf(p.visual1), image: (p.image1 || "").trim() },
  { title: p.update2, detail: p.detail2, visual: visualOf(p.visual2), image: (p.image2 || "").trim() },
  { title: p.update3, detail: p.detail3, visual: visualOf(p.visual3), image: (p.image3 || "").trim() },
  { title: p.update4, detail: p.detail4, visual: visualOf(p.visual4), image: (p.image4 || "").trim() },
];

// ---------- word-mask rise ----------
// One row in its own mask: padding keeps descenders inside the clip, the negative margin gives the space back.
// `out` 0–1 lifts the row up and out of the same mask.
type Word = { text: string; color?: string };
const MaskRow: React.FC<{ words: Word[]; local: number; start: number; dur: number; out?: number }> = ({ words, local, start, dur, out = 0 }) => (
  <div style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em -0.08em" }}>
    <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: 1 }}>
      {words.map((w, i) => {
        const s = start + STAGGER * Math.min(i, 8);
        const t = progress(local, s, s + dur, "enter");
        return (
          <span key={i} style={{ display: "inline-block", color: w.color, transform: `translateY(${((1 - t) * 115 - out * 115).toFixed(3)}%)` }}>
            {w.text}
          </span>
        );
      })}
    </div>
  </div>
);
const words = (text: string, color?: string): Word[] =>
  (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ text: t, color }));

// ---------- mini-interface helpers (q = px per design unit of the 720 × 260 box) ----------
const uiShadow = (q: number) => `0 ${q}px ${2 * q}px ${alpha(FILM.black, 0.04)}, 0 ${8 * q}px ${24 * q}px ${alpha(FILM.black, 0.06)}`;
const surface = (q: number, x: number, y: number, w: number, h: number, extra?: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  left: x * q,
  top: y * q,
  width: w * q,
  height: h * q,
  boxSizing: "border-box",
  background: P.card,
  border: `${STROKE.hair * q}px solid ${P.line}`,
  borderRadius: RADIUS.button * q,
  boxShadow: uiShadow(q),
  ...extra,
});
const at = (q: number, x: number, y: number, extra?: React.CSSProperties): React.CSSProperties => ({ position: "absolute", left: x * q, top: y * q, ...extra });
const sans = (q: number, size: number, weight: number, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: FONT_SANS,
  fontSize: size * q,
  fontWeight: weight,
  color,
  lineHeight: 1.2,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  ...extra,
});
const mono = (q: number, size: number, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: size * q,
  color,
  lineHeight: 1.2,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
  ...extra,
});
// 24-unit stroke icons (Lucide geometry).
const ICON = {
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  clock: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 7v5l3 2"],
  search: ["M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14", "M20 20l-4-4"],
  doc: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5"],
  folder: ["M4 6a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"],
  team: ["M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8", "M2 21v-1a6 6 0 0 1 12 0v1", "M16 3.5a4 4 0 0 1 0 7", "M22 21v-1a6 6 0 0 0-4-5.6"],
  command: ["M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"],
} as const;
const Icon: React.FC<{ q: number; size: number; d: readonly string[]; color: string; stroke?: number }> = ({ q, size, d, color, stroke = 1.75 }) => (
  <svg width={size * q} height={size * q} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    {d.map((x, i) => (
      <path key={i} d={x} />
    ))}
  </svg>
);
type VisProps = { q: number; t: number; accent: string; label: string };

// ---- toggle: a settings panel; the feature's row switches on
const Switch: React.FC<{ q: number; on: number; accent: string; y: number }> = ({ q, on, accent, y }) => (
  <div style={{ position: "absolute", right: 24 * q, top: y * q, width: 64 * q, height: 36 * q, borderRadius: 18 * q, background: alpha(P.ink, 0.14), overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: accent, opacity: on }} />
    <div
      style={{
        position: "absolute",
        left: (4 + 28 * on) * q,
        top: 4 * q,
        width: 28 * q,
        height: 28 * q,
        borderRadius: 14 * q,
        background: P.card,
        boxShadow: `0 ${q}px ${3 * q}px ${alpha(FILM.black, 0.18)}`,
      }}
    />
  </div>
);
const ToggleVis: React.FC<VisProps> = ({ q, t, accent, label }) => {
  const on = progress(t, 12, 24, "travel");
  const rows = [
    { icon: ICON.bell, title: "Daily digest", sub: "A summary every morning", on: 0 },
    { icon: ICON.clock, title: label, sub: "Available on every plan", on },
  ];
  return (
    <div style={surface(q, 0, 20, 720, 220)}>
      {rows.map((r, i) => {
        const y = i * 110;
        return (
          <React.Fragment key={i}>
            <div style={at(q, 24, y + 31, { width: 48 * q, height: 48 * q, borderRadius: RADIUS.chip * q, background: P.fill, display: "flex", alignItems: "center", justifyContent: "center" })}>
              <Icon q={q} size={24} d={r.icon} color={P.ink2} />
            </div>
            <div style={sans(q, 22, 500, P.ink, at(q, 92, y + 28))}>{r.title}</div>
            <div style={sans(q, 18, 400, P.ink2, at(q, 92, y + 60))}>{r.sub}</div>
            <Switch q={q} on={r.on} accent={accent} y={y + 37} />
          </React.Fragment>
        );
      })}
      <div style={at(q, 24, 109, { width: 672 * q, height: STROKE.hair * q, background: P.line })} />
    </div>
  );
};

// ---- chart: seven bars rise, the key day in the accent, the total counts up
export const BARS = [0.42, 0.66, 0.54, 0.92, 0.7, 0.26, 0.34] as const;
export const KEY_BAR = 3;
export const CHART_TOTAL = 32.5;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
// Chart area inside the 720-wide card (28 padding each side): 7 bars 52 wide on a 102 step, baseline at 96.
export const CHART = { w: 664, bar: 52, step: 102, base: 96 } as const;
const topRounded = (x: number, y: number, w: number, h: number, r: number) => {
  if (h <= 0.01) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x} ${y + h} V${y + rr} Q${x} ${y} ${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h} Z`;
};
const ChartVis: React.FC<VisProps> = ({ q, t, accent }) => {
  const grow = BARS.map((_, k) => progress(t, 4 + STAGGER * k, 4 + STAGGER * k + 18, "enter"));
  const total = progress(t, 4, 4 + STAGGER * 6 + 18, "travel");
  return (
    <div style={surface(q, 0, 8, 720, 244)}>
      <div style={mono(q, 18, P.ink3, at(q, 28, 22))}>FOCUS HOURS · THIS WEEK</div>
      <div style={sans(q, 36, 600, P.ink, at(q, 28, 48, { letterSpacing: "-0.03em" }))}>{`${(CHART_TOTAL * total).toFixed(1)}h`}</div>
      <div style={mono(q, 18, P.ink2, { position: "absolute", right: 28 * q, top: 22 * q })}>+12% VS LAST WEEK</div>
      <svg width={CHART.w * q} height={124 * q} viewBox={`0 0 ${CHART.w} 124`} style={at(q, 28, 104)}>
        {[0, 30, 60].map((y) => (
          <line key={y} x1={0} x2={CHART.w} y1={y + 0.75} y2={y + 0.75} stroke={P.ink} strokeOpacity={0.06} strokeWidth={STROKE.hair} />
        ))}
        <line x1={0} x2={CHART.w} y1={CHART.base + 0.75} y2={CHART.base + 0.75} stroke={P.ink} strokeOpacity={0.2} strokeWidth={STROKE.hair} />
        {BARS.map((b, k) => {
          const h = CHART.base * b * grow[k];
          return <path key={k} d={topRounded(k * CHART.step, CHART.base - h, CHART.bar, h, RADIUS.chip)} fill={k === KEY_BAR ? accent : alpha(P.ink, 0.12)} />;
        })}
        {DAYS.map((d, k) => (
          <text key={k} x={k * CHART.step + CHART.bar / 2} y={120} textAnchor="middle" fontFamily={FONT_MONO} fontSize={VIS_MIN_TEXT} fill={k === KEY_BAR ? P.ink : P.ink3}>
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ---- search: a focused field types "design", three results drop in
export const QUERY = "design";
const RESULTS = [
  { rest: " review", kind: "DOC", icon: ICON.doc },
  { rest: " system", kind: "PROJECT", icon: ICON.folder },
  { rest: " team", kind: "TEAM", icon: ICON.team },
];
const SearchVis: React.FC<VisProps> = ({ q, t, accent }) => {
  const n = t < 4 ? 0 : Math.min(QUERY.length, Math.floor((t - 4) / 2.5) + 1);
  const focus = t >= 2;
  const drop = progress(t, 14, 26, "enter");
  const caret = <div style={{ width: 2 * q, height: 26 * q, background: P.ink, marginLeft: n ? 2 * q : 0, marginRight: n ? 0 : 4 * q }} />;
  return (
    <>
      <div
        style={surface(q, 0, 4, 720, 64, {
          border: `${STROKE.hair * q}px solid ${focus ? accent : P.line}`,
          boxShadow: focus ? `0 0 0 ${3 * q}px ${alpha(accent, 0.14)}, ${uiShadow(q)}` : uiShadow(q),
        })}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 20 * q, gap: 14 * q }}>
          <Icon q={q} size={24} d={ICON.search} color={P.ink2} />
          <div style={{ display: "flex", alignItems: "center" }}>
            {n ? <span style={sans(q, 22, 400, P.ink)}>{QUERY.slice(0, n)}</span> : null}
            {caret}
            {n ? null : <span style={sans(q, 22, 400, P.ink3)}>Search everything</span>}
          </div>
        </div>
        <div
          style={mono(q, VIS_MIN_TEXT, P.ink3, {
            position: "absolute",
            right: 14 * q,
            top: 13 * q,
            height: 34 * q,
            lineHeight: `${34 * q - 2 * STROKE.hair * q}px`,
            padding: `0 ${8 * q}px`,
            boxSizing: "border-box",
            border: `${STROKE.hair * q}px solid ${P.line}`,
            borderRadius: RADIUS.chip * q,
          })}
        >
          ESC
        </div>
      </div>
      <div style={surface(q, 0, 80, 720, 172, { opacity: drop, transform: `translateY(${(-(1 - drop) * 8 * q).toFixed(3)}px)` })}>
        {RESULTS.map((r, i) => {
          const pr = progress(t, 16 + STAGGER * i, 28 + STAGGER * i, "enter");
          return (
            <div
              key={i}
              style={at(q, 8, 8 + 52 * i, {
                width: 701 * q,
                height: 52 * q,
                borderRadius: RADIUS.chip * q,
                background: i === 0 ? P.fill : "transparent",
                display: "flex",
                alignItems: "center",
                gap: 12 * q,
                padding: `0 ${14 * q}px`,
                boxSizing: "border-box",
                opacity: pr,
                transform: `translateY(${((1 - pr) * 6 * q).toFixed(3)}px)`,
              })}
            >
              <Icon q={q} size={20} d={r.icon} color={P.ink2} />
              <span style={{ display: "flex" }}>
                <span style={sans(q, 20, 600, P.ink)}>Design</span>
                <span style={sans(q, 20, 400, P.ink2, { whiteSpace: "pre" })}>{r.rest}</span>
              </span>
              <span style={mono(q, VIS_MIN_TEXT, P.ink3, { marginLeft: "auto" })}>{r.kind}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---- avatars: a shared calendar's member stack grows, then "+3"
const PEOPLE = [
  { initials: "MJ", bg: P.ink, fg: P.card },
  { initials: "AK", bg: P.ink2, fg: P.card },
  { initials: "SL", bg: P.ink3, fg: P.card },
  { initials: "RT", bg: P.fill, fg: P.ink },
  { initials: "+3", bg: P.fill, fg: P.ink2 },
];
const AvatarsVis: React.FC<VisProps> = ({ q, t, accent, label }) => (
  <div style={surface(q, 0, 22, 720, 216)}>
    <div style={at(q, 28, 26, { display: "flex", alignItems: "center", gap: 10 * q })}>
      <div style={{ width: 10 * q, height: 10 * q, borderRadius: 5 * q, background: accent }} />
      <div style={sans(q, 22, 500, P.ink)}>{label}</div>
    </div>
    <div style={mono(q, VIS_MIN_TEXT, P.ink3, at(q, 28, 60))}>7 MEMBERS · EDITING LIVE</div>
    <div
      style={sans(q, 18, 500, P.onButton, {
        position: "absolute",
        right: 28 * q,
        top: 24 * q,
        height: 44 * q,
        lineHeight: `${44 * q}px`,
        padding: `0 ${20 * q}px`,
        borderRadius: RADIUS.button * q,
        background: P.button,
      })}
    >
      Invite
    </div>
    {PEOPLE.map((a, k) => {
      const s0 = 4 + 4 * k;
      const p = progress(t, s0, s0 + 14, "spring");
      return (
        <div
          key={k}
          style={at(q, 28 + 60 * k, 108, {
            width: 80 * q,
            height: 80 * q,
            borderRadius: 40 * q,
            boxSizing: "border-box",
            border: `${4 * q}px solid ${P.card}`,
            background: a.bg,
            color: a.fg,
            fontFamily: FONT_SANS,
            fontSize: 22 * q,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(1, p * 2),
            transform: `scale(${(0.6 + 0.4 * p).toFixed(4)})`,
          })}
        >
          {a.initials}
        </div>
      );
    })}
    <div style={mono(q, VIS_MIN_TEXT, P.ink3, { position: "absolute", right: 28 * q, bottom: 36 * q })}>SYNCED JUST NOW</div>
  </div>
);

// ---- keys: ⌘ and K press, the command menu opens
const MENU = [
  { label: "New event", key: "N" },
  { label: "Go to today", key: "T" },
  { label: "Invite people", key: "I" },
];
const Keycap: React.FC<{ q: number; x: number; d: number; children: React.ReactNode }> = ({ q, x, d, children }) => (
  <div
    style={at(q, x, 66, {
      width: 128 * q,
      height: 128 * q,
      boxSizing: "border-box",
      borderRadius: RADIUS.button * q,
      background: P.card,
      border: `${STROKE.hair * q}px solid ${P.line}`,
      boxShadow: `0 ${mix(6, 1, d) * q}px 0 ${alpha(P.ink, 0.08)}, 0 ${mix(10, 3, d) * q}px ${mix(24, 8, d) * q}px ${alpha(FILM.black, 0.07)}`,
      transform: `translateY(${(d * 5 * q).toFixed(3)}px)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    })}
  >
    {children}
  </div>
);
const KeysVis: React.FC<VisProps> = ({ q, t, accent }) => {
  const cmd = progress(t, 4, 8, "enter") - progress(t, 28, 33, "enter");
  const k = progress(t, 9, 13, "enter") - progress(t, 26, 31, "enter");
  const open = progress(t, 13, 27, "enter");
  return (
    <>
      <Keycap q={q} x={0} d={cmd}>
        <Icon q={q} size={48} d={ICON.command} color={P.ink} stroke={1.6} />
      </Keycap>
      <Keycap q={q} x={148} d={k}>
        <span style={sans(q, 48, 500, P.ink, { lineHeight: 1 })}>K</span>
      </Keycap>
      <div style={surface(q, 316, 4, 404, 252, { opacity: open, transform: `scale(${(0.96 + 0.04 * open).toFixed(4)})`, transformOrigin: "0% 50%" })}>
        <div style={at(q, 18, 0, { height: 60 * q, display: "flex", alignItems: "center", gap: 12 * q })}>
          <Icon q={q} size={22} d={ICON.search} color={P.ink3} />
          <div style={{ width: 2 * q, height: 24 * q, background: accent }} />
          <span style={sans(q, 20, 400, P.ink3)}>Type a command</span>
        </div>
        <div style={at(q, 0, 60, { width: "100%", height: STROKE.hair * q, background: P.line })} />
        {MENU.map((r, i) => {
          const pr = progress(t, 16 + STAGGER * i, 28 + STAGGER * i, "enter");
          return (
            <div
              key={i}
              style={at(q, 8, 70 + 58 * i, {
                width: 385 * q,
                height: 52 * q,
                borderRadius: RADIUS.chip * q,
                background: i === 0 ? P.fill : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `0 ${14 * q}px`,
                boxSizing: "border-box",
                opacity: pr,
              })}
            >
              <span style={sans(q, 18, 500, i === 0 ? P.ink : P.ink2)}>{r.label}</span>
              <span
                style={mono(q, VIS_MIN_TEXT, P.ink2, {
                  width: 32 * q,
                  height: 32 * q,
                  boxSizing: "border-box",
                  border: `${STROKE.hair * q}px solid ${P.line}`,
                  borderRadius: RADIUS.chip * q,
                  background: P.card,
                  letterSpacing: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                {r.key}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---- calendar: a work-week strip; the accent focus block glides in from Friday to Wednesday morning
const WEEK = ["Mon 13", "Tue 14", "Wed 15", "Thu 16", "Fri 17"];
const TODAY = 2;
const HOURS = ["9", "10", "11", "12"];
const BUSY = [
  { col: 0, from: 0, to: 1, label: "Standup" },
  { col: 1, from: 1, to: 2, label: "1:1" },
  { col: 3, from: 2.5, to: 4, label: "Review" },
  { col: 4, from: 3, to: 4, label: "Sync" },
];
const CAL = { w: 720, h: 244, gutter: 56, col: 128, head: 52, row: 48 } as const;
const CalendarVis: React.FC<VisProps> = ({ q, t, accent }) => {
  const slide = progress(t, 6, 26, "travel");
  const fade = progress(t, 6, 12, "enter");
  const ex = CAL.gutter + TODAY * CAL.col + 4 + (1 - slide) * 2 * CAL.col;
  return (
    <div style={surface(q, 0, 8, CAL.w, CAL.h, { overflow: "hidden" })}>
      <svg width={CAL.w * q} height={CAL.h * q} viewBox={`0 0 ${CAL.w} ${CAL.h}`} style={at(q, 0, 0)}>
        {WEEK.map((d, k) => (
          <text
            key={d}
            x={CAL.gutter + CAL.col * k + CAL.col / 2}
            y={32}
            textAnchor="middle"
            fontFamily={FONT_SANS}
            fontSize={VIS_MIN_TEXT}
            fontWeight={k === TODAY ? 600 : 500}
            fill={k === TODAY ? P.ink : P.ink3}
          >
            {d}
          </text>
        ))}
        <line x1={0} x2={CAL.w} y1={CAL.head} y2={CAL.head} stroke={P.line} strokeWidth={STROKE.hair} />
        {[1, 2, 3].map((r) => (
          <line key={r} x1={CAL.gutter} x2={CAL.w} y1={CAL.head + CAL.row * r} y2={CAL.head + CAL.row * r} stroke={P.ink} strokeOpacity={0.06} strokeWidth={STROKE.hair} />
        ))}
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={CAL.gutter + CAL.col * k} x2={CAL.gutter + CAL.col * k} y1={CAL.head} y2={CAL.h} stroke={P.ink} strokeOpacity={0.06} strokeWidth={STROKE.hair} />
        ))}
        {HOURS.map((h, r) => (
          <text key={h} x={CAL.gutter - 14} y={CAL.head + CAL.row * r + 20} textAnchor="end" fontFamily={FONT_MONO} fontSize={VIS_MIN_TEXT} fill={P.ink3}>
            {h}
          </text>
        ))}
        {BUSY.map((b) => {
          const x = CAL.gutter + CAL.col * b.col + 4;
          const y = CAL.head + CAL.row * b.from + 3;
          return (
            <React.Fragment key={b.label}>
              <rect x={x} y={y} width={CAL.col - 8} height={CAL.row * (b.to - b.from) - 6} rx={RADIUS.chip} fill={P.fill} />
              <text x={x + 10} y={y + 26} fontFamily={FONT_SANS} fontSize={VIS_MIN_TEXT} fontWeight={500} fill={P.ink2}>
                {b.label}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
      <div
        style={at(q, ex, CAL.head + 3, {
          width: (CAL.col - 8) * q,
          height: (CAL.row * 2 - 6) * q,
          borderRadius: RADIUS.chip * q,
          background: alpha(accent, 0.14),
          overflow: "hidden",
          opacity: fade,
        })}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: STROKE.ring * q, background: accent }} />
        <div style={sans(q, VIS_MIN_TEXT, 600, P.ink, at(q, 14, 12))}>Focus time</div>
        <div style={mono(q, VIS_MIN_TEXT, P.ink2, at(q, 14, 40, { letterSpacing: 0 }))}>9–11 AM</div>
      </div>
    </div>
  );
};

const VIS: Record<Visual, React.FC<VisProps>> = {
  toggle: ToggleVis,
  chart: ChartVis,
  search: SearchVis,
  avatars: AvatarsVis,
  keys: KeysVis,
  calendar: CalendarVis,
};

// ---------- the update card ----------
// Drawn at full size; the overview scales it with a transform. `compact` 0–1 fades the detail and lifts the panel.
const UpdateCard: React.FC<{
  n: number;
  title: string;
  detail: string;
  visual: Visual;
  image: string; // non-empty: the user's picture fills the panel instead of the mini interface
  accent: string;
  u: number;
  tall: boolean;
  compact: number;
  local: number; // frames since the card started entering
  vt: number; // frames since the card's window started (drives its mini interface)
}> = ({ n, title, detail, visual, image, accent, u, tall, compact, local, vt }) => {
  const C = (tall ? SIZE.tall : SIZE.wide).card;
  const inner = C.w - 2 * C.pad;
  const tSize = fitSize(title, inner, C.title);
  const dSize = tall ? C.detail : fitSize(detail, inner, C.detail);
  const dp = progress(local, T.detail[0], T.detail[1], "enter");
  const pw = C.w - 2 * C.inset;
  const ph = C.h - C.inset - C.panelTop;
  const q = visScale(tall) * u;
  const Vis = VIS[visual];
  return (
    <div
      style={{
        position: "relative",
        width: C.w * u,
        height: mix(C.h, C.hc, compact) * u,
        boxSizing: "border-box",
        background: P.card,
        borderRadius: RADIUS.card * u,
        border: `${STROKE.hair * u}px solid ${alpha(FILM.black, 0.08)}`,
        boxShadow: `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
        overflow: "hidden",
      }}
    >
      <div style={mono(u, 20, alpha(P.ink, 0.45), { position: "absolute", left: C.pad * u, top: C.pad * u })}>{pad2(n)}</div>
      <div style={{ position: "absolute", right: C.pad * u, top: C.pad * u, display: "flex", alignItems: "center", gap: 10 * u }}>
        <div style={{ width: 8 * u, height: 8 * u, borderRadius: 4 * u, background: P.ink2 }} />
        <div style={mono(u, 18, P.ink2, { letterSpacing: "0.1em" })}>NEW</div>
      </div>
      <div style={{ position: "absolute", left: C.pad * u, top: C.titleTop * u, fontFamily: FONT_SANS, fontSize: tSize * u, fontWeight: 600, letterSpacing: `${TRACK.card}em`, color: P.ink }}>
        <MaskRow words={words(title)} local={local} start={T.cardTitle} dur={T.wordDur} />
      </div>
      <div
        style={{
          position: "absolute",
          left: C.pad * u,
          top: C.detailTop * u,
          width: inner * u,
          fontFamily: FONT_SANS,
          fontSize: dSize * u,
          fontWeight: 400,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          color: alpha(P.ink, 0.6),
          whiteSpace: tall ? "normal" : "nowrap",
          opacity: dp * (1 - compact),
          transform: `translateY(${((1 - dp) * 12 * u).toFixed(3)}px)`,
        }}
      >
        {detail}
      </div>
      <div
        style={{
          position: "absolute",
          left: C.inset * u,
          top: mix(C.panelTop, C.panelTopC, compact) * u,
          width: pw * u,
          height: ph * u,
          borderRadius: RADIUS.button * u,
          background: P.fill,
          overflow: "hidden",
        }}
      >
        {image ? (
          <>
            {/* width-fitted, cropped from the top (no object-position), pushing in from the top edge */}
            <Img
              src={image}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                transformOrigin: "50% 0%",
                transform: `scale(${(1 + IMAGE_PUSH * Math.min(1, Math.max(0, vt / CARD.len))).toFixed(5)})`,
              }}
            />
            <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * u, boxShadow: `inset 0 0 0 ${STROKE.hair * u}px ${alpha(FILM.black, 0.08)}` }} />
          </>
        ) : (
          <div style={{ position: "absolute", left: (pw * u - VIS_BOX.w * q) / 2, top: (ph * u - VIS_BOX.h * q) / 2, width: VIS_BOX.w * q, height: VIS_BOX.h * q }}>
            <Vis q={q} t={vt} accent={accent} label={title} />
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- the film ----------
export const ChangelogRoundup: React.FC<ChangelogRoundupProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  const { u, width, height, isVertical: tall } = useLayout();
  const G = geometry(width / u, height / u, tall);
  const { S } = G;
  const bg = index === 0 ? FILM.black : p.field;
  const ink = textOn(bg);
  const ups = updatesOf(p);
  const active = Math.max(0, Math.min(COUNT - 1, Math.floor((frame - SHOTS[1]) / CARD.len)));
  const L3 = frame - SHOTS[2]; // shot 3 local (negative before it)
  const leave = index === 2 ? 1 - progress(L3, T.fade[0], T.fade[1], "exit") : 1;

  // ---- captions (all shots)
  const capOpacity = index === 0 ? progress(local, T.caption[0], T.caption[1], "enter") : 1;
  const capRight = index === 1 ? `${pad2(active + 1)} / ${pad2(COUNT)}` : `${pad2(COUNT)} UPDATES`;
  const captions = (
    <>
      <div style={mono(u, S.caption, alpha(ink, 0.5), { position: "absolute", left: G.m * u, top: G.captionY * u, letterSpacing: "0.1em", opacity: capOpacity })}>
        {`${p.brand} Changelog`.toUpperCase()}
      </div>
      <div style={mono(u, S.caption, alpha(ink, 0.5), { position: "absolute", right: G.m * u, top: G.captionY * u, letterSpacing: "0.1em", opacity: capOpacity })}>
        {capRight}
      </div>
    </>
  );

  // ---- progress bar (all shots; leaves at the overview)
  const bar = (
    <div style={{ position: "absolute", inset: 0, opacity: leave }}>
      {ups.map((d, k) => {
        const x = G.bar.x0 + k * (G.segW + G.bar.gap);
        const draw = index === 0 ? progress(local, T.bar + STAGGER * k, T.bar + STAGGER * k + T.segDur, "enter") : 1;
        const fill = index === 0 ? 0 : Math.min(1, Math.max(0, (frame - cardStart(k)) / CARD.len));
        const labelOpacity = index === 0 ? draw * 0.6 : index === 1 ? (k === active ? 1 : 0.4) : 0.4;
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: "absolute",
                left: x * u,
                top: (G.bar.y - 16 - S.barLabel * 1.2) * u,
                width: G.segW * u,
                display: "flex",
                gap: 12 * u,
                opacity: labelOpacity,
                overflow: "hidden",
              }}
            >
              <span style={mono(u, S.barLabel, ink, { letterSpacing: "0.04em" })}>{pad2(k + 1)}</span>
              {tall ? null : <span style={mono(u, S.barLabel, ink, { letterSpacing: 0 })}>{d.title}</span>}
            </div>
            <div
              style={{
                position: "absolute",
                left: x * u,
                top: (G.bar.y - STROKE.hair / 2) * u,
                width: G.segW * u,
                height: STROKE.hair * u,
                background: alpha(ink, 0.22),
                transformOrigin: "0 50%",
                transform: `scaleX(${draw.toFixed(4)})`,
              }}
            />
            {fill > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: x * u,
                  top: (G.bar.y - STROKE.ring / 2) * u,
                  width: G.segW * fill * u,
                  height: STROKE.ring * u,
                  background: ink,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ---- shot 1: black title card
  if (index === 0) {
    const tSize = fitSize(p.title, G.open.maxW, S.openTitle);
    const mSize = fitSize(p.month, G.open.maxW, S.openMonth);
    const push = 1 + T.push * Math.min(1, local / (SHOTS[1] - SHOTS[0]));
    return (
      <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: FONT_SANS }}>
        {captions}
        <div style={{ position: "absolute", left: G.open.x * u, top: G.open.y * u, color: FILM.white, transformOrigin: "0% 50%", transform: `scale(${push.toFixed(5)})` }}>
          <div style={{ fontSize: tSize * u, fontWeight: 500, letterSpacing: `${TRACK.title}em` }}>
            <MaskRow words={words(p.title)} local={local} start={T.title} dur={T.wordDur} />
          </div>
          <div style={{ marginTop: 8 * u, fontSize: mSize * u, fontWeight: 600, letterSpacing: `${TRACK.month}em` }}>
            <MaskRow words={words(p.month)} local={local} start={T.month} dur={T.monthDur} />
          </div>
        </div>
        {bar}
      </AbsoluteFill>
    );
  }

  // ---- shots 2 and 3: cards on the field
  const compact = index === 2 ? progress(L3, T.compact[0], T.compact[1], "enter") : 0;
  const poses = ups.map((_, i) => {
    if (index === 2) {
      const cell = G.cells[i];
      if (i === COUNT - 1) {
        const t = progress(L3, T.shrink[0], T.shrink[1], "spring");
        return { x: mix(G.stage.x, cell.x, t), y: mix(G.stage.y, cell.y, t), s: mix(1, cell.s, t), o: 1 };
      }
      const s0 = T.fly + STAGGER * i;
      const t = progress(L3, s0, s0 + T.flyDur, "spring");
      return { x: cell.x - (1 - t) * T.flyFrom, y: cell.y, s: cell.s, o: progress(L3, s0, s0 + 12, "enter") };
    }
    if (frame < enterAt(i)) return null;
    if (i < COUNT - 1 && frame >= cardStart(i + 1)) return null;
    const e = progress(frame, enterAt(i), enterAt(i) + CARD.enter, "spring");
    const out = i < COUNT - 1 ? progress(frame, exitAt(i), exitAt(i) + CARD.exit, "exit") : 0;
    return {
      x: G.stage.x + (1 - e) * CARD.inFrom - out * CARD.outTo,
      y: G.stage.y,
      s: 1,
      o: progress(frame, enterAt(i), enterAt(i) + CARD.fadeIn, "enter") * (1 - out),
    };
  });

  const L2 = frame - SHOTS[1];
  const numberStyle: React.CSSProperties = {
    position: "absolute",
    left: G.number.x * u,
    top: G.number.y * u,
    fontFamily: FONT_SANS,
    fontSize: S.number * u,
    fontWeight: 600,
    letterSpacing: `${TRACK.number}em`,
    color: alpha(ink, NUMBER_INK),
    opacity: leave,
  };
  const labelWords = [...words(p.title, ink), ...words(p.month, alpha(ink, 0.5))];
  const labelSize = fitSize(`${p.title} ${p.month}`, G.label.maxW, S.label);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: FONT_SANS }}>
      {captions}
      {/* the big index, one mask per number: it rises in with its card and lifts out as the card leaves */}
      {ups.map((_, i) => {
        if (frame < enterAt(i)) return null;
        const out = i < COUNT - 1 ? progress(frame, exitAt(i), exitAt(i) + T.numberOut, "exit") : 0;
        if (out >= 1) return null;
        return (
          <div key={i} style={numberStyle}>
            <MaskRow words={[{ text: pad2(i + 1) }]} local={frame - enterAt(i)} start={0} dur={T.numberIn} out={out} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: G.label.x * u, top: G.label.y * u, fontSize: labelSize * u, fontWeight: 500, letterSpacing: "-0.02em", opacity: leave }}>
        <MaskRow words={labelWords} local={L2} start={T.label} dur={T.wordDur} />
      </div>
      {bar}
      {index === 2 ? (
        <div style={{ position: "absolute", left: G.over.x * u, top: G.over.y * u, color: ink }}>
          <div style={{ fontSize: fitSize(p.title, G.over.maxW, S.overTitle) * u, fontWeight: 500, letterSpacing: `${TRACK.title}em`, color: alpha(ink, 0.55) }}>
            <MaskRow words={words(p.title)} local={L3} start={T.overTitle} dur={T.wordDur} />
          </div>
          <div style={{ marginTop: 8 * u, fontSize: fitSize(p.month, G.over.maxW, S.overMonth) * u, fontWeight: 600, letterSpacing: `${TRACK.month}em` }}>
            <MaskRow words={words(p.month)} local={L3} start={T.overMonth} dur={T.wordDur} />
          </div>
        </div>
      ) : null}
      {poses.map((pose, i) => {
        if (!pose) return null;
        const d = ups[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(${(pose.x * u).toFixed(2)}px, ${(pose.y * u).toFixed(2)}px) scale(${pose.s.toFixed(5)})`,
              opacity: pose.o,
            }}
          >
            <UpdateCard
              n={i + 1}
              title={d.title}
              detail={d.detail}
              visual={d.visual}
              image={d.image}
              accent={p.accent}
              u={u}
              tall={tall}
              compact={compact}
              local={frame - enterAt(i)}
              vt={frame - cardStart(i)}
            />
          </div>
        );
      })}
      {index === 2
        ? (() => {
            const t = progress(L3, T.logo[0], T.logo[1], "enter");
            return (
              <div style={{ position: "absolute", left: G.logo.x * u, top: G.logo.y * u, opacity: t, transform: `translateY(${((1 - t) * 16 * u).toFixed(3)}px)` }}>
                <Logo src={p.logo || undefined} name={p.brand} size={S.logo * u} color={ink} tile={ink} onTile={p.field} />
              </div>
            );
          })()
        : null}
    </AbsoluteFill>
  );
};
