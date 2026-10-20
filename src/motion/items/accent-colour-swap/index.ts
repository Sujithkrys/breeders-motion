import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AccentColourSwap, TIMING, geometry, isDarkPage, splitAccentWord, swatchIndices, type AccentColourSwapProps } from "./AccentColourSwap";

const CORAL = "#FF5A1F", BLUE = "#2443FF", GREEN = "#14A34A", VIOLET = "#A23CFF", INK = "#111111";

const palettes = [
  { name: "Paper", swatch: ["#FAFAF8", CORAL, BLUE], values: { background: "#FAFAF8", page: "#FFFFFF", swatch1: CORAL, swatch2: BLUE, swatch3: GREEN, swatch4: VIOLET, swatch5: INK } },
  { name: "White", swatch: ["#FFFFFF", BLUE, CORAL], values: { background: "#FFFFFF", page: "#FAFAF8", swatch1: BLUE, swatch2: CORAL, swatch3: GREEN, swatch4: VIOLET, swatch5: INK } },
  { name: "Soft", swatch: ["#F2F2EF", INK, CORAL], values: { background: "#F2F2EF", page: "#FFFFFF", swatch1: INK, swatch2: CORAL, swatch3: BLUE, swatch4: GREEN, swatch5: VIOLET } },
  { name: "Ink", swatch: ["#0E0F12", CORAL, GREEN], values: { background: "#0E0F12", page: "#15161A", swatch1: CORAL, swatch2: GREEN, swatch3: BLUE, swatch4: VIOLET, swatch5: "#FFFFFF" } },
];

export default defineMotion<AccentColourSwapProps>({
  slug: "accent-colour-swap",
  name: "Accent Colour Swap",
  description: "A cursor picks a new swatch in a Framer-style colour panel and a landing-page hero re-colours its accent live, then switches back.",
  category: "ui",
  tags: ["editor", "colour", "landing page", "cursor", "framer", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: AccentColourSwap,
  defaultProps: {
    ...palettes[0].values,
    headline1: "Plan less.",
    headline2: "Do more.",
    subline: "Tempo is the AI calendar that plans your week around what matters, focus time first.",
    buttonLabel: "Start free →",
    startSwatch: 1,
    secondSwatch: 2,
    cursorName: "Maya",
    ease: "enter",
  } as AccentColourSwapProps,
  palettes,
  controls: [
    { type: "text", key: "headline1", label: "Headline line 1", maxLength: 18 },
    { type: "text", key: "headline2", label: "Headline line 2", maxLength: 18 },
    { type: "text", key: "subline", label: "Subline", maxLength: 110 },
    { type: "text", key: "buttonLabel", label: "Button", maxLength: 20 },
    { type: "text", key: "cursorName", label: "Cursor name", maxLength: 14 },
    { type: "color", key: "swatch1", label: "Swatch 1" },
    { type: "color", key: "swatch2", label: "Swatch 2" },
    { type: "color", key: "swatch3", label: "Swatch 3" },
    { type: "color", key: "swatch4", label: "Swatch 4" },
    { type: "color", key: "swatch5", label: "Swatch 5" },
    { type: "number", key: "startSwatch", label: "Start swatch", min: 1, max: 5, step: 1 },
    { type: "number", key: "secondSwatch", label: "Clicked swatch", min: 1, max: 5, step: 1 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const T = TIMING;
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const u = Math.min(c.width, c.height) / 1080;
    const g = geometry(ratio, c.width / u, c.height / u);
    const px = (n: number) => Math.round(n * u);
    const at = (fr: number) => `${((fr / T.base) * c.seconds).toFixed(1)}s`;
    const pct = (fr: number) => `${Math.round((fr / T.base) * 100)}%`;
    const sw = [p.swatch1, p.swatch2, p.swatch3, p.swatch4, p.swatch5].map((s) => s.toUpperCase());
    const [ia, ib] = swatchIndices(p.startSwatch, p.secondSwatch);
    const [, word] = splitAccentWord(p.headline2);
    const dark = isDarkPage(p.page);
    const scale = (g.AW * u) / g.DW;
    const layout = g.wide
      ? `the hero artboard is ${px(g.AW)}×${px(g.AH)} centred at the top; the panel is a ${px(g.PW)}×${px(g.PH)} bar ${px(56)}px below it (swatches left, Hex and Used-in fields right)`
      : `the hero artboard is ${px(g.AW)}×${px(g.AH)} on the left; the ${px(g.PW)}×${px(g.PH)} panel sits ${px(48)}px to its right, vertically centred`;
    return [
      targetLine(c.target, "a landing-page hero whose accent colour is re-coloured live from a Framer-style colour panel", c.width, c.height, c.seconds),
      `Canvas ${p.background}; ${layout}. Font Geist everywhere, hex values in Geist Mono. ${dark ? "Dark UI: page " + p.page + ", cards #202127, hairlines #2A2B31, text #FFFFFF, secondary #8B8E97." : "Page " + p.page + ", ink #0E0F12, secondary #7B7E87, hairlines 1px #E8E8EC."} Cards use a tiny shadow (0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)). No glows.`,
      `Hero, designed at ${g.DW}×${g.DH} and scaled ×${scale.toFixed(2)} into the artboard: nav ("Tempo" with a round accent mark, 4 links, ink "Get Tempo" button); a hairline pill with an accent "New" tag on a 12% accent tint; headline "${p.headline1}" / "${p.headline2}" at ${px(g.hl * scale)}px, weight 500, -0.045em, line-height 1.02, centred, the word "${word}" in the accent; subline "${p.subline}" at ${px(19 * scale)}px in the secondary colour, max 2 lines; a "${p.buttonLabel}" button filled with the accent (radius ${px(11 * scale)}, white text, ink text if the accent is light) beside a hairline "Watch demo" button.`,
      `Preview strip bleeding off the artboard's bottom edge: a ${dark ? "#1C1D22" : "#F2F2EF"} tray (radius ${px(22 * scale)} top corners) holding a "This week" card with a 24.5h focus stat, a 6px progress bar at 62% in the accent, and 12 bars: 3 in full accent, the rest a ${dark ? 30 : 20}% accent tint.`,
      `Panel "Color · Accent": radius ${px(14)}, 1px hairline, colour chip + title, a divider, then five ${px(g.S)}px swatches (radius ${px(g.S * 0.25)}, ${px(g.gap)}px apart): ${sw.join(", ")}. The selected swatch wears a 2px #0099FF ring 3px outside it. Rows: "Hex" (field #E5F4FF, #0099FF mono text with a colour chip) and "Used in" → "12 layers".`,
      `Cursor: a #0099FF arrow with a white 1.6px outline and a "${p.cursorName}" name tag (14px, white on #0099FF, radius 3/9/9/9). It scales to 0.88 on each click.`,
      `Start: swatch ${ia + 1} (${sw[ia]}) is the accent. At ${at(T.heroClick)} the cursor, resting on the hero, clicks it: a 1.5px #0099FF selection box with white corner handles, a "${g.DW} × ${g.DH}" size label below and a blue "Hero" frame name fades in over 0.25s.`,
      `${at(T.move1[0])}–${at(T.move1[1])}: the cursor glides on a soft arc to swatch ${ib + 1} (${sw[ib]}) and clicks at ${at(T.click1)} (${pct(T.click1)}). The ring slides across in ${at(T.ring)}, the hex text swaps with a 10px vertical cross-fade, and the hero re-colours as a cascade: each accent element cross-fades over ${at(T.fade)} — button first, headline word +0.1s, pill tag +0.17s, logo mark +0.2s, progress +0.27s, then the bars left to right one frame apart.`,
      `Hold, then ${at(T.move2[0])}–${at(T.move2[1])} the cursor moves back to swatch ${ia + 1} and clicks at ${at(T.click2)} (${pct(T.click2)}); the same cascade returns everything to ${sw[ia]}.`,
      `${at(T.move3[0])}–${at(T.move3[1])}: the cursor returns to its resting spot on the hero and the selection fades out by ${at(T.selOut[1])}. The last frame matches the first, so it loops seamlessly.`,
      `Ease every move and fade with ${p.ease} ${bezierText(p.ease)}.`,
    ].join("\n");
  },
});
