import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type PanelWipeProps = {
  background: string; // Scene A
  inkA: string;
  panel1: string;
  panel2: string;
  panel3: string;
  sceneB: string;
  inkB: string;
  titleA: string;
  titleB: string;
  direction: string; // right | left | down | up: the way the wipe travels
  stagger: number; // frames between wipes
  skew: number; // degrees of slant on each leading edge
  ease: string;
};

export const WIPE_START = 10;
export const WIPE_DUR = 26;

type Dir = "right" | "left" | "down" | "up";
const VEC: Record<Dir, [number, number]> = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
export const asDir = (d: string): Dir => (d in VEC ? (d as Dir) : "right");

// The area a wipe has already covered when its leading edge sits at `e` on the travel axis. `s` is half the slant,
// so the edge crosses the frame as a tilted line. Points outside the frame are fine: clip-path only shows what's inside.
const covered = (dir: Dir, e: number, s: number, w: number, h: number) => {
  if (dir === "right") return `polygon(${-w}px 0px, ${e + s}px 0px, ${e - s}px ${h}px, ${-w}px ${h}px)`;
  if (dir === "left") return `polygon(${2 * w}px 0px, ${e - s}px 0px, ${e + s}px ${h}px, ${2 * w}px ${h}px)`;
  if (dir === "down") return `polygon(0px ${-h}px, ${w}px ${-h}px, ${w}px ${e - s}px, 0px ${e + s}px)`;
  return `polygon(0px ${2 * h}px, ${w}px ${2 * h}px, ${w}px ${e + s}px, 0px ${e - s}px)`;
};

const Title: React.FC<{ text: string; color: string; size: number; x: number; y: number }> = ({ text, color, size, x, y }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        color,
        fontSize: size,
        fontWeight: 650,
        letterSpacing: "-0.04em",
        lineHeight: 1.02,
        textAlign: "center",
        maxWidth: "84%",
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);

export const PanelWipe: React.FC<PanelWipeProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, u, isVertical } = useLayout();
  const dir = asDir(p.direction);
  const [dx, dy] = VEC[dir];
  const horizontal = dx !== 0;
  const travel = horizontal ? w : h;
  const s = ((horizontal ? h : w) / 2) * Math.tan((p.skew * Math.PI) / 180);
  const forward = dir === "right" || dir === "down";

  // Wipes 0–2 are the panels, wipe 3 is Scene B. Each later wipe is drawn above the earlier ones.
  const wipes = [0, 1, 2, 3].map((k) => {
    const from = WIPE_START + k * p.stagger;
    const t = progress(frame, from, from + WIPE_DUR, p.ease);
    const e = forward ? -s + t * (travel + 2 * s) : travel + s - t * (travel + 2 * s);
    return { t, clip: covered(dir, e, s, w, h) };
  });

  const size = (isVertical ? 128 : 168) * u;
  const push = 70 * u;
  const tA = wipes[0].t;
  const tB = wipes[3].t;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <Title text={p.titleA} color={p.inkA} size={size} x={dx * push * tA} y={dy * push * tA} />
      {[p.panel1, p.panel2, p.panel3].map((c, k) => (
        <AbsoluteFill key={k} style={{ background: c, clipPath: wipes[k].clip }} />
      ))}
      <AbsoluteFill style={{ background: p.sceneB, clipPath: wipes[3].clip }}>
        <Title text={p.titleB} color={p.inkB} size={size} x={-dx * push * (1 - tB)} y={-dy * push * (1 - tB)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
