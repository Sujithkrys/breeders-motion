import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DUR, KeyframeTimeline, LEN, START, layoutFor, parseLayers, schedule, trackOf, type KeyframeTimelineProps } from "./KeyframeTimeline";

const palettes = [
  { name: "Lavender", swatch: ["#C4B9FD", "#FFFFFF", "#2443FF"], values: { background: "#C4B9FD", titleColor: "#0E0F12", accent: "#2443FF" } },
  { name: "Lime", swatch: ["#E3F79C", "#FFFFFF", "#0C5A2F"], values: { background: "#E3F79C", titleColor: "#0E0F12", accent: "#0C5A2F" } },
  { name: "Deep green", swatch: ["#0C5A2F", "#E3F79C", "#FFFFFF"], values: { background: "#0C5A2F", titleColor: "#E3F79C", accent: "#0C5A2F" } },
  { name: "White", swatch: ["#FFFFFF", "#0E0F12", "#5B2A5E"], values: { background: "#FFFFFF", titleColor: "#0E0F12", accent: "#5B2A5E" } },
];

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
    ease: "smooth",
  } as KeyframeTimelineProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 22 },
    { type: "text", key: "layers", label: "Layers (5, comma separated)", maxLength: 70 },
    { type: "text", key: "cursorName", label: "Cursor name", maxLength: 14 },
    { type: "color", key: "background", label: "Block" },
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
    const at = (f: number) => secs(f, c.fps);
    const cardW = r0((g.card.variant === "tall" ? 456 : 952) * g.card.scale);
    const cardH = r0((g.card.variant === "tall" ? 600 : 264) * g.card.scale);
    const turns = Math.round(p.turns);
    return [
      targetLine(c.target, "a Figma-style Motion timeline where a name-tag cursor sets keyframes, then the playhead plays a linked record card", c.width, c.height, c.seconds),
      `Flat ${p.background} block. Title "${p.title}" top-left at ${g.title.x},${g.title.y}: Geist 400, ${g.title.size}px, -0.04em tracking, line-height 1, ${p.titleColor}. Sizes are px at 1080 on the short side.`,
      `Timeline panel ${r0(g.tl.w)}×${r0(g.tl.h)} at ${g.tl.x},${g.tl.y}: white, radius 20, 1px #E8E8EC border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06). ${g.tl.head}px header: ${p.accent} 36px play tile (radius 9), "Motion" Geist 600 21px, "0.00s / 1.60s" in Geist Mono 16px, right "${p.ease} · N keyframes" 15px #7B7E87.`,
      `${g.tl.ruler}px ruler from 0.0 to 1.6s: ticks every 0.1s, Geist Mono 13px #A3A5AD labels every 0.2s (${r0(px * 0.2)}px apart), track starts ${r0(x0)}px in. A ${g.tl.labelW}px label column (1px #E8E8EC divider) holds five ${r0(rowH)}px rows with 16px layer icons and Geist 19px #3B3D44 names: ${names.join(", ")}.`,
      `Each layer animates from its start to its end key: ${names.map((n, i) => `${n} ${START[i]}–${+(START[i] + LEN[i]).toFixed(2)}s`).join(", ")}. Keys are 20px diamonds (white, 3px ${p.accent} border, radius 3, rotated 45°; the just-clicked key fills ${p.accent}), joined by an 8px bar of ${p.accent} at 20%.`,
      `${g.card.variant === "tall" ? "Beside" : "Above"} it, a ${cardW}×${cardH} white record card (radius 18, same hairline and shadow) in a Figma frame: "{ } Loop / Record" label in ${p.titleColor} with a "Motion" badge, 1.5px ${p.accent} selection box with 9px white corner handles. Inside: "Loop" Geist 700 -0.05em with a "New this week" pill, a ${p.accent} sleeve with thin white concentric rings, a black SVG vinyl behind it with a ${p.accent} label, "Night Swim" Geist 600 30px, a 56px #0E0F12 play button and Geist track rows split by hairlines.`,
      `Motion. A cursor (${p.accent} arrow, white 1.6px stroke, "${p.cursorName}" name tag 16px Geist 500 on ${p.accent}, radius 7) glides with cubic-bezier(0.4, 0, 0.2, 1) and clicks each row's start time ${p.stagger}s apart from ${at(S.clicks[0])}. On each click the row tints ${p.accent} at 6%, the start key pops with cubic-bezier(0.3, 1.5, 0.4, 1) over 0.3s, the bar grows to the end key in ${at(S.grow)} and the end key pops; that layer in the card eases to its start state (header up and hidden, sleeve slid left, vinyl tucked inside the sleeve, tracks and play hidden).`,
      `At ${at(S.play)} the cursor clicks the play tile (it turns to pause). The 2px #FF5A1F playhead with a pentagon handle sweeps 0 → 1.6s in real time (${at(S.sweep0)}–${at(S.sweep1)}) and the card plays in sync: header and title drop in 14px, the sleeve slides in 36px with a 5° turn, the vinyl slides ${g.card.variant === "tall" ? 130 : 124}px out of the sleeve and spins ${turns} turn${turns > 1 ? "s" : ""}, easing out to a stop, tracks stagger in from 28px, the play button scales 0.6 → 1.`,
      `Layer motion and bar growth use ${p.ease} ${bezierText(p.ease)}. At ${at(S.reset0)} the keys shrink out row by row (2 frames apart) and the playhead returns to 0 in 0.6s while the card keeps its designed state, so the loop is seamless at ${at(DURATION)} (${DUR}s timeline).`,
    ].join("\n");
  },
});
