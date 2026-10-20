import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type CalendarInviteProps = {
  background: string;
  card: string;
  ink: string;
  accent: string;
  onAccent: string;
  avatarA: string;
  avatarB: string;
  title: string;
  time: string;
  location: string;
  stagger: number; // frames between avatars
  ease: string;
};

export const GUESTS = ["MC", "JR", "AL", "SK", "DP"];
export const PRESS_FRAME = 92;

const rgb = (h: string) => {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexMix = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
// Pick initials colour by perceived brightness so pastel and deep avatar ramps both stay readable.
const textOn = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#15120F" : "#FFFFFF";
};

const Line: React.FC<{ d: string; size: number; color: string }> = ({ d, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CalendarInvite: React.FC<CalendarInviteProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const W = (ratio === "9:16" ? 880 : 820) * u;
  const muted = alpha(p.ink, 0.56);
  const slide = progress(f, 0, 26, p.ease);
  const up = (from: number) => {
    const t = progress(f, from, from + 16, p.ease);
    return { opacity: t, transform: `translateY(${(1 - t) * 14 * u}px)` };
  };
  const dateIn = progress(f, 10, 28, "spring");
  const pressDown = progress(f, PRESS_FRAME - 4, PRESS_FRAME, "travel") - progress(f, PRESS_FRAME, PRESS_FRAME + 8, "travel");
  const done = progress(f, PRESS_FRAME + 4, PRESS_FRAME + 18, p.ease);
  const check = progress(f, PRESS_FRAME + 8, PRESS_FRAME + 24, "enter");
  const cursorT = progress(f, 66, PRESS_FRAME - 4, p.ease);
  const cursorOut = progress(f, PRESS_FRAME + 20, PRESS_FRAME + 36, "enter");
  const av = 64 * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: W,
          boxSizing: "border-box",
          padding: 44 * u,
          borderRadius: 40 * u,
          background: p.card,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
          boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,0.26), 0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.1)`,
          opacity: slide,
          transform: `translateX(${(1 - slide) * 140 * u}px) rotate(${(1 - slide) * 2}deg)`,
        }}
      >
        <div style={{ display: "flex", gap: 32 * u, alignItems: "flex-start" }}>
          <div
            style={{
              width: 124 * u,
              height: 136 * u,
              flexShrink: 0,
              borderRadius: 26 * u,
              background: alpha(p.accent, 0.14),
              border: `${1.5 * u}px solid ${alpha(p.accent, 0.3)}`,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: dateIn,
              transform: `scale(${mix(0.6, 1, dateIn)})`,
            }}
          >
            <span style={{ fontSize: 20 * u, fontWeight: 700, letterSpacing: "0.12em", color: p.accent }}>OCT</span>
            <span style={{ fontSize: 62 * u, fontWeight: 650, letterSpacing: "-0.04em", color: p.ink, lineHeight: 1.05 }}>24</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20 * u, color: muted, ...up(14) }}>Invitation from Maya Chen</div>
            <div style={{ fontSize: 46 * u, fontWeight: 650, letterSpacing: "-0.035em", color: p.ink, marginTop: 6 * u, lineHeight: 1.12, ...up(18) }}>{p.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 * u, marginTop: 16 * u, fontSize: 24 * u, color: alpha(p.ink, 0.82), ...up(24) }}>
              <Line d="M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4z M12 7.8V12l2.8 1.8" size={28 * u} color={p.accent} />
              {p.time}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 * u, marginTop: 10 * u, fontSize: 24 * u, color: alpha(p.ink, 0.82), ...up(29) }}>
              <Line d="M12 20.5s-6.3-5.4-6.3-10.6a6.3 6.3 0 0 1 12.6 0c0 5.2-6.3 10.6-6.3 10.6z M12 7.6a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z" size={28 * u} color={p.accent} />
              {p.location}
            </div>
          </div>
        </div>

        <div style={{ height: 1.5 * u, background: alpha(p.ink, 0.09), margin: `${34 * u}px 0 ${28 * u}px` }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {GUESTS.map((g, i) => {
              const t = progress(f, 34 + i * p.stagger, 50 + i * p.stagger, "spring");
              const col = hexMix(p.avatarA, p.avatarB, i / (GUESTS.length - 1));
              return (
                <div
                  key={g}
                  style={{
                    width: av,
                    height: av,
                    marginLeft: i === 0 ? 0 : -18 * u,
                    borderRadius: "50%",
                    background: `linear-gradient(150deg, ${hexMix(col, "#FFFFFF", 0.2)}, ${col})`,
                    border: `${4 * u}px solid ${p.card}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 21 * u,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: textOn(col),
                    opacity: Math.min(1, t * 1.5),
                    transform: `translateX(${(1 - t) * -16 * u}px) scale(${mix(0.5, 1, t)})`,
                  }}
                >
                  {g}
                </div>
              );
            })}
            {(() => {
              const t = progress(f, 34 + GUESTS.length * p.stagger, 50 + GUESTS.length * p.stagger, "spring");
              return (
                <div
                  style={{
                    height: av,
                    padding: `0 ${18 * u}px`,
                    marginLeft: -18 * u,
                    borderRadius: av / 2,
                    background: hexMix(p.card, p.ink, 0.1),
                    border: `${4 * u}px solid ${p.card}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 21 * u,
                    fontWeight: 600,
                    color: alpha(p.ink, 0.75),
                    opacity: Math.min(1, t * 1.5),
                    transform: `scale(${mix(0.5, 1, t)})`,
                  }}
                >
                  +3
                </div>
              );
            })()}
          </div>
          <div style={{ position: "relative", width: 220 * u, height: 30 * u, fontSize: 21 * u, color: muted, ...up(46) }}>
            <span style={{ position: "absolute", right: 0, opacity: 1 - done }}>8 guests · 5 going</span>
            <span style={{ position: "absolute", right: 0, opacity: done, color: p.ink }}>8 guests · 6 going</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 * u, marginTop: 34 * u, ...up(54) }}>
          <div
            style={{
              flex: 1,
              height: 76 * u,
              borderRadius: 20 * u,
              border: `${1.5 * u}px solid ${alpha(p.ink, 0.14)}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 25 * u,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: p.ink,
              opacity: mix(1, 0.4, done),
            }}
          >
            Decline
          </div>
          <div style={{ flex: 1.5, position: "relative", height: 76 * u, transform: `scale(${1 - 0.05 * pressDown})` }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20 * u,
                overflow: "hidden",
                boxShadow: `0 ${14 * u}px ${30 * u}px ${alpha(p.accent, 0.3 * (1 - done))}`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: alpha(p.accent, 0.14), border: `${1.5 * u}px solid ${alpha(p.accent, 0.45)}`, borderRadius: 20 * u, boxSizing: "border-box" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${hexMix(p.accent, "#FFFFFF", 0.12)}, ${p.accent})`, opacity: 1 - done }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25 * u, fontWeight: 600, letterSpacing: "-0.01em", color: p.onAccent, opacity: 1 - done, transform: `translateY(${-done * 12 * u}px)` }}>
                Accept
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 * u, fontSize: 25 * u, fontWeight: 600, letterSpacing: "-0.01em", color: p.accent, opacity: done, transform: `translateY(${(1 - done) * 12 * u}px)` }}>
                <svg width={30 * u} height={30 * u} viewBox="0 0 24 24" style={{ display: "block" }}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={p.accent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - check)} />
                </svg>
                Accepted
              </div>
            </div>
            <svg
              width={40 * u}
              height={40 * u}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: mix(260, 150, cursorT) * u,
                top: mix(150, 34, cursorT) * u + cursorOut * 60 * u,
                opacity: Math.min(cursorT * 3, 1) * (1 - cursorOut),
                transform: `scale(${1 - 0.12 * pressDown})`,
              }}
            >
              <path d="M5 3l13.5 9.2-6 1.1 3.4 6.6-2.6 1.3-3.4-6.6-4.9 3.9z" fill="rgba(0,0,0,0.28)" transform="translate(0.6 1.2)" />
              <path d="M5 3l13.5 9.2-6 1.1 3.4 6.6-2.6 1.3-3.4-6.6-4.9 3.9z" fill="#FFFFFF" stroke="#111114" strokeWidth={1.3} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
