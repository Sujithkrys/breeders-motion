import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type EndCardProps = {
  background: string;
  accent: string;
  accentInk: string;
  ink: string;
  muted: string;
  monogram: string;
  name: string;
  url: string;
  cta: string;
  stagger: number; // frames between elements
  ease: string;
};

export const timeline = (D: number, stagger: number) => {
  const start = (i: number) => D * 0.05 + i * stagger;
  const dur = D * 0.24;
  const lastEnd = start(3) + dur;
  return { start, dur, sheen: [lastEnd + 2, lastEnd + 2 + D * 0.14] as const };
};

export const EndCard: React.FC<EndCardProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, u, isVertical, width } = useLayout();
  const id = React.useId().replace(/:/g, "");
  const tl = timeline(D, p.stagger);
  const k = (i: number) => progress(frame, tl.start(i), tl.start(i) + tl.dur, p.ease);
  const fade = (i: number) => progress(frame, tl.start(i), tl.start(i) + tl.dur * 0.5, "soft");

  const M = (isVertical ? 176 : 150) * u;
  const nameFs = Math.min((isVertical ? 116 : 120) * u, (width * 0.86) / (Math.max(p.name.length, 3) * 0.6));
  const urlFs = Math.min((isVertical ? 36 : 32) * u, (width * 0.8) / (Math.max(p.url.length, 6) * 0.62));
  const k0 = k(0);
  const k1 = k(1);
  const k2 = k(2);
  const k3 = k(3);
  const sheen = progress(frame, tl.sheen[0], tl.sheen[1], "soft");
  const nudge = Math.sin(Math.PI * progress(frame, tl.sheen[0] + 2, tl.sheen[1], "smooth"));
  const glowW = 1400 * u;

  const blur = (t: number, px: number) => (t < 1 ? `blur(${(1 - t) * px * u}px)` : undefined);

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <svg width={glowW} height={glowW} viewBox="-1 -1 2 2" style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -glowW / 2, marginTop: -glowW / 2 - (isVertical ? 240 : 160) * u, opacity: fade(0) }}>
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor={p.accent} stopOpacity={0.2} />
            <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse rx={1} ry={0.62} fill={`url(#${id}-glow)`} />
      </svg>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: M,
            height: M,
            borderRadius: M * 0.28,
            background: `linear-gradient(140deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%, rgba(0,0,0,0.18)), ${p.accent}`,
            boxShadow: `0 ${24 * u}px ${70 * u}px ${alpha(p.accent, 0.4)}, inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.18)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: M * (p.monogram.length > 1 ? 0.4 : 0.52),
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1,
            color: p.accentInk,
            opacity: fade(0),
            transform: `translateY(${(1 - k0) * 40 * u}px) scale(${mix(0.6, 1, k0)}) rotate(${(1 - k0) * -12}deg)`,
            filter: blur(k0, 10),
          }}
        >
          {p.monogram}
        </div>

        <div
          style={{
            marginTop: (isVertical ? 56 : 46) * u,
            fontSize: nameFs,
            fontWeight: 650,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            color: p.ink,
            opacity: fade(1),
            transform: `translateY(${(1 - k1) * 36 * u}px)`,
            filter: blur(k1, 10),
          }}
        >
          {p.name}
        </div>

        <div
          style={{
            marginTop: 16 * u,
            fontFamily: FONT_MONO,
            fontSize: urlFs,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            color: p.muted,
            opacity: fade(2),
            transform: `translateY(${(1 - k2) * 24 * u}px)`,
          }}
        >
          {p.url}
        </div>

        <div
          style={{
            position: "relative",
            marginTop: (isVertical ? 72 : 56) * u,
            height: 100 * u,
            padding: `0 ${40 * u}px 0 ${48 * u}px`,
            borderRadius: 50 * u,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 18 * u,
            background: p.accent,
            color: p.accentInk,
            fontSize: 34 * u,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            boxShadow: `0 ${18 * u}px ${50 * u}px ${alpha(p.accent, 0.35)}, inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.25)`,
            opacity: fade(3),
            transform: `translateY(${(1 - k3) * 30 * u}px) scale(${mix(0.86, 1, k3)})`,
          }}
        >
          {/* a single sheen sweep once everything has landed */}
          {sheen > 0 && sheen < 1 ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: 140 * u,
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.4), rgba(255,255,255,0))",
                transform: `translateX(${mix(-180, 900, sheen) * u}px) skewX(-20deg)`,
              }}
            />
          ) : null}
          <span style={{ position: "relative" }}>{p.cta}</span>
          <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" fill="none" stroke={p.accentInk} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", transform: `translateX(${nudge * 6 * u}px)` }}>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
