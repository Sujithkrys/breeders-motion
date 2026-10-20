import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, mix, progress, useLayout } from "../../kit";

// Ported from the ClaudeFull film's flat-block WordShots ("SH*T." on blue, "IN 30 DAYS." with the cropped number,
// "IN SOME EDITOR." on white, "+ MY PROMPT?"): four statements cut on a beat, each a flat full-frame block with
// heavy Geist type that slams in. Order: A statement → B number → A statement → B final (holds, one accent word).

export type BlockTypeProps = {
  background: string; // block A (beats 1 and 3); also the root fill, so A beats export transparent
  textA: string;
  blockB: string; // block B (beats 2 and 4)
  textB: string;
  accentColor: string; // the number's unit word and the final accent word, both on block B
  line1: string;
  numberPre: string;
  number: string;
  numberUnit: string;
  line3: string;
  final: string;
  accent: string; // word(s) of `final` painted in accentColor
  beat: number; // frames per statement
  ease: string;
};

// ---------- type metrics (Geist variable at wght 800, measured from the font file) ----------
export const LH = 0.86; // line height
export const TRACK = -0.05; // em
const CAP = 0.71; // cap height / em
const BASE = 0.785; // baseline from the top of a 0.86 line box (ascent 1.005, descent 0.295)
const CAP_TOP = BASE - CAP; // 0.075: caps start this far below the line box top
export const CROP = 0.2; // share of the big number's cap height cropped by the bottom edge
export const SLAM = 6; // frames for the main slam move
export const TYPE_DELAY = 1; // frames of pure block after each hard cut

const ADV: Record<string, number> = {
  A: 0.75, B: 0.71, C: 0.745, D: 0.723, E: 0.628, F: 0.609, G: 0.751, H: 0.724, I: 0.31, J: 0.637, K: 0.705, L: 0.592, M: 0.927,
  N: 0.753, O: 0.788, P: 0.679, Q: 0.781, R: 0.706, S: 0.695, T: 0.615, U: 0.708, V: 0.751, W: 1.038, X: 0.715, Y: 0.65, Z: 0.61,
  a: 0.609, b: 0.647, c: 0.615, d: 0.647, e: 0.62, f: 0.464, g: 0.647, h: 0.621, i: 0.294, j: 0.355, k: 0.666, l: 0.328, m: 0.907,
  n: 0.621, o: 0.633, p: 0.647, q: 0.647, r: 0.44, s: 0.586, t: 0.462, u: 0.618, v: 0.633, w: 0.859, x: 0.671, y: 0.603, z: 0.598,
  "0": 0.703, "1": 0.703, "2": 0.703, "3": 0.703, "4": 0.703, "5": 0.703, "6": 0.703, "7": 0.703, "8": 0.703, "9": 0.703, // tabular
  " ": 0.221, ".": 0.248, ",": 0.248, "!": 0.272, "?": 0.602, "'": 0.212, "’": 0.261, "*": 0.419, "+": 0.574, "-": 0.417,
  "&": 0.734, "%": 0.833, $: 0.683, "#": 0.626, "@": 0.981, ":": 0.315, "/": 0.536, "(": 0.339, ")": 0.339, "…": 0.737, '"': 0.405,
};
// Rendered advance width in em, tracking included. Kerning only ever tightens this, so it's a safe upper bound.
export const textWidth = (s: string) => Array.from(s).reduce((w, ch) => w + (ADV[ch] ?? 0.75) + TRACK, 0);

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
  const padX = (wide ? 96 : vertical ? 64 : 72) * u;
  const padY = (wide ? 80 : vertical ? 110 : 72) * u;
  const maxW = W - 2 * padX;
  const maxH = H - 2 * padY;
  const maxSize = (wide ? 340 : vertical ? 300 : 280) * u;
  const s1 = fitLines(p.line1, maxW, maxH * 0.8, maxSize);
  const s3 = fitLines(p.line3, maxW, maxH * 0.8, maxSize);
  const fin = fitLines(p.final, maxW, maxH * 0.85, maxSize);

  const labelEm = Math.max(textWidth(p.numberPre), textWidth(p.numberUnit), 0.5) * 1.03;
  const numEm = Math.max(textWidth(p.number), 0.7) * 1.03;
  const gap = 56 * u;
  let label: number;
  let num: number;
  if (wide) {
    // the film's layout: lead-in top-left, unit bottom-left, the number on the right
    label = Math.min(120 * u, (W * 0.34) / labelEm);
    const unitW = textWidth(p.numberUnit) * 1.03 * label;
    num = Math.min(960 * u, (W - 1.6 * padX - unitW - gap) / numEm, (H * 0.8) / ((1 - CROP) * CAP));
  } else {
    // stacked: lead-in top-left, unit just above the number, the number across the bottom
    label = Math.min((vertical ? 180 : 140) * u, maxW / labelEm);
    num = Math.min((vertical ? 1100 : 900) * u, maxW / numEm);
  }
  const numCapTop = H - (1 - CROP) * CAP * num;
  return { u, wide, vertical, padX, padY, maxSize, s1, s3, fin, label, num, numCapTop, gap };
};

// ---------- motion ----------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// 0 → 1 over `dur` frames with the chosen ease, then a sine overshoot past 1 that settles by ~1.5 × dur.
const slam = (t: number, dur: number, ease: string, amp: number) => {
  if (t <= 0) return 0;
  const k = clamp01((t - dur * 0.5) / dur);
  return progress(t, 0, dur, ease) + amp * Math.sin(Math.PI * k);
};
const blurAt = (t: number, u: number) => (t < SLAM ? 14 * u * (1 - progress(t, 0, SLAM * 0.8, "smooth")) : 0);
const blurCss = (px: number) => (px > 0.3 ? `blur(${px.toFixed(2)}px)` : undefined);

// The film's directional ghost trail, kept to two faint copies during the slam only.
const Smear: React.FC<{ t: number; pose: (t: number) => string; style?: React.CSSProperties; children: React.ReactNode }> = ({ t, pose, style, children }) => (
  <>
    {t > 0 && t < SLAM
      ? [1.4, 0.7].map((d, i) => (
          <div key={d} style={{ ...style, transform: pose(t - d), opacity: (i === 0 ? 0.1 : 0.2) * (1 - t / SLAM) }}>
            {children}
          </div>
        ))
      : null}
    <div style={{ ...style, transform: pose(t) }}>{children}</div>
  </>
);

const typeStyle = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_SANS,
  fontWeight: 800,
  fontSize: size,
  lineHeight: LH,
  letterSpacing: `${TRACK}em`,
  color,
  whiteSpace: "pre",
  margin: 0,
});

const norm = (s: string) => s.toUpperCase().replace(/[\s.,!?;:'"’*…()\-]/g, "");

const rolled = (num: string, t: number, dur: number, ease: string) => {
  if (!/^\d{1,6}$/.test(num)) return num;
  const n = Math.round(parseInt(num, 10) * progress(t, 0, dur, ease));
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
  const { width: W, height: H, durationInFrames, u } = useLayout();
  const L = blockLayout(W, H, p);
  const beat = Math.max(1, Math.round(p.beat));
  const idx = Math.min(3, Math.floor(frame / beat));
  const start = idx * beat;
  const l = frame - start; // frames since the hard cut
  const t = l - TYPE_DELAY; // frames since the type started
  const len = idx === 3 ? durationInFrames - start : beat;
  const onB = idx % 2 === 1;

  // camera: a small settle on every cut plus a slow push through the beat
  const settle = 1 + 0.025 * (1 - progress(l, 0, 8, "smooth"));
  const drift = 1 + (idx === 3 ? 0.03 : 0.02) * progress(l, 0, len, "soft");
  const cam: React.CSSProperties = { transform: `scale(${(settle * drift).toFixed(5)})`, transformOrigin: idx === 3 ? "0% 100%" : "50% 50%" };

  let content: React.ReactNode = null;
  if (t >= 0 && (idx === 0 || idx === 2)) {
    const fit = idx === 0 ? L.s1 : L.s3;
    const text = idx === 0 ? p.line1 : p.line3;
    const pose =
      idx === 0
        ? (x: number) => `scale(${mix(1.55, 1, slam(x, SLAM, p.ease, 0.06)).toFixed(4)})`
        : (x: number) => `translateX(${mix(W * 0.42, 0, slam(x, SLAM, p.ease, 0.05)).toFixed(2)}px)`;
    content = text.trim() ? (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", filter: blurCss(blurAt(t, u)), opacity: Math.min(1, 0.55 + t * 0.45) }}>
        <Smear t={t} pose={pose} style={{ position: "absolute" }}>
          <Statement fit={fit} color={p.textA} />
        </Smear>
      </AbsoluteFill>
    ) : null;
  } else if (t >= 0 && idx === 1) {
    const unitT = t - 3;
    const capPx = (1 - CROP) * CAP * L.num;
    const numTop = H + CROP * CAP * L.num - BASE * L.num; // baseline sits CROP of the cap height below the frame
    const unitTop = L.wide ? H - L.padY - BASE * L.label : L.numCapTop - 40 * u - BASE * L.label;
    const numPose = (x: number) => `translateY(${mix(capPx * 0.7, 0, slam(x, SLAM + 1, p.ease, 0.05)).toFixed(2)}px)`;
    content = (
      <>
        {p.numberPre.trim() ? (
          <div
            style={{
              ...typeStyle(L.label, p.textB),
              position: "absolute",
              left: L.padX,
              top: L.padY - CAP_TOP * L.label,
              transformOrigin: "0% 0%",
              transform: `scale(${mix(1.4, 1, slam(t, SLAM, p.ease, 0.06)).toFixed(4)})`,
              filter: blurCss(blurAt(t, u) * 0.6),
            }}
          >
            {p.numberPre}
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, filter: blurCss(blurAt(t, u)) }}>
          <Smear
            t={t}
            pose={numPose}
            style={{
              ...typeStyle(L.num, p.textB),
              position: "absolute",
              top: numTop,
              ...(L.wide ? { right: L.padX * 0.6 } : { left: L.padX }),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {rolled(p.number.trim(), t, Math.max(8, Math.round(beat * 0.55)), p.ease)}
          </Smear>
        </div>
        {p.numberUnit.trim() && unitT >= 0 ? (
          <div
            style={{
              ...typeStyle(L.label, p.accentColor),
              position: "absolute",
              left: L.padX,
              top: unitTop,
              opacity: Math.min(1, 0.5 + unitT * 0.5),
              transform: `translateY(${mix(L.label * 0.9, 0, slam(unitT, SLAM, p.ease, 0.08)).toFixed(2)}px)`,
              filter: blurCss(blurAt(unitT, u) * 0.6),
            }}
          >
            {p.numberUnit}
          </div>
        ) : null}
      </>
    );
  } else if (t >= 0 && idx === 3) {
    const accents = p.accent.split(/\s+/).map(norm).filter(Boolean);
    const fs = L.fin.size;
    let k = 0;
    content = (
      <div style={{ ...typeStyle(fs, p.textB), position: "absolute", left: L.padX, bottom: L.padY - (LH - BASE) * fs }}>
        {L.fin.lines.map((line, li) => (
          <div key={li}>
            {line.map((w, wi) => {
              const wt = t - 2 * k++;
              const s = slam(wt, SLAM, p.ease, 0.07);
              const lit = accents.includes(norm(w));
              return (
                <React.Fragment key={wi}>
                  {wi > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      color: lit ? p.accentColor : p.textB,
                      opacity: wt < 0 ? 0 : Math.min(1, 0.5 + wt * 0.5),
                      transformOrigin: "0% 100%",
                      transform: `translateY(${mix(fs * 0.5, 0, s).toFixed(2)}px) scale(${mix(1.2, 1, s).toFixed(4)})`,
                      filter: blurCss(wt >= 0 ? blurAt(wt, u) * 0.7 : 0),
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
      <AbsoluteFill style={cam}>{content}</AbsoluteFill>
    </AbsoluteFill>
  );
};
