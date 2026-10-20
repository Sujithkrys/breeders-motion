import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type CheckoutMorphProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string;
  onButton: string;
  accent: string;
  success: string;
  onSuccess: string;
  item: string;
  price: string;
  label: string;
  done: string;
  detail: string;
  spin: number; // frames the spinner runs
  ease: string;
};

export const ENTER = 20;
export const CLICK_AT = 28;
export const MORPH_AT = 34;
export const MORPH = 18;
export const SPIN_AT = 46;
export const BTN_H = 112;
export const CARD = { wide: 1200, narrow: 900, pad: 56 };
const TEXT_GAP = 48;
const TEXT_H = 34 * 1.2 + 10 + 24 * 1.3;

// Shared with the prompt so the copied timings match the preview.
export const checkoutTimeline = (spin: number) => {
  const ok = SPIN_AT + spin;
  return { ok, lineAt: ok + 12 };
};

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};

// Stroke width in a 24-unit icon viewBox that renders as `px` design units at `size` design units.
const sw = (px: number, size: number) => (px * 24) / size;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CheckoutMorph: React.FC<CheckoutMorphProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const dark = isDark(p.background);
  const { ok, lineAt } = checkoutTimeline(p.spin);
  const cardW = ratio === "16:9" ? CARD.wide : CARD.narrow;
  const fullW = cardW - CARD.pad * 2;

  const enter = progress(frame, 0, ENTER, p.ease);
  const cursorFade = progress(frame, 6, 24, "enter");
  const cursorPos = progress(frame, 6, CLICK_AT - 2, "travel");
  const cursorOut = progress(frame, MORPH_AT + 4, MORPH_AT + 16, "exit");
  const press = interpolate(frame, [CLICK_AT, CLICK_AT + 4, CLICK_AT + 10], [1, 0.97, 1], clamp);
  const m = progress(frame, MORPH_AT, MORPH_AT + MORPH, p.ease);
  const labelOut = progress(frame, MORPH_AT, MORPH_AT + 12, "exit");
  const spinIn = progress(frame, SPIN_AT, SPIN_AT + 18, "enter");
  const s = progress(frame, ok, ok + 12, "travel");
  const check = progress(frame, ok + 2, ok + 20, "enter");
  const pop = interpolate(frame, [ok, ok + 6, ok + 14], [1, 1.04, 1], clamp);
  const ring = progress(frame, ok + 2, ok + 26, "travel");
  const line = progress(frame, lineAt, lineAt + 20, p.ease);

  const bw = mix(fullW, BTN_H, m) * u;
  const bh = BTN_H * u;
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const row: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24 * u, fontSize: 30 * u, letterSpacing: "-0.015em" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: TEXT_GAP * u, transform: `translateY(${(1 - line) * ((TEXT_H + TEXT_GAP) / 2) * u}px)` }}>
        <div
          style={{
            width: cardW * u,
            padding: CARD.pad * u,
            boxSizing: "border-box",
            borderRadius: RADIUS.card * u,
            background: p.card,
            border: `${u}px solid ${p.line}`,
            boxShadow: shadow,
            opacity: enter,
            transform: `translateY(${(1 - enter) * 24 * u}px)`,
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontSize: 18 * u, fontWeight: 500, letterSpacing: "0.12em", color: p.ink3, marginBottom: 28 * u }}>ORDER SUMMARY</div>
          <div style={{ ...row, color: p.ink2 }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.item}</span>
            <span style={{ flexShrink: 0 }}>{p.price}</span>
          </div>
          <div style={{ height: STROKE.hair * u, background: p.line, margin: `${24 * u}px 0` }} />
          <div style={row}>
            <span style={{ fontWeight: 500 }}>Total</span>
            <span style={{ fontWeight: 600, flexShrink: 0 }}>{p.price}</span>
          </div>

          <div style={{ position: "relative", marginTop: 40 * u, width: fullW * u, height: bh, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", width: bh, height: bh, borderRadius: 999, border: `${STROKE.ring * u}px solid ${p.success}`, boxSizing: "border-box", opacity: ring > 0 && ring < 1 ? 0.3 * (1 - ring) : 0, transform: `scale(${mix(1, 1.6, ring)})` }} />
            <div
              style={{
                position: "relative",
                width: bw,
                height: bh,
                borderRadius: 999,
                overflow: "hidden",
                background: p.button,
                transform: `scale(${press * pop})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: p.success, opacity: s }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 * u, whiteSpace: "nowrap", color: p.onButton, fontSize: 32 * u, fontWeight: 500, letterSpacing: "-0.015em", opacity: 1 - labelOut, transform: `scale(${mix(1, 0.9, labelOut)})` }}>
                <svg width={30 * u} height={30 * u} viewBox="0 0 24 24" fill="none" stroke={p.onButton} strokeWidth={sw(STROKE.ring, 30)} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {p.label}
              </div>
              <svg width={52 * u} height={52 * u} viewBox="0 0 52 52" style={{ position: "absolute", opacity: spinIn * (1 - s), transform: `rotate(${frame * 12}deg)` }}>
                <circle cx="26" cy="26" r="20" fill="none" stroke={alpha(p.onButton, 0.25)} strokeWidth={STROKE.ring} />
                <circle cx="26" cy="26" r="20" fill="none" stroke={p.accent} strokeWidth={STROKE.ring} strokeLinecap="round" strokeDasharray="34 126" />
              </svg>
              <svg width={64 * u} height={64 * u} viewBox="0 0 64 64" style={{ position: "absolute", opacity: s }}>
                <path d="M16 33.3l10.7 10.7L48 21.3" fill="none" stroke={p.onSuccess} strokeWidth={STROKE.bar} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="47" strokeDashoffset={47 * (1 - check)} />
              </svg>
            </div>
            <svg
              width={48 * u}
              height={48 * u}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                opacity: cursorFade * (1 - cursorOut),
                transform: `translate(${mix(320, 140, cursorPos) * u}px, ${mix(220, 16, cursorPos) * u}px) scale(${interpolate(frame, [CLICK_AT, CLICK_AT + 3, CLICK_AT + 8], [1, 0.85, 1], clamp)})`,
                transformOrigin: "0 0",
              }}
            >
              <path d="M5 3l14 8.2-6.2 1.4L10 19z" fill={p.ink} stroke={p.card} strokeWidth={sw(STROKE.hair, 48)} strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * u, opacity: line, transform: `translateY(${(1 - line) * 16 * u}px)` }}>
          <div style={{ fontSize: 34 * u, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.2 }}>{p.done}</div>
          <div style={{ fontSize: 24 * u, color: p.ink2, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{p.detail}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
