import { FILM, SAMPLE } from "../../film";
import { ACCENT, CANVAS, FINAL_HOLD, RADIUS, STAGGER, STATE, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  AFTER,
  BeforeAfter,
  CAM,
  CAPTION,
  CARDS,
  LINE_H,
  MARGIN,
  SHADOW,
  SHOTS,
  T,
  TITLE,
  TRACK,
  afterGeometry,
  textOn,
  tickPlan,
  titleLayout,
  type BeforeAfterProps,
} from "./BeforeAfter";

// Each colourway sets the four fields and the accent together.
const looks: { name: string; hookField: string; beforeField: string; afterField: string; endField: string; accent: string }[] = [
  { name: "Lime", hookField: FILM.black, beforeField: FILM.canvas, afterField: FILM.cream, endField: FILM.lime, accent: FILM.orange },
  { name: "Lavender", hookField: FILM.black, beforeField: FILM.canvas, afterField: FILM.white, endField: FILM.lavender, accent: ACCENT.blue },
  { name: "Green", hookField: FILM.green, beforeField: FILM.canvas, afterField: FILM.cream, endField: FILM.green, accent: FILM.orange },
  { name: "Plum", hookField: FILM.plum, beforeField: FILM.canvas, afterField: FILM.white, endField: FILM.plum, accent: FILM.orange },
];
const palettes = looks.map(({ name, ...values }) => ({ name, swatch: [values.hookField, values.afterField, values.endField, values.accent], values }));

export default defineMotion<BeforeAfterProps>({
  slug: "before-after",
  name: "Before After",
  description: "A problem-to-solution ad: a pile of messy calendar, email and spreadsheet fragments, a split line that sweeps them away to reveal your product and three outcomes, then your promise.",
  category: "templates",
  tags: ["ad", "problem solution", "comparison", "launch", "product"],
  addedAt: "2026-10-21",
  durationInFrames: 480,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: BeforeAfter,
  defaultProps: {
    ...palettes[0].values,
    problem: "Planning your week shouldn't take a meeting.",
    beforeLabel: "Before",
    afterLabel: "After",
    counterLabel: "Hours lost this week",
    hoursFrom: 4,
    hoursTo: 9,
    win1: "One calm plan",
    win2: "Zero planning meetings",
    win3: "4 hours back",
    solution: "Lumen plans it for you.",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
  } as BeforeAfterProps,
  palettes,
  controls: [
    { type: "text", key: "problem", label: "Problem", maxLength: 56 },
    { type: "text", key: "beforeLabel", label: "Before label", maxLength: 16 },
    { type: "text", key: "counterLabel", label: "Counter label", maxLength: 24 },
    { type: "number", key: "hoursFrom", label: "Counter from", min: 0, max: 10, step: 1 },
    { type: "number", key: "hoursTo", label: "Counter to", min: 1, max: 20, step: 1 },
    { type: "text", key: "afterLabel", label: "After label", maxLength: 16 },
    { type: "text", key: "win1", label: "Outcome 1", maxLength: 26 },
    { type: "text", key: "win2", label: "Outcome 2", maxLength: 26 },
    { type: "text", key: "win3", label: "Outcome 3", maxLength: 26 },
    { type: "text", key: "solution", label: "Solution", maxLength: 32 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "afterField", label: "After field" },
    { type: "color", key: "endField", label: "Title card" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const end = c.seconds * c.fps;
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const L = tall ? TITLE.tall : TITLE.wide;
    const hook = titleLayout(p.problem, "hook", tall, W, H, 1);
    const sol = titleLayout(p.solution, "end", tall, W, H, 1);
    const rowsText = (r: string[][]) => r.map((x) => `"${x.join(" ")}"`).join(" / ");
    const plan = tickPlan(p.hoursFrom, p.hoursTo);
    const last = plan.values.length ? plan.values[plan.values.length - 1] : plan.a;
    const G = afterGeometry(W, H, 1, tall);
    const r = Math.round;
    const cards = CARDS.map((k) => `${k.id} ${k.w}×${k.h}px centred at (${(tall ? k.tall : k.wide).join(", ")}), ${k.rot}°, lands from frame ${k.at}`).join("; ");
    const fo = tall ? CAM.focusTall : CAM.focus;
    const caption = (field: string) => `Geist Mono ${CAPTION}px in ${textOn(field)} at 55% opacity`;
    const wordRise = (start: number) =>
      `each row in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${start}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps)`;
    const block = (lay: typeof hook, ink: string) =>
      `${rowsText(lay.rows)} in ${ink}, Inter 500 ${r(lay.size)}px, tracking ${TRACK}em, line height ${LINE_H}, left-aligned at x ${r(lay.textX)}px within ${r(lay.maxW)}px, the block centred vertically on its bar`;

    return [
      targetLine(c.target, "a six-shot problem-to-solution ad: a hook line, a messy pile of work UI, a vertical split line that sweeps the mess away to reveal the product and three outcomes, then the promise on a flat title card", c.width, c.height, c.seconds),
      `Shots start at frames ${SHOTS.join(", ")}; all hard cuts except the sweep (frames ${SHOTS[3]}–${SHOTS[4]}), which wipes the old way off the new one. Flat colour fields only: no gradients, glows or text shadows. Inter only, Geist Mono for captions, sentence case. Sizes are px at 1080 on the short side. The motif is one ${p.accent} line, ${STROKE.bar}px thick: a bar beside the hook, the split line of the sweep, and the bar beside the final title.`,
      `Shot 1, hook (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.hookField}. ${block(hook, textOn(p.hookField))}; ${wordRise(SHOTS[0] + T.hookWords)}. A ${STROKE.bar}px ${p.accent} bar at x ${L.barX}px runs from the first row's cap top to the last row's baseline (${r(hook.barTop)}–${r(hook.barBottom)}px) and draws down (scaleY 0→1 from the top) over frames ${T.hookBar[0]}–${T.hookBar[1]} on ${enter}. Top-right at a ${MARGIN}px margin: "${p.counterLabel}: ${plan.a}" in ${caption(p.hookField)}.`,
      `Shot 2, the old way (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.beforeField}. Top-left at ${MARGIN}px: a 10px ${STATE.error} dot, 12px gap, "${p.beforeLabel}" in ${caption(p.beforeField)}. Top-right: "${p.counterLabel}:" then the number in Geist Mono 500; it ticks ${plan.a}→${last} in ${plan.ticks.length} steps at frames ${plan.ticks.join(", ") || "none"}, each new number rising out of an overflow-hidden mask over ${T.tickRise} frames on ${enter}.`,
      `Six real-looking UI fragments pile in, each a flat card (white, 1px rgba(0,0,0,0.08) hairline, shadow ${SHADOW}): a week calendar (radius ${RADIUS.card}; "June 8 – 12" / "Week 24" header, "4 conflicts" in ${STATE.error} mono, 5 day columns × 5 hour rows of hairline grid, grey ${CANVAS.paper.fill} blocks plus overlapping conflict blocks tinted ${STATE.error} at 12% with a 3px ${STATE.error} left edge and ${STATE.error} labels, offset blocks outlined in white), an inbox (radius ${RADIUS.card}; four threads with grey initial avatars, "Re: Re: Fwd: Planning for next week"…), a spreadsheet (radius ${RADIUS.card}; "week-plan-v7-final (2).xlsx", A–D columns, Task / Owner / Hours / Status rows, one "#REF!" in ${STATE.error}, one selected cell with a 2.5px black outline), a ${FILM.lime} sticky note (radius ${RADIUS.chip}; "TODO", four lines in Inter 500 20px, one struck through), an invite toast and a conflict toast (radius ${RADIUS.button}). Draw each card's content as one inline SVG.`,
      `Placement (px): ${cards}. Each enters on ${spring} over ${T.cardDur} frames: translateY 180px→0 with opacity 0→1 over the first half, already at its angle; later cards stack on top. On every counter tick the pile flinches: each card shifts up to ${T.shake.amp}px on a decaying sine over ${T.shake.len} frames (seeded per card).`,
      `Camera on the pile: frames ${SHOTS[1]}–${SHOTS[2]} scale 1→${CAM.wideEnd} about the frame centre on ${travel}. Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): hard cut to a closer framing, scale ${CAM.close}→${CAM.closeEnd} about (${fo.join(", ")})px on ${travel}; captions stay in screen space. Red count badges (40px tall pills, ${STATE.error}, white Inter 600 18px, 14px outside the top-right corner) pop onto the calendar ("4"), the inbox ("14") and the invite ("3") at frames ${T.badges.join(", ")}, scale 0.6→1 and fade over ${T.badgeDur} frames on ${spring}.`,
      `Shot 4, the sweep (frames ${SHOTS[3]}–${SHOTS[4]}): the new-way scene is already drawn underneath. A ${STROKE.bar}px ${p.accent} ${tall ? "horizontal line spanning the width moves top → bottom" : "vertical line spanning the height moves left → right"} across the frame over frames ${T.sweep[0]}–${T.sweep[1]} on ${travel}. The old-way layer (field included) is clipped with clip-path: ${tall ? "inset(<line y>px 0 0 0)" : "inset(0 0 0 <line x>px)"}, so the mess clears behind the line and "${p.beforeLabel}" becomes "${p.afterLabel}" in the same spot as it passes.`,
      `New way (frames ${SHOTS[3]}–${SHOTS[5]}): flat ${p.afterField}. Top-left: a 10px ${p.accent} dot and "${p.afterLabel}" in ${caption(p.afterField)}; top-right: "${p.counterLabel}: 0" with the 0 in ${p.accent}. ${
        tall
          ? `The user's phone screen in a ${r(G.w)}×${r(G.h)}px frame, radius ${RADIUS.hero}, centred horizontally with its top at ${r(G.y)}px, 1px hairline and the soft shadow, image filling the width and cropped from the top.`
          : `A rounded window (radius ${RADIUS.card}, white, 1px hairline and the soft shadow) at x ${r(G.x)}px, y ${r(G.y)}px, ${r(G.w)}×${r(G.h)}px: a ${AFTER.wide.chrome}px chrome bar with three 12px grey dots and a centred "${(p.brand || "app").toLowerCase().replace(/[^a-z0-9]+/g, "")}.com" pill in Geist Mono 14px, then the user's screenshot in a 16:10 slot below it, filling the width and cropped from the top.`
      } It pushes in slowly, scale 1→${tall ? AFTER.tall.push : AFTER.wide.push} about its centre over frames ${T.push[0]}–${T.push[1]} on ${travel}.`,
      `Three outcome chips ${tall ? `stack below the phone, centred, ${r(G.chipW)}px wide` : `stack to the right of the window at x ${r(G.chipX)}px, ${r(G.chipW)}px wide, centred on it vertically`}, ${r(G.chipH)}px tall, ${r(G.chipGap)}px apart: white, radius ${RADIUS.button}, 1px hairline, soft shadow, 24px side padding; a ${tall ? 44 : 40}px ${p.accent} circle with a white 2.5px check, then "${p.win1}", "${p.win2}", "${p.win3}" in black Inter 500 ${r(G.chipText)}px (tracking -0.02em, shrunk only to fit), and a Geist Mono 18px index ("01"–"03") at 40% black on the right. They rise one by one at frames ${T.chips.join(", ")}: translateY 48px→0 plus a fade over ${T.chipDur} frames on ${spring}.`,
      `Shot 6, the promise (frames ${SHOTS[5]}–${end}): flat ${p.endField}. ${block(sol, textOn(p.endField))}; ${wordRise(SHOTS[5] + T.endWords)}. The motif pays off: at the cut a ${STROKE.bar}px ${p.accent} line spans the full height at x ${L.barX}px and shortens on ${travel} over frames ${SHOTS[5] + T.endBar[0]}–${SHOTS[5] + T.endBar[1]} to a bar from the first row's cap top to the last row's baseline (${r(sol.barTop)}–${r(sol.barBottom)}px).`,
      `Bottom-left at x ${L.barX}px, ${MARGIN}px from the bottom: the user's logo file at ${L.logo}px tall (width auto), then "${p.brand}" in Inter 500 ${r(L.logo * 0.82)}px, ${textOn(p.endField)}; it fades in and rises 16px over frames ${SHOTS[5] + T.logo[0]}–${SHOTS[5] + T.logo[1]} on ${enter}.`,
      `Hold the title card still to the end; nothing moves after frame ${SHOTS[5] + T.endWords + STAGGER * T.maxStagger + T.wordDur}, and the last ${Math.max(FINAL_HOLD, 15)} frames (${end - Math.max(FINAL_HOLD, 15)}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
