import { CANVAS, EASE_OPTIONS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CLEAR, GEO, LEGS, MemberSelector, PICKS, PILL_IN, PILL_OUT, RING_GAP, TONES, firstName, initials, type MemberSelectorProps } from "./MemberSelector";

// The counter pill is the `button` surface (black; white on Ink), so its greys come from the opposite canvas.
const palettes = systemPalettes((t) => {
  const onInk = t.bg === CANVAS.ink.bg;
  const opp = onInk ? CANVAS.paper : CANVAS.ink;
  return {
    background: t.bg,
    card: t.card,
    line: t.line,
    ink: t.ink,
    ink2: t.ink2,
    ink3: t.ink3,
    button: t.button,
    onButton: t.onButton,
    sub: opp.ink2,
    pillLine: onInk ? opp.line : opp.ink3,
    accent: t.accent,
    onAccent: t.onAccent,
  };
});

export default defineMotion<MemberSelectorProps>({
  slug: "member-selector",
  name: "Member Selector",
  description: "A participants card where a cursor picks three members one by one: accent rings, popping check badges and a rolling \"3 selected\" pill, then clears.",
  category: "ui",
  tags: ["avatars", "selection", "checkbox", "cursor", "team"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: MemberSelector,
  defaultProps: {
    ...palettes[0].values,
    title: "Participants",
    name1: "Maya Chen",
    name2: "Leo Park",
    name3: "Ava Stone",
    name4: "Noah Kim",
    name5: "Iris Novak",
    ease: "spring",
  } as MemberSelectorProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 20 },
    { type: "text", key: "name1", label: "Name 1", maxLength: 18 },
    { type: "text", key: "name2", label: "Name 2", maxLength: 18 },
    { type: "text", key: "name3", label: "Name 3", maxLength: 18 },
    { type: "text", key: "name4", label: "Name 4", maxLength: 18 },
    { type: "text", key: "name5", label: "Name 5", maxLength: 18 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Select easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const s = (f: number) => secs(f, c.fps);
    const names = [p.name1, p.name2, p.name3, p.name4, p.name5];
    const picked = PICKS.map((k) => `"${firstName(names[k.i])}" at ${s(k.f)}`).join(", ");
    return [
      targetLine(c.target, `a "${p.title}" card of 5 initials avatars where a cursor selects 3 members and a counter pill tracks them`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter 500, sentence case, -0.01 to -0.02em tracking; Geist Mono only for the tiny "5 MEMBERS" label (+0.12em, ${p.ink3}). No images, gradients or glows.`,
      `Card: ${p.card}, radius 32px, 1px ${p.line} inner border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on dark canvases), ${g.pad}px padding. Header "${p.title}" ${g.head}px/500 ${p.ink}, "5 MEMBERS" right-aligned, then a 1px ${p.line} divider.`,
      `Grid of ${g.cols} columns, ${g.colW}px each${g.cols === 3 ? `, two rows ${g.rowGap}px apart` : ""}: 5 avatars of ${g.d}px (initials ${Math.round(g.d * 0.34)}px/500: ${names.map(initials).join(", ")}) filled with ${p.ink} mixed into ${p.card} at ${TONES.map((t) => `${Math.round(t.bg * 100)}%`).join(", ")}, each with a 1px ${p.line} hairline; first names ${g.name}px/500 in ${p.ink3} below. Sixth cell: a dashed ${STROKE.ring}px circle (ink at 30%) with a plus in ${p.ink2}, labelled "Add".`,
      `A 30px arrow cursor (${p.ink}, ${p.background} outline) glides on travel ${bezierText("travel")} and clicks ${picked}; each click dips the avatar to 0.95 and the cursor to 0.88.`,
      `On select (${p.ease} ${bezierText(p.ease)}, 12 frames): a ${STROKE.ring}px ${p.accent} ring ${RING_GAP}px outside the avatar fades in while scaling 1.12→1; a ${Math.round(g.d * 0.3)}px ${p.accent} check badge pops at the lower-right (scale 0→1.18→1 over 11 frames) with a ${STROKE.bar}px ${p.card} cut-out and a ${p.onAccent} ${STROKE.ring}px check; the name turns from ${p.ink3} to ${p.ink}.`,
      `${s(PILL_IN[0])}–${s(PILL_IN[1])}: below the card a ${g.pillH}px ${p.button} pill slides up 40px and fades in (enter ${bezierText("enter")}): "1 selected" ${g.pillFont}px/500 ${p.onButton} on the left, a hairline divider and "Clear" in ${p.sub} on the right. On each later click the digit rolls up to the new count over 10 frames.`,
      `${s(LEGS[3].a)}–${s(CLEAR)}: the cursor clicks "Clear"; the three selections undo in pick order, 3 frames apart, over 14 frames on exit ${bezierText("exit")} (ring and badge out, names back to ${p.ink3}), and ${s(PILL_OUT[0])}–${s(PILL_OUT[1])} the pill drops 24px and fades. The cursor returns to rest by ${s(LEGS[4].b)}.`,
      `Hold the last 12 frames still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
