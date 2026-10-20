import { FINAL_HOLD, STAGGER, bezierText, secs, targetLine } from "../../kit";
import { CURSOR_COLORS, FILM, SAMPLE } from "../../film";
import { defineMotion, type Palette } from "../../types";
import { BOX_RADIUS, GEO, MARGIN, PromptToProduct, SHOTS, SKELETON, SKELETON_RADIUS, T, type PromptToProductProps } from "./PromptToProduct";

// Each colourway sets the opening field, the end card and its type together.
const palettes: Palette[] = [
  { name: "Lavender", swatch: [FILM.lavender, FILM.green, FILM.greenInk], values: { field: FILM.lavender, end: FILM.green, endInk: FILM.greenInk } },
  { name: "Lime", swatch: [FILM.lime, FILM.black, FILM.white], values: { field: FILM.lime, end: FILM.black, endInk: FILM.white } },
  { name: "Cream", swatch: [FILM.cream, FILM.plum, FILM.cream], values: { field: FILM.cream, end: FILM.plum, endInk: FILM.cream } },
  { name: "Ink", swatch: [FILM.lavender, FILM.black, FILM.lime], values: { field: FILM.lavender, end: FILM.black, endInk: FILM.lime } },
];

const DURATION = 270;

export default defineMotion<PromptToProductProps>({
  slug: "prompt-to-product",
  name: "Prompt to Product",
  description: "A prompt is typed and sent, the page builds on a design canvas, the finished screen lands, then a title card.",
  category: "templates",
  tags: ["ai", "launch", "prompt", "product"],
  addedAt: "2026-10-21",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: PromptToProduct,
  defaultProps: {
    ...(palettes[0].values as Pick<PromptToProductProps, "field" | "end" | "endInk">),
    canvas: FILM.canvas,
    prompt: "Design a pricing page for Lumen",
    title: "Built in one prompt.",
    brand: SAMPLE.brand,
    cursorName: "Maya",
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
  },
  palettes,
  controls: [
    { type: "text", key: "prompt", label: "Prompt", maxLength: 60 },
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 18 },
    { type: "text", key: "cursorName", label: "Cursor name", maxLength: 12 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5" },
    { type: "color", key: "field", label: "Prompt field" },
    { type: "color", key: "end", label: "End card" },
    { type: "color", key: "endInk", label: "End card text" },
  ],
  prompt: (p, c) => {
    const wide = c.width > c.height;
    const g = wide ? GEO.wide : GEO.tall;
    const [, s2, s3, s4] = SHOTS;
    const at = (shot: number, f: number) => shot + f;
    const lastWord = at(s4, T.words + Math.min(p.title.split(/\s+/).filter(Boolean).length - 1, 7) * STAGGER + T.wordLen);
    return [
      targetLine(c.target, "a four-shot AI launch film: a prompt is typed and sent, the page builds on a design canvas, the finished screen lands, then a title card", c.width, c.height, c.seconds),
      `Hard cuts at frames 0, ${s2}, ${s3} and ${s4} (0s, ${secs(s2, c.fps)}, ${secs(s3, c.fps)}, ${secs(s4, c.fps)}) at ${c.fps}fps. Sizes are px at 1080 on the short side. Inter only (400 body, 500 titles), Geist Mono for the tiny frame label. Each shot is one flat colour field: no gradients, glows, sparkles or emoji.`,
      `Shot 1 (0–${s2}): flat ${p.field}. A white prompt box ${g.box.w}×${g.box.h}, radius ${BOX_RADIUS}, 1px hairline rgba(17,17,17,0.08) and shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06), ${wide ? "centred" : "centred horizontally with its middle a third of the way down"}. It fades in and rises 32px over frames ${T.boxIn[0]}–${T.boxIn[1]} (enter, ${bezierText("enter")}).`,
      `Inside at 40px padding, "${p.prompt}" in Inter 400 ${g.box.type}px #111111, line-height 1.35, tracking -0.01em${wide ? "" : ", wrapping"}, typed one character at a time from frame ${T.type[0]} to ${T.type[1]}. A 2px #111111 caret is solid while typing, then blinks every ${T.blink} frames until the click. Bottom-left: a 44px circle with a 1.5px hairline at 22% and a "+" in #6B6B6B. Bottom-right, 30px in: a 56px round send button in ${FILM.select} (grey #F2F2F0 until typing starts) with a white up-arrow.`,
      `A Figma-style multiplayer cursor (${CURSOR_COLORS.pink} arrow, white outline, 1.4× size, name tag "${p.cursorName}") glides in on a slight arc from below the lower-right corner over frames ${T.glide[0]}–${T.glide[1]} (travel, ${bezierText("travel")}) and clicks send at frame ${T.click}: the cursor dips and the button presses to 0.94 and back by frame ${T.click + 7}.`,
      `Shot 2 (${s2}–${s3}): flat ${p.canvas}. A white ${wide ? `page frame ${g.frame.w}×${g.frame.h} (16:10)` : `phone frame ${g.frame.w}×${g.frame.h} (9:19.5)`}, radius ${g.frame.r}, centred, with the same hairline and shadow. 34px above its top-left corner: "${p.brand} — ${g.device}" in Geist Mono 18px #6B6B6B.`,
      wide
        ? `Skeleton blocks in ${SKELETON}, radius ${SKELETON_RADIUS}, build in: a nav line (a 140×28 logo bar, three 64×16 links, a 120×40 pill), a centred two-bar title (600 and 440 wide, 48 tall), a 520×20 subtitle bar, a pair of 160×52 buttons, then three cards in a row filling the lower half at 48px margins and 24px gaps.`
        : `Skeleton blocks in ${SKELETON}, radius ${SKELETON_RADIUS}, build a mobile layout at 36px margins: a header (120×28 bar and a 40px circle), a left-aligned two-bar title (480 and 360 wide, 44 tall), a 420×20 subtitle, a full-width 64px button, then six list rows (an 88px square with two text bars beside it), 146px apart.`,
      `Each block fades in and rises 24px over ${T.buildLen} frames on a spring (${bezierText("spring")}), starting at frame ${at(s2, T.build)}, ${STAGGER} frames apart per group (eight steps at most; later rows arrive with the eighth).`,
      `Shot 3 (${s3}–${s4}): same canvas, frame and label. The user's ${wide ? "screenshot" : "phone screenshot"} fills the frame's width, cropped from the top, and replaces the skeleton with a top-to-bottom wipe: clip-path inset at the bottom from 100% to 0 over frames ${at(s3, T.reveal[0])}–${at(s3, T.reveal[1])} (travel).`,
      `Over frames ${at(s3, T.select[0])}–${at(s3, T.select[1])} a ${FILM.select} selection box draws on the frame's bounds (2px line, four 11px white square handles, a "${g.size}" tag 12px below in white Inter 500 16px on ${FILM.select}). A second cursor (${CURSOR_COLORS.green}, "Leo") drifts in from the right edge over frames ${at(s3, T.leo[0])}–${at(s3, T.leo[1])} (travel) and settles on the screenshot.`,
      `Shot 4 (${s4}–${c.seconds * c.fps}): flat ${p.end}. "${p.title}" top-left at a ${MARGIN}px margin, Inter 500 ${g.title}px, tracking -0.04em, line-height 1.05, in ${p.endInk}${wide ? "" : ", wrapping to the frame width"}. Each word rises out of its own mask (translateY 115% → 0) over ${T.wordLen} frames on enter, ${STAGGER} frames apart from frame ${at(s4, T.words)}; the last lands at frame ${lastWord}.`,
      `Bottom-left at the same margin: the user's logo file at ${g.logo}px tall followed by "${p.brand}" in Inter 500 at 0.82× that size, in ${p.endInk}, fading in and rising 16px over frames ${at(s4, T.logo[0])}–${at(s4, T.logo[1])} (enter). The last ${FINAL_HOLD} frames hold perfectly still.`,
    ].join("\n");
  },
});
