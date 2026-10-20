import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type ChatThreadProps = {
  background: string;
  surface: string;
  accent: string;
  accentText: string;
  text: string;
  name: string;
  msg1: string;
  msg2: string;
  msg3: string;
  msg4: string;
  pace: number; // frames between beats
  ease: string;
};

export const FIRST_MSG = 10;

// Beat indices on the pace grid: outgoing messages land on 0 and 3; incoming ones get a typing beat first (1 → 2, 4 → 5).
export const chatBeats = (pace: number) => [
  { out: true, typing: -1, at: FIRST_MSG },
  { out: false, typing: FIRST_MSG + pace, at: FIRST_MSG + 2 * pace },
  { out: true, typing: -1, at: FIRST_MSG + 3 * pace },
  { out: false, typing: FIRST_MSG + 4 * pace, at: FIRST_MSG + 5 * pace },
];

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const ChatThread: React.FC<ChatThreadProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const light = isLight(p.background);
  const w = (ratio === "16:9" ? 900 : 860) * u;
  const msgs = [p.msg1, p.msg2, p.msg3, p.msg4];
  const beats = chatBeats(p.pace);
  const head = progress(frame, 0, 12, p.ease);
  const lift = `0 ${6 * u}px ${18 * u}px rgba(0,0,0,${light ? 0.06 : 0.22})`;
  const r = 34 * u;
  const tail = 10 * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <div style={{ width: w, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 * u, marginBottom: 44 * u, opacity: head, transform: `translateY(${(1 - head) * 14 * u}px)` }}>
          <div style={{ width: 72 * u, height: 72 * u, borderRadius: "50%", background: `linear-gradient(135deg, ${alpha(p.accent, 0.7)}, ${p.accent})`, color: p.accentText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 * u, fontWeight: 600 }}>
            {p.name.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 32 * u, fontWeight: 600, letterSpacing: "-0.025em" }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 * u, marginTop: 4 * u, fontSize: 22 * u, color: alpha(p.text, 0.5) }}>
              <span style={{ width: 10 * u, height: 10 * u, borderRadius: "50%", background: p.accent }} />
              Active now
            </div>
          </div>
        </div>

        {beats.map((b, i) => {
          const show = progress(frame, b.at, b.at + 14, p.ease);
          const typing = b.typing < 0 ? 0 : progress(frame, b.typing, b.typing + 8, p.ease) * (1 - progress(frame, b.at - 2, b.at + 3, "travel"));
          const corner = b.out ? `${r}px ${r}px ${tail}px ${r}px` : `${r}px ${r}px ${r}px ${tail}px`;
          return (
            <div key={i} style={{ position: "relative", display: "flex", justifyContent: b.out ? "flex-end" : "flex-start", marginTop: (i === 0 ? 0 : 22) * u }}>
              {b.typing >= 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 76 * u,
                    padding: `0 ${28 * u}px`,
                    borderRadius: corner,
                    background: p.surface,
                    boxShadow: lift,
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    opacity: typing,
                    transformOrigin: "0 100%",
                    transform: `scale(${mix(0.7, 1, typing)})`,
                  }}
                >
                  {[0, 1, 2].map((k) => {
                    const wave = Math.max(0, Math.sin(frame * 0.35 - k * 0.9));
                    return <span key={k} style={{ width: 14 * u, height: 14 * u, borderRadius: "50%", background: alpha(p.text, 0.35 + 0.4 * wave), transform: `translateY(${-wave * 6 * u}px)` }} />;
                  })}
                </div>
              )}
              <div
                style={{
                  maxWidth: "74%",
                  padding: `${22 * u}px ${32 * u}px`,
                  borderRadius: corner,
                  fontSize: 32 * u,
                  lineHeight: 1.36,
                  letterSpacing: "-0.012em",
                  background: b.out ? `linear-gradient(180deg, ${alpha(p.accent, 0.9)}, ${p.accent})` : p.surface,
                  color: b.out ? p.accentText : p.text,
                  boxShadow: b.out ? `0 ${10 * u}px ${26 * u}px ${alpha(p.accent, light ? 0.22 : 0.28)}` : lift,
                  opacity: Math.min(show * 1.5, 1),
                  transformOrigin: b.out ? "100% 100%" : "0 100%",
                  transform: `translateY(${(1 - show) * 24 * u}px) scale(${mix(0.86, 1, show)})`,
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
