import { EASE_OPTIONS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CLICKS, GEO, LEAD, LEGS, NavPill, SETTLE, type NavPillProps } from "./NavPill";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
  onAccent: t.onAccent,
}));

export default defineMotion<NavPillProps>({
  slug: "nav-pill",
  name: "Nav Pill",
  description: "A row of nav pills where one accent pill slides and stretches between items as a cursor clicks, and the items shuffle their widths as it lands.",
  category: "ui",
  tags: ["navigation", "tabs", "pill", "cursor", "morph", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: NavPill,
  defaultProps: {
    ...palettes[0].values,
    item1: "Home",
    item2: "Changelog",
    item3: "Career",
    item4: "About",
    stretch: 4,
    ease: "travel",
  } as NavPillProps,
  palettes,
  controls: [
    { type: "text", key: "item1", label: "Item 1", maxLength: 14 },
    { type: "text", key: "item2", label: "Item 2", maxLength: 14 },
    { type: "text", key: "item3", label: "Item 3", maxLength: 14 },
    { type: "text", key: "item4", label: "Item 4", maxLength: 14 },
    { type: "number", key: "stretch", label: "Stretch", min: 0, max: 8, step: 1, unit: "f" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const labels = [p.item1, p.item2, p.item3, p.item4];
    const lag = Math.min(8, Math.max(0, Math.round(Number(p.stretch) || 0)));
    return [
      targetLine(c.target, `a top nav of ${labels.length} pills where one accent pill slides and stretches between items as a cursor clicks`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter ${g.font}px/500, -0.01em tracking, sentence case. No gradients, no glows.`,
      `Items, centred on one row with ${g.gap}px gaps: ${labels.map((l) => `"${l}"`).join(", ")}, each led by a ${g.icon}px stroked icon (home, open book, briefcase, info; ${STROKE.ring}px strokes, round caps) and a ${Math.round(g.font * 0.35)}px gap. Each item is a ${g.h}px-tall pill (radius ${g.radius}px) filled ${p.fill} with a 1px ${p.line} inner border, ${g.pad}px side padding; text and icon ${p.ink2}.`,
      `Active state: one ${p.accent} pill of the same height and radius sits over the active item; text and icon under it turn ${p.onAccent}. Colour each label by how much of its item the accent pill covers, so text flips as the pill passes.`,
      `The active item is ${g.extra}px wider than at rest; when the accent lands, the old item gives back that width and the new one takes it over frames +${SETTLE[0]} to +${SETTLE[1]} after the click, and the row re-centres.`,
      `Clicks: ${CLICKS.map((k) => `"${labels[k.to]}" at frame ${k.f}`).join(", ")}. On each click the accent pill's leading edge travels to the target over ${LEAD} frames, and the trailing edge follows ${lag} frames later, so the pill stretches across the gap then contracts. Ease ${p.ease} ${bezierText(p.ease)}.`,
      `A 30px arrow cursor (${p.ink}, ${p.background} outline) glides between items on ${bezierText("travel")} with a slight bow (${LEGS.map((l) => `${l.a}–${l.b}`).join(", ")}), scales to 0.88 for 8 frames on each click while the clicked pill dips to 0.97, then returns to its rest point below the row by frame ${LEGS[LEGS.length - 1].b}.`,
      `Starts and ends on "${labels[0]}" active; the last 12 frames hold still. Loop ${c.seconds}s, seamless.`,
    ].join("\n");
  },
});
