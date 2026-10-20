import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type TileGridRevealProps = {
  background: string;
  tileA: string;
  tileB: string;
  monogramColor: string;
  nameColor: string;
  monogram: string;
  name: string;
  stagger: number; // frames per diagonal step
  flip: number; // starting flip angle, degrees
  ease: string;
};

export const GRID = 5;
export const RADIUS = 0.18; // outer corner radius as a share of the mark; must stay under one tile (0.2)

export const timeline = (D: number, stagger: number) => {
  const start = (r: number, c: number) => D * 0.04 + (r + c) * stagger;
  const dur = D * 0.2;
  const lastEnd = start(GRID - 1, GRID - 1) + dur;
  const fuse = [lastEnd - 2, lastEnd + D * 0.07] as const;
  const n0 = lastEnd + D * 0.03;
  const name = [n0, Math.max(n0 + D * 0.1, Math.min(n0 + D * 0.2, D * 0.74))] as const;
  return { start, dur, lastEnd, fuse, name };
};

const fitSize = (text: string, base: number, avail: number) => Math.min(base, avail / (Math.max(text.length, 3) * 0.6));

export const TileGridReveal: React.FC<TileGridRevealProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, u, isVertical, width } = useLayout();
  const tl = timeline(D, p.stagger);

  const S = (isVertical ? 360 : 300) * u;
  const T = S / GRID;
  const R = S * RADIUS;
  const gap = S * 0.2;
  const fs = fitSize(p.name, (isVertical ? 116 : 120) * u, isVertical ? width * 0.86 : width * 0.84 - S - gap);
  const grad = `linear-gradient(135deg, ${p.tileA}, ${p.tileB})`;
  const fuse = progress(frame, tl.fuse[0], tl.fuse[1], "travel");
  const bump = Math.sin(Math.PI * progress(frame, tl.fuse[0], tl.fuse[1] + 4, "enter"));
  const w = progress(frame, tl.name[0], tl.name[1], p.ease);
  const g = 6 * u * (1 - fuse);
  const rIn = 8 * u * (1 - fuse);

  const monogram = (
    <div style={{ width: S, height: S, display: "flex", alignItems: "center", justifyContent: "center", fontSize: S * (p.monogram.length > 1 ? 0.4 : 0.52), fontWeight: 700, letterSpacing: "-0.045em", color: p.monogramColor, lineHeight: 1 }}>
      {p.monogram}
    </div>
  );

  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const s = tl.start(r, c);
      const k = progress(frame, s, s + tl.dur, p.ease);
      const o = progress(frame, s, s + tl.dur * 0.4, "travel");
      const x = c * T + g / 2;
      const y = r * T + g / 2;
      const shade = 0.5 * (1 - k);
      const outer = mix(rIn, R, fuse);
      tiles.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: T - g,
            height: T - g,
            overflow: "hidden",
            borderTopLeftRadius: r === 0 && c === 0 ? outer : rIn,
            borderTopRightRadius: r === 0 && c === GRID - 1 ? outer : rIn,
            borderBottomLeftRadius: r === GRID - 1 && c === 0 ? outer : rIn,
            borderBottomRightRadius: r === GRID - 1 && c === GRID - 1 ? outer : rIn,
            background: `linear-gradient(rgba(0,0,0,${shade}), rgba(0,0,0,${shade})), ${grad}`,
            backgroundSize: `${S}px ${S}px`,
            backgroundPosition: `${-x}px ${-y}px`,
            opacity: o,
            // flip about the anti-diagonal, so each tile turns over towards the direction the wave travels
            transform: `perspective(${900 * u}px) rotate3d(1, -1, 0, ${p.flip * (1 - k)}deg) scale(${mix(0.55, 1, k)})`,
          }}
        >
          <div style={{ position: "absolute", left: -x, top: -y }}>{monogram}</div>
        </div>,
      );
    }
  }

  const mark = (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.03 * bump})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: R, opacity: fuse, boxShadow: `0 ${30 * u}px ${90 * u}px ${alpha(p.tileB, 0.42)}` }} />
      {tiles}
      {/* the solid mark over the fused grid hides hairline seams between tiles */}
      <div style={{ position: "absolute", inset: 0, borderRadius: R, overflow: "hidden", background: grad, opacity: fuse }}>
        {monogram}
        <div style={{ position: "absolute", inset: 0, borderRadius: R, background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 50%)" }} />
      </div>
    </div>
  );

  const nameStyle: React.CSSProperties = {
    fontSize: fs,
    fontWeight: 650,
    letterSpacing: "-0.04em",
    lineHeight: 1.25,
    padding: "0 0.08em",
    whiteSpace: "nowrap",
    color: p.nameColor,
  };

  // A hidden copy of the name balances the real one on the far side of the mark, so the mark forms dead centre;
  // sliding the real side by -50% of its own size then centres the lockup without measuring text.
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", alignItems: "center" }}>
        <div style={{ opacity: 0, ...(isVertical ? { paddingBottom: gap } : { paddingRight: gap }) }}>
          <div style={nameStyle}>{p.name}</div>
        </div>
        <div style={{ width: S, height: S, flexShrink: 0 }} />
        <div style={{ position: "relative", ...(isVertical ? { paddingTop: gap } : { paddingLeft: gap }), transform: isVertical ? `translateY(${-50 * w}%)` : `translateX(${-50 * w}%)` }}>
          <div style={{ position: "absolute", width: S, height: S, zIndex: 1, ...(isVertical ? { top: -S, left: "50%", marginLeft: -S / 2 } : { left: -S, top: "50%", marginTop: -S / 2 }) }}>{mark}</div>
          {/* the name slides out from under the mark's edge */}
          <div style={{ overflow: "hidden" }}>
            <div style={{ ...nameStyle, opacity: progress(frame, tl.name[0], tl.name[0] + 6, "travel"), transform: isVertical ? `translateY(${-100 * (1 - w)}%)` : `translateX(${-100 * (1 - w)}%)` }}>{p.name}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
