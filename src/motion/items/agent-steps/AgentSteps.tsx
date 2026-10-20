import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type AgentStepsProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  success: string;
  task: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  result: string;
  stagger: number; // frames each step stays active
  ease: string;
};

export const ENTER = 20; // card entrance
export const FIRST_STEP = 18;
export const ROW = 80;
export const CARD_W = { wide: 1240, narrow: 920 };
const TIMES = ["1.4s", "2.1s", "0.9s", "3.2s"];

// Shared with the prompt so the copied timings match the preview.
export const stepsTimeline = (stagger: number) => {
  const allDone = FIRST_STEP + 4 * stagger - 6;
  return { allDone, chipAt: allDone + 4 };
};

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};

// Stroke width in a 24-unit icon viewBox that renders as `px` design units at `size` design units.
const sw = (px: number, size: number) => (px * 24) / size;

export const AgentSteps: React.FC<AgentStepsProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const steps = [p.step1, p.step2, p.step3, p.step4];
  const S = p.stagger;
  const { allDone, chipAt } = stepsTimeline(S);
  const dark = isDark(p.background);
  const enter = progress(frame, 0, ENTER, p.ease);
  const done = progress(frame, allDone, allDone + 12, "travel");
  const chip = progress(frame, chipAt, chipAt + 20, p.ease);
  const wide = ratio === "16:9";
  const w = (wide ? CARD_W.wide : CARD_W.narrow) * u;
  const pad = (wide ? 56 : 48) * u;
  const label: React.CSSProperties = { fontSize: 30 * u, fontWeight: 400, letterSpacing: "-0.012em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          position: "relative",
          width: w,
          padding: pad,
          boxSizing: "border-box",
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxShadow: shadow,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24 * u}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 * u }}>
          <div style={{ width: 64 * u, height: 64 * u, borderRadius: RADIUS.button * u, flexShrink: 0, background: p.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={32 * u} height={32 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink2} strokeWidth={sw(STROKE.ring, 32)} strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="2.4" fill={p.ink2} stroke="none" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18 * u, fontWeight: 500, letterSpacing: "0.12em", color: p.ink3, marginBottom: 8 * u }}>AGENT TASK</div>
            <div style={{ fontSize: 36 * u, fontWeight: 500, letterSpacing: "-0.025em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.task}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * u, height: 48 * u, padding: `0 ${20 * u}px`, borderRadius: 999, background: p.fill, color: p.ink2, fontSize: 22 * u, fontWeight: 500, flexShrink: 0 }}>
            <span style={{ position: "relative", width: 10 * u, height: 10 * u }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: p.accent, opacity: (1 - done) * (done > 0 ? 1 : 0.6 + 0.4 * Math.sin(frame / 5)) }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: p.success, opacity: done }} />
            </span>
            <span style={{ opacity: Math.abs(done * 2 - 1) }}>{done < 0.5 ? "Working" : "Done"}</span>
          </div>
        </div>

        <div style={{ height: STROKE.hair * u, background: p.line, margin: `${36 * u}px 0 ${24 * u}px` }} />

        {steps.map((s, i) => {
          const at = FIRST_STEP + i * S;
          const doneAt = at + S - 6;
          const appear = progress(frame, at, at + 18, p.ease);
          const d = progress(frame, doneAt, doneAt + 12, "spring");
          const dLin = progress(frame, doneAt, doneAt + 12, "travel");
          const active = frame >= at && dLin < 1;
          const band = (((frame - at) * 3.4) % 150) - 25;
          const mask = `linear-gradient(90deg, transparent ${band - 18}%, ${p.ink} ${band}%, transparent ${band + 18}%)`;
          const link = i < steps.length - 1 ? progress(frame, doneAt + 2, at + S + 6, "travel") : 0;
          return (
            <div key={i} style={{ position: "relative", height: ROW * u, display: "flex", alignItems: "center", gap: 24 * u, opacity: appear, transform: `translateY(${(1 - appear) * 16 * u}px)` }}>
              {i < steps.length - 1 && (
                <div style={{ position: "absolute", left: (22 - STROKE.hair / 2) * u, top: (ROW / 2 + 24) * u, width: STROKE.hair * u, height: (ROW - 48) * u, background: p.line, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: `${link * 100}%`, background: p.ink3 }} />
                </div>
              )}
              <div style={{ position: "relative", width: 44 * u, height: 44 * u, flexShrink: 0 }}>
                <svg width={44 * u} height={44 * u} viewBox="0 0 44 44" style={{ position: "absolute", opacity: 1 - dLin, transform: `rotate(${frame * 12}deg)` }}>
                  <circle cx="22" cy="22" r="17" fill="none" stroke={p.line} strokeWidth={STROKE.ring} />
                  <circle cx="22" cy="22" r="17" fill="none" stroke={p.accent} strokeWidth={STROKE.ring} strokeLinecap="round" strokeDasharray="30 107" />
                </svg>
                <svg width={44 * u} height={44 * u} viewBox="0 0 44 44" style={{ position: "absolute", opacity: dLin, transform: `scale(${mix(0.6, 1, d)})` }}>
                  <circle cx="22" cy="22" r="20" fill={p.ink} />
                  <path d="M13.6 22.5l5.8 5.8L30.9 16.8" fill="none" stroke={p.card} strokeWidth={STROKE.ring} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="25" strokeDashoffset={25 * (1 - dLin)} />
                </svg>
              </div>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <div style={{ ...label, color: p.ink3, opacity: 1 - dLin }}>{s}</div>
                <div style={{ ...label, position: "absolute", left: 0, top: 0, right: 0, color: p.ink2, opacity: dLin }}>{s}</div>
                <div style={{ ...label, position: "absolute", left: 0, top: 0, right: 0, color: p.ink, opacity: active ? 1 - dLin : 0, maskImage: mask, WebkitMaskImage: mask }}>{s}</div>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 22 * u, color: p.ink3, opacity: dLin, flexShrink: 0 }}>{TIMES[i]}</span>
            </div>
          );
        })}

        <div
          style={{
            marginTop: 24 * u,
            display: "flex",
            alignItems: "center",
            gap: 18 * u,
            padding: `${20 * u}px ${24 * u}px`,
            borderRadius: RADIUS.button * u,
            background: p.fill,
            opacity: chip,
            transform: `translateY(${(1 - chip) * 16 * u}px)`,
          }}
        >
          <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink2} strokeWidth={sw(STROKE.ring, 34)} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
          <span style={{ flex: 1, minWidth: 0, fontSize: 26 * u, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.result}</span>
          <svg width={28 * u} height={28 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink3} strokeWidth={sw(STROKE.ring, 28)} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
