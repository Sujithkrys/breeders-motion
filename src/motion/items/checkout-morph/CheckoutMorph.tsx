import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type CheckoutMorphProps = {
  background: string;
  button: string;
  buttonText: string;
  success: string;
  text: string;
  label: string;
  done: string;
  detail: string;
  spin: number; // frames the spinner runs
  ease: string;
};

export const CLICK_AT = 22;
export const MORPH_AT = 30;
export const SPIN_AT = 46;
export const BTN = { w: 560, h: 128 };

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CheckoutMorph: React.FC<CheckoutMorphProps> = (p) => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const light = isLight(p.background);
  const ok = SPIN_AT + p.spin;

  const enter = progress(frame, 0, 14, p.ease);
  const cursorIn = progress(frame, 4, CLICK_AT - 2, "smooth");
  const cursorOut = progress(frame, MORPH_AT + 2, MORPH_AT + 12, "soft");
  const press = interpolate(frame, [CLICK_AT, CLICK_AT + 4, CLICK_AT + 10], [1, 0.95, 1], clamp);
  const m = progress(frame, MORPH_AT, MORPH_AT + 18, p.ease);
  const labelOut = progress(frame, MORPH_AT, MORPH_AT + 8, "soft");
  const spinIn = progress(frame, SPIN_AT - 4, SPIN_AT + 4, "soft");
  const s = progress(frame, ok, ok + 10, "soft");
  const check = progress(frame, ok + 4, ok + 16, "smooth");
  const pop = interpolate(frame, [ok, ok + 6, ok + 14], [1, 1.1, 1], clamp);
  const ring = progress(frame, ok + 2, ok + 26, "soft");
  const line = progress(frame, ok + 12, ok + 28, p.ease);

  const bw = mix(BTN.w, BTN.h, m) * u;
  const bh = BTN.h * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 64 * u, opacity: enter, transform: `translateY(${(1 - enter) * 24 * u}px)` }}>
        <div style={{ position: "relative", width: BTN.w * u, height: bh, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: bh, height: bh, borderRadius: "50%", border: `${3 * u}px solid ${p.success}`, boxSizing: "border-box", opacity: ring > 0 && ring < 1 ? 0.7 * (1 - ring) : 0, transform: `scale(${mix(1, 1.9, ring)})` }} />
          <div
            style={{
              position: "relative",
              width: bw,
              height: bh,
              borderRadius: bh / 2,
              overflow: "hidden",
              background: `linear-gradient(180deg, ${alpha(p.button, 0.88)}, ${p.button})`,
              boxShadow: `0 ${24 * u}px ${56 * u}px ${alpha(s > 0.5 ? p.success : p.button, light ? 0.32 : 0.42)}, inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.25)`,
              transform: `scale(${press * pop})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${alpha(p.success, 0.88)}, ${p.success})`, opacity: s }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 * u, whiteSpace: "nowrap", color: p.buttonText, fontSize: 44 * u, fontWeight: 600, letterSpacing: "-0.03em", opacity: 1 - labelOut, transform: `scale(${mix(1, 0.85, labelOut)})` }}>
              <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" fill="none" stroke={p.buttonText} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {p.label}
            </div>
            <svg width={60 * u} height={60 * u} viewBox="0 0 60 60" style={{ position: "absolute", opacity: spinIn * (1 - s), transform: `rotate(${frame * 12}deg)` }}>
              <circle cx="30" cy="30" r="22" fill="none" stroke={alpha(p.buttonText, 0.25)} strokeWidth={5} />
              <circle cx="30" cy="30" r="22" fill="none" stroke={p.buttonText} strokeWidth={5} strokeLinecap="round" strokeDasharray="38 138.2" />
            </svg>
            <svg width={64 * u} height={64 * u} viewBox="0 0 24 24" style={{ position: "absolute", opacity: s }}>
              <path d="M6 12.5l4 4L18 8" fill="none" stroke={p.buttonText} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18" strokeDashoffset={18 * (1 - check)} />
            </svg>
          </div>
          <svg
            width={52 * u}
            height={52 * u}
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              opacity: cursorIn * (1 - cursorOut),
              transform: `translate(${mix(260, 90, cursorIn) * u}px, ${mix(200, 10, cursorIn) * u}px) scale(${interpolate(frame, [CLICK_AT, CLICK_AT + 3, CLICK_AT + 8], [1, 0.85, 1], clamp)})`,
              transformOrigin: "0 0",
            }}
          >
            <path d="M5 3l14 8.2-6.2 1.4L10 19z" fill="#0B0B0C" stroke="#FFFFFF" strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 * u, opacity: line, transform: `translateY(${(1 - line) * 22 * u}px)` }}>
          <div style={{ fontSize: 52 * u, fontWeight: 650, letterSpacing: "-0.04em" }}>{p.done}</div>
          <div style={{ fontSize: 28 * u, color: alpha(p.text, 0.55), letterSpacing: "-0.01em" }}>{p.detail}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
