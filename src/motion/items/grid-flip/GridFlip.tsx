import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type GridFlipProps = {
  background: string; // stage seen in the gaps while tiles turn
  sceneA: string;
  inkA: string;
  sceneB: string;
  inkB: string;
  titleA: string;
  titleB: string;
  tiles: number; // tiles along the short side
  stagger: number; // frames per diagonal step
  ease: string;
};

export const FLIP_START = 8;
export const FLIP_DUR = 22;
export const PERSPECTIVE = 1200;

// Tiles along the short side are fixed; the long side gets as many as keep them close to square.
export const gridSize = (tiles: number, w: number, h: number) => {
  const n = Math.max(2, Math.round(tiles));
  return w >= h ? { cols: Math.max(n, Math.round((n * w) / h)), rows: n } : { cols: n, rows: Math.max(n, Math.round((n * h) / w)) };
};

export const GridFlip: React.FC<GridFlipProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, u, isVertical } = useLayout();
  const { cols, rows } = gridSize(p.tiles, w, h);
  const tw = w / cols;
  const th = h / rows;
  const size = (isVertical ? 128 : 168) * u;
  const title: React.CSSProperties = {
    position: "absolute",
    width: w,
    height: h,
    padding: `0 ${w * 0.08}px`,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: size,
    fontWeight: 650,
    letterSpacing: "-0.04em",
    lineHeight: 1.02,
  };

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const from = FLIP_START + (r + c) * p.stagger;
      const angle = 180 * progress(frame, from, from + FLIP_DUR, p.ease);
      // No backface-visibility (not export-safe): each tile draws whichever face is towards the camera.
      const showB = angle > 90;
      const turn = showB ? angle - 180 : angle;
      const edgeOn = Math.abs(Math.sin((angle * Math.PI) / 180));
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: c * tw,
            top: r * th,
            // A hair of overlap hides seams between flat tiles.
            width: tw + 1,
            height: th + 1,
            overflow: "hidden",
            background: showB ? p.sceneB : p.sceneA,
            transform: `perspective(${PERSPECTIVE * u}px) rotateY(${turn}deg) scale(${1 - 0.08 * edgeOn})`,
          }}
        >
          <div style={{ ...title, left: -c * tw, top: -r * th, color: showB ? p.inkB : p.inkA }}>
            {showB ? p.titleB : p.titleA}
          </div>
          {edgeOn > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "#000000", opacity: 0.45 * edgeOn }} /> : null}
        </div>,
      );
    }
  }

  return <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>{cells}</AbsoluteFill>;
};
