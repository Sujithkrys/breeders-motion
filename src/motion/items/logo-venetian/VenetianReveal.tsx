import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, STROKE, alpha, progress, useLayout } from "../../kit";
import { sampleLogoFor } from "../../film";

export type VenetianRevealProps = {
  background: string; // behind the blinds while they turn
  card: string; // the slat face, which becomes the final field
  line: string; // slat edges; also the flat shade of a slat turned away
  ink: string; // wordmark
  ink2: string; // tagline
  accent: string; // the dot before the tagline
  logo: string;
  brand: string;
  tagline: string;
  slats: number; // 6–16 vertical slats
  speed: number; // wave speed, 0.75–1.5×
};

// Shared with the prompt so it quotes the real frames and sizes.
export const VENETIAN = {
  start: 6, // first slat starts turning
  turn: 36, // each slat's turn, on the spring
  delay: 3, // frames between neighbouring slats at 1× speed
  seam: 12, // after the last slat lands, its hairline edges fade on exit
  tag: [2, 22] as const, // after the last slat lands: tagline rises in
  tagRise: 12,
  perspective: 1600, // px at 1080, applied to each slat on its own
  shade: 0.6, // a slat turned edge-on is shaded with `line` at this opacity (scaled by sin of the angle)
} as const;

// Lockup geometry per ratio, px at 1080 on the short side. `share` caps the lockup's width as a share of the frame.
export const LOCKUP = {
  wide: { mark: 168, font: 150, gap: 44, share: 0.46 },
  square: { mark: 140, font: 124, gap: 36, share: 0.74 },
  tall: { mark: 208, font: 148, gap: 52, share: 0.8 },
  weight: 500,
  tracking: -0.035,
  tag: { wide: 22, tall: 26, gap: 56, dot: 10, dotGap: 14, tracking: 0.12 },
} as const;

export const slatCount = (n: number) => Math.round(Math.min(16, Math.max(6, n || 10)));
export const slatDelay = (speed: number) => VENETIAN.delay / Math.min(1.5, Math.max(0.75, speed || 1));
export const slatStart = (i: number, speed: number) => VENETIAN.start + i * slatDelay(speed);
export const settleFrame = (n: number, speed: number) => slatStart(slatCount(n) - 1, speed) + VENETIAN.turn;

// Inter 500 at -0.035em ≈ 0.58em per character.
export const lockupLayout = (brand: string, hasTag: boolean, width: number, height: number, u: number) => {
  const vertical = height > width;
  const L = vertical ? LOCKUP.tall : width === height ? LOCKUP.square : LOCKUP.wide;
  const mark = L.mark * u;
  const gap = L.gap * u;
  const room = width * L.share - (vertical ? 0 : mark + gap);
  const font = Math.min(L.font * u, room / (Math.max(brand.length, 3) * 0.58));
  const rowH = vertical ? mark + gap + font : Math.max(mark, font);
  const tagSize = (vertical ? LOCKUP.tag.tall : LOCKUP.tag.wide) * u;
  const tagGap = LOCKUP.tag.gap * u;
  const tagH = tagSize * 1.4;
  const groupH = rowH + (hasTag ? tagGap + tagH : 0);
  const rowTop = (height - groupH) / 2;
  return { vertical, mark, gap, font, rowH, rowTop, tagSize, tagTop: rowTop + rowH + tagGap, tagH };
};
type Layout = ReturnType<typeof lockupLayout>;

// The lockup row, laid out on the full frame so every slat's copy lines up exactly with its neighbours.
// Copies are cheap: one Img and one text node.
const LockupRow: React.FC<{ L: Layout; src: string; brand: string; ink: string; width: number }> = ({ L, src, brand, ink, width }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: L.rowTop,
      width,
      height: L.rowH,
      display: "flex",
      flexDirection: L.vertical ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: L.gap,
    }}
  >
    <Img src={src} style={{ width: L.mark, height: L.mark, objectFit: "contain", display: "block", flexShrink: 0 }} />
    <div
      style={{
        fontFamily: FONT_SANS,
        fontSize: L.font,
        fontWeight: LOCKUP.weight,
        letterSpacing: `${LOCKUP.tracking}em`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: ink,
      }}
    >
      {brand}
    </div>
  </div>
);

export const VenetianReveal: React.FC<VenetianRevealProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const n = slatCount(p.slats);
  const settle = settleFrame(n, p.speed);
  const clean = settle + VENETIAN.seam;
  const hasTag = p.tagline.trim().length > 0;
  const L = lockupLayout(p.brand, hasTag, width, height, u);
  const src = sampleLogoFor(p.logo, p.ink);
  const sw = width / n;
  const seamO = 1 - progress(frame, settle, clean, "exit");
  const kTag = progress(frame, settle + VENETIAN.tag[0], settle + VENETIAN.tag[1], "enter");
  const hair = STROKE.hair * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {frame < clean ? (
        Array.from({ length: n }, (_, i) => {
          const s = slatStart(i, p.speed);
          if (frame <= s) return null; // edge-on: nothing to draw yet
          const k = progress(frame, s, s + VENETIAN.turn, "spring");
          const angle = 90 * (1 - k);
          const rad = (angle * Math.PI) / 180;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: i * sw,
                top: 0,
                // 1px of overlap under the next slat hides antialiased seams; the hairline sits on each left edge
                width: sw + (i < n - 1 ? 1 : 0),
                height,
                overflow: "hidden",
                background: p.card,
                transformOrigin: "50% 50%",
                transform: `perspective(${(VENETIAN.perspective * u).toFixed(1)}px) rotateY(${angle.toFixed(3)}deg)`,
                boxShadow: i > 0 ? `inset ${hair}px 0 0 ${alpha(p.line, seamO)}` : undefined,
              }}
            >
              <div style={{ position: "absolute", left: -i * sw, top: 0, width, height }}>
                <LockupRow L={L} src={src} brand={p.brand} ink={p.ink} width={width} />
              </div>
              {angle > 0.5 ? (
                <div style={{ position: "absolute", inset: 0, background: p.line, opacity: VENETIAN.shade * Math.sin(rad) }} />
              ) : null}
            </div>
          );
        })
      ) : (
        // Settled: one clean field and one unsliced lockup in the same place, so no seams remain.
        <AbsoluteFill style={{ background: p.card }}>
          <LockupRow L={L} src={src} brand={p.brand} ink={p.ink} width={width} />
        </AbsoluteFill>
      )}

      {hasTag ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: L.tagTop,
            width,
            height: L.tagH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: LOCKUP.tag.dotGap * u,
            opacity: kTag,
            transform: `translateY(${((1 - kTag) * VENETIAN.tagRise * u).toFixed(2)}px)`,
          }}
        >
          <div style={{ width: LOCKUP.tag.dot * u, height: LOCKUP.tag.dot * u, borderRadius: 999, background: p.accent, flexShrink: 0 }} />
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: L.tagSize,
              fontWeight: 400,
              letterSpacing: `${LOCKUP.tag.tracking}em`,
              lineHeight: 1,
              whiteSpace: "nowrap",
              color: p.ink2,
            }}
          >
            {p.tagline.toUpperCase()}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
