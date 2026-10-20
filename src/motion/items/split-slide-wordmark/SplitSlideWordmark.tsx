import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type SplitSlideWordmarkProps = {
  background: string;
  ink: string;
  accent: string;
  wordmark: string;
  tagline: string;
  spread: number; // px the halves open to, at 1080 short side
  ease: string;
};

// Where the cut runs, as % of the 1.2 line box: through the middle of the lowercase letters, a touch below the
// cap middle, so both halves keep enough of every glyph to read.
export const CUT = 53;

export const timeline = (D: number) => ({
  enter: [D * 0.02, D * 0.2] as const,
  line: [D * 0.17, D * 0.29] as const,
  open: [D * 0.28, D * 0.42] as const,
  tag: [D * 0.31, D * 0.46] as const,
  close: [D * 0.6, D * 0.72] as const,
});

export const SplitSlideWordmark: React.FC<SplitSlideWordmarkProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames: D, u, isVertical, width } = useLayout();
  const tl = timeline(D);

  const fs = Math.min((isVertical ? 250 : 300) * u, (width * 0.86) / (Math.max(p.wordmark.length, 3) * 0.6));
  const enter = progress(frame, tl.enter[0], tl.enter[1], p.ease);
  const line = progress(frame, tl.line[0], tl.line[1], p.ease);
  const opened = progress(frame, tl.open[0], tl.open[1], p.ease);
  const closed = progress(frame, tl.close[0], tl.close[1], p.ease);
  const o = opened * (1 - closed);
  const tag = progress(frame, tl.tag[0], tl.tag[1], "enter");
  const half = (p.spread * u * o) / 2;
  const bump = Math.sin(Math.PI * progress(frame, tl.close[1] - 2, tl.close[1] + 8, "enter"));

  const word: React.CSSProperties = {
    fontSize: fs,
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 1.2,
    padding: "0 0.06em",
    whiteSpace: "nowrap",
    color: p.ink,
  };
  const enterStyle: React.CSSProperties = {
    opacity: enter,
    filter: enter < 1 ? `blur(${(1 - enter) * 12 * u}px)` : undefined,
  };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", transform: `scale(${1 - 0.012 * bump})` }}>
        <div style={{ ...word, opacity: 0 }}>{p.wordmark}</div>
        <div
          style={{
            ...word,
            ...enterStyle,
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 0 ${100 - CUT}% 0)`,
            transform: `translate(${(1 - enter) * -110 * u}px, ${-half}px)`,
          }}
        >
          {p.wordmark}
        </div>
        <div
          style={{
            ...word,
            ...enterStyle,
            position: "absolute",
            inset: 0,
            clipPath: `inset(${CUT}% 0 0 0)`,
            transform: `translate(${(1 - enter) * 110 * u}px, ${half}px)`,
          }}
        >
          {p.wordmark}
        </div>
        {/* the accent line marks the cut just before it opens, then gives way to the tagline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${CUT}%`,
            height: 4 * u,
            marginTop: -2 * u,
            borderRadius: 2 * u,
            background: p.accent,
            transform: `scaleX(${line})`,
            opacity: 1 - opened,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${CUT}%`,
            height: p.spread * u,
            width: width,
            marginLeft: -width / 2,
            marginTop: (-p.spread * u) / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            clipPath: `inset(${(1 - o) * 50}% 0 ${(1 - o) * 50}% 0)`,
          }}
        >
          <div
            style={{
              fontSize: Math.min((isVertical ? 46 : 44) * u, (width * 0.88) / (Math.max(p.tagline.length, 8) * 0.9)),
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: `${0.4 - 0.16 * tag}em`,
              whiteSpace: "nowrap",
              color: p.accent,
              opacity: tag,
            }}
          >
            {p.tagline}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
