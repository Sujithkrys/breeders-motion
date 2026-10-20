import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type GlassNotificationProps = {
  background: string;
  blobA: string;
  blobB: string;
  icon1: string;
  icon2: string;
  icon3: string;
  text: string;
  app1: string;
  msg1: string;
  app2: string;
  msg2: string;
  app3: string;
  msg3: string;
  stagger: number; // frames between drops
  ease: string;
};

export const FIRST_DROP = 12;
export const DROP_LEN = 18;
export const EXIT_AT = 150;
export const PEEK = 22;

const GLYPHS = [
  "M4 12c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5-3.6 7.5-8 7.5c-1.2 0-2.3-.2-3.3-.6L4.5 20l1-3.6C4.6 15.1 4 13.6 4 12z",
  "M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM5 10h14M9 3v4M15 3v4",
  "M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0",
];

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const GlassNotification: React.FC<GlassNotificationProps> = (p) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { u, ratio, width, height, durationInFrames } = useLayout();
  const light = isLight(p.background);
  const w = (ratio === "16:9" ? 820 : 860) * u;
  const h = 148 * u;
  const items = [
    { app: p.app1, msg: p.msg1, icon: p.icon1 },
    { app: p.app2, msg: p.msg2, icon: p.icon2 },
    { app: p.app3, msg: p.msg3, icon: p.icon3 },
  ];
  const drops = items.map((_, i) => progress(frame, FIRST_DROP + i * p.stagger, FIRST_DROP + i * p.stagger + DROP_LEN, p.ease));
  const out = progress(frame, EXIT_AT, durationInFrames - 8, "travel");
  const phase = (frame / durationInFrames) * Math.PI * 2;

  const glass: React.CSSProperties = light
    ? {
        background: "linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.5))",
        border: `${1.5 * u}px solid rgba(255,255,255,0.9)`,
        boxShadow: `0 ${24 * u}px ${60 * u}px rgba(30,20,50,0.14), inset 0 ${1.5 * u}px 0 rgba(255,255,255,1)`,
      }
    : {
        background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.07))",
        border: `${1.5 * u}px solid rgba(255,255,255,0.2)`,
        boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.3), inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.3)`,
      };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.text, overflow: "hidden" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`gn-a-${id}`}>
            <stop offset="0%" stopColor={p.blobA} stopOpacity={light ? 0.75 : 0.85} />
            <stop offset="100%" stopColor={p.blobA} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`gn-b-${id}`}>
            <stop offset="0%" stopColor={p.blobB} stopOpacity={light ? 0.7 : 0.7} />
            <stop offset="100%" stopColor={p.blobB} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={width * 0.5 - 300 * u + Math.sin(phase) * 50 * u} cy={height * 0.5 - 170 * u + Math.cos(phase) * 30 * u} r={480 * u} fill={`url(#gn-a-${id})`} />
        <circle cx={width * 0.5 + 320 * u - Math.sin(phase) * 40 * u} cy={height * 0.5 + 200 * u - Math.cos(phase) * 40 * u} r={440 * u} fill={`url(#gn-b-${id})`} />
      </svg>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: w, height: h + PEEK * 2 * u, opacity: 1 - out, transform: `translateY(${-out * 90 * u}px) scale(${mix(1, 0.96, out)})` }}>
          {items.map((it, i) => {
            const q = drops[i];
            const s = drops.slice(i + 1).reduce((a, b) => a + b, 0);
            const content = Math.min(Math.max(1 - s * 1.4, 0), 1);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: w,
                  height: h,
                  boxSizing: "border-box",
                  borderRadius: 44 * u,
                  padding: `0 ${30 * u}px`,
                  display: "flex",
                  alignItems: "center",
                  gap: 24 * u,
                  ...glass,
                  opacity: Math.min(q * 1.6, 1) * (1 - 0.18 * s),
                  transformOrigin: "50% 100%",
                  transform: `translateY(${(1 - q) * -170 * u + s * PEEK * u}px) scale(${mix(0.92, 1, q) * (1 - 0.055 * s)})`,
                }}
              >
                <div
                  style={{
                    width: 88 * u,
                    height: 88 * u,
                    borderRadius: 22 * u,
                    flexShrink: 0,
                    background: `linear-gradient(160deg, ${alpha(it.icon, 0.78)}, ${it.icon})`,
                    boxShadow: `inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.35), 0 ${6 * u}px ${14 * u}px ${alpha(it.icon, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: content,
                  }}
                >
                  <svg width={46 * u} height={46 * u} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={GLYPHS[i]} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0, opacity: content }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 * u }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 30 * u, fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.app}</span>
                    <span style={{ fontSize: 23 * u, color: alpha(p.text, 0.5), flexShrink: 0 }}>now</span>
                  </div>
                  <div style={{ marginTop: 6 * u, fontSize: 28 * u, color: alpha(p.text, 0.78), letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.msg}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
