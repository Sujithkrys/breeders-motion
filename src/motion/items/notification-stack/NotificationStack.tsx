import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type NotificationStackProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  toast1: string;
  toast2: string;
  toast3: string;
  toast4: string;
  peek: number; // design px each older toast shows below the one in front
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 2.56, "1:1": 2.0, "9:16": 2.0 };
export const TW = 460; // toast width
export const TH = 76; // toast height
export const DROP = 20; // design px a new toast falls from (× k ≈ 40–51px)

// ---------- timeline (180-frame loop): four arrivals, each ARRIVE frames ----------
export const ARRIVALS = [8, 50, 92, 134] as const;
export const ARRIVE = 22;

export const BODIES = ["The new onboarding flow is live", "This is so much calmer than before", "You now follow each other", "Can you share the motion specs?"];

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// "@maya liked your post" → ["@maya", "liked your post"]
export const splitToast = (s: string): [string, string] => {
  const t = (s || "").trim();
  const i = t.indexOf(" ");
  return i < 0 ? [t, ""] : [t.slice(0, i), t.slice(i + 1)];
};
const initial = (handle: string) => (handle.replace(/^@/, "").charAt(0) || "?").toUpperCase();

export const NotificationStack: React.FC<NotificationStackProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const peek = Math.min(20, Math.max(8, Number(p.peek) || 14));
  const texts = [p.toast1, p.toast2, p.toast3, p.toast4];

  // c counts arrivals so far, eased; every toast's depth is derived from it, so the stack moves as one.
  const c = ARRIVALS.reduce((acc, a) => acc + progress(frame, a, a + ARRIVE, p.ease), 0);

  // sequence slots: 0–3 are on screen at frame 0 (3 in front), 4–7 arrive. Slot s shows toast s % 4.
  const slots = [0, 1, 2, 3, 4, 5, 6, 7];
  const stackH = TH + 3 * peek;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: TW * k, height: stackH * k }}>
        {slots.map((s) => {
          const depth = 3 + c - s; // <0 not yet arrived, 0 front, 1+ behind
          if (depth <= -1 || depth >= 3.2) return null;
          const idx = s % 4;
          const [handle, action] = splitToast(texts[idx]);
          const arriving = depth < 0;
          const enterT = arriving ? 1 + depth : 1; // 0 → 1 while landing
          const d = Math.max(0, depth);
          const scale = 1 - 0.06 * d;
          const y = arriving ? -DROP * (1 - enterT) : peek * d;
          const opacity = arriving ? enterT : d <= 2 ? 1 : clamp01(1 - (d - 2) / 1);
          const veil = clamp01(d * 0.32); // older toasts recede toward the canvas colour, but stay opaque
          const textO = clamp01(1 - d * 1.6);
          const dot = arriving ? enterT : clamp01(1 - d * 2.5);
          return (
            <div
              key={s}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: TW * k,
                height: TH * k,
                transformOrigin: "50% 100%",
                transform: `translateY(${y * k}px) scale(${scale})`,
                opacity,
                zIndex: 100 - Math.round(depth * 10),
                borderRadius: RADIUS.hero * u,
                background: p.card,
                border: `${hair}px solid ${p.line}`,
                boxSizing: "border-box",
                boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: `0 ${22 * k}px 0 ${16 * k}px`, gap: 14 * k, opacity: textO }}>
                <div
                  style={{
                    width: 44 * k,
                    height: 44 * k,
                    flexShrink: 0,
                    borderRadius: 999,
                    background: p.fill,
                    border: `${hair}px solid ${p.line}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17 * k,
                    fontWeight: 500,
                    color: p.ink2,
                  }}
                >
                  {initial(handle)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16 * k, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                    <span style={{ color: p.ink, fontWeight: 500 }}>{handle}</span>
                    <span style={{ color: p.ink2 }}> {action}</span>
                  </div>
                  <div style={{ marginTop: 3 * k, fontSize: 14 * k, lineHeight: 1.3, color: p.ink3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{BODIES[idx]}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 * k, flexShrink: 0 }}>
                  <span style={{ fontSize: 13 * k, color: p.ink3 }}>now</span>
                  <span style={{ width: 8 * k, height: 8 * k, borderRadius: 999, background: p.accent, opacity: dot }} />
                </div>
              </div>
              {veil > 0.001 ? <div style={{ position: "absolute", inset: 0, background: p.background, opacity: veil }} /> : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
