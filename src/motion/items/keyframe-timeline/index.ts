import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { KEY_IN, KEY_OUT, KeyframeTimeline, LEN, RETURN, START, layoutFor, parseLayers, schedule, trackOf, type KeyframeTimelineProps } from "./KeyframeTimeline";
import { CARD_GEO } from "./RecordCard";

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
  accent: t.accent,
  onAccent: t.onAccent,
}));

const DURATION = 180;
const r0 = (n: number) => Math.round(n);

export default defineMotion<KeyframeTimelineProps>({
  slug: "keyframe-timeline",
  name: "Keyframe Timeline",
  description: "A cursor sets keyframes on a Figma-style Motion timeline, then the playhead plays a linked record card.",
  category: "ui",
  tags: ["timeline", "keyframes", "figma", "cursor", "product", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: KeyframeTimeline,
  defaultProps: {
    ...palettes[0].values,
    title: "Set keyframes",
    layers: "Header, Sleeve, Vinyl, Tracks, Play",
    cursorName: "Maya",
    stagger: 0.3,
    turns: 1,
    ease: "enter",
  } as KeyframeTimelineProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 22 },
    { type: "text", key: "layers", label: "Layers (5, comma separated)", maxLength: 70 },
    { type: "text", key: "cursorName", label: "Cursor name", maxLength: 14 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "stagger", label: "Click stagger", min: 0.2, max: 0.4, step: 0.05, unit: "s" },
    { type: "number", key: "turns", label: "Vinyl spins", min: 1, max: 3, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const g = layoutFor(c.width, c.height);
    const { x0, px, rowH } = trackOf(g.tl);
    const S = schedule(p.stagger, c.fps, DURATION);
    const names = parseLayers(p.layers);
    const geo = CARD_GEO[g.card.variant];
    const cardW = r0(geo.w * g.card.scale);
    const cardH = r0(geo.h * g.card.scale);
    const turns = Math.round(p.turns);
    const still = S.reset0 + Math.max(4 * STAGGER + KEY_OUT, RETURN);
    const shadow = "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas)";
    return [
      targetLine(c.target, "a Figma-style Motion timeline where a name-tag cursor sets keyframes, then the accent playhead plays a linked record card", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or texture. Sizes are px at 1080 on the short side.`,
      `Type: Inter throughout, Geist Mono only for times and tiny numerals. Title "${p.title}" top-left at ${g.title.x},${g.title.y}: Inter 400, ${g.title.size}px, -0.04em, line height 1, ${p.ink}. UI labels Inter 400–500 in ${p.ink}, ${p.ink2} and ${p.ink3}; no weight above 600.`,
      `Timeline card ${r0(g.tl.w)}×${r0(g.tl.h)} at ${g.tl.x},${g.tl.y}: ${p.card}, radius ${RADIUS.card}, ${STROKE.hair}px ${p.line} border, ${shadow}. ${g.tl.head}px header: a 36px ${p.button} play tile (radius ${RADIUS.chip}, ${p.onButton} icon), "Motion" Inter 500 21px, "0.00s / 1.60s" Geist Mono 16px ${p.ink2}/${p.ink3}, right-aligned "${p.ease} · N keyframes" 15px ${p.ink2}.`,
      `${g.tl.ruler}px ruler 0.0–1.6s: ${STROKE.hair}px ticks every 0.1s in ${p.ink} at 18%/30%, Geist Mono 13px ${p.ink3} labels every 0.2s (${r0(px * 0.2)}px apart), track starting ${r0(x0)}px in. A ${g.tl.labelW}px label column (hairline divider) holds five ${r0(rowH)}px rows split by ${p.line} hairlines, each a 16px ${STROKE.hair}px-stroke layer icon and an Inter 19px name in ${p.ink2}: ${names.join(", ")}.`,
      `Each layer animates between two keys: ${names.map((n, i) => `${n} ${START[i]}–${+(START[i] + LEN[i]).toFixed(2)}s`).join(", ")}. Keys are 20px sharp diamonds (${p.card} with a ${STROKE.ring}px ${p.accent} border, rotated 45°; the active key filled ${p.accent}) joined by a ${STROKE.bar}px pill bar of ${p.accent} at 24%.`,
      `${g.card.variant === "tall" ? "To the right" : "Above it"}: a ${cardW}×${cardH} record card (${p.card}, radius ${RADIUS.card}, same hairline) in a Figma frame: "{ } Loop / Record" label in ${p.ink2} with a small ${p.ink} "Motion" chip (radius ${RADIUS.chip}), and a ${STROKE.hair}px ${p.accent} selection box with 9px square handles. Inside: "Loop" Inter 600 with a ${p.fill} "New this week" pill, a flat ${p.accent} sleeve (radius ${RADIUS.chip}) with thin ${p.onAccent} concentric rings at 30%, a #111111 vinyl with a #F2F2F0 label (\"Loop\" in #6B6B6B) and faint grooves behind it, "Night Swim" Inter 500 30px, a 56px ${p.button} play button and ${geo.tracks.n} track rows split by hairlines. Accent plus greys only.`,
      "",
      `Motion: a ${p.button} cursor (${p.onButton} ${STROKE.hair}px outline) with a "${p.cursorName}" name tag (Inter 500 16px, ${p.onButton} on ${p.button}, radius ${RADIUS.chip}) glides on travel ${bezierText("travel")} and clicks each row's start time ${p.stagger}s apart from frame ${S.clicks[0]}.`,
      `On each click the row flashes the neutral ${p.fill} selection fill, the start key pops in on spring ${bezierText("spring")} over ${KEY_IN} frames, the bar grows to the end key in ${S.grow} frames and the end key pops; that layer in the card eases to its start state (header up and faint, sleeve slid left, vinyl inside the sleeve, tracks and play faint).`,
      `Frame ${S.play}: the cursor presses the play tile (it turns to pause). The ${STROKE.ring}px ${p.accent} playhead with a pentagon handle sweeps 0 → 1.6s in real time (frames ${S.sweep0}–${r0(S.sweep1)}) and the card plays in sync: header and title drop 14px, the sleeve slides in 36px with a 5° turn, the vinyl slides ${geo.vinyl.slide}px out and spins ${turns} turn${turns > 1 ? "s" : ""}, tracks slide in from 28px, the play button scales 0.6 → 1. Layer motion and bar growth use ${p.ease} ${bezierText(p.ease)}.`,
      `Frame ${S.reset0}: the keys leave row by row, ${STAGGER} frames apart, over ${KEY_OUT} frames on exit ${bezierText("exit")}; the playhead travels back to 0 over ${RETURN} frames on travel; the vinyl settles on a whole turn. Everything is still from frame ${still} to ${DURATION} (at least the final ${FINAL_HOLD} frames), matching frame 0, so the loop is seamless.`,
    ].join("\n");
  },
});
