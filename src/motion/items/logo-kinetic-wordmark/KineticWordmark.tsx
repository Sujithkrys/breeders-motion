import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";

export type KineticWordmarkProps = {
  background: string;
  ink: string; // the wordmark
  ink2: string; // the tagline
  accent: string; // the tagline's dot
  logo: string;
  brand: string;
  tagline: string;
  stagger: number; // frames between letters
};

// Inter variable at wght 600, opsz 32, measured from public/fonts/Inter-Variable.woff2 (advance per 1000 em).
// Used to fit the wordmark to the frame; the letters themselves are laid out by the browser.
const GLYPHS = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-'!?&/@_#%+$";
const ADV = [
  226, 541, 587, 544, 587, 553, 349, 587, 573, 232, 233, 536, 232, 869, 573, 570, 587, 587, 356, 505, 350, 573, 540, 796, 527, 540, 508, 693, 643, 725,
  697, 599, 572, 734, 715, 250, 553, 668, 550, 882, 720, 748, 625, 748, 644, 640, 627, 704, 688, 981, 680, 674, 627, 638, 380, 586, 613, 644, 592, 606,
  539, 604, 606, 236, 236, 236, 439, 266, 238, 553, 634, 351, 996, 468, 617, 906, 646, 640,
];
const advEm = (c: string) => (GLYPHS.indexOf(c) < 0 ? 0.62 : ADV[GLYPHS.indexOf(c)] / 1000);

// Inter vertical metrics (typo, used by browsers since USE_TYPO_METRICS is set) and where they fall in a 1.2 line box.
const ASC = 0.96875;
const DESC = 0.24121;
const CAP = 0.72754;
const LH = 1.2; // each letter's mask is one line box tall, so descenders are never clipped
const BASE = (LH - ASC - DESC) / 2 + ASC; // 0.964em: baseline from the top of the mask
const CAP_TOP = BASE - CAP; // 0.236em: cap line from the top of the mask

// Shared with the prompt so it quotes the real frames and sizes.
export const KW = {
  base: { wide: 220, square: 180, vertical: 200 }, // wordmark size before fitting
  weight: 600,
  tracking: -0.03,
  pad: 0.15, // em of side padding on each mask (offset by negative margins) so overhangs aren't clipped
  markGap: 0.16, // em between the mark and the first letter (inline)
  stackMark: 1.25, // mark size on 9:16, × cap height
  stackGap: 0.3, // em from the stacked mark to the cap line
  mark: [4, 32] as const, // rotate −90° → 0°, scale 0.6 → 1, spring
  markFade: 10,
  letters: 10, // first letter starts
  letterDur: 24, // each letter's spring
  lastStart: 50, // the last letter starts by here; longer names tighten the stagger
  scaleFrom: 1.15,
  settle: [28, 84] as const, // lockup 1.15 → 1 on travel
  tag: [70, 92] as const,
  tagRise: 16,
  tagSize: { wide: 22, vertical: 26 },
  tagTop: 0.4, // em of the wordmark from the baseline to the tagline's top
  dot: 10,
  dotGap: 14,
  edge: 24, // px kept clear of the frame edge at the 1.15 start scale
};

export const charsOf = (brand: string) => Array.from(String(brand ?? "").trim());
export const wordEm = (chars: string[]) => chars.reduce((w, c) => w + advEm(c) + KW.tracking, 0);
export const lastStartOf = (stagger: number, n: number) =>
  n > 1 ? Math.min(Number(stagger) || 0, (KW.lastStart - KW.letters) / (n - 1)) : 0;

export const sizesFor = (brand: string, width: number, height: number, u: number) => {
  const vertical = height > width;
  const ratio = vertical ? "vertical" : width === height ? "square" : "wide";
  const chars = charsOf(brand);
  const w = Math.max(wordEm(chars), 1);
  const lockupEm = vertical ? Math.max(w, CAP * KW.stackMark) : w + CAP + KW.markGap;
  const safe = ratio === "wide" ? 96 * u : width * 0.08;
  const size = Math.min(KW.base[ratio] * u, (width - 2 * safe) / lockupEm, (width - 2 * KW.edge * u) / (KW.scaleFrom * lockupEm));
  return {
    size,
    mark: CAP * size * (vertical ? KW.stackMark : 1),
    cap: CAP * size,
    tag: (vertical ? KW.tagSize.vertical : KW.tagSize.wide) * u,
  };
};

export const KineticWordmark: React.FC<KineticWordmarkProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, isVertical } = useLayout();
  const S = sizesFor(p.brand, width, height, u);
  const chars = charsOf(p.brand);
  const st = lastStartOf(p.stagger, chars.length);
  const tagline = String(p.tagline ?? "").trim();

  const km = progress(frame, KW.mark[0], KW.mark[1], "spring");
  const markOpacity = progress(frame, KW.mark[0], KW.mark[0] + KW.markFade, "enter");
  const scale = mix(KW.scaleFrom, 1, progress(frame, KW.settle[0], KW.settle[1], "travel"));
  const kt = progress(frame, KW.tag[0], KW.tag[1], "enter");
  const pad = KW.pad * S.size;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* the lockup: one camera move, 1.15 → 1 about its centre */}
        <div
          style={{
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: isVertical ? "center" : "flex-start",
            transform: `scale(${scale.toFixed(4)})`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* the mark: the leading glyph, sized to the cap height and sitting on the baseline */}
          <div
            style={{
              width: S.mark,
              height: S.mark,
              marginTop: isVertical ? 0 : CAP_TOP * S.size,
              marginRight: isVertical ? 0 : KW.markGap * S.size,
              marginBottom: isVertical ? (KW.stackGap - CAP_TOP) * S.size : 0,
              opacity: markOpacity,
              transform: `rotate(${(-90 * (1 - km)).toFixed(3)}deg) scale(${mix(0.6, 1, km).toFixed(4)})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img src={sampleLogoFor(p.logo, p.ink)} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          </div>

          {/* the wordmark: every letter in its own mask; even letters rise from below, odd ones drop from above */}
          <div style={{ display: "flex", flexDirection: "row" }}>
            {chars.map((ch, i) => {
              const s = KW.letters + i * st;
              const t = progress(frame, s, s + KW.letterDur, "spring");
              const dir = i % 2 === 0 ? 1 : -1;
              return (
                <div key={i} style={{ overflow: "hidden", height: LH * S.size, padding: `0 ${pad}px`, margin: `0 ${-pad}px` }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: S.size,
                      fontWeight: KW.weight,
                      letterSpacing: `${KW.tracking}em`,
                      lineHeight: LH,
                      whiteSpace: "pre",
                      color: p.ink,
                      transform: `translateY(${((1 - t) * dir * LH * S.size).toFixed(2)}px)`,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* the tagline: a small mono label with the one accent dot, under the settled lockup */}
        {tagline ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: KW.dotGap * u,
              marginTop: (KW.tagTop - (LH - BASE)) * S.size,
              opacity: kt,
              transform: `translateY(${((1 - kt) * KW.tagRise * u).toFixed(2)}px)`,
            }}
          >
            <div style={{ width: KW.dot * u, height: KW.dot * u, borderRadius: 999, background: p.accent }} />
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: S.tag,
                fontWeight: 400,
                letterSpacing: "0.12em",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                color: p.ink2,
              }}
            >
              {tagline.toUpperCase()}
            </span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
