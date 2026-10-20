import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, STAGGER, mix, progress, useLayout } from "../../kit";

// Four statements cut on a beat, each a flat full-frame block: the canvas and its ink inverse alternate (Paper and
// Ink, Stone and Ink, or Ink and Paper). Order: A statement → B number → A statement → B final, which holds with one
// accent word. Type is Inter 500 in sentence case; the only giant thing is the cropped tabular number.

export type BlockTypeProps = {
  background: string; // block A (beats 1 and 3); also the root fill, so A beats export transparent
  textA: string;
  blockB: string; // block B (beats 2 and 4), the ink inverse of block A
  textB: string;
  quietB: string; // the number's lead-in and unit: the grey half of the two-tone
  accent: string; // only the final key word
  line1: string;
  numberPre: string;
  number: string;
  numberUnit: string;
  line3: string;
  final: string;
  accentWord: string; // word(s) of `final` painted in accent
  beat: number; // frames per statement
  ease: string;
};

// ---------- type metrics (Inter variable at wght 500, opsz 32, measured from public/fonts/Inter-Variable.woff2) ----------
export const WEIGHT = 500;
export const LH = 1; // line height
export const TRACK = -0.045; // em
const ASC = 0.96875;
const DESC = 0.24121;
const CAP = 0.7275; // cap (and figure) height / em
const BASE = (LH - ASC - DESC) / 2 + ASC; // 0.864: baseline from the top of a line box
const CAP_TOP = BASE - CAP; // caps start this far below the line box top
export const CROP = 0.2; // share of the big number's figure height cropped by the bottom edge
export const ENTER = 18; // frames for every entrance
export const TYPE_DELAY = 1; // frames of pure block after each hard cut

const ADV: Record<string, number> = {
  A: 0.673, B: 0.64, C: 0.724, D: 0.693, E: 0.589, F: 0.563, G: 0.732, H: 0.711, I: 0.241, J: 0.544, K: 0.651, L: 0.542, M: 0.87,
  N: 0.715, O: 0.749, P: 0.618, Q: 0.749, R: 0.638, S: 0.627, T: 0.619, U: 0.704, V: 0.671, W: 0.965, X: 0.663, Y: 0.658, Z: 0.62,
  a: 0.529, b: 0.576, c: 0.534, d: 0.576, e: 0.544, f: 0.328, g: 0.576, h: 0.56, i: 0.219, j: 0.219, k: 0.521, l: 0.219, m: 0.854,
  n: 0.56, o: 0.56, p: 0.576, q: 0.576, r: 0.339, s: 0.49, t: 0.33, u: 0.56, v: 0.526, w: 0.774, x: 0.517, y: 0.526, z: 0.493,
  "0": 0.625, "1": 0.372, "2": 0.574, "3": 0.605, "4": 0.631, "5": 0.584, "6": 0.595, "7": 0.527, "8": 0.593, "9": 0.595,
  " ": 0.238, ".": 0.228, ",": 0.228, "!": 0.229, "?": 0.539, "'": 0.26, "’": 0.203, "*": 0.491, "+": 0.637, "-": 0.434,
  "&": 0.621, "%": 0.875, $: 0.627, "#": 0.608, "@": 0.985, ":": 0.228, "/": 0.338, "(": 0.31, ")": 0.31, "…": 0.684, '"': 0.426,
};
const TABULAR = 0.645; // every figure with font-variant-numeric: tabular-nums
// Rendered advance width in em, tracking included. Kerning only ever tightens this, so it's a safe upper bound.
export const textWidth = (s: string, tabular = false) =>
  Array.from(s).reduce((w, ch) => w + (tabular && /\d/.test(ch) ? TABULAR : (ADV[ch] ?? 0.75)) + TRACK, 0);

export type Fit = { lines: string[][]; size: number };
const splits = (words: string[], n: number): string[][][] => {
  if (n === 1) return [[words]];
  const out: string[][][] = [];
  for (let i = 1; i <= words.length - n + 1; i++) for (const rest of splits(words.slice(i), n - 1)) out.push([words.slice(0, i), ...rest]);
  return out;
};
const widest = (lines: string[][]) => Math.max(...lines.map((l) => textWidth(l.join(" "))));
// Break a statement into 1–3 lines so it sets as large as possible inside maxW × maxH, capped at maxSize.
// An extra line has to buy at least 20% more size, so short statements stay on one line.
export const fitLines = (text: string, maxW: number, maxH: number, maxSize: number): Fit => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [], size: maxSize };
  let best: Fit = { lines: [words], size: Math.min(maxSize, maxW / (textWidth(words.join(" ")) * 1.03), maxH / LH) };
  for (let n = 2; n <= Math.min(3, words.length); n++) {
    const lines = splits(words, n).reduce((a, b) => (widest(b) < widest(a) ? b : a));
    const size = Math.min(maxSize, maxW / (widest(lines) * 1.03), maxH / (n * LH));
    if (size > best.size * 1.2) best = { lines, size };
  }
  return best;
};

type TextProps = Pick<BlockTypeProps, "line1" | "numberPre" | "number" | "numberUnit" | "line3" | "final">;
// All layout in one pure function so the prompt can quote the exact sizes the component renders.
export const blockLayout = (W: number, H: number, p: TextProps) => {
  const u = Math.min(W, H) / 1080;
  const wide = W > H;
  const vertical = H > W;
  // safe area: 96/80px at 16:9, 8% / 7% of the frame otherwise
  const padX = wide ? 96 * u : W * 0.08;
  const padY = wide ? 80 * u : H * 0.07;
  const maxW = W - 2 * padX;
  const maxH = H - 2 * padY;
  const maxSize = (wide ? 320 : vertical ? 280 : 260) * u;
  const s1 = fitLines(p.line1, maxW, maxH * 0.8, maxSize);
  const s3 = fitLines(p.line3, maxW, maxH * 0.8, maxSize);
  const fin = fitLines(p.final, maxW, maxH * 0.85, maxSize);

  const labelEm = Math.max(textWidth(p.numberPre), textWidth(p.numberUnit), 0.5) * 1.03;
  const numEm = Math.max(textWidth(p.number, true), 0.7) * 1.03;
  const gap = 56 * u;
  let label: number;
  let num: number;
  if (wide) {
    // lead-in top-left, unit bottom-left, the number on the right edge of the safe area
    label = Math.min(120 * u, (W * 0.34) / labelEm);
    const unitW = textWidth(p.numberUnit) * 1.03 * label;
    num = Math.min(960 * u, (maxW - unitW - gap) / numEm, (H * 0.8) / ((1 - CROP) * CAP));
  } else {
    // stacked: lead-in top-left, unit just above the number, the number across the bottom
    label = Math.min((vertical ? 160 : 130) * u, maxW / labelEm);
    num = Math.min((vertical ? 1100 : 900) * u, maxW / numEm);
  }
  const numCapTop = H - (1 - CROP) * CAP * num;
  return { u, wide, vertical, padX, padY, maxSize, s1, s3, fin, label, num, numCapTop, gap };
};

const typeStyle = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_SANS,
  fontWeight: WEIGHT,
  fontSize: size,
  lineHeight: LH,
  letterSpacing: `${TRACK}em`,
  color,
  whiteSpace: "pre",
  margin: 0,
});

const norm = (s: string) => s.toLowerCase().replace(/[\s.,!?;:'"’*…()\-]/g, "");

// counts up to the number with the beat's ease; non-numeric values are shown as typed
const rolled = (num: string, t: number, ease: string) => {
  if (!/^\d{1,6}$/.test(num)) return num;
  const n = Math.round(parseInt(num, 10) * progress(t, 0, ENTER, ease));
  return String(n).padStart(num.length, "0");
};

const Statement: React.FC<{ fit: Fit; color: string }> = ({ fit, color }) => (
  <div style={{ ...typeStyle(fit.size, color), textAlign: "center" }}>
    {fit.lines.map((l, i) => (
      <div key={i}>{l.join(" ")}</div>
    ))}
  </div>
);

export const BlockType: React.FC<BlockTypeProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, u } = useLayout();
  const L = blockLayout(W, H, p);
  const beat = Math.max(1, Math.round(p.beat));
  const idx = Math.min(3, Math.floor(frame / beat));
  const t = frame - idx * beat - TYPE_DELAY; // frames since this beat's type started
  const onB = idx % 2 === 1;
  // every entrance: 0 → 1 over ENTER frames on the chosen ease, opacity on the same curve
  const k = (x: number) => progress(x, 0, ENTER, p.ease);

  let content: React.ReactNode = null;
  if (t >= 0 && (idx === 0 || idx === 2)) {
    const fit = idx === 0 ? L.s1 : L.s3;
    const text = idx === 0 ? p.line1 : p.line3;
    const e = k(t);
    // statement 1 scales up from 0.88; statement 3 slides in 80px from the right. Both fade from 0.
    const transform = idx === 0 ? `scale(${mix(0.88, 1, e).toFixed(4)})` : `translateX(${mix(80 * u, 0, e).toFixed(2)}px)`;
    content = text.trim() ? (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: Math.min(1, e), transform }}>
          <Statement fit={fit} color={p.textA} />
        </div>
      </AbsoluteFill>
    ) : null;
  } else if (t >= 0 && idx === 1) {
    const unitT = t - 2 * STAGGER;
    const capPx = (1 - CROP) * CAP * L.num;
    const numTop = H + CROP * CAP * L.num - BASE * L.num; // the baseline sits CROP of the figure height below the frame
    const unitTop = L.wide ? H - L.padY - BASE * L.label : L.numCapTop - 40 * u - BASE * L.label;
    const ePre = k(t);
    const eNum = k(t);
    const eUnit = k(unitT);
    content = (
      <>
        {p.numberPre.trim() ? (
          <div
            style={{
              ...typeStyle(L.label, p.quietB),
              position: "absolute",
              left: L.padX,
              top: L.padY - CAP_TOP * L.label,
              opacity: Math.min(1, ePre),
              transform: `translateY(${mix(24 * u, 0, ePre).toFixed(2)}px)`,
            }}
          >
            {p.numberPre}
          </div>
        ) : null}
        {/* the number only rises: it enters from below the frame edge, so it needs no fade */}
        <div
          style={{
            ...typeStyle(L.num, p.textB),
            position: "absolute",
            top: numTop,
            ...(L.wide ? { right: L.padX } : { left: L.padX }),
            fontVariantNumeric: "tabular-nums",
            transform: `translateY(${mix(capPx * 0.45, 0, eNum).toFixed(2)}px)`,
          }}
        >
          {rolled(p.number.trim(), t, p.ease)}
        </div>
        {p.numberUnit.trim() && unitT >= 0 ? (
          <div
            style={{
              ...typeStyle(L.label, p.quietB),
              position: "absolute",
              left: L.padX,
              top: unitTop,
              opacity: Math.min(1, eUnit),
              transform: `translateY(${mix(24 * u, 0, eUnit).toFixed(2)}px)`,
            }}
          >
            {p.numberUnit}
          </div>
        ) : null}
      </>
    );
  } else if (t >= 0 && idx === 3) {
    const accents = p.accentWord.split(/\s+/).map(norm).filter(Boolean);
    const fs = L.fin.size;
    let n = 0;
    content = (
      <div style={{ ...typeStyle(fs, p.textB), position: "absolute", left: L.padX, bottom: L.padY - (LH - BASE) * fs }}>
        {L.fin.lines.map((line, li) => (
          <div key={li}>
            {line.map((w, wi) => {
              // words rise one by one, STAGGER apart (in groups of 8)
              const e = k(t - STAGGER * (n++ % 8));
              const lit = accents.includes(norm(w));
              return (
                <React.Fragment key={wi}>
                  {wi > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      color: lit ? p.accent : p.textB,
                      opacity: Math.min(1, e),
                      transform: `translateY(${mix(fs * 0.3, 0, e).toFixed(2)}px)`,
                    }}
                  >
                    {w}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: p.background, overflow: "hidden", fontFamily: FONT_SANS }}>
      {onB ? <AbsoluteFill style={{ background: p.blockB }} /> : null}
      {content}
    </AbsoluteFill>
  );
};
