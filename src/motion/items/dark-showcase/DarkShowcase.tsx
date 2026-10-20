import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Cursor, FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type DarkShowcaseProps = {
  base: string; // shots 1–3
  end: string; // shot 4 (logo card)
  kicker: string;
  line: string;
  action: string;
  actionDone: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
};

// ---------- timeline (frames of the 240-frame film; shots are hard cuts) ----------
export const SHOTS = [0, 72, 132, 180] as const;
// Timings below are local to their shot.
export const T = {
  plateFade: 18, // shot 1: the tilted plate fades in from black
  kicker: [10, 28] as const, // shot 1: mono caption fades in
  wordStart: 4, // shot 2: first word starts rising, frames after the cut
  wordDur: 18, // one word's rise
  maxStagger: 8, // stagger steps before words start together
  button: [2, 20] as const, // shot 3: button fades in and rises
  buttonRise: 32, // px at 1080 the button rises
  glide: [6, 26] as const, // cursor glide in
  click: 28, // press (frame 160 of the film)
  swap: [29, 39] as const, // label roll after the press
  logoStart: 2,
  logoDur: 18,
} as const;

// ---------- the tilted plate (shot 1) ----------
// The plate starts steep and settles flatter over the whole shot on "travel", while it pushes in and drifts slightly.
export const TILT = { from: { x: 28, z: -8 }, to: { x: 14, z: -4 } } as const; // degrees
export const DRIFT = { from: [30, 24], to: [-30, -12] } as const; // px at 1080
export const PERSPECTIVE = 2400; // px at 1080

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: {
    plateW: 1400, // 16:10 screenshot
    plateRadius: RADIUS.card,
    plateScale: [0.86, 0.94] as const,
    plateY: -20,
    kicker: 20,
    window: 0.68, // shot 2: the zoomed screenshot fills the top 68%
    zoom: [2.3, 2.45] as const, // × the plate width
    statement: 72,
    maxLines: 2,
    button: { w: 560, h: 120 },
    label: 44,
    icon: 40,
    cursor: 1.6,
    logo: 80,
  },
  tall: {
    plateW: 620, // 9:19.5 phone screen
    plateRadius: RADIUS.hero,
    plateScale: [0.9, 0.98] as const,
    plateY: -60,
    kicker: 24,
    window: 0.66,
    zoom: [2.3, 2.45] as const,
    statement: 84,
    maxLines: 3,
    button: { w: 820, h: 168 },
    label: 60,
    icon: 54,
    cursor: 2,
    logo: 110,
  },
} as const;
export const MARGIN = 72;
export const TRACK = { statement: -0.04, label: -0.01, kicker: 0.12 } as const;
export const LINE_H = 1.08;
export const PLATE_LINE = 0.1; // white hairline opacity on the plate
export const EDGE_LINE = 0.18; // hairline under the zoomed screenshot

// Shot 2's camera: the view centre pans (linear) across a region of interest, as fractions of the image. Tuned to a
// week-view app (16:9: the mid-week columns and the "now" line, inside x .45–.85, y .15–.55) and a phone day view
// (9:16: the event list). Any upload still reads: the centre is clamped so the view never leaves the image.
export const PAN = {
  wide: { from: [0.55, 0.3] as const, to: [0.7, 0.4] as const, region: "x 45–85%, y 15–55%" },
  tall: { from: [0.27, 0.47] as const, to: [0.27, 0.62] as const, region: "the left of the event list, y 38–78%" },
} as const;

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

// Button label: one size for both labels so the roll never jumps. Inter 600 averages ~0.56em per character.
export const labelSize = (a: string, b: string, innerW: number, base: number) => {
  const chars = Math.max(1, a.length, b.length);
  return Math.min(base, innerW / (chars * 0.56));
};
export const BUTTON_PAD = 44; // px at 1080, each side
export const ICON_GAP = 16;

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
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "0.25em", whiteSpace: "nowrap", lineHeight: LINE_H }}>
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

// Stroked glyphs on a 24-unit grid; `stroke` is the rendered width in px.
const Glyph: React.FC<{ kind: "calendar" | "check"; size: number; color: string; stroke: number }> = ({ kind, size, color, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <g fill="none" stroke={color} strokeWidth={(stroke * 24) / size} strokeLinecap="round" strokeLinejoin="round">
      {kind === "calendar" ? (
        <>
          <rect x={3.5} y={5} width={17} height={15.5} rx={3} />
          <path d="M8 3 V7 M16 3 V7 M3.5 10 H20.5" />
        </>
      ) : (
        <path d="M5 12.5 L10 17.5 L19 7" />
      )}
    </g>
  </svg>
);

type Pt = [number, number];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
// A slight arc between two points, as a hand moves a mouse.
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp(t, 0, 1)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// ---------- shots ----------
const PlateShot: React.FC<{ p: DarkShowcaseProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.base);
  const t = progress(local, 0, length, "travel");
  const fade = progress(local, 0, T.plateFade, "enter");
  const kick = progress(local, T.kicker[0], T.kicker[1], "enter");

  const w = L.plateW * u;
  const h = isVertical ? (w * 19.5) / 9 : (w * 10) / 16;
  const x = (width - w) / 2;
  const y = (height - h) / 2 + L.plateY * u;
  const rx = mix(TILT.from.x, TILT.to.x, t);
  const rz = mix(TILT.from.z, TILT.to.z, t);
  const s = mix(L.plateScale[0], L.plateScale[1], t);
  const dx = mix(DRIFT.from[0], DRIFT.to[0], t) * u;
  const dy = mix(DRIFT.from[1], DRIFT.to[1], t) * u;
  // perspective() in the transform itself (not on a parent), so the plate carries its own camera into the export.
  const transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) perspective(${PERSPECTIVE * u}px) rotateX(${rx.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  const src = isVertical ? p.phoneShot || SAMPLE.phoneDark : p.screenshot || SAMPLE.appDark;

  return (
    <>
      <Screenshot
        src={src}
        x={x}
        y={y}
        w={w}
        h={h}
        radius={L.plateRadius * u}
        line={alpha(FILM.white, PLATE_LINE)}
        style={{ transform, opacity: fade, background: FILM.black }}
      />
      {p.kicker ? (
        <div
          style={{
            position: "absolute",
            left: MARGIN * u,
            bottom: MARGIN * u,
            fontFamily: FONT_MONO,
            fontSize: L.kicker * u,
            letterSpacing: `${TRACK.kicker}em`,
            textTransform: "uppercase",
            color: alpha(ink, 0.5),
            whiteSpace: "nowrap",
            opacity: kick,
          }}
        >
          {p.kicker}
        </div>
      ) : null}
    </>
  );
};

const DetailShot: React.FC<{ p: DarkShowcaseProps; local: number; length: number }> = ({ p, local, length }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const pan = isVertical ? PAN.tall : PAN.wide;
  const ink = textOn(p.base);
  const t = progress(local, 0, length, "linear");

  // the camera: a full-width window over the top of the frame, the screenshot large inside it
  const winH = height * L.window;
  const imgW = L.plateW * u * mix(L.zoom[0], L.zoom[1], t);
  const imgH = isVertical ? (imgW * 19.5) / 9 : (imgW * 10) / 16;
  const visX = Math.min(1, width / imgW) / 2;
  const visY = Math.min(1, winH / imgH) / 2;
  const cx = clamp(mix(pan.from[0], pan.to[0], t), visX, 1 - visX);
  const cy = clamp(mix(pan.from[1], pan.to[1], t), visY, 1 - visY);
  const src = isVertical ? p.phoneShot || SAMPLE.phoneDark : p.screenshot || SAMPLE.appDark;

  const { rows, size } = fitRows(p.line, width - 2 * MARGIN * u, L.statement * u, L.maxLines);

  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: winH, overflow: "hidden" }}>
        <Screenshot
          src={src}
          x={width / 2 - cx * imgW}
          y={winH / 2 - cy * imgH}
          w={imgW}
          h={imgH}
          radius={L.plateRadius * u * L.zoom[0]}
          style={isVertical ? undefined : { background: FILM.black }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, top: winH, width, height: STROKE.hair * u, background: alpha(ink, EDGE_LINE) }} />
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          top: winH,
          width: width - 2 * MARGIN * u,
          height: height - winH,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          fontFamily: FONT_SANS,
          fontSize: size,
          fontWeight: 500,
          letterSpacing: `${TRACK.statement}em`,
          color: ink,
        }}
      >
        <Rise rows={rows} local={local} />
      </div>
    </>
  );
};

const ControlShot: React.FC<{ p: DarkShowcaseProps; local: number }> = ({ p, local }) => {
  const { u, width, height, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const btn = textOn(p.base);
  const onBtn = textOn(btn);

  const bw = L.button.w * u;
  const bh = L.button.h * u;
  const cx = width / 2;
  const cy = height / 2;
  const icon = L.icon * u;
  const fs = labelSize(p.action, p.actionDone, bw - 2 * BUTTON_PAD * u - icon - ICON_GAP * u, L.label * u);

  const enter = progress(local, T.button[0], T.button[1], "enter");
  const press = interpolate(local, [T.click - 3, T.click, T.click + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The labels roll: the old one slides up out of the button as the new one slides up in, so the two never overlap.
  const roll = progress(local, T.swap[0], T.swap[1], "travel");

  // the cursor glides in from off-frame bottom-right on an arc and lands on the label's right half
  const tip: Pt = [cx + bw * 0.22, cy + bh * 0.14];
  const from: Pt = [width + 60 * u, height * (isVertical ? 0.78 : 0.92)];
  const cur = glide(from, tip, progress(local, T.glide[0], T.glide[1], "travel"));

  const label = (text: string, kind: "calendar" | "check", o: number, dy: number) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ICON_GAP * u,
        opacity: o,
        transform: `translateY(${dy.toFixed(2)}px)`,
      }}
    >
      <Glyph kind={kind} size={icon} color={onBtn} stroke={STROKE.ring * u} />
      <span style={{ fontFamily: FONT_SANS, fontSize: fs, fontWeight: 600, letterSpacing: `${TRACK.label}em`, color: onBtn, whiteSpace: "nowrap", lineHeight: 1 }}>
        {text}
      </span>
    </div>
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - bw / 2,
          top: cy - bh / 2,
          width: bw,
          height: bh,
          borderRadius: RADIUS.hero * u,
          background: btn,
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${((1 - enter) * T.buttonRise * u).toFixed(2)}px) scale(${(1 - 0.04 * press).toFixed(4)})`,
        }}
      >
        {roll < 1 ? label(p.action, "calendar", 1, -roll * bh) : null}
        {roll > 0 ? label(p.actionDone, "check", 1, (1 - roll) * bh) : null}
      </div>
      {/* macOS-style pointer: black fill, white outline, so it reads on the black field and on the white button */}
      <Cursor u={u} x={cur[0]} y={cur[1]} color={FILM.black} press={press} scale={L.cursor} />
    </>
  );
};

const LogoShot: React.FC<{ p: DarkShowcaseProps; local: number }> = ({ p, local }) => {
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

export const DarkShowcase: React.FC<DarkShowcaseProps> = (p) => {
  const { index, local, length } = useShot(SHOTS);
  const bg = index === 3 ? p.end : p.base;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <PlateShot p={p} local={local} length={length} /> : null}
      {index === 1 ? <DetailShot p={p} local={local} length={length} /> : null}
      {index === 2 ? <ControlShot p={p} local={local} /> : null}
      {index === 3 ? <LogoShot p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
