import { CANVAS, EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { BARS, BTN, CHART_TOP, PAD, SCALE, STATS, T, ThemeReveal, clampSpeed, isDark, layoutFor, type ThemeRevealProps } from "./ThemeReveal";

// The reveal flips to the opposite canvas: Paper and Stone go to Ink, Ink goes to Paper.
const palettes = systemPalettes((t) => {
  const alt = t.bg === CANVAS.ink.bg ? CANVAS.paper : CANVAS.ink;
  return {
    background: t.bg,
    card: t.card,
    line: t.line,
    fill: t.fill,
    ink: t.ink,
    ink2: t.ink2,
    ink3: t.ink3,
    altBackground: alt.bg,
    altCard: alt.card,
    altLine: alt.line,
    altFill: alt.fill,
    altInk: alt.ink,
    altInk2: alt.ink2,
    altInk3: alt.ink3,
    accent: t.accent,
  };
});

export default defineMotion<ThemeRevealProps>({
  slug: "theme-reveal",
  name: "Theme Reveal",
  description: "A cursor clicks the theme toggle on a small revenue dashboard and a circle grows from the button to flip the whole frame to the dark theme, then shrinks back.",
  category: "ui",
  tags: ["dark", "theme", "toggle", "reveal", "dashboard"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ThemeReveal,
  defaultProps: {
    ...palettes[0].values,
    title: "Revenue",
    value: "$48,290",
    speed: 26,
    ease: "enter",
  } as ThemeRevealProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Card title", maxLength: 18 },
    { type: "text", key: "value", label: "Headline number", maxLength: 10 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "speed", label: "Reveal time", min: 18, max: 30, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Reveal easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const L = layoutFor(ratio);
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const sp = clampSpeed(p.speed);
    const fromDark = isDark(p.background);
    return [
      targetLine(c.target, `a small "${p.title}" dashboard card whose theme toggle, when clicked, grows a circle that flips the whole frame from ${fromDark ? "dark to light" : "light to dark"} and back`, c.width, c.height, c.seconds),
      `Sizes are px at 1080 on the short side. Inter (400/500, sentence case); Geist Mono for the tiny capital labels (+0.12em). No gradients or glows. Two themes: A = canvas ${p.background}, card ${p.card}, line ${p.line}, fill ${p.fill}, text ${p.ink} / ${p.ink2} / ${p.ink3}; B = canvas ${p.altBackground}, card ${p.altCard}, line ${p.altLine}, fill ${p.altFill}, text ${p.altInk} / ${p.altInk2} / ${p.altInk3}. Accent ${p.accent} in both.`,
      `Card ${px(L.cw)} × ${px(L.ch)}, centred, radius ${RADIUS.card}px, 1px line border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) on the light theme only, ${px(PAD)} padding.`,
      `Header: a ${px(10)} ${p.accent} dot and "${p.title}" ${px(17)}/500; top-right a ${px(BTN)} round toggle (fill colour, 1px line border) with a ${px(18)} ${STROKE.ring}px-stroke sun icon in theme A and a moon in theme B. Then "LAST 30 DAYS" mono ${px(10.5)} in ink3, "${p.value}" ${px(48)}/400 -0.045em, and "+12.4%" (500, ink) "vs last month" (ink2) at ${px(13)}.`,
      `Chart from ${px(CHART_TOP)}, ${px(L.chartH)} tall, one SVG: ${BARS.length} bars (${BARS.join(", ")}% of the plot height, 58% of each slot, radius ${RADIUS.chip}px) in ink3 at 55%, the last bar ${p.accent}; two dashed and one solid ${STROKE.hair}px line-colour gridlines; "OCT 1", "OCT 15", "OCT 30" mono labels. Footer under a 1px rule: ${STATS.map(([a, b]) => `${a} ${b}`).join(", ")} (label ${px(12)} ink3, value ${px(17)}/500).`,
      `Render the whole frame twice, theme A underneath and theme B on top, identical geometry. Clip theme B with clip-path: circle(r at the toggle's centre); r runs 0 → the distance to the farthest frame corner.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor (drawn in both copies, so it flips colour as the circle passes) glides to the toggle on ${bezierText("travel")}, clicks at ${s(T.click1)} (cursor 0.88, toggle 0.92). ${s(T.open)}–${s(T.open + sp)} (${sp} frames): r grows on ${p.ease} ${bezierText(p.ease)}; the moon spins in from -90° and scale 0.5 over 14 frames on enter.`,
      `The cursor drifts over the chart (${s(T.hoverA)}–${s(T.hoverB)}), returns and clicks again at ${s(T.click2)}. ${s(T.close)}–${s(T.close + sp)}: r shrinks back into the toggle on the same curve and the sun spins back in; the cursor returns to rest by ${s(T.homeB)}. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
