import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type AgentStepsProps = {
  background: string;
  surface: string;
  accent: string;
  text: string;
  task: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  result: string;
  stagger: number; // frames each step stays active
  ease: string;
};

export const FIRST_STEP = 16;
const ROW = 78;
const TIMES = ["1.4s", "2.1s", "0.9s", "3.2s"];

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const AgentSteps: React.FC<AgentStepsProps> = (p) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { u, ratio } = useLayout();
  const steps = [p.step1, p.step2, p.step3, p.step4];
  const S = p.stagger;
  const allDone = FIRST_STEP + steps.length * S - 6;
  const enter = progress(frame, 0, 14, p.ease);
  const done = progress(frame, allDone, allDone + 10, "travel");
  const chip = progress(frame, allDone + 4, allDone + 18, p.ease);
  const light = isLight(p.background);
  const w = (ratio === "16:9" ? 940 : 880) * u;
  const label: React.CSSProperties = { fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <svg width={w * 1.6} height={w * 1.3} style={{ position: "absolute", opacity: (light ? 0.5 : 0.35) * enter }}>
        <defs>
          <radialGradient id={`as-glow-${id}`}>
            <stop offset="0%" stopColor={p.accent} stopOpacity={0.45} />
            <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={`url(#as-glow-${id})`} />
      </svg>
      <div
        style={{
          position: "relative",
          width: w,
          padding: 48 * u,
          boxSizing: "border-box",
          borderRadius: 40 * u,
          background: p.surface,
          border: `${1.5 * u}px solid ${alpha(p.text, light ? 0.08 : 0.07)}`,
          boxShadow: `0 ${50 * u}px ${110 * u}px rgba(0,0,0,${light ? 0.12 : 0.45}), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,${light ? 0.06 : 0.25})`,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30 * u}px) scale(${mix(0.97, 1, enter)})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 * u }}>
          <div style={{ width: 68 * u, height: 68 * u, borderRadius: 20 * u, flexShrink: 0, background: `linear-gradient(135deg, ${p.accent}, ${alpha(p.accent, 0.68)})`, boxShadow: `0 ${10 * u}px ${24 * u}px ${alpha(p.accent, 0.35)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" fill="none" stroke={p.surface} strokeWidth={2.4} strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="2.4" fill={p.surface} stroke="none" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 19 * u, letterSpacing: "0.14em", color: alpha(p.text, 0.45), marginBottom: 6 * u }}>AGENT TASK</div>
            <div style={{ fontSize: 38 * u, fontWeight: 600, letterSpacing: "-0.035em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.task}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * u, height: 50 * u, padding: `0 ${22 * u}px`, borderRadius: 25 * u, background: alpha(p.accent, 0.14), color: p.accent, fontSize: 22 * u, fontWeight: 600, flexShrink: 0 }}>
            <span style={{ width: 12 * u, height: 12 * u, borderRadius: "50%", background: p.accent, opacity: done > 0 ? 1 : 0.55 + 0.45 * Math.sin(frame / 4) }} />
            <span style={{ opacity: Math.abs(done * 2 - 1) }}>{done < 0.5 ? "Working" : "Done"}</span>
          </div>
        </div>

        <div style={{ height: 1.5 * u, background: alpha(p.text, 0.08), margin: `${36 * u}px 0 ${26 * u}px` }} />

        {steps.map((s, i) => {
          const at = FIRST_STEP + i * S;
          const doneAt = at + S - 6;
          const appear = progress(frame, at, at + 10, p.ease);
          const d = progress(frame, doneAt, doneAt + 9, "spring");
          const dLin = progress(frame, doneAt, doneAt + 9, "travel");
          const active = frame >= at && dLin < 1;
          const band = (((frame - at) * 3.4) % 150) - 25;
          const mask = `linear-gradient(90deg, transparent ${band - 18}%, #000 ${band}%, transparent ${band + 18}%)`;
          const line = i < steps.length - 1 ? progress(frame, doneAt + 2, at + S + 6, "travel") : 0;
          return (
            <div key={i} style={{ position: "relative", height: ROW * u, display: "flex", alignItems: "center", gap: 24 * u, opacity: appear, transform: `translateY(${(1 - appear) * 18 * u}px)` }}>
              {i < steps.length - 1 && (
                <div style={{ position: "absolute", left: 21 * u - 1 * u, top: (ROW / 2 + 26) * u, width: 2 * u, height: (ROW - 52) * u, background: alpha(p.text, 0.1), borderRadius: u, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: `${line * 100}%`, background: p.accent }} />
                </div>
              )}
              <div style={{ position: "relative", width: 42 * u, height: 42 * u, flexShrink: 0 }}>
                <svg width={42 * u} height={42 * u} viewBox="0 0 42 42" style={{ position: "absolute", opacity: 1 - dLin, transform: `rotate(${frame * 14}deg)` }}>
                  <circle cx="21" cy="21" r="16" fill="none" stroke={alpha(p.text, 0.12)} strokeWidth={3.5} />
                  <circle cx="21" cy="21" r="16" fill="none" stroke={p.accent} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="28 100.5" />
                </svg>
                <svg width={42 * u} height={42 * u} viewBox="0 0 42 42" style={{ position: "absolute", opacity: dLin, transform: `scale(${mix(0.4, 1, d)})` }}>
                  <circle cx="21" cy="21" r="19" fill={p.accent} />
                  <path d="M13 21.5l5.5 5.5L29.5 16" fill="none" stroke={p.surface} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="26" strokeDashoffset={26 * (1 - dLin)} />
                </svg>
              </div>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <div style={{ ...label, color: alpha(p.text, mix(0.42, 0.9, dLin)) }}>{s}</div>
                <div style={{ ...label, position: "absolute", left: 0, top: 0, right: 0, color: p.text, opacity: active ? 1 - dLin : 0, maskImage: mask, WebkitMaskImage: mask }}>{s}</div>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 22 * u, color: alpha(p.text, 0.4), opacity: dLin, flexShrink: 0 }}>{TIMES[i]}</span>
            </div>
          );
        })}

        <div
          style={{
            marginTop: 28 * u,
            display: "flex",
            alignItems: "center",
            gap: 18 * u,
            padding: `${20 * u}px ${24 * u}px`,
            borderRadius: 24 * u,
            background: alpha(p.accent, 0.12),
            border: `${1.5 * u}px solid ${alpha(p.accent, 0.35)}`,
            opacity: chip,
            transform: `translateY(${(1 - chip) * 22 * u}px) scale(${mix(0.96, 1, chip)})`,
          }}
        >
          <svg width={38 * u} height={38 * u} viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
          <span style={{ flex: 1, minWidth: 0, fontSize: 27 * u, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.result}</span>
          <svg width={30 * u} height={30 * u} viewBox="0 0 24 24" fill="none" stroke={alpha(p.text, 0.55)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
