import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CHAR_FRAMES, RESULTS, SearchCascade, type SearchCascadeProps } from "./SearchCascade";

const palettes = [
  { name: "Iris", swatch: ["#0B0A14", "#8B5CF6", "#EC4899"], values: { background: "#0B0A14", panel: "#16141F", ink: "#F3F1FF", accent: "#8B5CF6", accent2: "#EC4899" } },
  { name: "Citrus", swatch: ["#F4F4EE", "#65A30D", "#EAB308"], values: { background: "#F4F4EE", panel: "#FFFFFF", ink: "#16181A", accent: "#65A30D", accent2: "#EAB308" } },
  { name: "Coral", swatch: ["#150C0B", "#FF6B4A", "#FFB020"], values: { background: "#150C0B", panel: "#211614", ink: "#FFF1EC", accent: "#FF6B4A", accent2: "#FFB020" } },
  { name: "Lagoon", swatch: ["#061413", "#2DD4BF", "#38BDF8"], values: { background: "#061413", panel: "#0F2220", ink: "#E8FFFA", accent: "#2DD4BF", accent2: "#38BDF8" } },
  { name: "Graphite", swatch: ["#0A0A0B", "#D4D4D8", "#52525B"], values: { background: "#0A0A0B", panel: "#19191C", ink: "#F4F4F5", accent: "#D4D4D8", accent2: "#52525B" } },
];

export default defineMotion<SearchCascadeProps>({
  slug: "search-cascade",
  name: "Search Cascade",
  description: "A command-bar search types its query, then highlighted results cascade in and the top hit is selected.",
  category: "ui",
  tags: ["search", "command bar", "typing", "list"],
  addedAt: "2026-09-22",
  durationInFrames: 165,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SearchCascade,
  defaultProps: {
    ...palettes[0].values,
    query: "design",
    count: 5,
    stagger: 5,
    ease: "smooth",
  } as SearchCascadeProps,
  palettes,
  controls: [
    { type: "text", key: "query", label: "Query", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "count", label: "Results", min: 3, max: 5, step: 1 },
    { type: "number", key: "stagger", label: "Stagger", min: 3, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const count = Math.max(3, Math.min(5, Math.round(p.count)));
    const cap = p.query ? p.query[0].toUpperCase() + p.query.slice(1) : p.query;
    const titles = RESULTS.slice(0, count)
      .map((r) => `"${r.pre}${r.pre ? p.query : cap}${r.post}" (${r.sub})`)
      .join(", ");
    const typeEnd = (16 + p.query.length * CHAR_FRAMES) / c.fps;
    const w = c.width > c.height ? 1000 : 900;
    return [
      targetLine(c.target, "a command-bar search that types a query and cascades in highlighted results", c.width, c.height, c.seconds),
      `Background ${p.background}. A ${w}px-wide ${p.panel} panel with radius 28, a 1.5px ${p.ink} border at 10% and a deep soft shadow. Font Geist; keys in Geist Mono.`,
      `Search row 112px tall: a muted magnifier, the query at 40px weight 500 (-0.025em) in ${p.ink}, a 3×46px ${p.accent} caret, and an "esc" key chip on the right.`,
      `Results (${count}): ${titles}. Rows are 80px with radius 18: a 52px gradient tile whose colour steps from ${p.accent} to ${p.accent2} with a white line glyph, a 28px title, a 20px muted subtitle and a type label on the right.`,
      `In each title the query is highlighted: ${p.accent}, weight 650, on a ${p.accent} tint at 14% with radius 6. A "TOP RESULTS" header (18px, 0.08em tracking) sits above and a footer with "↑↓ to navigate", "↵ to open" and the result count sits below.`,
      "",
      `0–0.5s: the panel fades up 24px from 97%. From 0.53s, "${p.query}" types at ${secs(CHAR_FRAMES, c.fps)} per character, ending at ${typeEnd.toFixed(1)}s; the caret then blinks every 0.47s.`,
      `0.2s later, the panel grows downward while staying centred, and rows fade in from 14px above, ${secs(p.stagger, c.fps)} apart, each over 0.47s.`,
      `Then the first row is selected: a ${p.accent} 15% fill with a 1.5px inset ring, and its label swaps to "Open ↵". Ease ${p.ease} ${bezierText(p.ease)}. Hold to ${c.seconds}s.`,
    ].join("\n");
  },
});
