import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, progress, useLayout } from "../../kit";

export type LiquidToggleProps = {
  background: string;
  card: string;
  line: string;
  track: string;
  knob: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  title: string;
  offText: string;
  onText: string;
  stretch: number; // % of the travel the trailing edge lags behind the leading edge
  travel: number; // frames per switch
  ease: string;
};

export const ON_AT = 18;
export const OFF_AT = 78;
export const TRACK = { w: 480, h: 224, pad: 20 };
export const CARD = { wide: 1240, narrow: 880, pad: 72 };

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};

export const LiquidToggle: React.FC<LiquidToggleProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const { w: W, h: H, pad } = TRACK;
  const d = H - pad * 2;
  const travel = W - pad * 2 - d;
  const T = p.travel;
  const lag = Math.min(Math.max(p.stretch, 0), 45) / 100;

  // The leading edge finishes early and the trailing edge starts late, so the knob stretches mid-travel like a drop.
  const lead = (s: number) => progress(frame, s, s + T * (1 - lag), p.ease);
  const trail = (s: number) => progress(frame, s + T * lag, s + T, p.ease);
  const rightPos = lead(ON_AT) - trail(OFF_AT);
  const leftPos = trail(ON_AT) - lead(OFF_AT);

  const rawLeft = pad + travel * leftPos;
  const rawRight = pad + d + travel * rightPos;
  const width = Math.min(Math.max(rawRight - rawLeft, d * 0.86), W - pad * 2);
  const center = (rawLeft + rawRight) / 2;
  const left = Math.min(Math.max(center - width / 2, pad), W - pad - width);
  const stretchAmt = Math.max(0, width - d) / travel;
  const squash = Math.max(0, d - width) / d;
  const kh = d * (1 - 0.2 * stretchAmt + 0.5 * squash);

  const on = Math.min(Math.max((leftPos + rightPos) / 2, 0), 1);
  const dark = isDark(p.background);
  const wide = ratio === "16:9";
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const knobShadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.08), 0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.12)`;
  const stateLine: React.CSSProperties = { position: "absolute", inset: 0, lineHeight: `${44 * u}px`, textAlign: wide ? "left" : "center", whiteSpace: "nowrap" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          width: (wide ? CARD.wide : CARD.narrow) * u,
          padding: CARD.pad * u,
          boxSizing: "border-box",
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxShadow: shadow,
          display: "flex",
          flexDirection: wide ? "row-reverse" : "column",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 56 * u,
        }}
      >
        <div style={{ position: "relative", width: W * u, height: H * u, flexShrink: 0, borderRadius: 999, background: p.track, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: (left + width + pad) * u,
              borderRadius: 999,
              background: p.accent,
              opacity: interpolate(on, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: left * u,
              top: ((H - kh) / 2) * u,
              width: width * u,
              height: kh * u,
              borderRadius: 999,
              background: p.knob,
              boxShadow: knobShadow,
            }}
          />
        </div>

        <div style={{ flex: wide ? 1 : undefined, minWidth: 0, width: wide ? undefined : "100%", display: "flex", flexDirection: "column", alignItems: wide ? "flex-start" : "center", gap: 14 * u }}>
          <div style={{ fontSize: 56 * u, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, textAlign: wide ? "left" : "center" }}>{p.title}</div>
          <div style={{ position: "relative", alignSelf: "stretch", height: 44 * u, overflow: "hidden", fontSize: 30 * u, fontWeight: 400, letterSpacing: "-0.015em" }}>
            <div style={{ ...stateLine, color: p.ink3, opacity: 1 - on, transform: `translateY(${-on * 28 * u}px)` }}>{p.offText}</div>
            <div style={{ ...stateLine, color: p.ink2, opacity: on, transform: `translateY(${(1 - on) * 28 * u}px)` }}>{p.onText}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
