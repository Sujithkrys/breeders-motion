import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, mix, progress, useLayout } from "../../kit";

export type StrokeDrawMarkProps = {
  background: string;
  stroke: string;
  fill: string;
  nameColor: string;
  taglineColor: string;
  name: string;
  tagline: string;
  stagger: number; // frames between the inner strokes
  ease: string;
};

// The glyph lives in a 200×200 box: a pointy-top hexagon (radius 80) split into three faces by three spokes.
const R3 = 69.282; // 80 · cos 30°
const HEX: [number, number][] = [[100, 20], [100 + R3, 60], [100 + R3, 140], [100, 180], [100 - R3, 140], [100 - R3, 60]];
const HEX_LEN = 480;
const SPOKE_LEN = 80;
const SPOKES = [HEX[1], HEX[3], HEX[5]];
const pt = (v: readonly [number, number]) => `${v[0]} ${v[1]}`;
const HEX_D = `M${HEX.map(pt).join(" L")} Z`;
const FACES = [
  { d: `M${pt(HEX[5])} L${pt(HEX[0])} L${pt(HEX[1])} L100 100 Z`, o: 1 },
  { d: `M100 100 L${pt(HEX[1])} L${pt(HEX[2])} L${pt(HEX[3])} Z`, o: 0.55 },
  { d: `M${pt(HEX[5])} L100 100 L${pt(HEX[3])} L${pt(HEX[4])} Z`, o: 0.78 },
];
export const STROKE_W = 6;

export const timeline = (D: number, stagger: number) => {
  const hex = [D * 0.04, D * 0.32] as const;
  const spoke = (i: number) => [D * 0.2 + i * stagger, D * 0.2 + i * stagger + D * 0.12] as const;
  const flood0 = spoke(2)[1] - D * 0.03;
  const flood = [flood0, flood0 + D * 0.18] as const;
  const recolor = [flood0 + D * 0.1, flood[1] + D * 0.04] as const;
  const name = [flood0 + D * 0.08, flood0 + D * 0.21] as const;
  const tag = [name[0] + D * 0.05, Math.min(name[1] + D * 0.05, D * 0.74)] as const;
  return { hex, spoke, flood, recolor, name, tag };
};

// Point a given distance along the hexagon outline, for the pen head that leads the stroke.
const alongHex = (len: number) => {
  const seg = Math.min(5, Math.floor(len / 80));
  const t = (len - seg * 80) / 80;
  const a = HEX[seg];
  const b = HEX[(seg + 1) % 6];
  return [mix(a[0], b[0], t), mix(a[1], b[1], t)] as const;
};

export const StrokeDrawMark: React.FC<StrokeDrawMarkProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, u, isVertical } = useLayout();
  const id = React.useId().replace(/:/g, "");
  const tl = timeline(D, p.stagger);

  const S = (isVertical ? 400 : 330) * u;
  const hex = progress(frame, tl.hex[0], tl.hex[1], p.ease);
  const flood = progress(frame, tl.flood[0], tl.flood[1], p.ease);
  const lineColor = interpolateColors(progress(frame, tl.recolor[0], tl.recolor[1], "soft"), [0, 1], [p.stroke, p.background]);
  const head = alongHex(hex * HEX_LEN);
  const headO = progress(frame, tl.hex[0], tl.hex[0] + 4, "soft") * (1 - progress(frame, tl.hex[1] - 6, tl.hex[1], "soft"));
  const name = progress(frame, tl.name[0], tl.name[1], p.ease);
  const tag = progress(frame, tl.tag[0], tl.tag[1], p.ease);
  const floodY = mix(184, 16, flood);

  const rise = (k: number): React.CSSProperties => ({
    opacity: k,
    transform: `translateY(${(1 - k) * 28 * u}px)`,
    filter: k < 1 ? `blur(${(1 - k) * 8 * u}px)` : undefined,
  });

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <svg width={S} height={S} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <clipPath id={`${id}-flood`}>
              <rect x={0} y={floodY} width={200} height={200} />
            </clipPath>
            <clipPath id={`${id}-hexclip`}>
              <path d={HEX_D} />
            </clipPath>
            <radialGradient id={`${id}-head`}>
              <stop offset="0%" stopColor={p.stroke} stopOpacity={0.9} />
              <stop offset="100%" stopColor={p.stroke} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-glow`}>
              <stop offset="0%" stopColor={p.fill} stopOpacity={0.32} />
              <stop offset="100%" stopColor={p.fill} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={100} cy={100} r={150} fill={`url(#${id}-glow)`} opacity={flood} />
          <g clipPath={`url(#${id}-flood)`}>
            {FACES.map((f, i) => (
              <path key={i} d={f.d} fill={p.fill} fillOpacity={f.o} />
            ))}
          </g>
          {flood > 0 && flood < 1 ? <line x1={0} x2={200} y1={floodY} y2={floodY} stroke={p.stroke} strokeWidth={1.2} opacity={0.5 * Math.sin(Math.PI * flood)} clipPath={`url(#${id}-hexclip)`} /> : null}
          <path
            d={HEX_D}
            fill="none"
            stroke={lineColor}
            strokeWidth={STROKE_W}
            strokeLinejoin="round"
            strokeDasharray={`${HEX_LEN} ${HEX_LEN}`}
            strokeDashoffset={HEX_LEN * (1 - hex)}
          />
          {SPOKES.map((v, i) => {
            const k = progress(frame, tl.spoke(i)[0], tl.spoke(i)[1], p.ease);
            return (
              <path
                key={i}
                d={`M100 100 L${pt(v)}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                strokeDasharray={`${SPOKE_LEN} ${SPOKE_LEN}`}
                strokeDashoffset={SPOKE_LEN * (1 - k)}
              />
            );
          })}
          {headO > 0 ? (
            <g opacity={headO}>
              <circle cx={head[0]} cy={head[1]} r={14} fill={`url(#${id}-head)`} />
              <circle cx={head[0]} cy={head[1]} r={3.6} fill={p.stroke} />
            </g>
          ) : null}
        </svg>
        <div
          style={{
            marginTop: (isVertical ? 64 : 52) * u,
            fontSize: (isVertical ? 112 : 104) * u,
            fontWeight: 650,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            color: p.nameColor,
            ...rise(name),
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            marginTop: 16 * u,
            fontSize: (isVertical ? 40 : 36) * u,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            color: p.taglineColor,
            ...rise(tag),
          }}
        >
          {p.tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
