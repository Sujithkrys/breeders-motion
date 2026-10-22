import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";

export type TypewriterLockupProps = {
  background: string;
  ink: string; // the typed text and the wordmark
  ink2: string; // the tagline
  accent: string; // the caret, which becomes the full stop
  logo: string;
  brand: string;
  tagline: string;
  speed: number; // frames per typed character
};

// Inter variable at wght 600, opsz 32, measured from public/fonts/Inter-Variable.woff2 (advance per 1000 em).
// Every letter is placed from these, so each mono letter knows exactly where its Inter twin will stand.
const GLYPHS = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-'!?&/@_#%+$";
const ADV = [
  226, 541, 587, 544, 587, 553, 349, 587, 573, 232, 233, 536, 232, 869, 573, 570, 587, 587, 356, 505, 350, 573, 540, 796, 527, 540, 508, 693, 643, 725,
  697, 599, 572, 734, 715, 250, 553, 668, 550, 882, 720, 748, 625, 748, 644, 640, 627, 704, 688, 981, 680, 674, 627, 638, 380, 586, 613, 644, 592, 606,
  539, 604, 606, 236, 236, 236, 439, 266, 238, 553, 634, 351, 996, 468, 617, 906, 646, 640,
];
const advEm = (c: string) => (GLYPHS.indexOf(c) < 0 ? 0.62 : ADV[GLYPHS.indexOf(c)] / 1000);

// Vertical metrics (typo; both fonts set USE_TYPO_METRICS). Glyphs sit in a 1.2 line box; BASE is the baseline
// from the top of that box, so both families can be pinned to one shared baseline.
const LH = 1.2;
const INTER = { asc: 0.96875, desc: 0.24121, cap: 0.72754 };
const MONO = { asc: 1.005, desc: 0.295, cap: 0.71, adv: 0.6 }; // Geist Mono: every glyph advances 0.6em
const baseOf = (m: { asc: number; desc: number }) => (LH - m.asc - m.desc) / 2 + m.asc;
const INTER_BASE = baseOf(INTER); // 0.964em
const MONO_BASE = baseOf(MONO); // 0.955em

// Shared with the prompt so it quotes the real frames and sizes.
export const TW = {
  base: { wide: 140, square: 128, vertical: 132 }, // type size before fitting; mono and Inter share it
  weight: 600,
  tracking: -0.03,
  blink: [8, 14] as const, // the caret blinks off once before typing
  typeAt: 16, // first key
  typeBudget: 28, // frames from the first key to the last; long names type faster
  pause: 12, // frames between the last key and the morph
  morphStagger: 2, // frames between letters in the morph
  morphBudget: 10, // the last letter starts its morph within this many frames of the first
  letterDur: 22, // each letter's spring from its mono slot to its Inter slot
  monoFade: 10, // the mono glyph fades out (exit) over the first frames of its letter's move
  interFade: [3, 15] as const, // the Inter glyph fades in (enter), relative to its letter's move
  caret: { at: 6, dur: 26, w: 0.5, h: 0.84, drop: 0.1 }, // relative to the morph; block size in em
  dot: 0.15, // em: the full stop the caret becomes
  dotGap: 0.06, // em after the last letter
  mark: { at: 12, dur: 22, fade: 8, inline: 0.84, stack: 1.05, gap: 0.3, stackGap: 0.32 },
  tag: { at: 24, dur: 20, rise: 12, wide: 34, vertical: 38, top: 0.42 },
};

export const charsOf = (brand: string) => Array.from(String(brand ?? "").trim());

export const timelineFor = (n: number, speed: number) => {
  const want = Math.max(1, Number(speed) || 3);
  const spd = n > 1 ? Math.min(want, TW.typeBudget / (n - 1)) : want;
  const appear = Array.from({ length: n }, (_, i) => TW.typeAt + Math.round(i * spd));
  const lastKey = n ? appear[n - 1] : TW.typeAt;
  const morph = lastKey + TW.pause;
  const ms = n > 1 ? Math.min(TW.morphStagger, TW.morphBudget / (n - 1)) : 0;
  return {
    spd,
    appear,
    lastKey,
    morph,
    ms,
    lettersEnd: Math.round(morph + Math.max(0, n - 1) * ms + TW.letterDur),
    caret: [morph + TW.caret.at, morph + TW.caret.at + TW.caret.dur] as const,
    mark: [morph + TW.mark.at, morph + TW.mark.at + TW.mark.dur] as const,
    tag: [morph + TW.tag.at, morph + TW.tag.at + TW.tag.dur] as const,
  };
};

export const layoutFor = (brand: string, hasTag: boolean, width: number, height: number, u: number) => {
  const vertical = height > width;
  const ratio = vertical ? "vertical" : width === height ? "square" : "wide";
  const chars = charsOf(brand);
  const n = chars.length;
  const interEm = chars.reduce((w, c) => w + advEm(c) + TW.tracking, 0);
  const wordEm = interEm + TW.dotGap + TW.dot; // the wordmark with its full stop
  const monoEm = (n + 1) * MONO.adv; // the typed text plus the caret's cell
  const lockEm = vertical ? Math.max(wordEm, TW.mark.stack) : TW.mark.inline + TW.mark.gap + wordEm;
  const safe = ratio === "wide" ? 96 * u : width * 0.08;
  const size = Math.min(TW.base[ratio] * u, (width - 2 * safe) / Math.max(lockEm, monoEm, 1));

  const cx = width / 2;
  const cy = height / 2;
  const cap = INTER.cap * size;
  const tagSize = (vertical ? TW.tag.vertical : TW.tag.wide) * u;
  const tagBelow = hasTag ? TW.tag.top * size + tagSize * LH : 0; // baseline to the tagline's bottom

  // typing: the mono text is centred in the frame on its own
  const monoStart = cx - (n * MONO.adv * size) / 2;
  const yMono = cy + (MONO.cap * size) / 2;

  // final lockup, centred together with its tagline
  let markS: number, markX: number, markY: number, interStart: number, yFinal: number;
  if (vertical) {
    markS = TW.mark.stack * size;
    const top = cy - (markS + TW.mark.stackGap * size + cap + tagBelow) / 2;
    markX = cx - markS / 2;
    markY = top;
    yFinal = top + markS + TW.mark.stackGap * size + cap;
    interStart = cx - (wordEm * size) / 2;
  } else {
    markS = TW.mark.inline * size;
    const W = markS + TW.mark.gap * size + wordEm * size;
    yFinal = cy + cap / 2 - tagBelow / 2;
    markX = cx - W / 2;
    markY = yFinal - cap / 2 - markS / 2; // centred on the cap height
    interStart = markX + markS + TW.mark.gap * size;
  }
  const interX: number[] = [];
  let x = interStart;
  for (const c of chars) {
    interX.push(x);
    x += (advEm(c) + TW.tracking) * size;
  }
  return {
    size,
    chars,
    monoX: chars.map((_, i) => monoStart + i * MONO.adv * size),
    monoStart,
    yMono,
    interX,
    dotX: interStart + (interEm + TW.dotGap) * size,
    yFinal,
    markS,
    markX,
    markY,
    tagSize,
    tagTop: yFinal + TW.tag.top * size,
  };
};

export const TypewriterLockup: React.FC<TypewriterLockupProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const tagline = String(p.tagline ?? "").trim();
  const L = layoutFor(p.brand, Boolean(tagline), width, height, u);
  const T = timelineFor(L.chars.length, p.speed);
  const s = L.size;
  const monoAdv = MONO.adv * s;

  // caret: a block in the next mono cell, then it travels to the end of the wordmark and shrinks into a full stop
  const typed = T.appear.filter((a) => frame >= a).length;
  const kc = progress(frame, T.caret[0], T.caret[1], "spring");
  const caretW = mix(TW.caret.w, TW.dot, kc) * s;
  const caretH = mix(TW.caret.h, TW.dot, kc) * s;
  const caretBottom = mix(L.yMono, L.yFinal, kc) + mix(TW.caret.drop, 0, kc) * s;
  const caretLeft = mix(L.monoStart + typed * monoAdv + (monoAdv - TW.caret.w * s) / 2, L.dotX, kc);
  const caretOn = !(frame >= TW.blink[0] && frame < TW.blink[1]);

  const km = progress(frame, T.mark[0], T.mark[1], "spring");
  const markOpacity = progress(frame, T.mark[0], T.mark[0] + TW.mark.fade, "enter");
  const kt = progress(frame, T.tag[0], T.tag[1], "enter");

  const glyph: React.CSSProperties = { position: "absolute", left: 0, top: 0, fontSize: s, lineHeight: LH, whiteSpace: "pre", color: p.ink };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* the mark pops in to the left of (on 9:16, above) the wordmark */}
      <div
        style={{
          position: "absolute",
          left: L.markX,
          top: L.markY,
          width: L.markS,
          height: L.markS,
          opacity: markOpacity,
          transform: `scale(${mix(0.6, 1, km).toFixed(4)})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Img src={sampleLogoFor(p.logo, p.ink)} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>

      {/* each letter twice: the typed mono glyph and its Inter twin, moving together on one spring and cross-fading */}
      {L.chars.map((ch, i) => {
        const start = T.morph + i * T.ms;
        const k = progress(frame, start, start + TW.letterDur, "spring");
        const x = mix(L.monoX[i], L.interX[i], k);
        const y = mix(L.yMono, L.yFinal, k);
        const monoO = frame >= T.appear[i] ? 1 - progress(frame, start, start + TW.monoFade, "exit") : 0;
        const interO = progress(frame, start + TW.interFade[0], start + TW.interFade[1], "enter");
        return (
          <React.Fragment key={i}>
            {monoO > 0 ? (
              <span
                style={{
                  ...glyph,
                  fontFamily: FONT_MONO,
                  fontWeight: 400,
                  opacity: monoO,
                  transform: `translate(${x.toFixed(2)}px, ${(y - MONO_BASE * s).toFixed(2)}px)`,
                }}
              >
                {ch}
              </span>
            ) : null}
            {interO > 0 ? (
              <span
                style={{
                  ...glyph,
                  fontWeight: TW.weight,
                  letterSpacing: `${TW.tracking}em`,
                  opacity: interO,
                  transform: `translate(${x.toFixed(2)}px, ${(y - INTER_BASE * s).toFixed(2)}px)`,
                }}
              >
                {ch}
              </span>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* the caret, in the accent */}
      {caretOn ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: caretW,
            height: caretH,
            borderRadius: mix(0, TW.dot / 2, kc) * s, // square block → a round dot
            background: p.accent,
            transform: `translate(${caretLeft.toFixed(2)}px, ${(caretBottom - caretH).toFixed(2)}px)`,
          }}
        />
      ) : null}

      {/* the tagline, centred under the lockup */}
      {tagline ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.tagTop,
            textAlign: "center",
            fontSize: L.tagSize,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: LH,
            whiteSpace: "nowrap",
            color: p.ink2,
            opacity: kt,
            transform: `translateY(${((1 - kt) * TW.tag.rise * u).toFixed(2)}px)`,
          }}
        >
          {tagline}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
