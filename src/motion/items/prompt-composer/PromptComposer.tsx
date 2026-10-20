import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type PromptComposerProps = {
  background: string;
  surface: string;
  accent: string;
  text: string;
  prompt: string;
  placeholder: string;
  mode: string;
  speed: number; // characters per second
  ease: string;
};

export const TYPE_AT = 20;
const TYPE_END_MAX = 78;
const BARS = [92, 100, 84, 58];

// Shared with the prompt so the copied timings match the preview.
export const composerTimeline = (len: number, cps: number, fps: number) => {
  const typeEnd = Math.min(TYPE_AT + Math.max(len, 1) / Math.max(cps, 1) * fps, TYPE_END_MAX);
  const press = Math.round(typeEnd + 16);
  return { typeEnd, press, reply: press + 10 };
};

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const PromptComposer: React.FC<PromptComposerProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio, fps } = useLayout();
  const light = isLight(p.background);
  const w = (ratio === "16:9" ? 1120 : 900) * u;
  const { typeEnd, press, reply } = composerTimeline(p.prompt.length, p.speed, fps);

  const enter = progress(frame, 0, 14, p.ease);
  const n = Math.floor(interpolate(frame, [TYPE_AT, typeEnd], [0, p.prompt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typing = frame >= TYPE_AT && frame < typeEnd;
  const sent = frame >= press + 4;
  const caretOn = sent ? 0 : typing ? 1 : Math.floor(frame / 15) % 2 === 0 ? 1 : 0;
  const ready = progress(frame, TYPE_AT, TYPE_AT + 6, "travel");
  const pulse = progress(frame, typeEnd, typeEnd + 16, "travel");
  const pressScale = interpolate(frame, [press, press + 4, press + 12], [1, 0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + 0.06 * Math.sin(pulse * Math.PI);
  const stop = progress(frame, press + 4, press + 10, "travel");
  const r = progress(frame, reply, reply + 18, p.ease);
  const respH = 4 * 22 + 3 * 20 + 16;
  const gap = 44;

  const iconBtn: React.CSSProperties = { width: 64 * u, height: 64 * u, borderRadius: 32 * u, border: `${1.5 * u}px solid ${alpha(p.text, 0.14)}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <div style={{ width: w, display: "flex", flexDirection: "column", gap: gap * u, transform: `translateY(${(1 - r) * ((respH + gap) / 2) * u}px)` }}>
        <div
          style={{
            padding: `${36 * u}px ${36 * u}px ${28 * u}px`,
            borderRadius: 40 * u,
            background: p.surface,
            border: `${1.5 * u}px solid ${alpha(p.text, light ? 0.09 : 0.08)}`,
            boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,${light ? 0.1 : 0.45}), 0 ${6 * u}px ${18 * u}px rgba(0,0,0,${light ? 0.05 : 0.2})`,
            opacity: enter,
            transform: `translateY(${(1 - enter) * 28 * u}px) scale(${mix(0.97, 1, enter)})`,
          }}
        >
          <div style={{ minHeight: 2 * 1.4 * 36 * u, fontSize: 36 * u, lineHeight: 1.4, letterSpacing: "-0.015em", padding: `0 ${8 * u}px`, opacity: sent ? 0.6 : 1 }}>
            <span>{p.prompt.slice(0, n)}</span>
            <span style={{ display: "inline-block", width: 3.5 * u, height: "1.15em", marginLeft: 2 * u, marginRight: n === 0 ? 10 * u : 0, verticalAlign: "-0.2em", borderRadius: 2 * u, background: p.accent, opacity: caretOn }} />
            {n === 0 && <span style={{ color: alpha(p.text, 0.38) }}>{p.placeholder}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 * u, marginTop: 28 * u }}>
            <div style={iconBtn}>
              <svg width={28 * u} height={28 * u} viewBox="0 0 24 24" fill="none" stroke={alpha(p.text, 0.6)} strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 * u, height: 64 * u, padding: `0 ${24 * u}px`, borderRadius: 32 * u, background: alpha(p.accent, 0.12), color: p.accent, fontSize: 24 * u, fontWeight: 550 }}>
              <svg width={26 * u} height={26 * u} viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3z" />
              </svg>
              {p.mode}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", width: 72 * u, height: 72 * u }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${3 * u}px solid ${p.accent}`, opacity: pulse > 0 && pulse < 1 ? 0.6 * (1 - pulse) : 0, transform: `scale(${mix(1, 1.7, pulse)})` }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: alpha(p.text, 0.1), transform: `scale(${pressScale * breathe})` }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: p.accent,
                  opacity: ready,
                  boxShadow: `0 ${10 * u}px ${26 * u}px ${alpha(p.accent, 0.4)}`,
                  transform: `scale(${pressScale * breathe})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={32 * u} height={32 * u} viewBox="0 0 24 24" fill="none" stroke={p.surface} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", opacity: 1 - stop }}>
                  <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
                </svg>
                <div style={{ position: "absolute", width: 22 * u, height: 22 * u, borderRadius: 5 * u, background: p.surface, opacity: stop, transform: `scale(${mix(0.5, 1, stop)})` }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 * u, padding: `0 ${28 * u}px`, height: respH * u, opacity: r, transform: `translateY(${(1 - r) * 20 * u}px)` }}>
          <div style={{ width: 48 * u, height: 48 * u, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${p.accent}, ${alpha(p.accent, 0.55)})`, transform: `scale(${0.92 + 0.08 * Math.sin(frame / 5)})` }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 * u, paddingTop: 13 * u }}>
            {BARS.map((bw, i) => {
              const show = progress(frame, reply + 4 + i * 4, reply + 16 + i * 4, p.ease);
              const x = ((frame * 3.2 - i * 10) % 180) - 50;
              return (
                <div key={i} style={{ position: "relative", width: `${bw * mix(0.6, 1, show)}%`, height: 22 * u, borderRadius: 11 * u, background: alpha(p.text, light ? 0.07 : 0.08), overflow: "hidden", opacity: show }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: "45%", background: `linear-gradient(90deg, ${alpha(p.accent, 0)}, ${alpha(p.accent, light ? 0.28 : 0.35)}, ${alpha(p.accent, 0)})` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
