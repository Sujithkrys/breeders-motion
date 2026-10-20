import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CURSOR_COLORS, Cursor, FILM, Logo, SAMPLE, Screenshot, SelectionBox, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, alpha, mix, progress, useLayout } from "../../kit";

export type CanvasFeatureProps = {
  title: string;
  feature: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  canvas: string; // shots 1–3: the design canvas
  end: string; // shot 4: the title card
};

// ---------- timeline (frames of the 240-frame film) ----------
// Shots 1–3 share one canvas and one camera, so those cuts are invisible; shot 4 is a hard cut to the title card.
export const SHOTS = [0, 60, 132, 180] as const;
// Timings below are local to their shot.
export const T = {
  settle: 18, // shot 1: the frame settles in
  maya1: [10, 52] as const, // shot 1: Maya glides to where the drag starts
  leo1: [4, 46] as const, // shot 1: Leo drifts onto the page
  press: [0, 3] as const, // shot 2: mouse down
  drag: [4, 28] as const, // shot 2: the selection grows with Maya's cursor
  release: [28, 32] as const,
  leo2: [6, 34] as const, // shot 2: Leo settles beside the selection
  zoom: [30, 70] as const, // shot 2: the camera zooms into the selection
  mayaRest: [32, 52] as const, // shot 2: Maya lets go of the handle and rests inside the selection
  chip: [4, 22] as const, // shot 3: the feature chip pops in
  idleIn: 12, // shot 3: idle drift fades in
  wordStart: 2, // shot 4: first word starts rising
  wordDur: 16,
  maxStagger: 8,
  logo: [10, 28] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const SIZE = {
  wide: { frameW: 1100, aspect: 10 / 16, fill: 0.7, fillH: 0.74, title: 110, titleMaxW: 1200, maxLines: 2, logo: 44, cursor: 1.4, chip: 32 },
  tall: { frameW: 600, aspect: 19.5 / 9, fill: 0.85, fillH: 0.5, title: 110, titleMaxW: 936, maxLines: 4, logo: 56, cursor: 1.6, chip: 44 },
} as const;
export const MARGIN = 72;
export const FRAME_DY = 12; // the frame sits this far below centre, leaving room for its label
export const LABEL = { size: 18, above: 34 } as const; // frame label: Geist Mono size, top offset above the frame
export const CAMERA_DY = 30; // after the zoom the selection's centre sits this far below the frame centre
export const SETTLE_FROM = 0.97;
export const CHIP = { gap: 20, padX: 20, from: 0.85 } as const;
export const IDLE = { amp: 4, period: 16 } as const; // px, frames per radian
export const TRACK = -0.04;
export const LINE_H = 1.08;
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

// Where the camera goes, as fractions of the screenshot frame. Tuned to a standard landing page (hero headline,
// subtitle and buttons in the centre) and a phone home screen (event cards under the day strip). Cursor rest points are
// fractions of the frame too; start points are fractions of the viewport (off-frame).
type Rect = { x: number; y: number; w: number; h: number };
type Pt = [number, number];
export const TARGETS: Record<"wide" | "tall", {
  rect: Rect;
  size: readonly [number, number];
  what: string;
  mayaFrom: Pt;
  leoFrom: Pt;
  leoRest: Pt;
  leoNear: Pt;
  mayaRest: Pt;
}> = {
  wide: {
    rect: { x: 0.3, y: 0.215, w: 0.4, h: 0.4 },
    size: [1440, 900],
    what: "the hero headline, subtitle and buttons",
    mayaFrom: [1.06, 0.14],
    leoFrom: [-0.15, 0.92],
    leoRest: [0.14, 0.66],
    leoNear: [0.235, 0.503],
    mayaRest: [0.644, 0.535],
  },
  tall: {
    rect: { x: 0.035, y: 0.37, w: 0.93, h: 0.22 },
    size: [390, 844],
    what: "the first two event cards under the day strip",
    mayaFrom: [1.08, 0.18],
    leoFrom: [-0.15, 0.92],
    leoRest: [0.16, 0.86],
    leoNear: [0.109, 0.615],
    mayaRest: [0.835, 0.546],
  },
};

// The one camera: frame placement, the selection in canvas space, and the zoom (scale S, then translate) that puts the
// selection at `fill` of the width (capped at `fillH` of the height). Shared with the prompt, so the numbers match.
export const geometry = (W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const tg = tall ? TARGETS.tall : TARGETS.wide;
  const fw = L.frameW * u;
  const fh = fw * L.aspect;
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2 + FRAME_DY * u;
  const sel = { x: fx + tg.rect.x * fw, y: fy + tg.rect.y * fh, w: tg.rect.w * fw, h: tg.rect.h * fh };
  const S = Math.min((L.fill * W) / sel.w, (L.fillH * H) / sel.h);
  const tx = W / 2 - S * (sel.x + sel.w / 2);
  const ty = H / 2 + CAMERA_DY * u - S * (sel.y + sel.h / 2);
  return { L, tg, fw, fh, fx, fy, sel, S, tx, ty };
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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// A slight arc between two points, as a hand moves a mouse.
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// ---------- shots 1–3: one canvas, one camera ----------
// The camera is a single scale + translate applied to canvas coordinates. The screenshot is laid out at its zoomed
// size (so it is sampled sharp, not upscaled from a small raster), and the selection box, frame label and cursors are
// drawn in screen space from the same transform, so hairlines, handles and cursors keep their size through the zoom.
const CanvasScene: React.FC<{ p: CanvasFeatureProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const G = geometry(W, H, u, isVertical);
  const { L, tg, fw, fh, fx, fy } = G;
  const r = tg.rect;

  const l1 = frame - SHOTS[0];
  const l2 = frame - SHOTS[1];
  const l3 = frame - SHOTS[2];

  // camera
  const z = progress(l2, T.zoom[0], T.zoom[1], "travel");
  const s = mix(1, G.S, z);
  const cam = (x: number, y: number): Pt => [x * s + z * G.tx, y * s + z * G.ty];
  const at = (pt: readonly [number, number]): Pt => cam(fx + pt[0] * fw, fy + pt[1] * fh);

  // frame
  const settle = progress(l1, 0, T.settle, "enter");
  const [sx, sy] = cam(fx, fy);
  const src = isVertical ? p.phoneShot || SAMPLE.phone : p.screenshot || SAMPLE.site;
  const soft = `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;

  // selection: dragged out from the feature's top-left corner
  const g = progress(l2, T.drag[0], T.drag[1], "travel");
  const [bx, by] = at([r.x, r.y]);
  const bw = r.w * fw * s * g;
  const bh = r.h * fh * s * g;
  const selT = progress(l2, T.drag[0], T.drag[0] + 6, "enter");
  const sizeTag = `${Math.round(r.w * g * tg.size[0])} × ${Math.round(r.h * g * tg.size[1])}`;

  // cursors
  const press = interpolate(l2, [T.press[0], T.press[1], T.release[0], T.release[1]], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const idle = progress(l3, 0, T.idleIn, "enter") * IDLE.amp * u;
  const tl: Pt = [r.x, r.y];
  const maya: Pt =
    l2 < 0
      ? glide([W * tg.mayaFrom[0], H * tg.mayaFrom[1]], at(tl), progress(l1, T.maya1[0], T.maya1[1], "travel"))
      : glide(at([r.x + r.w * g, r.y + r.h * g]), at(tg.mayaRest), progress(l2, T.mayaRest[0], T.mayaRest[1], "travel"));
  const leo: Pt =
    l2 < 0
      ? glide([W * tg.leoFrom[0], H * tg.leoFrom[1]], at(tg.leoRest), progress(l1, T.leo1[0], T.leo1[1], "travel"))
      : glide(at(tg.leoRest), at(tg.leoNear), progress(l2, T.leo2[0], T.leo2[1], "travel"));
  const lt = Math.max(0, l3);
  const mayaIdle: Pt = [Math.sin(lt / IDLE.period) * idle, Math.sin(lt / (IDLE.period * 1.3)) * idle * 0.7];
  const leoIdle: Pt = [-Math.sin(lt / (IDLE.period * 1.2)) * idle * 0.8, Math.sin(lt / IDLE.period) * idle * 0.6];

  // feature chip, above the selection's top-left
  const ct = progress(l3, T.chip[0], T.chip[1], "spring");
  const chipH = L.chip * 2 * u;

  return (
    <>
      <Screenshot
        src={src}
        x={sx}
        y={sy}
        w={fw * s}
        h={fh * s}
        radius={0}
        line={alpha(FILM.black, 0.08)}
        shadow={soft}
        style={{ opacity: settle, transform: `scale(${mix(SETTLE_FROM, 1, settle).toFixed(4)})` }}
      />
      <div
        style={{
          position: "absolute",
          left: sx,
          top: sy - LABEL.above * u,
          fontFamily: FONT_MONO,
          fontSize: LABEL.size * u,
          lineHeight: 1,
          color: labelOn(p.canvas),
          whiteSpace: "nowrap",
          opacity: settle,
        }}
      >
        {`${p.brand} — Home`}
      </div>
      {l2 >= 0 ? <SelectionBox u={u} x={bx} y={by} w={bw} h={bh} color={FILM.select} label={sizeTag} t={selT} /> : null}
      {ct > 0 ? (
        <div
          style={{
            position: "absolute",
            left: bx,
            top: by - CHIP.gap * u - chipH,
            height: chipH,
            padding: `0 ${CHIP.padX * u}px`,
            borderRadius: RADIUS.chip * u,
            background: FILM.white,
            boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.1)}, ${soft}`,
            color: FILM.black,
            fontFamily: FONT_SANS,
            fontSize: L.chip * u,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: `${chipH}px`,
            whiteSpace: "nowrap",
            opacity: ct,
            transformOrigin: "0% 100%",
            transform: `scale(${mix(CHIP.from, 1, ct).toFixed(4)})`,
          }}
        >
          {p.feature}
        </div>
      ) : null}
      <Cursor u={u} x={leo[0] + leoIdle[0]} y={leo[1] + leoIdle[1]} name="Leo" color={CURSOR_COLORS.green} scale={L.cursor} />
      <Cursor u={u} x={maya[0] + mayaIdle[0]} y={maya[1] + mayaIdle[1]} name="Maya" color={CURSOR_COLORS.pink} press={press} scale={L.cursor} />
    </>
  );
};

// ---------- shot 4: the title card ----------
// Cap top of the first row lands on the margin: the row mask's padding plus Inter's half-leading sit ~0.2em above it.
const TITLE_LIFT = 0.2;

const TitleCard: React.FC<{ p: CanvasFeatureProps; local: number }> = ({ p, local }) => {
  const { u, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = textOn(p.end);
  const { rows, size } = fitRows(p.title, L.titleMaxW * u, L.title * u, L.maxLines);
  const l = progress(local, T.logo[0], T.logo[1], "enter");
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          top: MARGIN * u - TITLE_LIFT * size,
          fontFamily: FONT_SANS,
          fontSize: size,
          fontWeight: 500,
          letterSpacing: `${TRACK}em`,
          color: ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Rise rows={rows} local={local} />
      </div>
      <div style={{ position: "absolute", left: MARGIN * u, bottom: MARGIN * u, opacity: l, transform: `translateY(${((1 - l) * 16 * u).toFixed(3)}px)` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.end} />
      </div>
    </>
  );
};

export const CanvasFeature: React.FC<CanvasFeatureProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  return (
    <AbsoluteFill style={{ background: index === 3 ? p.end : p.canvas, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index < 3 ? <CanvasScene p={p} frame={frame} /> : <TitleCard p={p} local={local} />}
    </AbsoluteFill>
  );
};
