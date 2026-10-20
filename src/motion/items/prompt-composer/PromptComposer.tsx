import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type PromptComposerProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string;
  onButton: string;
  accent: string;
  prompt: string;
  placeholder: string;
  mode: string;
  speed: number; // characters per second
  ease: string;
};

export const ENTER = 20;
export const TYPE_AT = 24;
const TYPE_END_MAX = 84;
export const BARS = [92, 100, 84, 58];
export const COMPOSER_W = { wide: 1240, narrow: 920 };

// Shared with the prompt so the copied timings match the preview.
export const composerTimeline = (len: number, cps: number, fps: number) => {
  const typeEnd = Math.min(TYPE_AT + (Math.max(len, 1) / Math.max(cps, 1)) * fps, TYPE_END_MAX);
  const press = Math.round(typeEnd + 16);
  return { typeEnd, press, reply: press + 10 };
};

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};

// Stroke width in a 24-unit icon viewBox that renders as `px` design units at `size` design units.
const sw = (px: number, size: number) => (px * 24) / size;

export const PromptComposer: React.FC<PromptComposerProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio, fps } = useLayout();
  const dark = isDark(p.background);
  const w = (ratio === "16:9" ? COMPOSER_W.wide : COMPOSER_W.narrow) * u;
  const { typeEnd, press, reply } = composerTimeline(p.prompt.length, p.speed, fps);

  const enter = progress(frame, 0, ENTER, p.ease);
  const n = Math.floor(interpolate(frame, [TYPE_AT, typeEnd], [0, p.prompt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typing = frame >= TYPE_AT && frame < typeEnd;
  const sent = progress(frame, press + 4, press + 16, "travel");
  const caretOn = frame >= press + 4 ? 0 : typing ? 1 : Math.floor(frame / 15) % 2 === 0 ? 1 : 0;
  const ready = progress(frame, TYPE_AT, TYPE_AT + 8, "travel");
  const pulse = progress(frame, typeEnd, typeEnd + 16, "travel");
  const pressScale = interpolate(frame, [press, press + 4, press + 12], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + 0.04 * Math.sin(pulse * Math.PI);
  const stop = progress(frame, press + 4, press + 12, "travel");
  const r = progress(frame, reply, reply + 20, p.ease);
  const respH = 4 * 22 + 3 * 20 + 16;
  const gap = 44;
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  const iconBtn: React.CSSProperties = { width: 64 * u, height: 64 * u, borderRadius: 999, border: `${u}px solid ${p.line}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" };
  const sendLayer: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: 999, transform: `scale(${pressScale * breathe})`, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ width: w, display: "flex", flexDirection: "column", gap: gap * u, transform: `translateY(${(1 - r) * ((respH + gap) / 2) * u}px)` }}>
        <div
          style={{
            padding: `${36 * u}px ${36 * u}px ${28 * u}px`,
            borderRadius: RADIUS.card * u,
            background: p.card,
            border: `${u}px solid ${p.line}`,
            boxShadow: shadow,
            opacity: enter,
            transform: `translateY(${(1 - enter) * 24 * u}px)`,
          }}
        >
          <div style={{ minHeight: 2 * 1.4 * 36 * u, fontSize: 36 * u, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.015em", padding: `0 ${8 * u}px`, opacity: mix(1, 0.55, sent) }}>
            <span>{p.prompt.slice(0, n)}</span>
            <span style={{ display: "inline-block", width: STROKE.ring * u, height: "1.15em", marginLeft: 2 * u, marginRight: n === 0 ? 10 * u : 0, verticalAlign: "-0.2em", borderRadius: 999, background: p.accent, opacity: caretOn }} />
            {n === 0 && <span style={{ color: p.ink3 }}>{p.placeholder}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 * u, marginTop: 28 * u }}>
            <div style={iconBtn}>
              <svg width={28 * u} height={28 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink2} strokeWidth={sw(STROKE.ring, 28)} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 * u, height: 64 * u, padding: `0 ${24 * u}px`, borderRadius: 999, background: p.fill, color: p.ink2, fontSize: 24 * u, fontWeight: 500 }}>
              <svg width={26 * u} height={26 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink2} strokeWidth={sw(STROKE.hair, 26)} strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3z" />
              </svg>
              {p.mode}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", width: 72 * u, height: 72 * u }}>
              <div style={{ ...sendLayer, background: p.fill }}>
                <svg width={32 * u} height={32 * u} viewBox="0 0 24 24" fill="none" stroke={p.ink3} strokeWidth={sw(STROKE.ring, 32)} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
                </svg>
              </div>
              <div style={{ ...sendLayer, background: p.button, opacity: ready }}>
                <svg width={32 * u} height={32 * u} viewBox="0 0 24 24" fill="none" stroke={p.onButton} strokeWidth={sw(STROKE.ring, 32)} strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", opacity: 1 - stop }}>
                  <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
                </svg>
                <div style={{ position: "absolute", width: 22 * u, height: 22 * u, borderRadius: RADIUS.chip * u, background: p.onButton, opacity: stop, transform: `scale(${mix(0.5, 1, stop)})` }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 * u, padding: `0 ${28 * u}px`, height: respH * u, opacity: r, transform: `translateY(${(1 - r) * 20 * u}px)` }}>
          <div style={{ width: 48 * u, height: 48 * u, borderRadius: 999, flexShrink: 0, background: p.fill, border: `${u}px solid ${p.line}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 16 * u, height: 16 * u, borderRadius: 999, background: p.accent, transform: `scale(${0.85 + 0.15 * Math.sin(frame / 6)})` }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 * u, paddingTop: 13 * u }}>
            {BARS.map((bw, i) => {
              const at = reply + 4 + i * STAGGER;
              const show = progress(frame, at, at + 18, p.ease);
              const wave = 0.5 + 0.5 * Math.sin(frame * 0.16 - i * 0.8);
              return <div key={i} style={{ width: `${bw * mix(0.6, 1, show)}%`, height: 22 * u, borderRadius: 999, background: p.line, opacity: show * mix(0.5, 1, wave) }} />;
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
