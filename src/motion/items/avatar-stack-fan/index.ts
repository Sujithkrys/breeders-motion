import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AvatarStackFan, GEO, OVERLAP, T, firstName, initials, type AvatarStackFanProps } from "./AvatarStackFan";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
}));

export default defineMotion<AvatarStackFanProps>({
  slug: "avatar-stack-fan",
  name: "Avatar Stack",
  description: "A stack of five overlapping avatars and a \"+12\" chip fans open under a hovering cursor, showing each name in a tooltip, then folds back.",
  category: "ui",
  tags: ["avatars", "stack", "hover", "tooltip", "cursor"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: AvatarStackFan,
  defaultProps: {
    ...palettes[0].values,
    name1: "Maya Chen",
    name2: "Leo Park",
    name3: "Ava Stone",
    name4: "Noah Kim",
    name5: "Iris Novak",
    extra: 12,
    ease: "spring",
  } as AvatarStackFanProps,
  palettes,
  controls: [
    { type: "text", key: "name1", label: "Name 1", maxLength: 18 },
    { type: "text", key: "name2", label: "Name 2", maxLength: 18 },
    { type: "text", key: "name3", label: "Name 3", maxLength: 18 },
    { type: "text", key: "name4", label: "Name 4", maxLength: 18 },
    { type: "text", key: "name5", label: "Name 5", maxLength: 18 },
    { type: "number", key: "extra", label: "Extra count", min: 1, max: 99, step: 1 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Fan easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const s = (f: number) => secs(f, c.fps);
    const names = [p.name1, p.name2, p.name3, p.name4, p.name5];
    const extra = Math.max(1, Math.min(99, Math.round(Number(p.extra) || 12)));
    return [
      targetLine(c.target, `a stack of 5 overlapping initials avatars plus a "+${extra}" chip that fans open on cursor hover and shows each name in a tooltip`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 500 for initials and tooltips, sentence case; Geist Mono only for the tiny "SHARED WITH" label (+0.12em). No images, gradients or glows.`,
      `Avatars: ${g.d}px circles drawn in code, initials ${Math.round(g.d * 0.34)}px/500 -0.02em: ${names.map((n) => `${initials(n)} (${n})`).join(", ")}. Fills are soft tones of ${p.card}: ink ${p.ink} mixed in at 8%, 16%, 5% and 24%, and one avatar tinted with the accent ${p.accent} at 16% with accent initials. Each has a 1px ${p.line} inner hairline and a ${STROKE.bar}px ${p.background} cut-out ring so overlaps read cleanly.`,
      `Collapsed: the 6 circles (5 avatars, then a "+${extra}" chip in ${p.fill} with ${p.ink2} text) sit centred on one row, each step ${Math.round(OVERLAP * 100)}% of the diameter, earlier avatars on top.`,
      `${s(T.inA)}–${s(T.inB)}: a 30px arrow cursor (${p.ink}, ${p.background} outline) glides onto the first avatar on travel ${bezierText("travel")}. From ${s(T.open)} the gaps open: each circle moves to a step of ${g.d + g.gap}px over ${T.openLen} frames, staggered 3 frames left to right, ${p.ease} ${bezierText(p.ease)}.`,
      `From ${s(T.slot0)} the cursor visits each avatar in turn, ${T.slot} frames each (8-frame travel between them). The hovered avatar lifts 10px and scales to 1.05; above it a tooltip pill pops in over 8 frames (opacity 0→1, scale 0.92→1, rising 10px): ${p.button} fill, radius ${RADIUS.button}px, the full name in ${g.tip}px/500 ${p.onButton}, with a small caret pointing at the avatar. It fades out as the cursor moves on.`,
      `Below the stack: "SHARED WITH" in mono ${Math.round(g.cap * 0.62)}px ${p.ink3}, then "${firstName(names[0])}, ${firstName(names[1])} and ${3 + extra} others" ${g.cap}px ${p.ink2}.`,
      `${s(T.outA)}–${s(T.outB)}: the cursor returns to its rest point below-right; ${s(T.closeA)}–${s(T.closeB)} the stack collapses back together on travel. Hold the last 12 frames still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
