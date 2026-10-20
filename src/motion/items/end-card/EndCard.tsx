import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type EndCardProps = {
  background: string;
  ink: string; // brand name
  ink3: string; // URL
  accent: string; // the mark
  onAccent: string; // the monogram on the mark
  button: string; // the CTA pill
  onButton: string;
  monogram: string;
  name: string;
  url: string;
  cta: string;
  rise: number; // px the name, URL and button rise as they enter
  ease: string;
};

// Shared with the prompt so it quotes the real frames and sizes.
export const CARD = {
  start: 6, // first element starts
  enter: 22, // each element's entrance
  gap: STAGGER, // between elements
  nudge: [52, 72] as const, // the arrow's one nudge, after everything has landed
  mark: { wide: 136, vertical: 168 },
  name: { wide: 120, vertical: 116, weight: 500, tracking: -0.045 },
  url: { wide: 30, vertical: 34 },
  button: { h: 96, font: 32, padL: 44, padR: 36, icon: 30 },
} as const;

export const elementStart = (i: number) => CARD.start + i * CARD.gap;

// Inter 500 at -0.045em ≈ 0.56em per character; Geist Mono ≈ 0.6em.
export const sizesFor = (p: Pick<EndCardProps, "name" | "url">, width: number, height: number, u: number) => {
  const vertical = height > width;
  const safeW = width - 2 * (width > height ? 96 * u : width * 0.08);
  return {
    mark: (vertical ? CARD.mark.vertical : CARD.mark.wide) * u,
    name: Math.min((vertical ? CARD.name.vertical : CARD.name.wide) * u, safeW / (Math.max(p.name.length, 3) * 0.58)),
    url: Math.min((vertical ? CARD.url.vertical : CARD.url.wide) * u, safeW / (Math.max(p.url.length, 6) * 0.62)),
  };
};

export const EndCard: React.FC<EndCardProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, isVertical } = useLayout();
  const S = sizesFor(p, width, height, u);
  const k = (i: number) => progress(frame, elementStart(i), elementStart(i) + CARD.enter, p.ease);
  const [k0, k1, k2, k3] = [k(0), k(1), k(2), k(3)];
  // one small arrow nudge (out and back) once the card has landed, finished well before the final hold
  const nudge = Math.sin(Math.PI * progress(frame, CARD.nudge[0], CARD.nudge[1], "travel"));
  const icon = CARD.button.icon;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {/* the mark: a flat accent tile with the monogram; it scales up from 0.88 and fades in */}
        <div
          style={{
            width: S.mark,
            height: S.mark,
            borderRadius: RADIUS.card * u,
            background: p.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: S.mark * (p.monogram.length > 1 ? 0.4 : 0.5),
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: p.onAccent,
            opacity: Math.min(1, k0),
            transform: `scale(${mix(0.88, 1, k0).toFixed(4)})`,
          }}
        >
          {p.monogram}
        </div>

        <div
          style={{
            marginTop: (isVertical ? 56 : 48) * u,
            fontSize: S.name,
            fontWeight: CARD.name.weight,
            letterSpacing: `${CARD.name.tracking}em`,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            color: p.ink,
            opacity: Math.min(1, k1),
            transform: `translateY(${((1 - k1) * p.rise * u).toFixed(2)}px)`,
          }}
        >
          {p.name}
        </div>

        <div
          style={{
            marginTop: 14 * u,
            fontFamily: FONT_MONO,
            fontSize: S.url,
            fontWeight: 400,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            color: p.ink3,
            opacity: Math.min(1, k2),
            transform: `translateY(${((1 - k2) * p.rise * u).toFixed(2)}px)`,
          }}
        >
          {p.url}
        </div>

        <div
          style={{
            marginTop: (isVertical ? 72 : 56) * u,
            height: CARD.button.h * u,
            padding: `0 ${CARD.button.padR * u}px 0 ${CARD.button.padL * u}px`,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 14 * u,
            background: p.button,
            color: p.onButton,
            fontSize: CARD.button.font * u,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            opacity: Math.min(1, k3),
            transform: `translateY(${((1 - k3) * p.rise * u).toFixed(2)}px)`,
          }}
        >
          <span>{p.cta}</span>
          {/* viewBox in the icon's own px, so the stroke is exactly STROKE.ring × u */}
          <svg
            width={icon * u}
            height={icon * u}
            viewBox={`0 0 ${icon} ${icon}`}
            fill="none"
            stroke={p.onButton}
            strokeWidth={STROKE.ring}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `translateX(${(nudge * 6 * u).toFixed(2)}px)` }}
          >
            <path d={`M${icon * 0.2} ${icon / 2}H${icon * 0.8}M${icon * 0.55} ${icon * 0.25}L${icon * 0.8} ${icon / 2}L${icon * 0.55} ${icon * 0.75}`} />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
