import { CANVAS, EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CommandBarMorph, GEO, PANEL_PAD, PLACEHOLDER, SHORTCUTS, T, isDark, panelHeight, pillWidth, type CommandBarMorphProps } from "./CommandBarMorph";

// The bar is the `button` surface (black; white on Ink), so its text greys come from the opposite canvas.
const palettes = systemPalettes((t) => {
  const onInk = t.bg === CANVAS.ink.bg;
  const opp = onInk ? CANVAS.paper : CANVAS.ink;
  return {
    background: t.bg,
    button: t.button,
    onButton: t.onButton,
    sub: opp.ink2,
    faint: opp.ink3,
    chip: opp.fill,
    ink: t.ink,
    accent: t.accent,
  };
});

export default defineMotion<CommandBarMorphProps>({
  slug: "command-bar-morph",
  name: "Command Bar Morph",
  description: "A black ⌘K pill is clicked and springs open into a wide command bar, a query types in and a suggestions panel drops down, then it all folds back.",
  category: "ui",
  tags: ["command", "search", "morph", "cursor", "input"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CommandBarMorph,
  defaultProps: {
    ...palettes[0].values,
    label: "Ask anything",
    query: "Plan my week",
    item1: "Draft a plan for the week",
    item2: "Block focus time each day",
    item3: "Summarise last week",
    ease: "spring",
  } as CommandBarMorphProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Button label", maxLength: 18 },
    { type: "text", key: "query", label: "Typed query", maxLength: 24 },
    { type: "text", key: "item1", label: "Suggestion 1", maxLength: 28 },
    { type: "text", key: "item2", label: "Suggestion 2", maxLength: 28 },
    { type: "text", key: "item3", label: "Suggestion 3", maxLength: 28 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Morph easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    return [
      targetLine(c.target, `a black "⌘K ${p.label}" pill that springs open into a command bar, types a query and drops a suggestions panel`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 400/500, sentence case, -0.015em tracking; Geist Mono for key caps and the tiny "SUGGESTIONS" label (+0.12em). No gradients or glows.`,
      `Button: ${Math.round(pillWidth(p.label, g))} × ${g.h}px pill (radius ${RADIUS.hero}px), ${p.button}${dark ? "" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, centred. A ${g.keyW} × ${g.keyH}px "⌘K" key cap (${p.chip}, radius ${RADIUS.chip}px, mono ${Math.round(g.mono * 1.1)}px ${p.sub}) then "${p.label}" ${g.font}px/500 ${p.onButton}.`,
      `${s(T.mvA)}–${s(T.mvB)}: an arrow cursor glides in (travel ${bezierText("travel")}) and clicks at ${s(T.click)} (pill dips to 0.96). ${s(T.openA)}–${s(T.openB)}: the same element widens from its centre to ${g.barW}px, height and pill radius unchanged (${p.ease} ${bezierText(p.ease)}). The key cap and label fade out in the first half while a 24-grid search glyph (${STROKE.ring} stroke, ${p.sub}), the placeholder "${PLACEHOLDER}" (${p.faint}, 400) and a mono "esc" key cap on the right fade in over the second half. The cursor drifts back and fades out.`,
      `${s(T.typeA)}–${s(T.typeB)}: "${p.query}" types in at ${g.font}px/400 ${p.onButton}, one character at a time, with a 3px ${p.accent} caret that blinks every 9 frames once typing stops.`,
      `${s(T.dropA)}–${s(T.dropB)}: a ${g.barW} × ${Math.round(panelHeight(g))}px panel (${p.button}, radius ${RADIUS.card}px, ${PANEL_PAD}px padding) drops ${g.gap}px below the bar: opacity 0→1, 28px down, scale 0.97→1 (enter ${bezierText("enter")}), while the bar rises so bar and panel stay centred. Header "SUGGESTIONS" mono ${p.faint}; three ${g.rowH}px rows stagger in 3 frames apart: a ${g.icon}px stroke icon (calendar, clock, list), the label ${g.rowFont}px/400, and a mono key cap on the right (${SHORTCUTS.map((k) => `"${k}"`).join(", ")}).`,
      `Rows: "${p.item1}", "${p.item2}", "${p.item3}" in ${p.sub}. ${s(T.hlA)}–${s(T.hlB)}: row 1 highlights: a ${p.chip} fill (radius ${RADIUS.button}px) fades in, its label turns ${p.onButton} and its icon ${p.accent} (the only accent besides the caret).`,
      `${s(T.outA)}–${s(T.outB)}: the panel fades up and out and the query blurs away (exit ${bezierText("exit")}); ${s(T.closeA)}–${s(T.closeB)}: the bar shrinks back into the pill, crossfading back to "⌘K ${p.label}", and the cursor fades in at its start. The last 12 frames hold; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
