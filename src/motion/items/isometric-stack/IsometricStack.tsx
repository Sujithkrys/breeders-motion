import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { alpha, progress, useLayout } from "../../kit";

export type IsometricStackProps = {
  background: string;
  colorA: string; // bottom layer
  colorB: string; // middle layers
  colorC: string; // top block
  layers: number;
  stagger: number; // frames between drops
  drop: number; // drop height in block sizes
  ease: string;
};

const ISO_X = 54.7356; // arctan(1/√2): true isometric, so equal-sum blocks never overlap and depth sorting stays exact
const FALL = 16;

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace("#", "").slice(0, 6), 16);
  const pb = parseInt(b.replace("#", "").slice(0, 6), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const isLight = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

type Block = { x: number; y: number; z: number; color: string };

// A stepped staircase: layer k covers an (L−k)² square tucked into the back corner.
const buildBlocks = (L: number, a: string, b: string, c: string): Block[] => {
  const out: Block[] = [];
  for (let z = 0; z < L; z++) {
    const n = L - z;
    const t = L > 1 ? z / (L - 1) : 0;
    const color = t < 0.5 ? mixHex(a, b, t * 2) : mixHex(b, c, t * 2 - 1);
    const layer: Block[] = [];
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) layer.push({ x, y, z, color });
    layer.sort((p, q) => p.x + p.y - (q.x + q.y) || p.x - q.x);
    out.push(...layer);
  }
  return out;
};

export const IsometricStack: React.FC<IsometricStackProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, u, isVertical } = useLayout();
  const L = Math.max(2, Math.min(4, Math.round(p.layers)));
  const s = ((isVertical ? 600 : 640) * u) / (L * 1.414);
  const light = isLight(p.background);

  const blocks = buildBlocks(L, p.colorA, p.colorB, p.colorC);
  const stagger = Math.min(p.stagger, (durationInFrames * 0.62 - FALL) / Math.max(1, blocks.length - 1));
  const landed = new Map<string, number>();
  const state = blocks.map((bl, i) => {
    const start = i * stagger;
    const pr = progress(frame, start, start + FALL, p.ease);
    landed.set(`${bl.x},${bl.y},${bl.z}`, pr);
    return { ...bl, pr, visible: frame >= start };
  });
  const isLanded = (x: number, y: number, z: number) => (landed.get(`${x},${y},${z}`) ?? 0) >= 1;

  // Painter's order for an isometric voxel grid: back to front by x + y + z, lower blocks first on ties.
  const ordered = [...state].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);

  const half = L / 2;
  const scene = `rotateX(${ISO_X}deg) rotateZ(45deg)`;
  const face = (cx: number, cy: number, cz: number, orient: string): React.CSSProperties => ({
    position: "absolute",
    left: -s / 2,
    top: -s / 2,
    width: s,
    height: s,
    transform: `${scene} translate3d(${cx * s}px, ${cy * s}px, ${cz * s}px) ${orient}`,
  });

  const firstIn = progress(frame, 0, FALL * 2, "smooth");

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 0, height: 0, transform: `translateY(${s * 0.35}px)` }}>
        <div
          style={{
            ...face(0.12, 0.12, -half, ""),
            width: s * L,
            height: s * L,
            left: (-s * L) / 2,
            top: (-s * L) / 2,
            borderRadius: s * 0.2,
            background: alpha(light ? mixHex(p.colorA, "#000000", 0.6) : "#000000", light ? 0.22 : 0.55),
            filter: `blur(${s * 0.18}px)`,
            opacity: firstIn,
          }}
        />
        {ordered.map((b) => {
          if (!b.visible) return null;
          const fall = Math.max(0, 1 - b.pr) * p.drop;
          const ox = b.x - half + 0.5;
          const oy = b.y - half + 0.5;
          const oz = b.z - half + fall;
          const op = Math.min(1, b.pr * 4);
          const top = mixHex(b.color, "#FFFFFF", 0.22);
          const left = b.color;
          const right = mixHex(b.color, "#000000", 0.28);
          const k = `${b.x}-${b.y}-${b.z}`;
          const edge = `${Math.max(1, u)}px solid ${alpha("#FFFFFF", light ? 0.35 : 0.14)}`;
          return (
            <React.Fragment key={k}>
              {!isLanded(b.x + 1, b.y, b.z) && (
                <div style={{ ...face(ox + 0.5, oy, oz + 0.5, "rotateY(90deg)"), opacity: op, background: `linear-gradient(180deg, ${right}, ${mixHex(right, "#000000", 0.12)})` }} />
              )}
              {!isLanded(b.x, b.y + 1, b.z) && (
                <div style={{ ...face(ox, oy + 0.5, oz + 0.5, "rotateX(90deg)"), opacity: op, background: `linear-gradient(0deg, ${left}, ${mixHex(left, "#000000", 0.1)})` }} />
              )}
              {!isLanded(b.x, b.y, b.z + 1) && (
                <div
                  style={{
                    ...face(ox, oy, oz + 1, ""),
                    opacity: op,
                    boxSizing: "border-box",
                    border: edge,
                    background: `linear-gradient(135deg, ${mixHex(top, "#FFFFFF", 0.12)}, ${top})`,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
