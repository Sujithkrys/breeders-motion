import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type OtpCodeProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  success: string;
  title: string;
  code: string;
  speed: number; // frames per digit
  ease: string;
};

export const FIRST_DIGIT = 26;
export const ENTER = 20;
export const DIGIT_IN = 18;
export const CARET_GLIDE = 6;
export const codeOf = (code: string) => (code.replace(/\s/g, "") + "000000").slice(0, 6);
export const doneFrame = (speed: number) => FIRST_DIGIT + 6 * speed + 4;
// The card is designed at ~876px; at 16:9 it scales up so it fills ~64% of the frame width.
export const zoomFor = (wide: boolean) => (wide ? 1.4 : 1);

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};

export const OtpCode: React.FC<OtpCodeProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const s = u * zoomFor(ratio === "16:9");
  const dark = isDark(p.background);
  const code = codeOf(p.code);
  const sp = p.speed;
  const enter = progress(f, 0, ENTER, p.ease);

  const bw = 108 * s;
  const bh = 132 * s;
  const gap = 16 * s;
  const sep = 36 * s; // extra space for the dash between the two groups of three
  const xs = Array.from({ length: 6 }, (_, i) => i * (bw + gap) + (i >= 3 ? sep : 0));
  const rowW = xs[5] + bw;

  // Caret position in box units: glides one box right after each digit lands.
  const caretPos = Array.from({ length: 6 }, (_, i) => progress(f, FIRST_DIGIT + i * sp, FIRST_DIGIT + i * sp + CARET_GLIDE, "travel")).reduce((a, b) => a + b, 0);
  const lo = Math.min(5, Math.floor(caretPos));
  const caretX = caretPos >= 6 ? xs[5] + bw / 2 : mix(xs[lo] + bw / 2, (xs[lo + 1] ?? xs[5]) + bw / 2, caretPos - lo);
  const doneF = doneFrame(sp);
  const ok = progress(f, doneF, doneF + DIGIT_IN, p.ease);
  const blink = f < FIRST_DIGIT ? (Math.floor(f / 12) % 2 === 0 ? 1 : 0.15) : 1;
  const caretAlpha = blink * (1 - progress(f, FIRST_DIGIT + 5 * sp + 2, FIRST_DIGIT + 5 * sp + 14, "exit")) * enter;
  const verified = progress(f, doneF + 14, doneF + 14 + ENTER, p.ease);
  const tick = progress(f, doneF + 18, doneF + 18 + DIGIT_IN, "enter");
  const lockIcon = 36 * s;
  const checkIcon = 36 * s;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          padding: `${56 * s}px ${56 * s}px ${48 * s}px`,
          borderRadius: RADIUS.card * s,
          background: p.card,
          border: `${1 * s}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${1 * s}px ${2 * s}px rgba(0,0,0,0.04), 0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.06)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24 * s}px)`,
        }}
      >
        <div style={{ width: 72 * s, height: 72 * s, borderRadius: RADIUS.button * s, background: p.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={lockIcon} height={lockIcon} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path
              d="M7 10.5V8a5 5 0 0 1 10 0v2.5 M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V12a1.5 1.5 0 0 1 1.5-1.5z M12 14.2v2.3"
              fill="none"
              stroke={p.ink2}
              strokeWidth={(STROKE.ring * s * 24) / lockIcon}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 40 * s, fontWeight: 500, letterSpacing: "-0.035em", color: p.ink, marginTop: 26 * s }}>{p.title}</div>
        <div style={{ fontSize: 22 * s, color: p.ink2, marginTop: 10 * s }}>We sent a 6-digit code to •••• 2048</div>

        <div style={{ position: "relative", width: rowW, height: bh, marginTop: 44 * s }}>
          <div
            style={{
              position: "absolute",
              left: xs[2] + bw + gap / 2 + sep / 2 - 8 * s,
              top: bh / 2 - (STROKE.ring * s) / 2,
              width: 16 * s,
              height: STROKE.ring * s,
              borderRadius: 999,
              background: p.ink3,
            }}
          />
          {xs.map((x, i) => {
            const enterD = FIRST_DIGIT + i * sp;
            const d = progress(f, enterD, enterD + DIGIT_IN, "enter");
            const focus = Math.max(0, 1 - Math.abs(caretPos - i)) * (1 - ok);
            const pulseAt = doneF + i * STAGGER;
            const pulse = progress(f, pulseAt, pulseAt + 8, "travel") - progress(f, pulseAt + 8, pulseAt + 20, "travel");
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 0, width: bw, height: bh, transform: `scale(${1 + 0.04 * pulse})` }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, background: p.fill, boxShadow: `inset 0 0 0 ${STROKE.hair * s}px ${p.line}` }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, background: p.card, boxShadow: `inset 0 0 0 ${STROKE.ring * s}px ${p.accent}`, opacity: focus }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, boxShadow: `inset 0 0 0 ${STROKE.ring * s}px ${p.success}`, opacity: ok }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span
                    style={{
                      fontSize: 60 * s,
                      fontWeight: 500,
                      letterSpacing: "-0.035em",
                      fontVariantNumeric: "tabular-nums",
                      color: p.ink,
                      opacity: d,
                      transform: `translateY(${(1 - d) * 16 * s}px)`,
                    }}
                  >
                    {code[i]}
                  </span>
                </div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: caretX - (STROKE.ring * s) / 2,
              top: bh / 2 - 30 * s,
              width: STROKE.ring * s,
              height: 60 * s,
              borderRadius: 999,
              background: p.accent,
              opacity: caretAlpha,
            }}
          />
        </div>

        <div style={{ position: "relative", height: 44 * s, width: rowW, marginTop: 34 * s }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 * s, color: p.ink3, opacity: 1 - verified }}>
            Didn’t get it? <span style={{ color: p.ink, fontWeight: 500, marginLeft: 8 * s }}>Resend in 0:24</span>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12 * s,
              opacity: verified,
              transform: `translateY(${(1 - verified) * 12 * s}px)`,
            }}
          >
            <svg width={checkIcon} height={checkIcon} viewBox="0 0 24 24" style={{ display: "block" }}>
              <circle cx={12} cy={12} r={11} fill={p.success} />
              <path
                d="M7 12.4l3.2 3.2L17 8.8"
                fill="none"
                stroke={p.card}
                strokeWidth={(STROKE.ring * s * 24) / checkIcon}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={16}
                strokeDashoffset={16 * (1 - tick)}
              />
            </svg>
            <span style={{ fontSize: 26 * s, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink }}>Verified</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
