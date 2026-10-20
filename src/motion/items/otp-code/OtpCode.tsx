import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type OtpCodeProps = {
  background: string;
  card: string;
  ink: string;
  accent: string;
  success: string;
  title: string;
  code: string;
  speed: number; // frames per digit
  ease: string;
};

export const FIRST_DIGIT = 26;
export const codeOf = (code: string) => (code.replace(/\s/g, "") + "000000").slice(0, 6);

const hexMix = (a: string, b: string, t: number) => {
  const rgb = (h: string) => {
    const s = h.replace("#", "");
    const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const x = rgb(a);
  const y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

export const OtpCode: React.FC<OtpCodeProps> = (p) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const code = codeOf(p.code);
  const muted = alpha(p.ink, 0.56);
  const sp = p.speed;
  const enter = progress(f, 0, 20, p.ease);

  const bw = 108 * u;
  const bh = 132 * u;
  const gap = 16 * u;
  const sep = 36 * u; // extra space for the dash between the two groups of three
  const xs = Array.from({ length: 6 }, (_, i) => i * (bw + gap) + (i >= 3 ? sep : 0));
  const rowW = xs[5] + bw;

  // Caret position in box units: glides one box right over 5 frames after each digit lands.
  const caretPos = Array.from({ length: 6 }, (_, i) => progress(f, FIRST_DIGIT + i * sp, FIRST_DIGIT + i * sp + 5, p.ease)).reduce((a, b) => a + b, 0);
  const lo = Math.min(5, Math.floor(caretPos));
  const caretX = caretPos >= 6 ? xs[5] + bw / 2 : mix(xs[lo] + bw / 2, (xs[lo + 1] ?? xs[5]) + bw / 2, caretPos - lo);
  const doneF = FIRST_DIGIT + 6 * sp + 4;
  const ok = progress(f, doneF, doneF + 12, p.ease);
  const blink = f < FIRST_DIGIT ? (Math.floor(f / 12) % 2 === 0 ? 1 : 0.15) : 1;
  const caretAlpha = blink * (1 - progress(f, FIRST_DIGIT + 5 * sp + 2, FIRST_DIGIT + 5 * sp + 8)) * enter;
  const verified = progress(f, doneF + 14, doneF + 28, p.ease);
  const tick = progress(f, doneF + 18, doneF + 34, "smooth");

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          padding: `${56 * u}px ${56 * u}px ${48 * u}px`,
          borderRadius: 44 * u,
          background: p.card,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
          boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,0.28), 0 0 ${120 * u}px ${alpha(p.success, 0.18 * ok)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30 * u}px) scale(${mix(0.97, 1, enter)})`,
        }}
      >
        <div style={{ width: 72 * u, height: 72 * u, borderRadius: 22 * u, background: alpha(p.accent, 0.14), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={36 * u} height={36 * u} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d="M7 10.5V8a5 5 0 0 1 10 0v2.5 M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V12a1.5 1.5 0 0 1 1.5-1.5z M12 14.2v2.3" fill="none" stroke={p.accent} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 40 * u, fontWeight: 650, letterSpacing: "-0.035em", color: p.ink, marginTop: 26 * u }}>{p.title}</div>
        <div style={{ fontSize: 22 * u, color: muted, marginTop: 10 * u }}>We sent a 6-digit code to •••• 2048</div>

        <div style={{ position: "relative", width: rowW, height: bh, marginTop: 44 * u }}>
          <div style={{ position: "absolute", left: xs[2] + bw + gap / 2 + sep / 2 - 8 * u, top: bh / 2 - 1.5 * u, width: 16 * u, height: 3 * u, borderRadius: 2 * u, background: alpha(p.ink, 0.25) }} />
          {xs.map((x, i) => {
            const enterD = FIRST_DIGIT + i * sp;
            const d = progress(f, enterD, enterD + 9, "bouncy");
            const focus = Math.max(0, 1 - Math.abs(caretPos - i)) * (1 - ok);
            const pulseAt = doneF + i * 3;
            const pulse = progress(f, pulseAt, pulseAt + 8, "soft") - progress(f, pulseAt + 8, pulseAt + 20, "soft");
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: 0,
                  width: bw,
                  height: bh,
                  borderRadius: 24 * u,
                  background: ok > 0 ? alpha(p.success, 0.08 * ok) : alpha(p.ink, 0.035),
                  boxShadow: [
                    `inset 0 0 0 ${1.5 * u}px ${alpha(p.ink, 0.14 * (1 - ok))}`,
                    `inset 0 0 0 ${2.5 * u}px ${alpha(p.accent, focus)}`,
                    `0 0 0 ${5 * u}px ${alpha(p.accent, 0.18 * focus)}`,
                    `inset 0 0 0 ${2 * u}px ${alpha(p.success, 0.75 * ok)}`,
                  ].join(", "),
                  transform: `scale(${1 + 0.06 * pulse})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 60 * u,
                    fontWeight: 500,
                    color: hexMix(p.ink, p.success, ok),
                    opacity: Math.min(1, d * 1.6),
                    transform: `translateY(${(1 - d) * 16 * u}px) scale(${mix(0.6, 1, d)})`,
                  }}
                >
                  {code[i]}
                </span>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: caretX - 1.5 * u, top: bh / 2 - 30 * u, width: 3 * u, height: 60 * u, borderRadius: 2 * u, background: p.accent, opacity: caretAlpha }} />
        </div>

        <div style={{ position: "relative", height: 44 * u, width: rowW, marginTop: 34 * u }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 * u, color: muted, opacity: 1 - verified }}>
            Didn’t get it? <span style={{ color: p.accent, fontWeight: 500, marginLeft: 8 * u }}>Resend in 0:24</span>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14 * u,
              opacity: verified,
              transform: `translateY(${(1 - verified) * 12 * u}px)`,
            }}
          >
            <svg width={40 * u} height={40 * u} viewBox="0 0 24 24" style={{ display: "block", transform: `scale(${mix(0.5, 1, verified)})` }}>
              <circle cx={12} cy={12} r={11} fill={p.success} />
              <path d="M7 12.4l3.2 3.2L17 8.8" fill="none" stroke={p.card} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={16} strokeDashoffset={16 * (1 - tick)} />
            </svg>
            <span style={{ fontSize: 28 * u, fontWeight: 600, letterSpacing: "-0.02em", color: p.success }}>Verified</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
