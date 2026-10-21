import { EASE_OPTIONS, RADIUS, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { DIVIDE, GEO, STAR_JOIN, StarRating, T, cleanRating, isDark, type StarRatingProps } from "./StarRating";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<StarRatingProps>({
  slug: "star-rating",
  name: "Star Rating",
  description: "Five large stars that a cursor sweeps across, filling in half-star steps with a tiny pop each, landing on 4.5 beside the review count.",
  category: "ui",
  tags: ["rating", "stars", "review", "cursor", "input"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: StarRating,
  defaultProps: {
    ...palettes[0].values,
    rating: 4.5,
    reviews: "128 reviews",
    pop: 1.08,
    ease: "travel",
  } as StarRatingProps,
  palettes,
  controls: [
    { type: "number", key: "rating", label: "Rating", min: 0.5, max: 5, step: 0.5 },
    { type: "text", key: "reviews", label: "Reviews", maxLength: 18 },
    { type: "number", key: "pop", label: "Pop", min: 1, max: 1.16, step: 0.01, unit: "×" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Sweep easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const r = cleanRating(p.rating);
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const pop = Math.min(1.16, Math.max(1, Number(p.pop) || 1.08));
    return [
      targetLine(c.target, `a star rating card where a cursor sweeps across five stars that fill in half-star steps, landing on ${r.toFixed(1)}`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter only. No gradients or glows.`,
      `Card ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, ${g.pad}px padding. ${ratio === "16:9" ? `One row: the stars, a 1px ${p.line} vertical divider with ${DIVIDE}px either side, then the value block.` : `The value row sits on top, the stars ${g.stackGap}px below it.`}`,
      `Stars: five ${g.star}px five-point stars with ${g.gap}px gaps, drawn in one SVG with a ${STAR_JOIN}% round-joined stroke of their own colour so the points are softly rounded. Empty stars are ${p.line}; a ${p.accent} copy of each star sits on top, clipped by a rect from the left so a star can be half or fully filled.`,
      `Value: "${r.toFixed(1)}" at ${g.num}px Inter 600, -0.045em, ${p.ink} (${p.ink3} while it reads 0.0); "${p.reviews}" at ${g.rev}px in ${p.ink2} ${ratio === "16:9" ? "under it" : "right-aligned on its baseline"}.`,
      `The loop starts full at ${r.toFixed(1)}. ${s(T.drainA)}: the accent fills fade out right to left (12 frames each, 3-frame stagger, exit ${bezierText("exit")}) while the number counts down in half steps to 0.0.`,
      `${s(T.inA)}–${s(T.inB)}: an arrow cursor (30px, ${p.ink}, ${p.card} outline) glides to the left of the first star. ${s(T.sweepA)}–${s(T.sweepB)}: it sweeps right (${p.ease} ${bezierText(p.ease)}). The hovered value is half-star precise: the left half of a star reads n.5, the right half n+1; the number updates live.`,
      `Each time a star gains fill it pops: scale 1 → ${pop.toFixed(2)} → 1 on a spring (${bezierText("spring")}) over ~16 frames; the number nudges to 1.04 on each change.`,
      `At ${s(T.click)} the cursor clicks (scales to 0.88) to commit ${r.toFixed(1)}, then glides to its rest point by ${s(T.homeB)}. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
