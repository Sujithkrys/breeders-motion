import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type LiquidToggleProps = {
  background: string;
  trackOff: string;
  accent: string;
  knob: string;
  text: string;
  title: string;
  offText: string;
  onText: string;
  stretch: number; // % of the travel the trailing edge lags behind the leading edge
  travel: number; // frames per switch
  ease: string;
};

export const ON_AT = 18;
export const OFF_AT = 78;
export const TRACK = { w: 560, h: 260, pad: 24 };

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const LiquidToggle: React.FC<LiquidToggleProps> = (p) => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
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
  const swap = on;
  const light = isLight(p.background);

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 76 * u }}>
        <div
          style={{
            position: "relative",
            width: W * u,
            height: H * u,
            borderRadius: (H / 2) * u,
            background: p.trackOff,
            overflow: "hidden",
            boxShadow: `inset 0 ${5 * u}px ${16 * u}px rgba(0,0,0,${light ? 0.12 : 0.35}), 0 ${30 * u}px ${90 * u}px ${alpha(p.accent, 0.38 * on)}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: (left + width + pad) * u,
              borderRadius: (H / 2) * u,
              background: `linear-gradient(180deg, ${alpha(p.accent, 0.92)}, ${p.accent})`,
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
              borderRadius: (Math.min(kh, width) / 2) * u,
              background: `linear-gradient(180deg, ${p.knob}, ${alpha(p.knob, 0.9)})`,
              boxShadow: `0 ${12 * u}px ${28 * u}px rgba(0,0,0,${light ? 0.18 : 0.32}), inset 0 ${-6 * u}px ${14 * u}px rgba(0,0,0,0.07)`,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: "14%", right: "14%", top: "7%", height: "38%", borderRadius: (kh / 2) * u, background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0))", opacity: 0.6 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 * u }}>
          <div style={{ fontSize: 60 * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.1 }}>{p.title}</div>
          <div style={{ position: "relative", height: 56 * u, minWidth: 300 * u, overflow: "hidden", fontSize: 40 * u, fontWeight: 500, letterSpacing: "-0.02em" }}>
            <div style={{ position: "absolute", inset: 0, textAlign: "center", lineHeight: `${56 * u}px`, color: alpha(p.text, 0.45), opacity: 1 - swap, transform: `translateY(${-swap * 40 * u}px)` }}>{p.offText}</div>
            <div style={{ position: "absolute", inset: 0, textAlign: "center", lineHeight: `${56 * u}px`, color: p.accent, opacity: swap, transform: `translateY(${(1 - swap) * 40 * u}px)` }}>{p.onText}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
