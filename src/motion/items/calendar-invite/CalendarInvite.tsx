import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, mix, progress, useLayout } from "../../kit";

export type CalendarInviteProps = {
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
  title: string;
  time: string;
  location: string;
  ease: string;
};

export const GUESTS = ["MC", "JR", "AL", "SK", "DP"];
// Timeline in frames (150-frame clip, frames 138–150 held still).
export const TL = {
  cardIn: 24,
  dateIn: 8,
  textIn: 12,
  avatarsIn: 30,
  countIn: 48,
  buttonsIn: 54,
  cursorIn: 62,
  press: 90,
  done: 94,
  check: 98,
  cursorOut: 110,
} as const;
export const ENTER = 18;
export const EXIT = 14;
// The card is designed at 820px; at 16:9 it scales up so it fills ~62% of the frame width.
export const zoomFor = (wide: boolean) => (wide ? 1.45 : 1);
export const cardWidth = (vertical: boolean) => (vertical ? 880 : 820);

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};

const Icon: React.FC<{ d: string; size: number; color: string; stroke: number }> = ({ d, size, color, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path d={d} fill="none" stroke={color} strokeWidth={(stroke * 24) / size} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CalendarInvite: React.FC<CalendarInviteProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio, isVertical } = useLayout();
  const s = u * zoomFor(ratio === "16:9");
  const W = cardWidth(isVertical) * s;
  const dark = isDark(p.background);
  const slide = progress(f, 0, TL.cardIn, p.ease);
  const up = (from: number) => {
    const t = progress(f, from, from + ENTER, p.ease);
    return { opacity: t, transform: `translateY(${(1 - t) * 14 * s}px)` };
  };
  const dateIn = progress(f, TL.dateIn, TL.dateIn + ENTER, "spring");
  const pressDown = progress(f, TL.press - 4, TL.press, "travel") - progress(f, TL.press, TL.press + 8, "travel");
  const done = progress(f, TL.done, TL.done + ENTER, p.ease);
  const check = progress(f, TL.check, TL.check + ENTER, "enter");
  const cursorFade = progress(f, TL.cursorIn, TL.cursorIn + ENTER, "enter");
  const cursorT = progress(f, TL.cursorIn, TL.press - 4, "travel");
  const cursorOut = progress(f, TL.cursorOut, TL.cursorOut + EXIT, "exit");
  const av = 64 * s;
  const hair = STROKE.hair * s;
  const iconStroke = STROKE.ring * s;
  const cursor = 40 * s;

  const avatarStyle = (i: number): React.CSSProperties => {
    const t = progress(f, TL.avatarsIn + i * STAGGER, TL.avatarsIn + i * STAGGER + ENTER, "spring");
    return {
      height: av,
      marginLeft: i === 0 ? 0 : -16 * s,
      borderRadius: 999,
      border: `${STROKE.ring * s}px solid ${p.card}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 21 * s,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      opacity: t,
      transform: `scale(${mix(0.7, 1, t)})`,
    };
  };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: W,
          boxSizing: "border-box",
          padding: 44 * s,
          borderRadius: RADIUS.card * s,
          background: p.card,
          border: `${1 * s}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${1 * s}px ${2 * s}px rgba(0,0,0,0.04), 0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.06)`,
          opacity: slide,
          transform: `translateX(${(1 - slide) * 120 * s}px)`,
        }}
      >
        <div style={{ display: "flex", gap: 32 * s, alignItems: "flex-start" }}>
          <div
            style={{
              width: 124 * s,
              height: 136 * s,
              flexShrink: 0,
              borderRadius: RADIUS.button * s,
              background: p.fill,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4 * s,
              opacity: dateIn,
              transform: `scale(${mix(0.8, 1, dateIn)})`,
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontSize: 18 * s, fontWeight: 500, letterSpacing: "0.12em", color: p.accent }}>OCT</span>
            <span style={{ fontSize: 60 * s, fontWeight: 600, letterSpacing: "-0.04em", color: p.ink, lineHeight: 1 }}>24</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20 * s, color: p.ink3, ...up(TL.textIn) }}>Invitation from Maya Chen</div>
            <div style={{ fontSize: 46 * s, fontWeight: 500, letterSpacing: "-0.035em", color: p.ink, marginTop: 6 * s, lineHeight: 1.12, ...up(TL.textIn + STAGGER) }}>{p.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 * s, marginTop: 16 * s, fontSize: 24 * s, color: p.ink2, ...up(TL.textIn + 2 * STAGGER) }}>
              <Icon d="M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4z M12 7.8V12l2.8 1.8" size={28 * s} color={p.ink3} stroke={iconStroke} />
              {p.time}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 * s, marginTop: 10 * s, fontSize: 24 * s, color: p.ink2, ...up(TL.textIn + 3 * STAGGER) }}>
              <Icon d="M12 20.5s-6.3-5.4-6.3-10.6a6.3 6.3 0 0 1 12.6 0c0 5.2-6.3 10.6-6.3 10.6z M12 7.6a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z" size={28 * s} color={p.ink3} stroke={iconStroke} />
              {p.location}
            </div>
          </div>
        </div>

        <div style={{ height: hair, background: p.line, margin: `${34 * s}px 0 ${28 * s}px` }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {GUESTS.map((g, i) => (
              <div key={g} style={{ ...avatarStyle(i), width: av, background: p.fill, color: p.ink2 }}>
                {g}
              </div>
            ))}
            <div style={{ ...avatarStyle(GUESTS.length), padding: `0 ${18 * s}px`, background: p.card, boxShadow: `inset 0 0 0 ${hair}px ${p.line}`, color: p.ink3 }}>+3</div>
          </div>
          <div style={{ position: "relative", width: 220 * s, height: 30 * s, fontSize: 21 * s, ...up(TL.countIn) }}>
            <span style={{ position: "absolute", right: 0, color: p.ink3, opacity: 1 - done, whiteSpace: "nowrap" }}>8 guests · 5 going</span>
            <span style={{ position: "absolute", right: 0, color: p.ink2, opacity: done, whiteSpace: "nowrap" }}>8 guests · 6 going</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 * s, marginTop: 34 * s, ...up(TL.buttonsIn) }}>
          <div
            style={{
              flex: 1,
              height: 76 * s,
              borderRadius: RADIUS.button * s,
              border: `${hair}px solid ${p.line}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 25 * s,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: p.ink,
              opacity: mix(1, 0.4, done),
            }}
          >
            Decline
          </div>
          <div style={{ flex: 1.5, position: "relative", height: 76 * s, transform: `scale(${1 - 0.03 * pressDown})` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: p.fill }} />
              <div style={{ position: "absolute", inset: 0, background: p.button, opacity: 1 - done }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 25 * s,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: p.onButton,
                  opacity: 1 - done,
                  transform: `translateY(${-done * 12 * s}px)`,
                }}
              >
                Accept
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10 * s,
                  fontSize: 25 * s,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: p.ink,
                  opacity: done,
                  transform: `translateY(${(1 - done) * 12 * s}px)`,
                }}
              >
                <svg width={30 * s} height={30 * s} viewBox="0 0 24 24" style={{ display: "block" }}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke={p.accent}
                    strokeWidth={(STROKE.ring * s * 24) / (30 * s)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={22}
                    strokeDashoffset={22 * (1 - check)}
                  />
                </svg>
                Accepted
              </div>
            </div>
            <svg
              width={cursor}
              height={cursor}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: mix(260, 150, cursorT) * s,
                top: mix(150, 34, cursorT) * s + cursorOut * 40 * s,
                opacity: cursorFade * (1 - cursorOut),
                transform: `scale(${1 - 0.1 * pressDown})`,
              }}
            >
              <path
                d="M5 3l13.5 9.2-6 1.1 3.4 6.6-2.6 1.3-3.4-6.6-4.9 3.9z"
                fill={p.button}
                stroke={p.onButton}
                strokeWidth={(STROKE.hair * s * 24) / cursor}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
