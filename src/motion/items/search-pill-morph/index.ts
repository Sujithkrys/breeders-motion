import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { GEO, SearchPillMorph, T, isDark, type SearchPillMorphProps } from "./SearchPillMorph";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<SearchPillMorphProps>({
  slug: "search-pill-morph",
  name: "Search Pill Morph",
  description: "A round magnifier button is clicked and stretches sideways into a search field, a query types and is cleared, and the field folds back into the circle.",
  category: "ui",
  tags: ["search", "input", "morph", "cursor", "button"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SearchPillMorph,
  defaultProps: {
    ...palettes[0].values,
    query: "Weekend in Lisbon",
    placeholder: "Search trips, places, notes",
    ease: "spring",
  } as SearchPillMorphProps,
  palettes,
  controls: [
    { type: "text", key: "query", label: "Query", maxLength: 24 },
    { type: "text", key: "placeholder", label: "Placeholder", maxLength: 28 },
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
      targetLine(c.target, "a round magnifier button that stretches sideways into a search field, types a query, clears it and folds back", c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 400, -0.025em tracking, sentence case; Geist Mono only for the "/" key hint. No gradients or glows.`,
      `Button: a ${g.h}px circle, ${p.card}, 1px ${p.line} inner border${dark ? "" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, centred, with a ${g.icon}px SVG magnifier (24-unit grid: circle r 6.5 at 10.5,10.5 and a handle to 20,20; ${STROKE.ring} stroke, round caps) in ${p.ink}.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides to it (travel ${bezierText("travel")}) and clicks at ${s(T.click1)}; the circle dips to 0.94. ${s(T.openA)}–${s(T.openB)}: the same element stretches from its centre to ${g.w} × ${g.h}px, ends staying fully round (${p.ease} ${bezierText(p.ease)}). The magnifier slides from centre to ${g.inset}px from the left edge, rocking −14° at mid-morph, and turns ${p.ink2}. The border thickens to ${STROKE.ring}px ${p.accent} as a focus ring.`,
      `Placeholder "${p.placeholder}" ${g.font}px ${p.ink3} fades in at ${g.inset + g.icon + 24}px, with a 44px "/" key hint on the right (${p.fill}, 1px ${p.line}, radius ${RADIUS.chip}px, mono ${g.mono}px ${p.ink2}). A 3px ${p.accent} caret blinks every 9 frames.`,
      `${s(T.typeA)}–${s(T.typeB)}: "${p.query}" types in, ${g.font}px ${p.ink}, one character at a time. ${s(T.xA)}–${s(T.xB)}: the key hint fades and a ${g.clear}px round clear button (${p.fill}, × in ${p.ink2}, ${STROKE.ring} stroke) springs in from 0.5 scale.`,
      `${s(T.mv2A)}–${s(T.mv2B)}: the cursor moves to × and clicks at ${s(T.click2)}. ${s(T.clearA)}–${s(T.clearB)}: the query slides 24px left, blurs 6px and fades (exit ${bezierText("exit")}); the × shrinks out and the placeholder returns.`,
      `${s(T.closeA)}–${s(T.closeB)}: the focus ring fades, the field folds back into the circle and the magnifier re-centres while the cursor returns to its start. The last 12 frames hold; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
