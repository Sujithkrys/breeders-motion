import { ACCENT, EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AccentColourSwap, DELAY, TIMING, geometry, isDark, splitAccentWord, swatchIndices, type AccentColourSwapProps } from "./AccentColourSwap";

// Swatch row: the look's accent, the other system accent, ink, the mid grey and the system green.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  button: t.button,
  onButton: t.onButton,
  onAccent: t.onAccent,
  accent: t.accent,
  swatch2: t.accent === ACCENT.orange ? ACCENT.blue : ACCENT.orange,
  swatch3: t.ink,
  swatch4: t.ink2,
  swatch5: t.success,
}));

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
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "startSwatch", label: "Start swatch", min: 1, max: 5, step: 1 },
    { type: "number", key: "secondSwatch", label: "Clicked swatch", min: 1, max: 5, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const T = TIMING;
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const u = Math.min(c.width, c.height) / 1080;
    const g = geometry(ratio, c.width / u, c.height / u);
    const px = (n: number) => Math.round(n * u);
    const fr = (n: number) => Math.round((n / T.base) * c.seconds * c.fps);
    const sw = [p.accent, p.swatch2, p.swatch3, p.swatch4, p.swatch5].map((s) => s.toUpperCase());
    const [ia, ib] = swatchIndices(p.startSwatch, p.secondSwatch);
    const [, word] = splitAccentWord(p.headline2);
    const dark = isDark(p.background);
    const scale = (g.AW * u) / g.DW;
    const layout = g.wide
      ? `the hero artboard is ${px(g.AW)}×${px(g.AH)}px centred at the top; the panel is a ${px(g.PW)}×${px(g.PH)}px bar ${px(56)}px below it (swatches left, Hex and Used-in fields right)`
      : `the hero artboard is ${px(g.AW)}×${px(g.AH)}px on the left; the ${px(g.PW)}×${px(g.PH)}px panel sits ${px(48)}px to its right, vertically centred`;
    return [
      targetLine(c.target, "a landing-page hero whose accent colour is re-coloured live from a Framer-style colour panel", c.width, c.height, c.seconds),
      `Background: flat canvas ${p.background}; ${layout}. Page, panel and cards ${p.card}, 1px ${p.line} hairlines, trays and fields ${p.fill}${dark ? ", no shadows on this dark canvas" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) on the artboard and panel"}. No gradients or glows. Only one accent hue is ever on screen outside the swatch row.`,
      `Type: Inter; hex values and the size label in Geist Mono. Headline "${p.headline1}" / "${p.headline2}" at ${px(g.hl * scale)}px, weight 400, -0.045em, line-height 1.02, centred in ${p.ink}, the word "${word}" in the accent. Subline "${p.subline}" at ${px(19 * scale)}px in ${p.ink2}. Labels and buttons weight 500; meta text in ${p.ink3}.`,
      `Hero (designed at ${g.DW}×${g.DH}, scaled ×${scale.toFixed(2)}): nav with "Tempo", a round accent mark, 4 links in ${p.ink2} and a ${p.button} "Get Tempo" button; a hairline pill with an accent "New" tag on a 12% accent tint; a "${p.buttonLabel}" button filled with the accent (${p.onAccent} text, or ${p.ink} text on a light swatch) beside a hairline "Watch demo" button; a ${p.fill} tray bleeding off the bottom with a "This week" card: "24.5h" focus stat, a ${STROKE.bar}px progress bar at 62% in the accent and 12 bars (3 in the accent, the rest ${p.line}).`,
      `Panel "Color · Accent": live colour dot + title, a ${STROKE.hair}px divider, five ${px(g.S)}px round swatches ${px(g.gap)}px apart: ${sw.join(", ")}. The selected one wears a ${STROKE.ring}px ring 5px outside it in the live accent. Rows "Hex" (mono hex with a colour dot) and "Used in" → "12 layers" in ${p.fill} fields.`,
      `Cursor: a ${p.ink} arrow with a ${STROKE.hair}px ${p.card} outline and a "${p.cursorName}" tag (14px weight 500, ${p.card} on ${p.ink}). It scales to 0.88 on each click.`,
      `Geometry: panel and fields radius ${RADIUS.button}, tray radius ${RADIUS.card} (top corners), hero buttons radius ${RADIUS.button}, chips and bar tops radius ${RADIUS.chip}, swatches and pills fully round.`,
      "",
      `Start: swatch ${ia + 1} (${sw[ia]}) is the accent. Frame ${fr(T.heroClick)}: the cursor clicks the hero; frames ${fr(T.selIn[0])}–${fr(T.selIn[1])} a ${STROKE.hair}px selection box in the accent fades in, its corner handles scale from 0.4, with a "${g.DW} × ${g.DH}" label below (${p.ease}, ${bezierText(p.ease)}).`,
      `Frames ${fr(T.move1[0])}–${fr(T.move1[1])}: the cursor glides on a soft arc to swatch ${ib + 1} (${sw[ib]}) on travel, ${bezierText("travel")}, and clicks at frame ${fr(T.click1)}. The ring slides across over ${fr(T.ring)} frames on travel, the hex swaps with a 10px vertical cross-fade, and the hero re-colours as a cascade, each element cross-fading over ${fr(T.fade)} frames on ${p.ease}: button first, headline word +${fr(DELAY.word)}, tag +${fr(DELAY.tag)}, logo mark +${fr(DELAY.mark)}, progress +${fr(DELAY.progress)}, then the bars left to right one frame apart.`,
      `Frames ${fr(T.move2[0])}–${fr(T.move2[1])}: the cursor moves back to swatch ${ia + 1} and clicks at frame ${fr(T.click2)}; the same cascade returns everything to ${sw[ia]}.`,
      `Frames ${fr(T.move3[0])}–${fr(T.move3[1])}: the cursor returns to its resting spot on the hero while the selection fades out on exit, ${bezierText("exit")}, frames ${fr(T.selOut[0])}–${fr(T.selOut[1])}. Hold still to frame ${c.seconds * c.fps}; the last frame matches the first, so it loops seamlessly.`,
    ].join("\n");
  },
});
