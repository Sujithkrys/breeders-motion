import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type DockMenuProps = {
  background: string;
  ink: string;
  button: string;
  onButton: string;
  accent: string;
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  item5: string;
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
export const GEO = {
  "16:9": { w: 760, row: 92, font: 34, icon: 36, slot: 104, dockIcon: 40 },
  "1:1": { w: 660, row: 80, font: 30, icon: 32, slot: 92, dockIcon: 36 },
  "9:16": { w: 660, row: 80, font: 30, icon: 32, slot: 92, dockIcon: 36 },
} as const;
export const DOCK_H = 96; // radius 48 (hero) = a pill
export const PAD = 16; // card padding above and below the rows
export const SUB = ["Back", "Profile", "Appearance", "Upgrade", "Invite a friend", "Sign out"] as const;
export const SUB_FROM = 4; // the main row that opens the submenu (has a chevron)
export const ACCENT_ROW = 3; // "Upgrade": the one accent icon

// ---------- timeline (frames of a 180-frame loop) ----------
export const T = {
  toMore: [4, 22], click1: 26, open: [27, 47], iconsOut: [27, 39], rowsIn: 33,
  toRow2: [30, 46], hov2: [44, 56], toRow5: [54, 66], hov5: [62, 74], click2: 70,
  subIn: [71, 89], mainOut: [71, 83], subRowsIn: [74, 92],
  toUpgrade: [92, 106], hovUp: [104, 114], toBack: [112, 124], hovBack: [121, 132], click3: 128,
  subOut: [129, 141], mainIn: [132, 150], subShrink: [129, 147],
  toSide: [136, 148], close: [148, 164], rowsOut: [148, 160], iconsIn: [150, 168], toRest: [150, 166],
} as const;

// ---------- icons (24-unit viewBox, stroked) ----------
const I = {
  home: "M4.5 10.5 12 4.5l7.5 6V19.5h-5v-5.5h-5v5.5h-5z",
  search: "M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM16 16l4 4",
  heart: "M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z",
  notebook: "M5 9.5h14v10H5zM7 6.5h10M9 3.5h6",
  sliders: "M4 8h9M17 8h3M4 16h3M11 16h9M15 5.5v5M9 13.5v5",
  more: "M8 9.5l4-4 4 4M8 14.5l4 4 4-4",
  chevron: "M10 7l5 5-5 5",
  back: "M19 12H5M11 6l-6 6 6 6",
  user: "M15.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM5 20a7 7 0 0 1 14 0",
  appearance: "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 3.5v17M12 8l4.5-3.5M12 13l7.5-4M12 18l6.5-4",
  upgrade: "M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z",
  invite: "M13.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM3.5 20a6.5 6.5 0 0 1 11-4.7M18.5 14v6M15.5 17h6",
  signout: "M10 4.5H5.5v15H10M14.5 8l4 4-4 4M18.5 12H9.5",
};
const MAIN_ICONS = [I.home, I.search, I.heart, I.notebook, I.sliders];
const SUB_ICONS = [I.back, I.user, I.appearance, I.upgrade, I.invite, I.signout];
const DOCK_ICONS = [I.home, I.search, I.heart, I.notebook, I.more];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const isDark = (c: string) => {
  const m = interpolateColors(0, [0, 1], [c, c]).match(/[\d.]+/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

const Icon: React.FC<{ d: string; size: number; color: string; strokePx: number }> = ({ d, size, color, strokePx }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={(strokePx * 24) / size} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

export const DockMenu: React.FC<DockMenuProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const main = [p.item1, p.item2, p.item3, p.item4, p.item5];
  const lit = (a: readonly [number, number], ease: string = p.ease) => progress(frame, a[0], a[1], ease);
  const win = (a: readonly [number, number]) =>
    interpolate(frame, [a[0], a[0] + 4, a[1] - 4, a[1]], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tint = (t: number) => interpolateColors(t, [0, 1], [p.button, p.onButton]);

  // ---- sizes
  const W = g.w * u;
  const rowH = g.row * u;
  const pad = PAD * u;
  const Hmain = main.length * rowH + 2 * pad;
  const Hsub = SUB.length * rowH + 2 * pad;
  const dockW = DOCK_ICONS.length * g.slot * u + 2 * 12 * u;
  const dockH = DOCK_H * u;
  const strokePx = STROKE.ring * u;

  // ---- morph state
  const m = clamp01(lit(T.open) - lit(T.close));
  const subT = clamp01(lit(T.subIn) - lit(T.subShrink));
  const Hcard = mix(Hmain, Hsub, subT);
  const cw = mix(dockW, W, m);
  const ch = mix(dockH, Hcard, m);
  const radius = mix(RADIUS.hero, RADIUS.card, m) * u;

  // ---- anchor: the dock sits low; the menu unfolds upward from it
  const cx = width / 2;
  const bottom = (height + Hsub) / 2 + 10 * u;
  const cardLeft = cx - cw / 2;
  const cardTop = bottom - ch;

  // ---- content visibility
  const iconsO = clamp01(1 - lit(T.iconsOut, "exit") + lit(T.iconsIn, "enter"));
  const rowsOut = lit(T.rowsOut, "exit");
  const mainOut = lit(T.mainOut, "exit");
  const mainIn = lit(T.mainIn, "enter");
  const mainShift = frame < T.mainIn[0] ? -0.22 * W * mainOut : -0.22 * W * (1 - mainIn);
  const mainLayerO = (frame < T.mainIn[0] ? 1 - mainOut : mainIn) * (1 - rowsOut);
  const subInT = lit(T.subRowsIn, "enter");
  const subOutT = lit(T.subOut, "exit");
  const subShift = frame < T.subOut[0] ? 0.22 * W * (1 - subInT) : 0.22 * W * subOutT;
  const subLayerO = frame < T.subOut[0] ? subInT : 1 - subOutT;

  // ---- hover highlights
  const hoverMain = [0, win(T.hov2), 0, 0, Math.max(win(T.hov5), frame >= T.hov5[0] && frame < T.mainOut[1] ? 1 : 0)];
  const hoverSub = [win(T.hovBack), 0, 0, win(T.hovUp), 0, 0];
  const dockHover = interpolate(frame, [18, 24, T.click1, T.click1 + 6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- cursor (positions use the settled card heights)
  const mainTop = bottom - Hmain;
  const subTop = bottom - Hsub;
  const rowX = cx - W / 2 + W * 0.42;
  const rest: Pt = [cx + dockW * 0.3, bottom + 104 * u];
  const pMore: Pt = [cx - dockW / 2 + 12 * u + (DOCK_ICONS.length - 0.5) * g.slot * u + 6 * u, bottom - dockH / 2 + 10 * u];
  const pRow2: Pt = [rowX, mainTop + pad + 1.5 * rowH + 6 * u];
  const pRow5: Pt = [rowX + 30 * u, mainTop + pad + (SUB_FROM + 0.5) * rowH + 6 * u];
  const pUp: Pt = [rowX - 10 * u, subTop + pad + (ACCENT_ROW + 0.5) * rowH + 6 * u];
  const pBack: Pt = [rowX - 40 * u, subTop + pad + 0.5 * rowH + 6 * u];
  const pSide: Pt = [cx + W / 2 + 90 * u, mainTop + Hmain * 0.45];
  const legs: { a: readonly [number, number]; from: Pt; to: Pt }[] = [
    { a: T.toMore, from: rest, to: pMore },
    { a: T.toRow2, from: pMore, to: pRow2 },
    { a: T.toRow5, from: pRow2, to: pRow5 },
    { a: T.toUpgrade, from: pRow5, to: pUp },
    { a: T.toBack, from: pUp, to: pBack },
    { a: T.toSide, from: pBack, to: pSide },
    { a: T.toRest, from: pSide, to: rest },
  ];
  let cur: Pt = rest;
  for (const l of legs) if (frame >= l.a[0]) cur = glide(l.from, l.to, progress(frame, l.a[0], l.a[1], "travel"));
  const press = Math.max(bump(T.click1), bump(T.click2), bump(T.click3));

  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,.06)`;

  const renderRow = (label: string, icon: string, i: number, hover: number, appear: number, chevron: boolean, accentIcon: boolean) => (
    <div
      key={`${label}-${i}`}
      style={{
        position: "absolute",
        left: 0,
        top: pad + i * rowH,
        width: W,
        height: rowH,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14 * u}px)`,
        filter: appear < 0.99 ? `blur(${(1 - appear) * 6 * u}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", left: 12 * u, top: 4 * u, width: W - 24 * u, height: rowH - 8 * u, borderRadius: RADIUS.button * u, background: tint(0.1), opacity: hover }} />
      <div style={{ position: "absolute", left: 36 * u, top: 0, right: 32 * u, height: rowH, display: "flex", alignItems: "center", gap: 20 * u }}>
        <Icon d={icon} size={g.icon * u} color={accentIcon ? p.accent : tint(mix(0.72, 1, hover))} strokePx={strokePx} />
        <span style={{ fontSize: g.font * u, fontWeight: 500, letterSpacing: "-0.01em", color: tint(mix(0.86, 1, hover)), whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ flex: 1 }} />
        {chevron ? <Icon d={I.chevron} size={g.icon * 0.8 * u} color={tint(0.5)} strokePx={strokePx} /> : null}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          left: cardLeft,
          top: cardTop,
          width: cw,
          height: ch,
          borderRadius: radius,
          background: p.button,
          boxShadow: `inset 0 0 0 ${hair}px ${tint(0.08)}${shadow === "none" ? "" : `, ${shadow}`}`,
          overflow: "hidden",
          transform: `scale(${1 - 0.015 * bump(T.click1)})`,
        }}
      >
        {/* dock icons, pinned to the bottom of the shape */}
        <div style={{ position: "absolute", left: (cw - dockW) / 2, bottom: 0, width: dockW, height: dockH, opacity: iconsO, filter: iconsO < 0.99 ? `blur(${(1 - iconsO) * 6 * u}px)` : undefined }}>
          {DOCK_ICONS.map((d, i) => {
            const isMore = i === DOCK_ICONS.length - 1;
            const x = 12 * u + i * g.slot * u;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 0, width: g.slot * u, height: dockH, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isMore ? <div style={{ position: "absolute", width: 64 * u, height: 64 * u, borderRadius: RADIUS.card * u, background: tint(0.14), opacity: dockHover }} /> : null}
                <div style={{ position: "relative", display: "flex" }}>
                  <Icon d={d} size={g.dockIcon * u} color={tint(i === 0 ? 1 : 0.72)} strokePx={strokePx} />
                </div>
              </div>
            );
          })}
        </div>

        {/* main menu */}
        <div style={{ position: "absolute", left: (cw - W) / 2, top: 0, width: W, height: Hmain, opacity: mainLayerO * m, transform: `translateX(${mainShift}px)` }}>
          {main.map((label, i) =>
            renderRow(label, MAIN_ICONS[i], i, hoverMain[i], progress(frame, T.rowsIn + i * 3, T.rowsIn + i * 3 + 18, "enter"), i >= SUB_FROM - 1, false),
          )}
        </div>

        {/* submenu */}
        {subLayerO > 0.001 ? (
          <div style={{ position: "absolute", left: (cw - W) / 2, top: 0, width: W, height: Hsub, opacity: subLayerO, transform: `translateX(${subShift}px)` }}>
            {SUB.map((label, i) =>
              renderRow(label, SUB_ICONS[i], i, hoverSub[i], progress(frame, T.subRowsIn[0] + i * 3, T.subRowsIn[0] + i * 3 + 18, "enter"), false, i === ACCENT_ROW),
            )}
          </div>
        ) : null}
      </div>

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
