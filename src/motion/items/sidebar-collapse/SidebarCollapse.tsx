import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type SidebarCollapseProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  workspace: string;
  greeting: string;
  section1: string;
  section2: string;
  active: string;
  morph: number; // frames the width morph takes
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, { k: number; h: number }> = {
  "16:9": { k: 1.25, h: 680 },
  "1:1": { k: 0.88, h: 700 },
  "9:16": { k: 0.88, h: 1500 },
};
export const W = 1088; // whole subject: sidebar + main panel
export const SW = 264; // expanded sidebar
export const RW = 72; // icon rail
export const ROW_H = 40;
export const PAD = 12;

// ---------- timeline (frames, 180-frame loop) ----------
export const T = {
  mv1A: 14, mv1B: 36,
  click1: 40,
  colA: 42,
  labOutB: 54,
  divInA: 52, divInB: 64,
  mv2A: 66, mv2B: 88,
  mv3A: 94, mv3B: 114,
  click2: 118,
  expA: 120,
  divOutB: 132,
  labInA: 130, labInB: 150,
  mv4A: 140, mv4B: 164,
} as const;

// ---------- helpers ----------
const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

const ICONS = {
  toggle: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9.5 4v16",
  search: "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM15.5 15.5 20 20",
  ask: "M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9-4.9-1.9 4.9-1.9zM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  dashboard: "M5.5 4h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3A1.5 1.5 0 0 1 5.5 4zM15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3A1.5 1.5 0 0 1 15.5 4zM5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3A1.5 1.5 0 0 1 5.5 14zM15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5z",
  calendar: "M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M8.5 3v4M15.5 3v4",
  conversations: "M6 4.5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5v-3.5H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z",
  contacts: "M12 5.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5",
  automations: "M13 3 5.5 13.5H11L10 21l7.5-10.5H12z",
} as const;
type IconName = keyof typeof ICONS;

const Icon: React.FC<{ name: IconName; size: number; color: string }> = ({ name, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE.hair} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={ICONS[name]} />
  </svg>
);

const BARS = [38, 52, 44, 61, 48, 70, 58, 66, 54, 78, 63, 84, 72, 92];

type Entry =
  | { kind: "search" }
  | { kind: "item"; icon: IconName; label: string; active?: boolean; dot?: boolean }
  | { kind: "header"; label: string }
  | { kind: "gap"; h: number };

// ---------- component ----------
export const SidebarCollapse: React.FC<SidebarCollapseProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const cfg = SCALE[ratio];
  const k = cfg.k * u;
  const H = cfg.h;
  const dark = isDark(p.background);
  const shadow = dark ? "none" : `0 ${k}px ${2 * k}px rgba(0,0,0,0.04), 0 ${8 * k}px ${24 * k}px rgba(0,0,0,0.06)`;
  const chipShadow = dark ? "none" : `0 ${k}px ${2 * k}px rgba(0,0,0,0.05), 0 ${3 * k}px ${10 * k}px rgba(0,0,0,0.05)`;
  const L = Math.min(28, Math.max(16, Math.round(Number(p.morph) || 22)));

  // state
  const c = clamp01(progress(frame, T.colA, T.colA + L, p.ease) - progress(frame, T.expA, T.expA + L, p.ease));
  const lab = frame < T.expA ? 1 - progress(frame, T.colA, T.labOutB, "exit") : progress(frame, T.labInA, T.labInB, "enter");
  const div = frame < T.expA ? progress(frame, T.divInA, T.divInB, "enter") : 1 - progress(frame, T.expA, T.divOutB, "exit");
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.max(bump(T.click1), bump(T.click2));
  const hover = clamp01(
    progress(frame, T.mv1B - 4, T.mv1B + 2, "enter") - progress(frame, T.colA + 2, T.colA + 8, "exit") + progress(frame, T.mv3B - 4, T.mv3B + 2, "enter") - progress(frame, T.expA + 2, T.expA + 8, "exit"),
  );

  const sideW = mix(SW, RW, c);
  const rowW = mix(SW - 2 * PAD, RW - 2 * PAD, c);
  const toggleX = mix(SW - PAD - 36, (RW - 36) / 2, c);

  // sidebar entries
  const entries: Entry[] = [
    { kind: "search" },
    { kind: "item", icon: "ask", label: `Ask ${p.workspace}` },
    { kind: "gap", h: 8 },
    { kind: "header", label: p.section1 },
    { kind: "item", icon: "dashboard", label: p.active, active: true },
    { kind: "item", icon: "calendar", label: "Calendar" },
    { kind: "gap", h: 8 },
    { kind: "header", label: p.section2 },
    { kind: "item", icon: "conversations", label: "Conversations", dot: true },
    { kind: "item", icon: "contacts", label: "Contacts" },
    { kind: "item", icon: "automations", label: "Automations" },
  ];
  const headerH = mix(36, 17, c);
  let y = 76;
  const placed = entries.map((e) => {
    const top = y;
    if (e.kind === "gap") y += e.h;
    else if (e.kind === "header") y += headerH;
    else y += ROW_H + 4;
    return { e, top };
  });

  // cursor (design coords)
  const P0: Pt = [W * 0.64, H * 0.4];
  const P1: Pt = [W * 0.5, H * 0.56];
  const Te: Pt = [SW - PAD - 18 + 3, 40 + 4];
  const Tc: Pt = [RW / 2 + 3, 40 + 4];
  let cur: Pt = P0;
  // the cursor stays put after each click while the toggle slides out from under it
  if (frame >= T.mv4A) cur = glide(Tc, P0, progress(frame, T.mv4A, T.mv4B, "travel"));
  else if (frame >= T.mv3A) cur = glide(P1, Tc, progress(frame, T.mv3A, T.mv3B, "travel"));
  else if (frame >= T.mv2A) cur = glide(Te, P1, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.mv1A) cur = glide(P0, Te, progress(frame, T.mv1A, T.mv1B, "travel"));

  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left: left * k, top: top * k, width: width * k, height: height * k });
  const labelStyle: React.CSSProperties = { opacity: lab, filter: lab < 0.99 ? `blur(${(1 - lab) * 4 * k}px)` : undefined, whiteSpace: "nowrap" };
  const panelLeft = sideW;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: W * k, height: H * k, color: p.ink }}>
        {/* top row: mark + workspace, toggle */}
        <div style={{ ...abs(PAD + 10, 22, SW - 100, 36), display: "flex", alignItems: "center", gap: 10 * k, ...labelStyle }}>
          <svg width={26 * k} height={26 * k} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M12 3 21 8l-9 5-9-5z" fill={p.ink} />
            <path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" fill="none" stroke={p.ink} strokeWidth={STROKE.ring} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em" }}>{p.workspace}</span>
        </div>
        <div style={{ ...abs(toggleX, 22, 36, 36), borderRadius: RADIUS.chip * u, background: p.fill, opacity: hover }} />
        <div style={{ ...abs(toggleX, 22, 36, 36), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="toggle" size={20 * k} color={hover > 0.5 ? p.ink : p.ink2} />
        </div>

        {/* sidebar entries */}
        {placed.map(({ e, top }, i) => {
          if (e.kind === "gap") return null;
          if (e.kind === "header") {
            return (
              <React.Fragment key={i}>
                <div style={{ ...abs(PAD + 10, top + 10, SW - 40, 18), fontSize: 13 * k, color: p.ink3, ...labelStyle }}>{e.label}</div>
                <div style={{ ...abs(RW / 2 - 16, top + headerH / 2 - 0.5, 32, 1), height: Math.max(1, u), background: p.line, opacity: div }} />
              </React.Fragment>
            );
          }
          if (e.kind === "search") {
            return (
              <div key={i} style={{ ...abs(PAD, top, rowW, ROW_H), borderRadius: RADIUS.button * u, background: p.fill, overflow: "hidden", display: "flex", alignItems: "center" }}>
                <div style={{ width: 48 * k, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="search" size={20 * k} color={p.ink2} />
                </div>
                <span style={{ fontSize: 15 * k, color: p.ink3, ...labelStyle }}>Search</span>
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{
                ...abs(PAD, top, rowW, ROW_H),
                borderRadius: RADIUS.chip * u,
                background: e.active ? p.card : undefined,
                border: e.active ? `${Math.max(1, u)}px solid ${p.line}` : undefined,
                boxSizing: "border-box",
                boxShadow: e.active ? chipShadow : undefined,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ width: 48 * k - (e.active ? 2 * Math.max(1, u) : 0), display: "flex", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={e.icon} size={20 * k} color={e.active ? p.ink : p.ink2} />
              </div>
              <span style={{ fontSize: 15 * k, fontWeight: e.active ? 500 : 400, color: e.active ? p.ink : p.ink2, ...labelStyle }}>{e.label}</span>
            </div>
          );
        })}
        {/* unread dot: sits at the row's end, then tucks onto the icon in the rail */}
        {placed
          .filter(({ e }) => e.kind === "item" && e.dot)
          .map(({ top }, i) => (
            <div
              key={`dot${i}`}
              style={{
                ...abs(mix(PAD + rowW - 22, RW / 2 + 7, c), top + mix(ROW_H / 2 - 3.5, 7, c), 7, 7),
                borderRadius: 999,
                background: p.accent,
                boxShadow: `0 0 0 ${2 * k * c}px ${p.background}`,
              }}
            />
          ))}

        {/* profile */}
        <div style={{ ...abs(PAD, H - ROW_H - 12, rowW, ROW_H), display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div style={{ width: 48 * k, display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 28 * k, height: 28 * k, borderRadius: 999, background: p.fill, border: `${Math.max(1, u)}px solid ${p.line}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 * k, fontWeight: 500, color: p.ink2 }}>MC</div>
          </div>
          <span style={{ fontSize: 15 * k, color: p.ink, ...labelStyle }}>Maya Chen</span>
        </div>

        {/* main panel */}
        <div
          style={{
            ...abs(panelLeft, 0, W - panelLeft, H),
            background: p.card,
            borderRadius: RADIUS.card * u,
            border: `${Math.max(1, u)}px solid ${p.line}`,
            boxSizing: "border-box",
            boxShadow: shadow,
            padding: 36 * k,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 30 * k, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap" }}>{p.greeting}</div>
          <div style={{ marginTop: 8 * k, fontSize: 14 * k, color: p.ink2, whiteSpace: "nowrap" }}>Here is what changed since yesterday</div>
          <div style={{ display: "flex", gap: 12 * k, marginTop: 28 * k }}>
            {[
              ["Revenue", "$48.2K"],
              ["New customers", "312"],
              ["Open conversations", "18"],
            ].map(([l, v], i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, borderRadius: RADIUS.button * u, border: `${Math.max(1, u)}px solid ${p.line}`, padding: 18 * k, boxSizing: "border-box" }}>
                <div style={{ fontSize: 13 * k, color: p.ink2, whiteSpace: "nowrap" }}>{l}</div>
                <div style={{ marginTop: 10 * k, fontSize: 30 * k, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", fontWeight: i === 0 ? 500 : 400 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, marginTop: 12 * k, borderRadius: RADIUS.button * u, border: `${Math.max(1, u)}px solid ${p.line}`, padding: 18 * k, boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 * k, color: p.ink2, whiteSpace: "nowrap" }}>
              <span>Revenue · last 14 days</span>
              <span style={{ color: p.ink3 }}>+12.4%</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8 * k, marginTop: 18 * k }}>
              {BARS.map((b, i) => (
                <div key={i} style={{ flex: 1, height: `${b}%`, borderRadius: `${RADIUS.chip * u}px ${RADIUS.chip * u}px 0 0`, background: i === BARS.length - 1 ? p.ink : p.fill }} />
              ))}
            </div>
          </div>
        </div>

        {/* cursor */}
        <svg
          width={16 * k}
          height={22 * k}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - k, top: cur[1] * k - k, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
