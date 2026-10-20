import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, mix, useLayout } from "../../kit";

export type DotGridWaveProps = {
  background: string;
  dot: string;
  crest: string;
  ink: string;
  title: string; // empty hides it
  spacing: number; // px at 1080 short side
  bands: number; // wave crests across the diagonal
  speed: number; // whole wave cycles per loop
};

const TAU = Math.PI * 2;
export const SHARPNESS = 4;

export const DotGridWave: React.FC<DotGridWaveProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames, u, isVertical } = useLayout();
  const id = "dg" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const hasTitle = p.title.trim() !== "";
  const t = frame / durationInFrames;
  const sp = p.spacing * u;
  const cols = Math.max(2, Math.floor(w / sp));
  const rows = Math.max(2, Math.floor(h / sp));
  const ox = (w - (cols - 1) * sp) / 2;
  const oy = (h - (rows - 1) * sp) / 2;
  const speed = Math.max(1, Math.round(p.speed));
  const rBase = sp * 0.03;
  const rCrest = sp * 0.115;

  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * sp;
      const y = oy + r * sp;
      // (x + y) / (w + h) gives a true 45° wavefront at any ratio.
      const d = (x + y) / (w + h);
      const v = Math.pow(0.5 + 0.5 * Math.cos(TAU * (p.bands * d - speed * t)), SHARPNESS);
      const rad = mix(rBase, rCrest, v);
      const fill = interpolateColors(v, [0, 1], [p.dot, p.crest]);
      if (v > 0.2) dots.push(<circle key={`h${r}-${c}`} cx={x} cy={y} r={rad * 2.4} fill={p.crest} fillOpacity={0.16 * v} />);
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={rad} fill={fill} fillOpacity={mix(0.55, 1, v)} />);
    }
  }

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {dots}
        {hasTitle ? (
          <>
            {/* A soft pool of background colour keeps the title readable as crests pass behind it. */}
            <defs>
              <radialGradient id={`${id}t`}>
                <stop offset="0" stopColor={p.background} stopOpacity={0.85} />
                <stop offset="0.6" stopColor={p.background} stopOpacity={0.5} />
                <stop offset="1" stopColor={p.background} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={w / 2} cy={h / 2} rx={(isVertical ? 0.48 : 0.34) * w} ry={(isVertical ? 0.14 : 0.24) * h} fill={`url(#${id}t)`} />
          </>
        ) : null}
      </svg>
      {hasTitle ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              color: p.ink,
              fontSize: (isVertical ? 120 : 156) * u,
              fontWeight: 650,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              textAlign: "center",
              maxWidth: "84%",
            }}
          >
            {p.title}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
