import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CURSOR_COLORS, Cursor, FILM, Logo, SAMPLE, Screenshot, SelectionBox, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, alpha, mix, progress, useLayout } from "../../kit";
import { areaOn, parseArea, type Area } from "../../placement";

export type CanvasFeatureProps = {
  title: string;
  feature: string;
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  featureArea: string; // 16:9: where the selection sits and the camera zooms, "x,y,w,h" of the screenshot slot
  featureAreaTall: string; // 9:16: the same on the phone screen
  showCursor: boolean; // Maya and Leo
  showSelection: boolean; // the selection box, handles and size tag (the camera still zooms)
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

// Where the camera goes: the feature area, a placement ("x,y,w,h") on the visible screenshot slot, one per ratio
// (users move it in the Edit tab). Defaults are tuned to a standard landing page (hero headline, subtitle and buttons
// in the centre) and a phone home screen (event cards under the day strip). Cursor start points are fractions of the
// viewport (off-frame); Leo's shot-1 rest is a fraction of the screenshot frame.
type Pt = [number, number];
export const FEATURE_AREA: Area = { x: 0.3, y: 0.215, w: 0.4, h: 0.4 };
export const FEATURE_AREA_TALL: Area = { x: 0.035, y: 0.37, w: 0.93, h: 0.22 };
export const MAX_ZOOM = 4; // tiny areas stop here, so the screenshot never turns to mush
export const EDGE = 32; // cursors, size tag and chip stay this far inside the video frame
export const TAG = { gap: 12, h: 30, padX: 10, size: 16 } as const; // the size tag, drawn as SelectionBox draws it

export const TARGETS: Record<"wide" | "tall", {
  area: Area;
  size: readonly [number, number]; // the page in px, for the size tag
  what: string;
  mayaFrom: Pt;
  leoFrom: Pt;
  leoRest: Pt;
}> = {
  wide: {
    area: FEATURE_AREA,
    size: [1440, 900],
    what: "the hero headline, subtitle and buttons",
    mayaFrom: [1.06, 0.14],
    leoFrom: [-0.15, 0.92],
    leoRest: [0.14, 0.66],
  },
  tall: {
    area: FEATURE_AREA_TALL,
    size: [390, 844],
    what: "the first two event cards under the day strip",
    mayaFrom: [1.08, 0.18],
    leoFrom: [-0.15, 0.92],
    leoRest: [0.16, 0.86],
  },
};

export const featureAreaOf = (p: Pick<CanvasFeatureProps, "featureArea" | "featureAreaTall">, tall: boolean) =>
  tall ? parseArea(p.featureAreaTall, FEATURE_AREA_TALL) : parseArea(p.featureArea, FEATURE_AREA);

export const sizeTag = (size: readonly [number, number], a: Area, g: number) => `${Math.round(a.w * g * size[0])} × ${Math.round(a.h * g * size[1])}`;

const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

// The one camera: frame placement, the area in canvas space, and the zoom (scale S, then translate). S fits the area
// into `fill` of the width and `fillH` of the height, kept between 1× and MAX_ZOOM. The translate centres the area
// (CAMERA_DY below the middle), then is clamped per axis so the view never leaves the screenshot frame: a zoomed frame
// bigger than the viewport always covers it, a smaller one stays fully in view. Shared with the prompt.
export const geometry = (W: number, H: number, u: number, tall: boolean, area: Area) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const tg = tall ? TARGETS.tall : TARGETS.wide;
  const fw = L.frameW * u;
  const fh = fw * L.aspect;
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2 + FRAME_DY * u;
  const sel = areaOn(area, fx, fy, fw, fh);
  const S = Math.min(MAX_ZOOM, Math.max(1, Math.min((L.fill * W) / sel.w, (L.fillH * H) / sel.h)));
  const keep = (t: number, start: number, len: number, view: number) => {
    const a = -S * start; // the frame's near edge on the viewport's near edge
    const b = view - S * (start + len); // the frame's far edge on the viewport's far edge
    return clampTo(t, Math.min(a, b), Math.max(a, b));
  };
  const tx0 = W / 2 - S * (sel.x + sel.w / 2);
  const ty0 = H / 2 + CAMERA_DY * u - S * (sel.y + sel.h / 2);
  const tx = keep(tx0, fx, fw, W);
  const ty = keep(ty0, fy, fh, H);
  // the area on screen once the zoom lands
  const A = { x: S * sel.x + tx, y: S * sel.y + ty, w: S * sel.w, h: S * sel.h };
  return { tall, L, tg, fw, fh, fx, fy, sel, S, tx, ty, A, shifted: Math.abs(tx - tx0) > 0.5 || Math.abs(ty - ty0) > 0.5 };
};
export type Geometry = ReturnType<typeof geometry>;

// ---------- what sits around the area after the zoom ----------
type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inView = (b: Box, W: number, H: number, e: number) => b.x >= e && b.y >= e && b.x + b.w <= W - e && b.y + b.h <= H - e;
// A Cursor's footprint from its tip: arrow plus name pill (Inter 500 16px, ~0.56em a character), times its scale.
const cursorBox = (tip: Pt, name: string, cs: number): Box => ({ x: tip[0] - 2 * cs, y: tip[1] - 2 * cs, w: (46 + name.length * 9) * cs, h: 58 * cs });

// Size tag: 12px under the box, centred. It slides to stay EDGE inside the frame (pinned over the box's bottom when
// the box reaches the frame's bottom), so it never jumps mid-zoom.
export const tagPlace = (box: Box, label: string, W: number, H: number, u: number) => {
  const e = EDGE * u;
  const w = (2 * TAG.padX + label.length * TAG.size * 0.6) * u;
  const h = TAG.h * u;
  const cx = clampTo(box.x + box.w / 2, e + w / 2, W - e - w / 2);
  const below = box.y + box.h + TAG.gap * u;
  return { cx, y: Math.min(below, H - e - h), w, h, pinned: below > H - e - h };
};

// Chip and cursor rests, placed once for the held zoom; each flips sides when its usual side would leave the frame.
export const stage = (G: Geometry, W: number, H: number, u: number, area: Area, feature: string, showSelection: boolean) => {
  const { L, tg, S, tx, ty, fx, fy, fw, fh, A } = G;
  const e = EDGE * u;
  const cs = L.cursor * u;
  const toFrame = (pt: Pt): Pt => [((pt[0] - tx) / S - fx) / fw, ((pt[1] - ty) / S - fy) / fh];
  const keepIn = (tip: Pt, name: string): Pt => {
    const b = cursorBox(tip, name, cs);
    return [clampTo(tip[0], e + 2 * cs, W - e - b.w + 2 * cs), clampTo(tip[1], e + 2 * cs, H - e - b.h + 2 * cs)];
  };

  const t = tagPlace(A, sizeTag(tg.size, area, 1), W, H, u);
  const tag: Box = { x: t.cx - t.w / 2, y: t.y, w: t.w, h: t.h };

  // Chip: above the area, left-aligned; else below it (under the size tag), else inside its top edge. Right-aligned
  // with the area when it would run off the right side.
  const gap = CHIP.gap * u;
  const chipH = L.chip * 2 * u;
  const chipW = (2 * CHIP.padX + feature.length * L.chip * 0.56) * u;
  let v: "above" | "below" | "inside" = "above";
  let top = A.y - gap - chipH;
  if (top < e) {
    v = "below";
    top = (showSelection ? Math.max(A.y + A.h, tag.y + tag.h) : A.y + A.h) + gap;
    if (top + chipH > H - e) {
      v = "inside";
      top = A.y + gap;
    }
  }
  const right = A.x + chipW > W - e;
  const left = right ? clampTo(A.x + A.w, e + chipW, W - e) - chipW : clampTo(A.x, e, W - e - chipW);
  const chip = { x: left, y: top, w: chipW, h: chipH, v, side: right ? ("right" as const) : ("left" as const) };

  // Maya rests just inside the area's bottom-right.
  const mayaTip = keepIn([A.x + 0.86 * A.w, A.y + 0.8 * A.h], "Maya");
  // Leo settles beside the area: the ratio's usual side first, then the others. The first spot that fits in the frame
  // and clears the area, chip, size tag and Maya wins; if none does, the usual spot is pulled inside the frame.
  const leoW = cursorBox([0, 0], "Leo", cs).w;
  const leoH = 58 * cs;
  const gx = 0.065 * fw * S;
  const gy = 0.025 * fh * S;
  const near = 24 * u;
  const midY = A.y + 0.72 * A.h;
  const leftOf: Pt = [A.x - gx, midY];
  const rightOf: Pt = [A.x + A.w + Math.max(gx - leoW, near), midY];
  const below: Pt = [A.x + 0.08 * A.w, A.y + A.h + gy];
  const above: Pt = [A.x + 0.92 * A.w - leoW, A.y - gy - leoH];
  const tries: Pt[] = G.tall ? [below, above, [A.x - near - leoW, midY], [A.x + A.w + near, midY]] : [leftOf, rightOf, below, above];
  const avoid: Box[] = [A, chip, cursorBox(mayaTip, "Maya", cs), ...(showSelection ? [tag] : [])];
  const fits = (tip: Pt) => {
    const b = cursorBox(tip, "Leo", cs);
    return inView(b, W, H, e) && !avoid.some((o) => overlaps(b, o));
  };
  const found = tries.find(fits);
  const leoTip = found ?? keepIn(tries[0], "Leo");
  const leoSide = found ? tries.indexOf(found) : -1; // 0 = the usual side

  return { chip, tag: t, mayaTip, leoTip, leoSide, mayaRest: toFrame(mayaTip), leoNear: toFrame(leoTip) };
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
  const r = featureAreaOf(p, isVertical);
  const showCursor = p.showCursor !== false;
  const showSelection = p.showSelection !== false;
  const G = geometry(W, H, u, isVertical, r);
  const { L, tg, fw, fh, fx, fy } = G;
  const st = stage(G, W, H, u, r, p.feature, showSelection);

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

  // selection: dragged out from the area's top-left corner
  const g = progress(l2, T.drag[0], T.drag[1], "travel");
  const [bx, by] = at([r.x, r.y]);
  const bw = r.w * fw * s * g;
  const bh = r.h * fh * s * g;
  const selT = progress(l2, T.drag[0], T.drag[0] + 6, "enter");
  const tagText = sizeTag(tg.size, r, g);
  const tag = tagPlace({ x: bx, y: by, w: bw, h: bh }, tagText, W, H, u);

  // cursors
  const press = interpolate(l2, [T.press[0], T.press[1], T.release[0], T.release[1]], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const idle = progress(l3, 0, T.idleIn, "enter") * IDLE.amp * u;
  const tl: Pt = [r.x, r.y];
  const maya: Pt =
    l2 < 0
      ? glide([W * tg.mayaFrom[0], H * tg.mayaFrom[1]], at(tl), progress(l1, T.maya1[0], T.maya1[1], "travel"))
      : glide(at([r.x + r.w * g, r.y + r.h * g]), at(st.mayaRest), progress(l2, T.mayaRest[0], T.mayaRest[1], "travel"));
  const leo: Pt =
    l2 < 0
      ? glide([W * tg.leoFrom[0], H * tg.leoFrom[1]], at(tg.leoRest), progress(l1, T.leo1[0], T.leo1[1], "travel"))
      : glide(at(tg.leoRest), at(st.leoNear), progress(l2, T.leo2[0], T.leo2[1], "travel"));
  const lt = Math.max(0, l3);
  const mayaIdle: Pt = [Math.sin(lt / IDLE.period) * idle, Math.sin(lt / (IDLE.period * 1.3)) * idle * 0.7];
  const leoIdle: Pt = [-Math.sin(lt / (IDLE.period * 1.2)) * idle * 0.8, Math.sin(lt / IDLE.period) * idle * 0.6];

  // feature chip, anchored to the area (placed for the held zoom; it only appears once the camera has landed)
  const ct = progress(l3, T.chip[0], T.chip[1], "spring");
  const chip = st.chip;
  const chipH = chip.h;

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
      {showSelection && l2 >= 0 ? <SelectionBox u={u} x={bx} y={by} w={bw} h={bh} color={FILM.select} t={selT} /> : null}
      {showSelection && l2 >= 0 && selT > 0 ? (
        <div
          style={{
            position: "absolute",
            left: tag.cx,
            top: tag.y,
            transform: "translateX(-50%)",
            height: tag.h,
            padding: `0 ${TAG.padX * u}px`,
            borderRadius: 6 * u,
            background: FILM.select,
            color: FILM.white,
            fontFamily: FONT_SANS,
            fontSize: TAG.size * u,
            fontWeight: 500,
            lineHeight: `${tag.h}px`,
            whiteSpace: "nowrap",
            opacity: Math.min(1, selT * 1.5),
          }}
        >
          {tagText}
        </div>
      ) : null}
      {ct > 0 ? (
        <div
          style={{
            position: "absolute",
            ...(chip.side === "right" ? { right: W - (chip.x + chip.w) } : { left: chip.x }),
            top: chip.y,
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
            transformOrigin: `${chip.side === "right" ? "100%" : "0%"} ${chip.v === "above" ? "100%" : "0%"}`,
            transform: `scale(${mix(CHIP.from, 1, ct).toFixed(4)})`,
          }}
        >
          {p.feature}
        </div>
      ) : null}
      {showCursor ? (
        <>
          <Cursor u={u} x={leo[0] + leoIdle[0]} y={leo[1] + leoIdle[1]} name="Leo" color={CURSOR_COLORS.green} scale={L.cursor} />
          <Cursor u={u} x={maya[0] + mayaIdle[0]} y={maya[1] + mayaIdle[1]} name="Maya" color={CURSOR_COLORS.pink} press={press} scale={L.cursor} />
        </>
      ) : null}
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
