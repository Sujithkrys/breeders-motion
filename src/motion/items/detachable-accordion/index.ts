import { RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { BODY_H, CW, DetachableAccordion, OPEN, PAD_X, POP, ROW_H, SCALE, T, isDark, type DetachableAccordionProps } from "./DetachableAccordion";

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

export default defineMotion<DetachableAccordionProps>({
  slug: "detachable-accordion",
  name: "Detachable Accordion",
  description: "A cursor clicks a row in a five-row list; the row springs out of the card into its own rounded card, opens to show its text, then closes and snaps back in.",
  category: "ui",
  tags: ["accordion", "list", "cursor", "spring", "faq"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: DetachableAccordion,
  defaultProps: {
    ...palettes[0].values,
    title1: "Components",
    title2: "Performance",
    title3: "Developer experience",
    title4: "Security",
    title5: "Infrastructure",
    body: "Pages render at the edge in under 50 ms, with every asset cached close to your users by default.",
    gap: 32,
  } as DetachableAccordionProps,
  palettes,
  controls: [
    { type: "text", key: "title1", label: "Row 1", maxLength: 24 },
    { type: "text", key: "title2", label: "Row 2 (opens)", maxLength: 24 },
    { type: "text", key: "title3", label: "Row 3", maxLength: 24 },
    { type: "text", key: "title4", label: "Row 4", maxLength: 24 },
    { type: "text", key: "title5", label: "Row 5", maxLength: 24 },
    { type: "text", key: "body", label: "Body text", maxLength: 100 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "gap", label: "Detach gap", min: 12, max: 64, step: 4, unit: "px" },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const titles = [p.title1, p.title2, p.title3, p.title4, p.title5];
    const gap = Math.min(64, Math.max(12, Number(p.gap) || 32));
    const sp = bezierText("spring");
    return [
      targetLine(c.target, `a five-row accordion card where a cursor clicks row ${OPEN + 1}, which detaches into its own card, opens, closes and re-attaches`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter (500 titles, 400 body, sentence case); Geist Mono for the row numbers. No gradients or glows.`,
      `Card ${px(CW)} wide, centred, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Five ${px(ROW_H)} rows split by full-width 1px ${p.line} hairlines: ${titles.map((t) => `"${t}"`).join(", ")}.`,
      `Each row, ${px(PAD_X)} side padding: "01"…"05" in Geist Mono ${px(11)} +0.1em ${p.ink3} in a ${px(36)} column, the title ${px(19)}/500 -0.02em ${p.ink}, and a ${px(32)} round button in ${p.fill} with a ${STROKE.ring}px ${p.ink2} chevron.`,
      `Build it as three stacked segments (rows above, the row, rows below), each with its own border, overlapping by 1px so they read as one card. Draw all shadows in a layer under all segments.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides to row ${OPEN + 1}'s button on ${bezierText("travel")} and clicks at ${s(T.click1)} (cursor 0.88, button 0.92).`,
      `${s(T.detA)}–${s(T.detB)} on ${sp}: ${gap}px gaps open above and below the row, its inner corners round to ${RADIUS.card}px (and the neighbours' facing corners), it widens ${px(POP)} on each side and its shadow deepens to 0 18px 40px rgba(0,0,0,.10). The whole stack stays vertically centred.`,
      `${s(T.expA)}–${s(T.expB)} on spring: the card grows ${px(BODY_H)} taller, its button turns ${p.accent} with a ${p.onAccent} chevron and rotates 180°. ${s(T.textA)}–${s(T.textB)}: "${p.body}" (${px(15)}, line-height 1.5, ${p.ink2}, two lines) fades in, rising ${px(8)} from a ${px(4)} blur, on enter ${bezierText("enter")}.`,
      `${s(T.mv2A)}–${s(T.click2)}: the cursor clicks the button again. Text fades out on exit (${s(T.textOutA)}–${s(T.textOutB)}), the card closes (${s(T.colA)}–${s(T.colB)}) and re-attaches (${s(T.attA)}–${s(T.attB)}), both on spring, while the cursor returns to rest. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
