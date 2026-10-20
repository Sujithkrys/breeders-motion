import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type RingBurstProps = {
  background: string;
  ringColor: string;
  badgeA: string;
  badgeB: string;
  badgeInk: string;
  monogram: string;
  name: string;
  tagline: string;
  rings: number;
  ease: string;
};

export const RING_GAP = 4; // frames between rings
export const timeline = (D: number) => ({
  flash: [D * 0.03, D * 0.16] as const,
  ringStart: D * 0.04,
  ringDur: D * 0.36,
  pop: D * 0.2,
  mono: [D * 0.27, D * 0.47] as const,
  text: [D * 0.3, D * 0.58] as const,
});

// Badge geometry in a 200×200 box centred on 0,0. Top text sits on its baseline arc and grows outwards; bottom text
// runs the other way round so it reads upright, on an arc one cap-height further out so both share one band.
const R_TOP = 77;
const R_BOT = 85.4;

export const RingBurst: React.FC<RingBurstProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, fps, u, isVertical } = useLayout();
  const id = React.useId().replace(/:/g, "");
  const tl = timeline(D);

  const B = (isVertical ? 500 : 440) * u;
  const n = Math.max(2, Math.round(p.rings));
  const box = Math.max(B * 3.4, 1500 * u);

  const flash = progress(frame, tl.flash[0], tl.flash[1], "smooth");
  const pop = spring({ frame: frame - tl.pop, fps, config: { damping: 10, stiffness: 120, mass: 0.9 } });
  const mono = progress(frame, tl.mono[0], tl.mono[1], p.ease);
  const text = progress(frame, tl.text[0], tl.text[1], p.ease);

  const ringEls = Array.from({ length: n }, (_, i) => {
    const s = tl.ringStart + i * RING_GAP;
    const k = progress(frame, s, s + tl.ringDur, p.ease);
    if (k <= 0 || k >= 1) return null;
    const r = mix(B * 0.12, B * 0.5 + 430 * u * (1 + i * 0.1), k);
    const fadeIn = progress(frame, s, s + 4, "soft");
    return <circle key={i} r={r} fill="none" stroke={p.ringColor} strokeOpacity={(i % 2 === 0 ? 0.9 : 0.5) * fadeIn * Math.pow(1 - k, 1.3)} strokeWidth={mix(14, 1, k) * u} />;
  });

  const label: React.CSSProperties = { fontFamily: FONT_SANS, textTransform: "uppercase" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -box / 2, marginTop: -box / 2, overflow: "visible" }}>
        <defs>
          <radialGradient id={`${id}-flash`}>
            <stop offset="0%" stopColor={p.ringColor} stopOpacity={0.85} />
            <stop offset="100%" stopColor={p.ringColor} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0%" stopColor={p.badgeA} stopOpacity={0.28} />
            <stop offset="100%" stopColor={p.badgeA} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle r={B * 1.05} fill={`url(#${id}-halo)`} opacity={Math.min(1, Math.max(0, pop))} />
        {flash > 0 && flash < 1 ? <circle r={mix(B * 0.05, B * 0.45, flash)} fill={`url(#${id}-flash)`} opacity={Math.sin(Math.PI * flash)} /> : null}
        {ringEls}
      </svg>
      <div
        style={{
          position: "relative",
          width: B,
          height: B,
          borderRadius: "50%",
          transform: `scale(${Math.max(0, pop)})`,
          boxShadow: `0 ${36 * u}px ${100 * u}px ${alpha(p.badgeB, 0.45)}`,
        }}
      >
        <svg width={B} height={B} viewBox="-100 -100 200 200" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={p.badgeA} />
              <stop offset="100%" stopColor={p.badgeB} />
            </linearGradient>
            <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
            <path id={`${id}-top`} d={`M${-R_TOP} 0 A${R_TOP} ${R_TOP} 0 0 1 ${R_TOP} 0`} />
            <path id={`${id}-bot`} d={`M${-R_BOT} 0 A${R_BOT} ${R_BOT} 0 0 0 ${R_BOT} 0`} />
          </defs>
          <circle r={98} fill={`url(#${id}-fill)`} />
          <circle r={98} fill={`url(#${id}-gloss)`} />
          <circle r={93} fill="none" stroke={p.badgeInk} strokeOpacity={0.3} strokeWidth={0.8} />
          <circle r={70} fill="none" stroke={p.badgeInk} strokeOpacity={0.35} strokeWidth={1.2} />
          <g opacity={text} transform={`rotate(${(1 - text) * -70})`}>
            <text fill={p.badgeInk} fontSize={11.5} fontWeight={650} style={{ ...label, letterSpacing: "0.22em" }}>
              <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
                {p.name}
              </textPath>
            </text>
            <text fill={p.badgeInk} fillOpacity={0.8} fontSize={9.5} fontWeight={500} style={{ ...label, letterSpacing: "0.2em" }}>
              <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">
                {p.tagline}
              </textPath>
            </text>
            <circle cx={-81.5} cy={0} r={2.2} fill={p.badgeInk} />
            <circle cx={81.5} cy={0} r={2.2} fill={p.badgeInk} />
          </g>
          <text
            textAnchor="middle"
            dy="0.35em"
            fill={p.badgeInk}
            fontSize={p.monogram.length > 1 ? 50 : 66}
            fontWeight={700}
            opacity={mono}
            transform={`scale(${mix(0.6, 1, mono)})`}
            style={{ fontFamily: FONT_SANS, letterSpacing: "-0.045em" }}
          >
            {p.monogram}
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
