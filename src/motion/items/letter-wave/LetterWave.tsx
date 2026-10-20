import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type LetterWaveProps = {
  background: string;
  ink: string;
  quiet: string;
  accent: string; // letters are this colour mid-flight and cool to ink as they land
  text: string;
  caption: string;
  stagger: number; // frames between letters
  rotation: number; // degrees each letter starts tilted
  ease: string;
};

export const WAVE = { start: 6, dur: 26, base: 170, baseVertical: 150, landBy: 0.7 } as const;

// Long headlines would push the last letter past the hold, so the stagger tightens to land everything by 70%.
export const effectiveStagger = (stagger: number, letters: number, durationInFrames: number) => {
  if (letters <= 1) return stagger;
  const room = (durationInFrames * WAVE.landBy - WAVE.start - WAVE.dur) / (letters - 1);
  return Math.max(0.5, Math.min(stagger, room));
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LetterWave: React.FC<LetterWaveProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, durationInFrames, isVertical } = useLayout();
  const words = p.text.trim().split(/\s+/).filter(Boolean);
  const letters = words.reduce((n, w) => n + w.length, 0);
  const stagger = effectiveStagger(p.stagger, letters, durationInFrames);
  const base = (isVertical ? WAVE.baseVertical : WAVE.base) * u;
  // Horizontal keeps one line; vertical wraps by word, so fit to the longest word instead.
  const fitChars = isVertical ? Math.max(1, ...words.map((w) => w.length)) : Math.max(1, p.text.trim().length);
  const fs = Math.min(base, (width * 0.86) / (fitChars * 0.56));
  const lastEnd = WAVE.start + Math.max(letters - 1, 0) * stagger + WAVE.dur;
  const cap = progress(frame, lastEnd - 12, lastEnd + 14, "enter");

  let gi = 0;
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            flexWrap: isVertical ? "wrap" : "nowrap",
            justifyContent: "center",
            columnGap: "0.26em",
            maxWidth: width * 0.9,
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
          }}
        >
          {words.map((w, wi) => (
            <span key={wi} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
              {w.split("").map((ch, ci) => {
                const i = gi++;
                const s = WAVE.start + i * stagger;
                const pe = progress(frame, s, s + WAVE.dur, p.ease);
                const lin = interpolate(frame, [s, s + WAVE.dur], [0, 1], clamp);
                return (
                  <span
                    key={ci}
                    style={{
                      display: "inline-block",
                      color: interpolateColors(lin, [0, 0.45, 1], [p.accent, p.accent, p.ink]),
                      opacity: interpolate(lin, [0, 0.3], [0, 1], clamp),
                      transform: `translateY(${(1 - pe) * 0.72}em) rotate(${(1 - pe) * p.rotation}deg)`,
                      transformOrigin: "50% 100%",
                      filter: `blur(${(Math.max(0, 1 - lin * 1.6) * 6 * u).toFixed(2)}px)`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
        {p.caption.trim() !== "" && (
          <div
            style={{
              marginTop: 28 * u,
              fontSize: 40 * u,
              fontWeight: 400,
              letterSpacing: "-0.012em",
              color: p.quiet,
              opacity: cap,
              transform: `translateY(${(1 - cap) * 18 * u}px)`,
            }}
          >
            {p.caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
