import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FINAL_HOLD, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type SearchCascadeProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  query: string;
  count: number; // results shown, 3–5
  ease: string;
};

// Every result contains the query, so the match always has something to mark whatever the user types.
export const RESULTS = [
  { pre: "", post: " system", sub: "Library · Updated 2h ago", kind: "Library" },
  { pre: "", post: " review notes", sub: "Docs · Edited by Maya", kind: "Doc" },
  { pre: "Brand ", post: " tokens", sub: "Repository · main", kind: "Repo" },
  { pre: "", post: " handoff checklist", sub: "Tasks · 12 open", kind: "Task" },
  { pre: "Weekly ", post: " sync", sub: "Calendar · Thu 10:00", kind: "Event" },
];

export const CHAR_FRAMES = 2.5;
export const TYPE_AT = 20;
export const ENTER = 20;
export const ROW_IN = 18;
export const BLINK = 15;
// Panel width in px at 1080: fills ~62% of the frame at 16:9 and ~81% of the short side otherwise.
export const panelWidth = (wide: boolean) => (wide ? 1200 : 880);
// Derived timeline, shared with the prompt.
export const timeline = (queryLength: number, count: number) => {
  const typingEnd = TYPE_AT + queryLength * CHAR_FRAMES;
  const r0 = Math.round(typingEnd + 6);
  const cascadeEnd = r0 + (count - 1) * STAGGER + ROW_IN;
  return { typingEnd, r0, cascadeEnd, select: cascadeEnd + 2 };
};
export const clampCount = (n: number) => Math.max(3, Math.min(5, Math.round(n)));

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
const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};

const GLYPHS = [
  "M5 5h5.5v5.5H5z M13.5 5H19v5.5h-5.5z M5 13.5h5.5V19H5z M13.5 13.5H19V19h-5.5z",
  "M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z M14 3.5V8h4 M9 12.5h6 M9 16h6",
  "M9 7.5L4.5 12 9 16.5 M15 7.5l4.5 4.5-4.5 4.5 M13.2 5.5l-2.4 13",
  "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4z M8.3 12.2l2.5 2.5 4.9-5",
  "M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5z M4 10h16 M8.5 3.5v4 M15.5 3.5v4",
];

const Glyph: React.FC<{ i: number; size: number; color: string; stroke: number }> = ({ i, size, color, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d={GLYPHS[i % GLYPHS.length]} fill="none" stroke={color} strokeWidth={(stroke * 24) / size} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SearchCascade: React.FC<SearchCascadeProps> = (p) => {
  const f = useCurrentFrame();
  const { height, u, ratio, durationInFrames } = useLayout();
  const count = clampCount(p.count);
  const q = p.query;
  const capQ = q.length > 0 ? q[0].toUpperCase() + q.slice(1) : q;
  const dark = isDark(p.background);

  const { typingEnd, r0, cascadeEnd, select } = timeline(q.length, count);
  const typed = Math.max(0, Math.min(q.length, Math.floor((f - TYPE_AT) / CHAR_FRAMES) + 1));
  const selT = progress(f, select, select + ROW_IN, p.ease);
  const expand = progress(f, r0 - 4, cascadeEnd, p.ease);
  const appear = progress(f, 0, ENTER, p.ease);
  // The caret blinks after typing, then settles solid before the held final frames.
  const blinkStart = typingEnd + 4;
  const blinkEnd = durationInFrames - FINAL_HOLD - BLINK;
  const caretOn = f < blinkStart || f >= blinkEnd ? 1 : Math.floor((f - blinkStart) / BLINK) % 2 === 0 ? 1 : 0;

  const W = panelWidth(ratio === "16:9") * u;
  const searchH = 112 * u;
  const rowH = 88 * u;
  const headerH = 54 * u;
  const footerH = 58 * u;
  const hair = STROKE.hair * u;
  const listH = headerH + count * rowH + 12 * u + footerH;
  const panelH = searchH + listH * expand;
  const top = mix(height / 2 - searchH / 2, height / 2 - (searchH + listH) / 2, expand);
  const tile = 52 * u;
  const glyph = 28 * u;
  const lens = 36 * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top,
          width: W,
          height: panelH,
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${1 * u}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          overflow: "hidden",
          boxSizing: "border-box",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 24 * u}px) scale(${mix(0.97, 1, appear)})`,
        }}
      >
        <div style={{ height: searchH - hair, display: "flex", alignItems: "center", padding: `0 ${36 * u}px`, gap: 22 * u }}>
          <svg width={lens} height={lens} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
            <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={p.ink3} strokeWidth={(STROKE.ring * u * 24) / lens} />
            <path d="M15.5 15.5L20 20" stroke={p.ink3} strokeWidth={(STROKE.ring * u * 24) / lens} strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 40 * u, fontWeight: 400, letterSpacing: "-0.03em", color: p.ink, whiteSpace: "pre" }}>
            {q.slice(0, typed)}
            <span style={{ width: STROKE.ring * u, height: 46 * u, marginLeft: 3 * u, borderRadius: 999, background: p.accent, opacity: caretOn }} />
            {typed === 0 ? <span style={{ color: p.ink3, marginLeft: 8 * u }}>Search everything…</span> : null}
          </div>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18 * u,
              color: p.ink3,
              padding: `${6 * u}px ${12 * u}px`,
              borderRadius: RADIUS.chip * u,
              boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
            }}
          >
            esc
          </span>
        </div>
        <div style={{ height: hair, background: p.line, opacity: expand }} />
        <div
          style={{
            height: headerH,
            display: "flex",
            alignItems: "flex-end",
            padding: `0 ${36 * u}px ${12 * u}px`,
            boxSizing: "border-box",
            fontFamily: FONT_MONO,
            fontSize: 15 * u,
            fontWeight: 500,
            letterSpacing: "0.12em",
            color: p.ink3,
            opacity: progress(f, r0 - 2, r0 - 2 + ROW_IN, "enter"),
          }}
        >
          TOP RESULTS
        </div>
        {RESULTS.slice(0, count).map((r, i) => {
          const t = progress(f, r0 + i * STAGGER, r0 + i * STAGGER + ROW_IN, p.ease);
          const sel = i === 0 ? selT : 0;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                height: rowH - 8 * u,
                margin: `0 ${14 * u}px ${8 * u}px`,
                padding: `0 ${22 * u}px`,
                display: "flex",
                alignItems: "center",
                gap: 22 * u,
                opacity: t,
                transform: `translateY(${(1 - t) * -14 * u}px)`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * u, background: p.fill, opacity: sel }} />
              <div
                style={{
                  position: "relative",
                  width: tile,
                  height: tile,
                  borderRadius: RADIUS.button * u,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: p.card,
                  boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
                }}
              >
                <Glyph i={i} size={glyph} color={hexMix(p.ink2, p.accent, sel)} stroke={STROKE.ring * u} />
              </div>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 28 * u, fontWeight: 400, letterSpacing: "-0.02em", color: p.ink2, whiteSpace: "pre" }}>
                  {r.pre}
                  <span style={{ color: p.ink, fontWeight: 500 }}>{r.pre ? q : capQ}</span>
                  {r.post}
                </div>
                <div style={{ fontSize: 20 * u, color: p.ink3, marginTop: 4 * u }}>{r.sub}</div>
              </div>
              {i === 0 ? (
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", width: 140 * u, height: 40 * u }}>
                  <span style={{ position: "absolute", right: 0, fontSize: 20 * u, color: p.ink3, opacity: 1 - sel }}>{r.kind}</span>
                  <span style={{ position: "absolute", right: 0, display: "flex", alignItems: "center", gap: 10 * u, fontSize: 20 * u, fontWeight: 500, color: p.ink2, opacity: sel }}>
                    Open
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 18 * u,
                        padding: `${4 * u}px ${10 * u}px`,
                        borderRadius: RADIUS.chip * u,
                        background: p.card,
                        boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
                      }}
                    >
                      ↵
                    </span>
                  </span>
                </div>
              ) : (
                <span style={{ position: "relative", fontSize: 20 * u, color: p.ink3 }}>{r.kind}</span>
              )}
            </div>
          );
        })}
        <div
          style={{
            height: footerH,
            marginTop: 12 * u,
            borderTop: `${hair}px solid ${p.line}`,
            display: "flex",
            alignItems: "center",
            gap: 26 * u,
            padding: `0 ${36 * u}px`,
            boxSizing: "border-box",
            fontSize: 18 * u,
            color: p.ink3,
            opacity: progress(f, cascadeEnd - 6, cascadeEnd - 6 + ROW_IN, "enter"),
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
