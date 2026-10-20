import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type SearchCascadeProps = {
  background: string;
  panel: string;
  ink: string;
  accent: string;
  accent2: string;
  query: string;
  count: number; // results shown, 3–5
  stagger: number; // frames between result rows
  ease: string;
};

// Every result contains the query, so the highlight always has something to mark whatever the user types.
export const RESULTS = [
  { pre: "", post: " system", sub: "Library · Updated 2h ago", kind: "Library" },
  { pre: "", post: " review notes", sub: "Docs · Edited by Maya", kind: "Doc" },
  { pre: "Brand ", post: " tokens", sub: "Repository · main", kind: "Repo" },
  { pre: "", post: " handoff checklist", sub: "Tasks · 12 open", kind: "Task" },
  { pre: "Weekly ", post: " sync", sub: "Calendar · Thu 10:00", kind: "Event" },
];

export const CHAR_FRAMES = 2.5;

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

const TileGlyph: React.FC<{ i: number; size: number }> = ({ i, size }) => {
  const s = { fill: "none", stroke: "#FFFFFF", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const d = [
    "M5 5h5.5v5.5H5z M13.5 5H19v5.5h-5.5z M5 13.5h5.5V19H5z M13.5 13.5H19V19h-5.5z",
    "M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z M14 3.5V8h4 M9 12.5h6 M9 16h6",
    "M9 7.5L4.5 12 9 16.5 M15 7.5l4.5 4.5-4.5 4.5 M13.2 5.5l-2.4 13",
    "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4z M8.3 12.2l2.5 2.5 4.9-5",
    "M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5z M4 10h16 M8.5 3.5v4 M15.5 3.5v4",
  ][i % 5];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path {...s} d={d} />
    </svg>
  );
};

export const SearchCascade: React.FC<SearchCascadeProps> = (p) => {
  const f = useCurrentFrame();
  const { height, u, ratio } = useLayout();
  const count = Math.max(3, Math.min(5, Math.round(p.count)));
  const q = p.query;
  const capQ = q.length > 0 ? q[0].toUpperCase() + q.slice(1) : q;
  const muted = alpha(p.ink, 0.5);

  const T0 = 16;
  const typed = Math.max(0, Math.min(q.length, Math.floor((f - T0) / CHAR_FRAMES) + 1));
  const typingEnd = T0 + q.length * CHAR_FRAMES;
  const r0 = typingEnd + 6;
  const cascadeEnd = r0 + (count - 1) * p.stagger + 14;
  const selT = progress(f, cascadeEnd + 2, cascadeEnd + 14, p.ease);
  const expand = progress(f, r0 - 4, cascadeEnd, p.ease);
  const appear = progress(f, 0, 16, p.ease);
  const caretOn = f < typingEnd + 4 ? 1 : Math.floor((f - typingEnd - 4) / 14) % 2 === 0 ? 1 : 0;

  const W = (ratio === "16:9" ? 1000 : 900) * u;
  const searchH = 112 * u;
  const rowH = 88 * u;
  const headerH = 54 * u;
  const footerH = 58 * u;
  const listH = headerH + count * rowH + 12 * u + footerH;
  const panelH = searchH + listH * expand;
  const top = mix(height / 2 - searchH / 2, height / 2 - (searchH + listH) / 2, expand);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top,
          width: W,
          height: panelH,
          borderRadius: 28 * u,
          background: p.panel,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.1)}`,
          boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,0.3), 0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.12)`,
          overflow: "hidden",
          boxSizing: "border-box",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 24 * u}px) scale(${mix(0.97, 1, appear)})`,
        }}
      >
        <div style={{ height: searchH - 1.5 * u, display: "flex", alignItems: "center", padding: `0 ${36 * u}px`, gap: 22 * u }}>
          <svg width={36 * u} height={36 * u} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
            <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={muted} strokeWidth={2} />
            <path d="M15.5 15.5L20 20" stroke={muted} strokeWidth={2} strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 40 * u, fontWeight: 500, letterSpacing: "-0.025em", color: p.ink, whiteSpace: "pre" }}>
            {q.slice(0, typed)}
            <span style={{ width: 3 * u, height: 46 * u, marginLeft: 3 * u, borderRadius: 2 * u, background: p.accent, opacity: caretOn }} />
            {typed === 0 ? <span style={{ color: alpha(p.ink, 0.32), marginLeft: 8 * u }}>Search everything…</span> : null}
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 18 * u, color: muted, padding: `${6 * u}px ${12 * u}px`, borderRadius: 8 * u, border: `${1.5 * u}px solid ${alpha(p.ink, 0.12)}` }}>esc</span>
        </div>
        <div style={{ height: 1.5 * u, background: alpha(p.ink, 0.08), opacity: expand }} />
        <div style={{ height: headerH, display: "flex", alignItems: "flex-end", padding: `0 ${36 * u}px ${12 * u}px`, boxSizing: "border-box", fontSize: 18 * u, fontWeight: 500, letterSpacing: "0.08em", color: muted, opacity: progress(f, r0 - 2, r0 + 8) }}>
          TOP RESULTS
        </div>
        {RESULTS.slice(0, count).map((r, i) => {
          const t = progress(f, r0 + i * p.stagger, r0 + i * p.stagger + 14, p.ease);
          const sel = i === 0 ? selT : 0;
          const tile = hexMix(p.accent, p.accent2, i / (count - 1));
          return (
            <div
              key={i}
              style={{
                height: rowH - 8 * u,
                margin: `0 ${14 * u}px ${8 * u}px`,
                padding: `0 ${22 * u}px`,
                borderRadius: 18 * u,
                display: "flex",
                alignItems: "center",
                gap: 22 * u,
                background: alpha(p.accent, 0.15 * sel),
                boxShadow: `inset 0 0 0 ${1.5 * u}px ${alpha(p.accent, 0.35 * sel)}`,
                opacity: t,
                transform: `translateY(${(1 - t) * -14 * u}px)`,
              }}
            >
              <div
                style={{
                  width: 52 * u,
                  height: 52 * u,
                  borderRadius: 14 * u,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(150deg, ${hexMix(tile, "#FFFFFF", 0.22)}, ${tile} 60%, ${hexMix(tile, "#000000", 0.2)})`,
                  boxShadow: `0 ${6 * u}px ${14 * u}px ${alpha(tile, 0.3)}`,
                }}
              >
                <TileGlyph i={i} size={28 * u} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 28 * u, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "pre" }}>
                  {r.pre}
                  <span style={{ color: p.accent, fontWeight: 650, background: alpha(p.accent, 0.14), borderRadius: 6 * u, padding: `0 ${3 * u}px` }}>{r.pre ? q : capQ}</span>
                  {r.post}
                </div>
                <div style={{ fontSize: 20 * u, color: muted, marginTop: 4 * u }}>{r.sub}</div>
              </div>
              {i === 0 ? (
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", width: 140 * u, height: 40 * u }}>
                  <span style={{ position: "absolute", right: 0, fontSize: 20 * u, color: muted, opacity: 1 - sel }}>{r.kind}</span>
                  <span style={{ position: "absolute", right: 0, display: "flex", alignItems: "center", gap: 10 * u, fontSize: 20 * u, color: p.ink, opacity: sel }}>
                    Open
                    <span style={{ fontFamily: FONT_MONO, fontSize: 18 * u, padding: `${4 * u}px ${10 * u}px`, borderRadius: 8 * u, background: alpha(p.ink, 0.1) }}>↵</span>
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 20 * u, color: muted }}>{r.kind}</span>
              )}
            </div>
          );
        })}
        <div
          style={{
            height: footerH,
            marginTop: 12 * u,
            borderTop: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
            display: "flex",
            alignItems: "center",
            gap: 26 * u,
            padding: `0 ${36 * u}px`,
            boxSizing: "border-box",
            fontSize: 18 * u,
            color: muted,
            opacity: progress(f, cascadeEnd - 6, cascadeEnd + 6),
          }}
        >
          <span>
            <span style={{ fontFamily: FONT_MONO }}>↑↓</span> to navigate
          </span>
          <span>
            <span style={{ fontFamily: FONT_MONO }}>↵</span> to open
          </span>
          <span style={{ marginLeft: "auto" }}>{count} results</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
