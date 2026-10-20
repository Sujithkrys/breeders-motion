import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CANVAS, FONT_MONO, FONT_SANS, STAGGER, STROKE, alpha, progress, useLayout } from "../../kit";
import { CURSOR_COLORS, Cursor, FILM, Logo, Screenshot, SelectionBox, useShot } from "../../film";

export type PromptToProductProps = {
  prompt: string;
  title: string;
  brand: string;
  cursorName: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  field: string;
  canvas: string;
  end: string;
  endInk: string;
};

// ---------- timeline ----------
// Shot starts (hard cuts). Everything below is in frames local to its shot.
export const SHOTS = [0, 84, 144, 204] as const;
export const T = {
  boxIn: [0, 18] as const, // shot 1: prompt box rises in
  type: [8, 56] as const, // typing window
  blink: 8, // caret blink half-period after typing
  glide: [40, 64] as const, // cursor travels to the send button
  click: 70, // send pressed
  build: 6, // shot 2: first skeleton block
  buildLen: 18,
  reveal: [2, 22] as const, // shot 3: screenshot wipes in top to bottom
  select: [24, 36] as const, // selection box draws on
  leo: [26, 50] as const, // second cursor drifts in
  words: 4, // shot 4: first word rises
  wordLen: 20,
  logo: [12, 32] as const,
};

// ---------- geometry (px at 1080 on the short side) ----------
export const GEO = {
  wide: {
    box: { w: 980, h: 300, type: 40 },
    frame: { w: 1240, h: 775, r: 20 },
    title: 96,
    logo: 44,
    size: "1440 × 900",
    device: "Desktop",
  },
  tall: {
    box: { w: 920, h: 380, type: 44 },
    frame: { w: 640, h: Math.round((640 * 19.5) / 9), r: 48 },
    title: 104,
    logo: 52,
    size: "390 × 844",
    device: "Mobile",
  },
} as const;

export const BOX_RADIUS = 32;
export const MARGIN = 72;
// Skeleton placeholder grey on the white page, as in Figma Make while it generates.
export const SKELETON = "#EDEDEB";
export const SKELETON_RADIUS = 12;

const INK = CANVAS.paper.ink;
const INK2 = CANVAS.paper.ink2;
const INK3 = CANVAS.paper.ink3;

type Block = { x: number; y: number; w: number; h: number; i: number; r?: number };

// Desktop pricing page, 1240 × 775 frame.
const DESKTOP: Block[] = (() => {
  const fw = 1240;
  const fh = 775;
  const cardW = (fw - 96 - 48) / 3;
  const cardY = 418;
  return [
    { x: 48, y: 40, w: 140, h: 28, i: 0 },
    { x: 500, y: 46, w: 64, h: 16, i: 0 },
    { x: 588, y: 46, w: 64, h: 16, i: 0 },
    { x: 676, y: 46, w: 64, h: 16, i: 0 },
    { x: fw - 48 - 120, y: 34, w: 120, h: 40, i: 0, r: 20 },
    { x: (fw - 600) / 2, y: 128, w: 600, h: 48, i: 1 },
    { x: (fw - 440) / 2, y: 190, w: 440, h: 48, i: 2 },
    { x: (fw - 520) / 2, y: 266, w: 520, h: 20, i: 3 },
    { x: fw / 2 - 8 - 160, y: 314, w: 160, h: 52, i: 4 },
    { x: fw / 2 + 8, y: 314, w: 160, h: 52, i: 4 },
    ...[0, 1, 2].map((k) => ({ x: 48 + k * (cardW + 24), y: cardY, w: cardW, h: fh - 48 - cardY, i: 5 + k })),
  ];
})();

// Mobile pricing screen, 640 × 1387 frame.
const MOBILE: Block[] = (() => {
  const fw = 640;
  const rows: Block[] = [];
  for (let k = 0; k < 6; k++) {
    const y = 440 + k * 146;
    rows.push({ x: 36, y, w: 88, h: 88, i: 5 + k });
    rows.push({ x: 148, y: y + 18, w: 300, h: 22, i: 5 + k });
    rows.push({ x: 148, y: y + 54, w: 200, h: 16, i: 5 + k });
  }
  return [
    { x: 36, y: 64, w: 120, h: 28, i: 0 },
    { x: fw - 36 - 40, y: 58, w: 40, h: 40, i: 0, r: 20 },
    { x: 36, y: 156, w: 480, h: 44, i: 1 },
    { x: 36, y: 212, w: 360, h: 44, i: 2 },
    { x: 36, y: 284, w: 420, h: 20, i: 3 },
    { x: 36, y: 332, w: 568, h: 64, i: 4 },
    ...rows,
  ];
})();

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
// Cursor path: a straight line bowed slightly sideways, the way a hand moves a mouse.
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// Siblings stagger 3f, at most 8 steps; later blocks arrive with the 8th.
const delayOf = (i: number) => Math.min(i, 7) * STAGGER;

export const PromptToProduct: React.FC<PromptToProductProps> = (p) => {
  const { width: W, height: H, u, isVertical } = useLayout();
  const { index, local } = useShot(SHOTS);
  const g = isVertical ? GEO.tall : GEO.wide;

  const fields = [p.field, p.canvas, p.canvas, p.end];
  const soft = `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const hairline = `0 0 0 ${u}px ${alpha(INK, 0.08)}`;

  // ---------- shot 1: the prompt ----------
  const shot1 = () => {
    const bw = g.box.w * u;
    const bh = g.box.h * u;
    const bx = (W - bw) / 2;
    const by = isVertical ? H / 3 - bh / 2 : (H - bh) / 2;
    const e = progress(local, T.boxIn[0], T.boxIn[1], "enter");

    const len = p.prompt.length;
    const n = Math.floor(interpolate(local, [T.type[0], T.type[1]], [0, len], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const caretOn = local >= T.click + 2 ? 0 : local < T.type[1] ? 1 : Math.floor((local - T.type[1]) / T.blink) % 2 === 0 ? 1 : 0;
    const ready = progress(local, T.type[0], T.type[0] + 8, "travel");
    const press = interpolate(local, [T.click - 3, T.click, T.click + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const btnScale = interpolate(local, [T.click - 2, T.click + 1, T.click + 7], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const send = 56 * u;
    const sendInset = 30 * u;
    const sendC: Pt = [bx + bw - sendInset - send / 2, by + bh - sendInset - send / 2];
    const start: Pt = [W * 0.94, H + 60 * u];
    const target: Pt = [sendC[0] + 6 * u, sendC[1] + 8 * u];
    const [cx, cy] = glide(start, target, progress(local, T.glide[0], T.glide[1], "travel"));
    const plus = 44 * u;

    return (
      <>
        <div
          style={{
            position: "absolute",
            left: bx,
            top: by,
            width: bw,
            height: bh,
            borderRadius: BOX_RADIUS * u,
            background: FILM.white,
            boxShadow: `${hairline}, ${soft}`,
            opacity: e,
            transform: `translateY(${(1 - e) * 32 * u}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 40 * u,
              right: 40 * u,
              top: 34 * u,
              fontSize: g.box.type * u,
              fontWeight: 400,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              color: INK,
            }}
          >
            <span>{p.prompt.slice(0, n)}</span>
            <span
              style={{
                display: "inline-block",
                width: 2 * u,
                height: "1.1em",
                marginLeft: 2 * u,
                verticalAlign: "-0.18em",
                background: INK,
                opacity: caretOn,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 40 * u,
              bottom: sendInset + (send - plus) / 2,
              width: plus,
              height: plus,
              borderRadius: 999,
              border: `${STROKE.hair * u}px solid ${alpha(INK, 0.22)}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={20 * u} height={20 * u} viewBox="0 0 20 20" fill="none" stroke={INK2} strokeWidth={STROKE.ring} strokeLinecap="round">
              <path d="M10 3v14M3 10h14" />
            </svg>
          </div>
          <div style={{ position: "absolute", right: sendInset, bottom: sendInset, width: send, height: send, transform: `scale(${btnScale})` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: CANVAS.paper.fill }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: FILM.select, opacity: ready }} />
            <svg
              width={send}
              height={send}
              viewBox="0 0 56 56"
              fill="none"
              strokeWidth={STROKE.ring}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <path d="M28 38V18M20 26l8-8 8 8" stroke={INK3} opacity={1 - ready} />
              <path d="M28 38V18M20 26l8-8 8 8" stroke={FILM.white} opacity={ready} />
            </svg>
          </div>
        </div>
        <Cursor u={u} x={cx} y={cy} name={p.cursorName} color={CURSOR_COLORS.pink} press={press} scale={1.4} />
      </>
    );
  };

  // ---------- shots 2–3: the frame on the canvas ----------
  const fw = g.frame.w * u;
  const fh = g.frame.h * u;
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2 + 10 * u;

  const skeleton = (built: boolean) =>
    (isVertical ? MOBILE : DESKTOP).map((b, k) => {
      const t = built ? 1 : progress(local, T.build + delayOf(b.i), T.build + delayOf(b.i) + T.buildLen, "spring");
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: b.x * u,
            top: b.y * u,
            width: b.w * u,
            height: b.h * u,
            borderRadius: (b.r ?? SKELETON_RADIUS) * u,
            background: SKELETON,
            opacity: t,
            transform: `translateY(${(1 - t) * 24 * u}px)`,
          }}
        />
      );
    });

  const frameShot = (finished: boolean) => {
    const reveal = progress(local, T.reveal[0], T.reveal[1], "travel");
    const sel = progress(local, T.select[0], T.select[1], "enter");
    const leoStart: Pt = [W + 60 * u, fy + fh * 0.3];
    const leoEnd: Pt = [fx + fw * 0.8, fy + fh * 0.6];
    const [lx, ly] = glide(leoStart, leoEnd, progress(local, T.leo[0], T.leo[1], "travel"));
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: fx,
            top: fy - 34 * u,
            fontFamily: FONT_MONO,
            fontSize: 18 * u,
            lineHeight: 1,
            color: INK2,
            whiteSpace: "nowrap",
          }}
        >
          {`${p.brand} — ${g.device}`}
        </div>
        <div
          style={{
            position: "absolute",
            left: fx,
            top: fy,
            width: fw,
            height: fh,
            borderRadius: g.frame.r * u,
            background: FILM.white,
            boxShadow: `${hairline}, ${soft}`,
            overflow: "hidden",
          }}
        >
          {skeleton(finished)}
          {finished ? (
            <Screenshot
              src={isVertical ? p.phoneShot : p.screenshot}
              x={0}
              y={0}
              w={fw}
              h={fh}
              radius={g.frame.r * u}
              style={{ clipPath: `inset(0 0 ${((1 - reveal) * 100).toFixed(3)}% 0)` }}
            />
          ) : null}
        </div>
        {finished ? (
          <>
            <SelectionBox u={u} x={fx} y={fy} w={fw} h={fh} color={FILM.select} label={g.size} t={sel} />
            <Cursor u={u} x={lx} y={ly} name="Leo" color={CURSOR_COLORS.green} scale={1.4} />
          </>
        ) : null}
      </>
    );
  };

  // ---------- shot 4: the title card ----------
  const shot4 = () => {
    const fs = g.title * u;
    const words = p.title.split(/\s+/).filter(Boolean);
    const l = progress(local, T.logo[0], T.logo[1], "enter");
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: MARGIN * u,
            top: MARGIN * u - 0.12 * fs,
            width: W - 2 * MARGIN * u,
            fontSize: fs,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: p.endInk,
          }}
        >
          {words.map((w, i) => {
            const at = T.words + delayOf(i);
            const t = progress(local, at, at + T.wordLen, "enter");
            return (
              <React.Fragment key={i}>
                <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.14em", marginBottom: "-0.14em" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>{w}</span>
                </span>
                {i < words.length - 1 ? " " : null}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: MARGIN * u, bottom: MARGIN * u, opacity: l, transform: `translateY(${(1 - l) * 16 * u}px)` }}>
          <Logo src={p.logo} name={p.brand} size={g.logo * u} color={p.endInk} />
        </div>
      </>
    );
  };

  return (
    <AbsoluteFill style={{ background: fields[index], fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? shot1() : index === 1 ? frameShot(false) : index === 2 ? frameShot(true) : shot4()}
    </AbsoluteFill>
  );
};
