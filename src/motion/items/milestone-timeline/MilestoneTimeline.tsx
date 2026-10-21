import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type MilestoneTimelineProps = {
  background: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  title1: string;
  title2: string;
  title3: string;
  title4: string;
  title5: string;
  date1: string;
  date2: string;
  date3: string;
  date4: string;
  date5: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
// 16:9 puts the date left of the spine and the text right of it; 1:1 and 9:16 stack date, title and body to the right.
export const GEO: Record<Ratio, { S: number; title: number; body: number; date: number; node: number; cam: [number, number]; stacked: boolean }> = {
  "16:9": { S: 230, title: 46, body: 24, date: 20, node: 26, cam: [1.15, 2.85], stacked: false },
  "1:1": { S: 214, title: 42, body: 23, date: 19, node: 24, cam: [1.2, 2.8], stacked: true },
  "9:16": { S: 300, title: 50, body: 26, date: 21, node: 28, cam: [1.5, 2.5], stacked: true },
};
export const BODIES = [
  "Two founders, one shared doc and a prototype.",
  "All by word of mouth, with no paid ads.",
  "$4.2M led by early product investors.",
  "Twenty people across Lisbon and Toronto.",
  "Open to everyone, in 40 countries.",
];

// ---------- timeline (180-frame loop) ----------
// The fill travels node to node (22 frames each, 4-frame rest), holds, rewinds to the first node, then holds still.
export const T = { segA: 14, seg: 26, travel: 22, rise: 20, resetA: 140, resetB: 164 } as const;
export const arrival = (i: number) => T.segA + (i - 1) * T.seg + T.travel;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const g = GEO[ratio];
  const S = g.S * u;
  const titles = [p.title1, p.title2, p.title3, p.title4, p.title5];
  const dates = [p.date1, p.date2, p.date3, p.date4, p.date5];

  // ---- progress along the spine, in node units 0 → 4
  const resetting = frame >= T.resetA;
  let f = 0;
  if (resetting) f = 4 * (1 - progress(frame, T.resetA, T.resetB, "travel"));
  else for (let i = 1; i <= 4; i++) f = Math.max(f, i - 1 + progress(frame, T.segA + (i - 1) * T.seg, T.segA + (i - 1) * T.seg + T.travel, "travel"));

  // ---- camera follows the fill
  const camY = mix(g.cam[0], g.cam[1], f / 4) * S + (g.stacked ? 56 * u : 0);
  const originY = height / 2 - camY;

  // ---- columns
  const SX = g.stacked ? (isVertical ? 140 : 170) * u : width / 2 - 254 * u;
  const textX = g.stacked ? SX + 52 * u : SX + 56 * u;
  const textW = g.stacked ? width - textX - 70 * u : 720 * u;

  const filled = (i: number) => {
    if (i === 0) return 1;
    if (resetting) return clamp01((f - i + 0.12) / 0.12);
    return frame >= arrival(i) ? 1 : 0;
  };
  const pop = (i: number) => {
    if (i === 0 || resetting) return 1;
    const a = arrival(i);
    return interpolate(frame, [a, a + 6, a + 16], [0.5, 1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };
  const textIn = (i: number) => {
    if (i === 0) return 1;
    const a = arrival(i);
    if (resetting) return 1 - progress(frame, T.resetA + 3 * (4 - i), T.resetA + 3 * (4 - i) + 14, "exit");
    return progress(frame, a - 2, a - 2 + T.rise, "enter");
  };

  const ring = (i: number) => {
    const y = originY + i * S;
    const n = g.node * u;
    const on = filled(i);
    return (
      <React.Fragment key={`n${i}`}>
        <div style={{ position: "absolute", left: SX - n / 2, top: y - n / 2, width: n, height: n, borderRadius: 999, background: p.background, boxShadow: `inset 0 0 0 ${STROKE.ring * u}px ${alpha(p.ink, 0.28)}` }} />
        {on > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: SX - n / 2,
              top: y - n / 2,
              width: n,
              height: n,
              borderRadius: 999,
              background: p.accent,
              opacity: on,
              transform: `scale(${pop(i) * mix(0.6, 1, on)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: n * 0.3, height: n * 0.3, borderRadius: 999, background: p.background }} />
          </div>
        ) : null}
      </React.Fragment>
    );
  };

  const label = (i: number) => {
    const y = originY + i * S;
    const t = textIn(i);
    const date = String(dates[i]).toUpperCase();
    const dateStyle: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: g.date * u, letterSpacing: "0.12em", color: i === 0 || filled(i) > 0.5 ? p.ink2 : p.ink3, whiteSpace: "nowrap", lineHeight: 1 };
    const block = (
      <div style={{ opacity: t, transform: `translateY(${(1 - t) * 24 * u}px)` }}>
        <div style={{ fontSize: g.title * u, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.12, color: p.ink }}>{titles[i]}</div>
        <div style={{ marginTop: 10 * u, fontSize: g.body * u, lineHeight: 1.3, color: p.ink2 }}>{BODIES[i]}</div>
      </div>
    );
    if (g.stacked) {
      return (
        <React.Fragment key={`t${i}`}>
          <div style={{ position: "absolute", left: textX, top: y - (g.date * u) / 2, ...dateStyle }}>{date}</div>
          <div style={{ position: "absolute", left: textX, top: y + 26 * u, width: textW }}>{block}</div>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment key={`t${i}`}>
        <div style={{ position: "absolute", left: SX - 48 * u - 300 * u, width: 300 * u, top: y - (g.date * u) / 2, textAlign: "right", ...dateStyle }}>{date}</div>
        <div style={{ position: "absolute", left: textX, top: y - g.title * u * 0.6, width: textW }}>{block}</div>
      </React.Fragment>
    );
  };

  const bar = STROKE.bar * u;
  const hairW = STROKE.hair * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* spine and progress fill */}
      <div style={{ position: "absolute", left: SX - hairW / 2, top: originY, width: hairW, height: 4 * S, background: alpha(p.ink, 0.2) }} />
      <div style={{ position: "absolute", left: SX - bar / 2, top: originY - bar / 2, width: bar, height: f * S + bar, borderRadius: RADIUS.chip * u, background: p.accent }} />
      {[0, 1, 2, 3, 4].map(ring)}
      {[0, 1, 2, 3, 4].map(label)}
    </AbsoluteFill>
  );
};
