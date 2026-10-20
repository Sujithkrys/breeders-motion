import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type AppDockProps = {
  background: string;
  dock: string;
  ink: string;
  iconA: string;
  iconB: string;
  iconC: string;
  label: string;
  magnify: number; // peak icon scale under the cursor
  active: number; // 1–7, the icon that launches
  ease: string;
};

// Blend two hex colours so the seven icons step evenly along the palette ramp.
const hexMix = (a: string, b: string, t: number) => {
  const rgb = (h: string) => {
    const s = h.replace("#", "");
    const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const x = rgb(a);
  const y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

const ramp = (a: string, b: string, c: string, t: number) => (t < 0.5 ? hexMix(a, b, t * 2) : hexMix(b, c, (t - 0.5) * 2));

// Simple 24×24 line glyphs: folder, compass, chat, music, calendar, camera, sliders.
const Glyph: React.FC<{ i: number; size: number }> = ({ i, size }) => {
  const common = { fill: "none", stroke: "#FFFFFF", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      {i === 0 && <path {...common} d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z M3.5 10h17" />}
      {i === 1 && (
        <>
          <circle {...common} cx={12} cy={12} r={8.5} />
          <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" fill="#FFFFFF" />
        </>
      )}
      {i === 2 && <path {...common} d="M5.5 5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.2V17h-1.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />}
      {i === 3 && (
        <>
          <path {...common} d="M9.5 17.5V6.5l9-2v11" />
          <circle cx={7.2} cy={17.5} r={2.4} fill="#FFFFFF" />
          <circle cx={16.2} cy={15.5} r={2.4} fill="#FFFFFF" />
        </>
      )}
      {i === 4 && <path {...common} d="M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5z M4 10h16 M8.5 3.5v4 M15.5 3.5v4 M8 14h2 M12 14h2 M8 17h2" />}
      {i === 5 && (
        <>
          <path {...common} d="M5 7.5h2.5l1.6-2.2h5.8l1.6 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 5 7.5z" />
          <circle {...common} cx={12} cy={13} r={3.3} />
        </>
      )}
      {i === 6 && (
        <>
          <path {...common} d="M4 7h16 M4 12h16 M4 17h16" />
          <circle cx={9} cy={7} r={2.2} fill="#FFFFFF" />
          <circle cx={15.5} cy={12} r={2.2} fill="#FFFFFF" />
          <circle cx={7.5} cy={17} r={2.2} fill="#FFFFFF" />
        </>
      )}
    </svg>
  );
};

// One parabolic hop: rises and lands like a ball under gravity.
const hop = (f: number, start: number, dur: number, h: number) => {
  const x = (f - start) / dur;
  return x > 0 && x < 1 ? h * 4 * x * (1 - x) : 0;
};

const COUNT = 7;
const RUNNING = [0, 3];

export const AppDock: React.FC<AppDockProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const a = Math.min(COUNT - 1, Math.max(0, Math.round(p.active) - 1));

  const s = (ratio === "16:9" ? 112 : 96) * u;
  const gap = s * 0.16;
  const pad = s * 0.17;
  const step = s + gap;

  // Cursor path in icon-index units: sweep left → right, then come back and rest on the active icon.
  const sweep = progress(f, 22, 70, "soft");
  const back = progress(f, 70, 90, p.ease);
  const c = f < 70 ? -1.2 + sweep * 7.8 : 6.6 + (a - 6.6) * back;
  const amp = progress(f, 20, 34, "smooth");
  const sigma = 1.1;
  const scales = Array.from({ length: COUNT }, (_, i) => 1 + (p.magnify - 1) * amp * Math.exp(-((i - c) ** 2) / (2 * sigma * sigma)));
  const widths = scales.map((k) => s * k);
  const total = widths.reduce((acc, w) => acc + w, 0) + gap * (COUNT - 1);
  const lefts: number[] = [];
  widths.reduce((x, w) => {
    lefts.push(x);
    return x + w + gap;
  }, -total / 2);
  const centres = lefts.map((l, i) => l + widths[i] / 2);
  const ci = Math.floor(c);
  const cursorX =
    c <= 0 ? centres[0] + c * step : c >= COUNT - 1 ? centres[COUNT - 1] + (c - COUNT + 1) * step : centres[ci] + (centres[ci + 1] - centres[ci]) * (c - ci);

  const rise = progress(f, 0, 22, p.ease);
  const cx = width / 2;
  const bottom = height / 2 + s * 0.9 + (1 - rise) * 80 * u;
  const iconBase = bottom - pad;

  const bounce = hop(f, 96, 22, s * 0.5) + hop(f, 118, 16, s * 0.22);
  const press = 1 - 0.12 * (progress(f, 90, 94, "soft") - progress(f, 94, 100, "soft"));
  const tip = progress(f, 86, 100, p.ease);
  const newDot = progress(f, 110, 124, "bouncy");
  const cursorIn = progress(f, 18, 28, "smooth");

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: cx - total * 0.45,
          top: bottom - s * 1.4,
          width: total * 0.9,
          height: s * 1.6,
          borderRadius: "50%",
          background: alpha(p.iconB, 0.22),
          filter: `blur(${90 * u}px)`,
          opacity: rise,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - total / 2 - pad,
          top: bottom - s - pad * 2,
          width: total + pad * 2,
          height: s + pad * 2,
          borderRadius: s * 0.36,
          background: `linear-gradient(180deg, ${alpha(p.dock, 0.94)}, ${alpha(p.dock, 0.8)})`,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.12)}`,
          boxShadow: `0 ${30 * u}px ${70 * u}px rgba(0,0,0,0.32), inset 0 ${1.5 * u}px 0 ${alpha(p.ink, 0.08)}`,
          boxSizing: "border-box",
          opacity: rise,
        }}
      />
      {widths.map((w, i) => {
        const col = ramp(p.iconA, p.iconB, p.iconC, i / (COUNT - 1));
        const y = i === a ? bounce : 0;
        const k = i === a ? press : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + lefts[i],
              top: iconBase - w - y,
              width: w,
              height: w,
              borderRadius: w * 0.235,
              background: `linear-gradient(160deg, ${hexMix(col, "#FFFFFF", 0.28)}, ${col} 55%, ${hexMix(col, "#000000", 0.22)})`,
              boxShadow: `0 ${w * 0.08}px ${w * 0.18}px rgba(0,0,0,0.28)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              opacity: rise,
              transform: `scale(${k})`,
              transformOrigin: "50% 100%",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 52%)" }} />
            <Glyph i={i} size={w * 0.54} />
          </div>
        );
      })}
      {RUNNING.filter((i) => i !== a).map((i) => (
        <div key={i} style={{ position: "absolute", left: cx + centres[i] - 3.5 * u, top: bottom - pad * 0.62, width: 7 * u, height: 7 * u, borderRadius: "50%", background: alpha(p.ink, 0.7), opacity: rise }} />
      ))}
      <div
        style={{
          position: "absolute",
          left: cx + centres[a] - 3.5 * u,
          top: bottom - pad * 0.62,
          width: 7 * u,
          height: 7 * u,
          borderRadius: "50%",
          background: p.ink,
          transform: `scale(${newDot})`,
          boxShadow: `0 0 ${10 * u}px ${alpha(p.ink, 0.6)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx + centres[a] - 300 * u,
          top: iconBase - widths[a] - 22 * u - 58 * u + (1 - tip) * 10 * u,
          width: 600 * u,
          height: 58 * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: tip,
        }}
      >
        <div
          style={{
            padding: `${10 * u}px ${22 * u}px`,
            borderRadius: 14 * u,
            background: alpha(p.dock, 0.97),
            border: `${1.5 * u}px solid ${alpha(p.ink, 0.14)}`,
            boxShadow: `0 ${12 * u}px ${30 * u}px rgba(0,0,0,0.28)`,
            color: p.ink,
            fontSize: 26 * u,
            lineHeight: 1.2,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {p.label}
        </div>
      </div>
      <svg
        width={34 * u}
        height={34 * u}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: cx + cursorX - 6 * u,
          top: iconBase - s * 0.55 - 4 * u,
          opacity: cursorIn,
          transform: `scale(${press})`,
          transformOrigin: "20% 15%",
        }}
      >
        <path d="M5 3l13.5 9.2-6 1.1 3.4 6.6-2.6 1.3-3.4-6.6-4.9 3.9z" fill="rgba(0,0,0,0.28)" transform="translate(0.6 1.2)" />
        <path d="M5 3l13.5 9.2-6 1.1 3.4 6.6-2.6 1.3-3.4-6.6-4.9 3.9z" fill="#FFFFFF" stroke="#111114" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
