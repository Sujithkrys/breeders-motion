import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type ShardAssembleProps = {
  background: string;
  markA: string;
  markB: string;
  monogramColor: string;
  nameColor: string;
  monogram: string;
  name: string;
  spread: number; // px at 1080 short side
  stagger: number; // frames between shards
  ease: string;
};

// Six shards that tile the square, as clip-path polygons in %. They meet at an off-centre point so the cut reads as
// crystalline rather than a pie chart.
const SHARDS: [number, number][][] = [
  [[0, 0], [42, 0], [56, 46], [0, 62]],
  [[42, 0], [100, 0], [56, 46]],
  [[100, 0], [100, 40], [56, 46]],
  [[100, 40], [100, 100], [66, 100], [56, 46]],
  [[66, 100], [0, 100], [56, 46]],
  [[0, 100], [0, 62], [56, 46]],
];
// Arrival order, so neighbours don't land one after another.
const ORDER = [2, 0, 4, 1, 5, 3];
export const SHARD_COUNT = SHARDS.length;
export const RADIUS = 0.26; // corner radius as a share of the mark size

// Rough Geist semibold advance per character at -0.04em tracking; used only to fit long names to the frame.
const fitSize = (text: string, base: number, avail: number) => Math.min(base, avail / (Math.max(text.length, 3) * 0.6));

export const ShardAssemble: React.FC<ShardAssembleProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, u, isVertical, width } = useLayout();

  const S = (isVertical ? 320 : 280) * u;
  const gap = S * (isVertical ? 0.2 : 0.22);
  const fs = fitSize(p.name, (isVertical ? 116 : 124) * u, isVertical ? width * 0.86 : width * 0.84 - S - gap);
  const grad = `linear-gradient(140deg, ${p.markA}, ${p.markB})`;

  const start0 = D * 0.04;
  const dur = D * 0.24;
  const lockAt = start0 + (SHARDS.length - 1) * p.stagger + dur;
  const lock = progress(frame, lockAt - 3, lockAt + 4, "soft");
  const bump = Math.sin(Math.PI * progress(frame, lockAt - 2, lockAt + 10, "smooth"));
  const mono = progress(frame, lockAt - 2, lockAt + D * 0.12, p.ease);
  const nameStart = lockAt + D * 0.06;
  const nameEnd = Math.max(nameStart + D * 0.12, Math.min(nameStart + D * 0.2, D * 0.74));
  const w = progress(frame, nameStart, nameEnd, p.ease);

  const nameEl = (reveal: number) => (
    <div
      style={{
        fontSize: fs,
        fontWeight: 650,
        letterSpacing: "-0.04em",
        lineHeight: 1.25,
        padding: "0 0.08em",
        whiteSpace: "nowrap",
        color: p.nameColor,
        clipPath: isVertical ? `inset(0 0 ${(1 - reveal) * 100}% 0)` : `inset(0 ${(1 - reveal) * 100}% 0 0)`,
        transform: isVertical ? `translateY(${(1 - reveal) * -24 * u}px)` : `translateX(${(1 - reveal) * -36 * u}px)`,
      }}
    >
      {p.name}
    </div>
  );

  const shards = SHARDS.map((pts, i) => {
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
    const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    // fly in from the direction the shard faces, with a seeded wobble so each one takes its own angle
    const ang = Math.atan2(cy - 50, cx - 50) + (random(`shard-a-${i}`) - 0.5) * 0.9;
    const dist = p.spread * u * (0.8 + random(`shard-d-${i}`) * 0.45);
    const rot = (random(`shard-r-${i}`) - 0.5) * 110;
    const s = start0 + ORDER[i] * p.stagger;
    const k = progress(frame, s, s + dur, p.ease);
    const o = progress(frame, s, s + dur * 0.35, "soft");
    const glint = (i % 2 === 0 ? 0.22 : 0.08) * (1 - k);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: S * RADIUS,
          background: `linear-gradient(rgba(255,255,255,${glint}), rgba(255,255,255,${glint})), ${grad}`,
          clipPath: `polygon(${pts.map((q) => `${q[0]}% ${q[1]}%`).join(", ")})`,
          transformOrigin: `${cx}% ${cy}%`,
          transform: `translate(${Math.cos(ang) * dist * (1 - k)}px, ${Math.sin(ang) * dist * (1 - k)}px) rotate(${rot * (1 - k)}deg) scale(${mix(0.72, 1, k)})`,
          filter: k < 1 ? `blur(${18 * u * (1 - k)}px)` : undefined,
          opacity: o,
        }}
      />
    );
  });

  const mark = (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.035 * bump})` }}>
      {/* solid mark under the shards hides anti-aliased seams once they lock, and carries the glow */}
      <div style={{ position: "absolute", inset: 0, borderRadius: S * RADIUS, background: grad, opacity: lock, boxShadow: `0 ${34 * u}px ${90 * u}px ${alpha(p.markB, 0.45)}` }} />
      {shards}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: S * RADIUS,
          opacity: lock,
          background: "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0) 55%)",
          boxShadow: `inset 0 0 0 ${2 * u}px rgba(255,255,255,${0.12 + 0.3 * bump})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: S * (p.monogram.length > 1 ? 0.4 : 0.52),
          fontWeight: 700,
          letterSpacing: "-0.045em",
          color: p.monogramColor,
          opacity: mono,
          transform: `translateY(${(1 - mono) * S * 0.08}px) scale(${mix(0.86, 1, mono)})`,
          filter: mono < 1 ? `blur(${8 * u * (1 - mono)}px)` : undefined,
        }}
      >
        {p.monogram}
      </div>
    </div>
  );

  // The ghost copy of the name mirrors the real one on the other side of the mark, so the mark starts dead centre;
  // sliding the real half by -50% of its own width then centres the finished lockup without measuring any text.
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", alignItems: "center" }}>
        <div style={{ opacity: 0, ...(isVertical ? { paddingBottom: gap } : { paddingRight: gap }) }}>{nameEl(1)}</div>
        <div style={{ width: S, height: S, flexShrink: 0 }} />
        <div
          style={{
            position: "relative",
            ...(isVertical ? { paddingTop: gap } : { paddingLeft: gap }),
            transform: isVertical ? `translateY(${-50 * w}%)` : `translateX(${-50 * w}%)`,
          }}
        >
          <div style={{ position: "absolute", width: S, height: S, ...(isVertical ? { top: -S, left: "50%", marginLeft: -S / 2 } : { left: -S, top: "50%", marginTop: -S / 2 }) }}>
            {mark}
          </div>
          {nameEl(w)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
