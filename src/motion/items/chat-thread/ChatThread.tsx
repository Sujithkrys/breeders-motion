import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type ChatThreadProps = {
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
  name: string;
  msg1: string;
  msg2: string;
  msg3: string;
  msg4: string;
  pace: number; // frames between beats
  ease: string;
};

export const ENTER = 20;
export const FIRST_MSG = 18;
export const BUBBLE_IN = 20;
export const CHAT_W = { wide: 1200, narrow: 920 };

// Outgoing messages land on beats 0 and 3, incoming ones on 2 and 5. Each reply's typing indicator starts 0.6 of a beat
// after the message before it lands, so it is on screen for at least 1.4 beats.
export const chatBeats = (pace: number) => {
  const lead = Math.round(pace * 0.6);
  return [
    { out: true, typing: -1, at: FIRST_MSG },
    { out: false, typing: FIRST_MSG + lead, at: FIRST_MSG + 2 * pace },
    { out: true, typing: -1, at: FIRST_MSG + 3 * pace },
    { out: false, typing: FIRST_MSG + 3 * pace + lead, at: FIRST_MSG + 5 * pace },
  ];
};

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};

export const ChatThread: React.FC<ChatThreadProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const dark = isDark(p.background);
  const w = (ratio === "16:9" ? CHAT_W.wide : CHAT_W.narrow) * u;
  const msgs = [p.msg1, p.msg2, p.msg3, p.msg4];
  const beats = chatBeats(p.pace);
  const enter = progress(frame, 0, ENTER, p.ease);
  const r = RADIUS.card * u;
  const tail = RADIUS.chip * u;
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          width: w,
          padding: `${36 * u}px ${40 * u}px ${44 * u}px`,
          boxSizing: "border-box",
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24 * u}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 * u }}>
          <div style={{ width: 64 * u, height: 64 * u, borderRadius: 999, background: p.fill, color: p.ink2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 * u, fontWeight: 500 }}>
            {p.name.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 * u, marginTop: 4 * u, fontSize: 22 * u, color: p.ink2 }}>
              <span style={{ width: 10 * u, height: 10 * u, borderRadius: 999, background: p.accent }} />
              Active now
            </div>
          </div>
        </div>

        <div style={{ height: STROKE.hair * u, background: p.line, margin: `${32 * u}px 0 ${28 * u}px` }} />

        <div style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 18 * u, fontWeight: 500, letterSpacing: "0.12em", color: p.ink3, marginBottom: 24 * u }}>TODAY 9:41</div>

        {beats.map((b, i) => {
          const show = progress(frame, b.at, b.at + BUBBLE_IN, p.ease);
          const typing = b.typing < 0 ? 0 : progress(frame, b.typing, b.typing + 18, p.ease) * (1 - progress(frame, b.at - 4, b.at + 8, "exit"));
          const corner = b.out ? `${r}px ${r}px ${tail}px ${r}px` : `${r}px ${r}px ${r}px ${tail}px`;
          return (
            <div key={i} style={{ position: "relative", display: "flex", justifyContent: b.out ? "flex-end" : "flex-start", marginTop: (i === 0 ? 0 : 20) * u }}>
              {b.typing >= 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 80 * u,
                    padding: `0 ${28 * u}px`,
                    borderRadius: corner,
                    background: p.fill,
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    opacity: typing,
                    transformOrigin: "0 100%",
                    transform: `scale(${mix(0.9, 1, typing)})`,
                  }}
                >
                  {[0, 1, 2].map((k) => {
                    const wave = Math.max(0, Math.sin(frame * 0.32 - k * 0.9));
                    return <span key={k} style={{ width: 12 * u, height: 12 * u, borderRadius: 999, background: p.ink3, opacity: 0.45 + 0.55 * wave, transform: `translateY(${-wave * 5 * u}px)` }} />;
                  })}
                </div>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  padding: `${20 * u}px ${30 * u}px`,
                  borderRadius: corner,
                  fontSize: 30 * u,
                  fontWeight: 400,
                  lineHeight: 1.36,
                  letterSpacing: "-0.012em",
                  background: b.out ? p.button : p.fill,
                  color: b.out ? p.onButton : p.ink,
                  opacity: Math.min(show * 1.5, 1),
                  transformOrigin: b.out ? "100% 100%" : "0 100%",
                  transform: `translateY(${(1 - show) * 12 * u}px) scale(${mix(0.9, 1, show)})`,
                }}
              >
                {msgs[i]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
