import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type OrbitLockupProps = {
  background: string;
  accent: string;
  accentB: string;
  monogramColor: string;
  nameColor: string;
  monogram: string;
  name: string;
  count: number;
  turns: number;
  ease: string;
};

export const timeline = (D: number) => {
  const orbit = [D * 0.03, D * 0.42] as const;
  const c = orbit[1];
  const n0 = c + D * 0.1;
  return { orbit, collapse: c, shock: [c, c + D * 0.18] as const, mono: [c + 2, c + D * 0.14] as const, ring: [c + D * 0.06, c + D * 0.26] as const, name: [n0, Math.min(n0 + D * 0.22, D * 0.74)] as const };
};

const fitSize = (text: string, base: number, avail: number) => Math.min(base, avail / (Math.max(text.length, 3) * 0.6));

const polar = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

export const OrbitLockup: React.FC<OrbitLockupProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, fps, u, isVertical, width } = useLayout();
  const id = React.useId().replace(/:/g, "");
  const tl = timeline(D);

  const S = (isVertical ? 320 : 260) * u;
  const R0 = S * 1.18;
  const gap = S * 0.32;
  const fs = fitSize(p.name, (isVertical ? 116 : 120) * u, isVertical ? width * 0.86 : width * 0.84 - S - gap);
  const n = Math.max(3, Math.round(p.count));

  // linear clock for the orbit; squaring it makes the spin accelerate into the collapse
  const q = interpolate(frame, [tl.orbit[0], tl.orbit[1]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spin = p.turns * Math.PI * 2;
  const angVel = (2 * spin * q) / (tl.orbit[1] - tl.orbit[0]); // radians per frame
  const r = R0 * (1 - Math.pow(q, 3));
  const dotsIn = progress(frame, tl.orbit[0], tl.orbit[0] + D * 0.08, "travel");
  const dotsOut = 1 - progress(frame, tl.collapse - D * 0.05, tl.collapse, "travel");
  const trail = Math.min(1.7, angVel * 2.4);

  const pop = spring({ frame: frame - tl.collapse + 1, fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const shock = progress(frame, tl.shock[0], tl.shock[1], "enter");
  const mono = progress(frame, tl.mono[0], tl.mono[1], p.ease);
  const ring = progress(frame, tl.ring[0], tl.ring[1], p.ease);
  const w = progress(frame, tl.name[0], tl.name[1], p.ease);
  const box = R0 * 2.6;

  const orbitLayer = (
    <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} style={{ position: "absolute", left: S / 2 - box / 2, top: S / 2 - box / 2, overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}-core`}>
          <stop offset="0%" stopColor={p.accent} stopOpacity={0.7} />
          <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {dotsOut > 0 ? (
        <>
          <circle r={r} fill="none" stroke={p.accent} strokeOpacity={0.14 * dotsIn * dotsOut} strokeWidth={1.5 * u} />
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2 + spin * q * q;
            const [x, y] = polar(r, a);
            const c = i % 2 === 0 ? p.accent : p.accentB;
            const dr = mix(9, 13, q) * u;
            return (
              <g key={i} opacity={dotsIn * dotsOut}>
                {trail > 0.04 && r > 1 ? (
                  <>
                    <path d={arc(r, a - trail, a)} fill="none" stroke={c} strokeOpacity={0.18} strokeWidth={dr * 1.4} strokeLinecap="round" />
                    <path d={arc(r, a - trail * 0.45, a)} fill="none" stroke={c} strokeOpacity={0.4} strokeWidth={dr * 1.6} strokeLinecap="round" />
                  </>
                ) : null}
                <circle cx={x} cy={y} r={dr} fill={c} />
              </g>
            );
          })}
        </>
      ) : null}
      {shock > 0 && shock < 1 ? (
        <>
          <circle r={mix(S * 0.2, S * 0.95, shock)} fill={`url(#${id}-core)`} opacity={0.8 * (1 - shock)} />
          <circle r={mix(S * 0.5, S * 1.15, shock)} fill="none" stroke={p.accent} strokeOpacity={0.7 * (1 - shock)} strokeWidth={mix(5, 0.5, shock) * u} />
        </>
      ) : null}
    </svg>
  );

  // settles from behind the top-left to the upper-right, then holds
  const ra = -Math.PI * 1.6 + ring * Math.PI * 1.35;
  const rr = S / 2 + 26 * u;
  const [rdx, rdy] = polar(rr, ra);

  const mark = (
    <div style={{ position: "absolute", inset: 0 }}>
      {orbitLayer}
      <div
        style={{
          position: "absolute",
          left: -26 * u,
          top: -26 * u,
          width: S + 52 * u,
          height: S + 52 * u,
          borderRadius: "50%",
          border: `${1.5 * u}px solid ${alpha(p.accent, 0.35)}`,
          opacity: ring,
          transform: `scale(${mix(0.9, 1, ring)})`,
          boxSizing: "border-box",
        }}
      />
      <div style={{ position: "absolute", left: S / 2 + rdx - 7 * u, top: S / 2 + rdy - 7 * u, width: 14 * u, height: 14 * u, borderRadius: "50%", background: p.accent, opacity: ring, boxShadow: `0 0 ${18 * u}px ${alpha(p.accent, 0.8)}` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${p.accent}, ${p.accentB})`,
          transform: `scale(${Math.max(0, pop)})`,
          boxShadow: `0 ${30 * u}px ${90 * u}px ${alpha(p.accentB, 0.45)}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 52%)" }} />
        <div
          style={{
            position: "relative",
            fontSize: S * (p.monogram.length > 1 ? 0.38 : 0.5),
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1,
            color: p.monogramColor,
            opacity: mono,
            transform: `scale(${mix(0.7, 1, mono)})`,
          }}
        >
          {p.monogram}
        </div>
      </div>
    </div>
  );

  const nameStyle: React.CSSProperties = { fontSize: fs, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.25, padding: "0 0.08em", whiteSpace: "nowrap", color: p.nameColor };

  // The ghost name on the far side keeps the mark dead centre until the real side slides by -50% of its own size,
  // which centres the lockup without measuring text. The clip starts at the mark's centre, so the name emerges from
  // behind the circle rather than from empty space.
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", alignItems: "center" }}>
        <div style={{ opacity: 0, ...(isVertical ? { paddingBottom: gap } : { paddingRight: gap }) }}>
          <div style={nameStyle}>{p.name}</div>
        </div>
        <div style={{ width: S, height: S, flexShrink: 0 }} />
        <div style={{ position: "relative", transform: isVertical ? `translateY(${-50 * w}%)` : `translateX(${-50 * w}%)` }}>
          <div style={{ overflow: "hidden", ...(isVertical ? { marginTop: -S / 2 } : { marginLeft: -S / 2 }) }}>
            <div
              style={{
                ...(isVertical ? { paddingTop: S / 2 + gap } : { paddingLeft: S / 2 + gap }),
                transform: isVertical ? `translateY(${-100 * (1 - w)}%)` : `translateX(${-100 * (1 - w)}%)`,
              }}
            >
              <div style={nameStyle}>{p.name}</div>
            </div>
          </div>
          <div style={{ position: "absolute", width: S, height: S, ...(isVertical ? { top: -S, left: "50%", marginLeft: -S / 2 } : { left: -S, top: "50%", marginTop: -S / 2 }) }}>
            {mark}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
