import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { ADVANCE, CH, CW, LEAVE, MOVE, MoneyStack, OTHERS, ROLL, SCALE, isDark, type MoneyStackProps } from "./MoneyStack";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
}));

export default defineMotion<MoneyStackProps>({
  slug: "money-stack",
  name: "Money Stack",
  description: "A pile of payment cards: the front one tilts away, the next steps forward and its amount rolls into place.",
  category: "ui",
  tags: ["payments", "cards", "stack", "fintech", "number-roll"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: MoneyStack,
  defaultProps: {
    ...palettes[0].values,
    amount1: "$18.75",
    from1: "nico",
    to1: "allegra",
    note1: "matcha latte",
    tilt: 3,
    ease: "spring",
  } as MoneyStackProps,
  palettes,
  controls: [
    { type: "text", key: "amount1", label: "Amount", maxLength: 9 },
    { type: "text", key: "from1", label: "Payer", maxLength: 12 },
    { type: "text", key: "to1", label: "Recipient", maxLength: 12 },
    { type: "text", key: "note1", label: "Note", maxLength: 22 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "accent", label: "Verified badge" },
    { type: "number", key: "tilt", label: "Stack tilt", min: 0, max: 6, step: 0.5, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const tilt = Math.min(6, Math.max(0, Number(p.tilt) || 0));
    const all = [{ amount: p.amount1, from: p.from1, to: p.to1, note: p.note1 }, ...OTHERS];
    return [
      targetLine(c.target, `a stack of payment cards that cycles: the front card tilts away, the next steps forward and its amount rolls in`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, nothing else on it. Sizes are px at 1080 on the short side. Inter only, 400/500/600, sentence case; amounts use tabular figures. No gradients or glows.`,
      `Card: ${px(CW)} × ${px(CH)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, padding ${px(22)} ${px(26)}.`,
      `Card content: the amount top-left, ${px(56)}/600, -0.04em, ${p.ink}; top-right two overlapping ${px(38)} grey initials avatars (${p.fill}, initials ${p.ink2}/${p.ink3}, a ${STROKE.ring}px ring in the card colour). Bottom: "payer" 500 ${p.ink}, "paid" ${p.ink2}, "recipient" 500 ${p.ink} followed by a ${px(13)} verified badge (${p.accent} circle, ${p.onAccent} check) - the only colour. Last line: the note in curly quotes ${px(15)} ${p.ink2}, the age right-aligned ${px(13)} ${p.ink3}.`,
      `Payments, front to back: ${all.map((a) => `${a.amount} · ${a.from} paid ${a.to} · "${a.note}"`).join("; ")}. They cycle.`,
      `Stack: three cards show. Behind the front card, depth 1 sits ${px(14)} lower, ${px(10)} left, rotated -${tilt}° at 0.965 scale; depth 2 sits ${px(26)} lower, ${px(12)} right, rotated ${tilt * 0.8}° at 0.93. Card contents fade 55% per depth step. A fourth card fades in at the back as the stack moves.`,
      `At ${ADVANCE.map(s).join(", ")} the front card leaves over ${LEAVE} frames on exit ${bezierText("exit")}: it slides ${px(220)} left, lifts ${px(12)}, rotates -9°, shrinks to 0.9 and fades out. ${MOVE.delay} frames later every other card steps one depth forward over ${MOVE.len} frames (${p.ease} ${bezierText(p.ease)}).`,
      `As a card becomes the front, its amount rolls: each digit spins upward through 8 digits and settles over ${ROLL.len} frames on enter ${bezierText("enter")}, digits staggered by ${ROLL.stagger} frames left to right, with a light motion blur while moving.`,
      `After four steps the stack is back where it began; hold still for the last 12 frames so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
