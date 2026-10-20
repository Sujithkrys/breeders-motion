import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BLINK, CHAR_FRAMES, ENTER, RESULTS, ROW_IN, SearchCascade, TYPE_AT, clampCount, panelWidth, timeline, type SearchCascadeProps } from "./SearchCascade";

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

const DURATION = 150;

export default defineMotion<SearchCascadeProps>({
  slug: "search-cascade",
  name: "Search Cascade",
  description: "A command-bar search types its query, then matching results cascade in and the top hit is selected.",
  category: "ui",
  tags: ["search", "command bar", "typing", "list"],
  addedAt: "2026-09-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SearchCascade,
  defaultProps: {
    ...palettes[0].values,
    query: "design",
    count: 5,
    ease: "enter",
  } as SearchCascadeProps,
  palettes,
  controls: [
    { type: "text", key: "query", label: "Query", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "count", label: "Results", min: 3, max: 5, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const count = clampCount(p.count);
    const cap = p.query ? p.query[0].toUpperCase() + p.query.slice(1) : p.query;
    const titles = RESULTS.slice(0, count)
      .map((r) => `"${r.pre}${r.pre ? p.query : cap}${r.post}" (${r.sub})`)
      .join(", ");
    const tl = timeline(p.query.length, count);
    const w = panelWidth(c.width > c.height);
    return [
      targetLine(c.target, "a command-bar search that types a query and cascades in matching results", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. A ${w}px-wide panel: ${p.card} fill, 1px ${p.line} border, radius ${RADIUS.card}, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas).`,
      `Type: Inter, sentence case, hierarchy by grey. Query 40px weight 400, -0.03em, ${p.ink}; placeholder "Search everything…" in ${p.ink3}. Result titles 28px 400 in ${p.ink2} with the matched word in ${p.ink} weight 500 (a two-tone match, no colour highlight); subtitles and type labels 20px ${p.ink3}. "TOP RESULTS" in Geist Mono 15px 500, +0.12em, ${p.ink3}; key hints in Geist Mono.`,
      `Results (${count}): ${titles}.`,
      `Geometry: search row 112px with a ${p.ink3} magnifier (${STROKE.ring}px stroke), a ${STROKE.ring}×46px ${p.accent} caret and an "esc" key chip (radius ${RADIUS.chip}, ${STROKE.hair}px ${p.line} ring). ${STROKE.hair}px ${p.line} dividers. Rows 80px, radius ${RADIUS.button}; each has a 52px ${p.card} tile (radius ${RADIUS.button}, ${STROKE.hair}px ${p.line} ring) with a ${p.ink2} line glyph. Footer: "↑↓ to navigate", "↵ to open", "${count} results" at 18px ${p.ink3}.`,
      `${p.accent} appears only on the caret and the selected row's glyph. Selection is a ${p.fill} fill, not colour. No gradients, glows or coloured tiles.`,
      `Motion: frames 0–${ENTER} the panel fades up 24px from 97% (${p.ease} ${bezierText(p.ease)}). From frame ${TYPE_AT} "${p.query}" types at one character per ${CHAR_FRAMES} frames, ending at frame ${Math.round(tl.typingEnd)} (${secs(tl.typingEnd, c.fps)}); the caret then blinks every ${BLINK} frames and settles solid by frame ${DURATION - FINAL_HOLD - BLINK}.`,
      `Frames ${tl.r0 - 4}–${tl.cascadeEnd}: the panel grows downward while staying centred (${p.ease}); rows fade in from 14px above over ${ROW_IN} frames, ${STAGGER} frames apart.`,
      `Frames ${tl.select}–${tl.select + ROW_IN}: the first row is selected: a ${p.fill} fill fades in, its glyph turns ${p.accent} and its label swaps to "Open ↵". Frames ${DURATION - FINAL_HOLD}–${DURATION}: completely still.`,
    ].join("\n");
  },
});
