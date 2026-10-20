import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type CodeVerifyProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  success: string;
  onSuccess: string;
  title: string;
  subtitle: string;
  code: string;
  verified: string;
  pace: number; // frames between digits
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
export const G = {
  slotW: 176,
  slotH: 196,
  gap: 16, // between slots while typing; closes to 0 when verified
  pad: 16, // pill padding, so the outer radius is RADIUS.card + pad = RADIUS.hero
  check: 80, // check area that opens at the right as the gaps close (5 × 16), so the pill keeps its width
  badge: 64,
  digit: 104,
  title: 36,
  subtitle: 24,
  status: 26,
  caretH: 84,
} as const;
export const PILL_W = 6 * G.slotW + 5 * G.gap + 2 * G.pad; // 1168

// ---------- timeline (frames) ----------
export const timeline = (paceIn: number) => {
  const pace = Math.min(12, Math.max(6, Math.round(Number(paceIn) || 8)));
  const first = 30;
  const starts = [0, 1, 2, 3, 4, 5].map((i) => first + i * pace);
  const last = starts[5];
  const verifyA = last + 20; // "Verifying" enters (18f)
  const verifiedA = verifyA + 26; // swaps to the verified state
  return { pace, first, starts, last, ringOutA: last + 4, ringOutB: last + 16, verifyA, verifiedA, settleB: verifiedA + 24 };
};

export const digitsOf = (code: string) => (String(code).replace(/\D/g, "") + "000000").slice(0, 6).split("");

const lum = (hex: string) => {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;

export const CodeVerify: React.FC<CodeVerifyProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, u } = useLayout();
  const k = Math.min(1, (width * 0.9) / (PILL_W * u));
  const s = u * k;
  const t = timeline(p.pace);
  const digits = digitsOf(p.code);
  const dark = isDark(p.background);

  // entrances, staggered by 3
  const inTitle = progress(frame, 0, 20, p.ease);
  const inSub = progress(frame, STAGGER, STAGGER + 20, p.ease);
  const inPill = progress(frame, 2 * STAGGER, 2 * STAGGER + 22, p.ease);

  // the focus ring travels one slot per digit, then leaves
  let ringPos = 0;
  for (let i = 0; i < 5; i++) ringPos += progress(frame, t.starts[i], t.starts[i] + 8, "travel");
  const ringOp = progress(frame, 10, 28, "enter") * (1 - progress(frame, t.ringOutA, t.ringOutB, "exit"));
  const typedSince = t.starts.filter((st) => frame >= st).pop() ?? 10;
  const caretOp = Math.min(1, Math.max(0, 0.5 + 0.9 * Math.cos(((frame - typedSince) / 32) * Math.PI * 2)));

  // verify
  const wVerifying = progress(frame, t.verifyA, t.verifyA + 18, p.ease) * (1 - progress(frame, t.verifiedA, t.verifiedA + 12, "exit"));
  const wVerified = progress(frame, t.verifiedA + 6, t.verifiedA + 24, p.ease);
  const settle = progress(frame, t.verifiedA, t.settleB, "travel");
  const badge = progress(frame, t.verifiedA + 4, t.verifiedA + 24, p.ease);
  const tick = progress(frame, t.verifiedA + 10, t.verifiedA + 28, "enter");

  const gap = mix(G.gap, 0, settle) * s;
  const checkW = mix(0, G.check, settle) * s;
  const shadow = dark ? "none" : `0 ${1 * s}px ${2 * s}px rgba(0,0,0,.04), 0 ${8 * s}px ${24 * s}px rgba(0,0,0,.06)`;
  const spin = frame * 12;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: G.title * s, fontWeight: 400, letterSpacing: "-0.015em", color: p.ink, whiteSpace: "nowrap", opacity: inTitle, transform: `translateY(${(1 - inTitle) * 24 * s}px)` }}>
          {p.title}
        </div>
        <div style={{ marginTop: 12 * s, fontSize: G.subtitle * s, fontWeight: 400, color: p.ink2, whiteSpace: "nowrap", opacity: inSub, transform: `translateY(${(1 - inSub) * 24 * s}px)` }}>
          {p.subtitle}
        </div>

        {/* the pill */}
        <div
          style={{
            position: "relative",
            marginTop: 56 * s,
            display: "flex",
            alignItems: "center",
            padding: G.pad * s,
            borderRadius: RADIUS.hero * s,
            background: p.card,
            border: `${STROKE.hair * s}px solid ${p.line}`,
            boxShadow: shadow,
            opacity: inPill,
            transform: `translateY(${(1 - inPill) * 32 * s}px)`,
          }}
        >
          {digits.map((d, i) => {
            const dp = progress(frame, t.starts[i], t.starts[i] + 18, p.ease);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  marginLeft: i > 0 ? gap : 0,
                  width: G.slotW * s,
                  height: G.slotH * s,
                  borderRadius: RADIUS.card * s,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.card * s, background: p.fill, opacity: 1 - settle }} />
                <span
                  style={{
                    position: "relative",
                    fontSize: G.digit * s,
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    color: p.ink,
                    opacity: dp,
                    transform: `translateY(${(dp - 1) * 36 * s}px)`,
                  }}
                >
                  {d}
                </span>
              </div>
            );
          })}

          {/* check area opens as the gaps close */}
          <div style={{ width: checkW, height: G.slotH * s, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={G.badge * s} height={G.badge * s} viewBox="0 0 64 64" style={{ opacity: badge, transform: `scale(${mix(0.6, 1, badge)})`, flexShrink: 0 }}>
              <circle cx={32} cy={32} r={32} fill={p.success} />
              <path
                d="M20 33.5 28 41.5 44.5 24"
                fill="none"
                stroke={p.onSuccess}
                strokeWidth={STROKE.bar}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - tick}
              />
            </svg>
          </div>

          {/* focus ring + caret */}
          <div
            style={{
              position: "absolute",
              left: G.pad * s + ringPos * (G.slotW + G.gap) * s,
              top: G.pad * s,
              width: G.slotW * s,
              height: G.slotH * s,
              borderRadius: RADIUS.card * s,
              boxShadow: `inset 0 0 0 ${STROKE.ring * s}px ${p.accent}`,
              opacity: ringOp,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: STROKE.ring * s, height: G.caretH * s, borderRadius: STROKE.ring * s, background: p.accent, opacity: caretOp * (frame < t.last ? 1 : 0) }} />
          </div>
        </div>

        {/* status */}
        <div style={{ marginTop: 40 * s, height: 40 * s, display: "inline-grid", alignItems: "center", justifyItems: "center", fontSize: G.status * s, whiteSpace: "nowrap" }}>
          <span style={{ gridArea: "1 / 1", display: "flex", opacity: wVerifying }}>
            <svg width={28 * s} height={28 * s} viewBox="0 0 28 28" style={{ transform: `rotate(${spin}deg)` }}>
              <circle cx={14} cy={14} r={11} fill="none" stroke={p.line} strokeWidth={STROKE.ring} />
              <circle cx={14} cy={14} r={11} fill="none" stroke={p.ink2} strokeWidth={STROKE.ring} strokeLinecap="round" pathLength={1} strokeDasharray="0.28 0.72" />
            </svg>
          </span>
          <span style={{ gridArea: "1 / 1", fontWeight: 500, color: p.ink, opacity: wVerified, transform: `translateY(${(1 - wVerified) * 12 * s}px)` }}>{p.verified}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
