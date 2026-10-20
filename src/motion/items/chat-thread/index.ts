import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BUBBLE_IN, CHAT_W, ChatThread, ENTER, chatBeats, type ChatThreadProps } from "./ChatThread";

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
}));

export default defineMotion<ChatThreadProps>({
  slug: "chat-thread",
  name: "Chat Thread",
  description: "A messaging thread fills in, alternating sides, with a typing indicator before every reply.",
  category: "ui",
  tags: ["chat", "messages", "bubbles", "typing", "conversation"],
  addedAt: "2026-09-18",
  durationInFrames: 180,
  fps: 30,
  ratios: ["9:16", "16:9", "1:1"],
  component: ChatThread,
  defaultProps: {
    ...palettes[0].values,
    name: "Maya Chen",
    msg1: "Did the new build go out?",
    msg2: "Shipped an hour ago. Crash rate is flat.",
    msg3: "Amazing. Drinks on me tonight",
    msg4: "Deal. 7pm at the usual place?",
    pace: 20,
    ease: "enter",
  } as ChatThreadProps,
  palettes,
  controls: [
    { type: "text", key: "name", label: "Contact", maxLength: 22 },
    { type: "text", key: "msg1", label: "Message 1 (sent)", maxLength: 70 },
    { type: "text", key: "msg2", label: "Message 2 (reply)", maxLength: 70 },
    { type: "text", key: "msg3", label: "Message 3 (sent)", maxLength: 70 },
    { type: "text", key: "msg4", label: "Message 4 (reply)", maxLength: 70 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "pace", label: "Pace", min: 16, max: 24, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const b = chatBeats(p.pace);
    return [
      targetLine(c.target, "a chat window where bubbles arrive on alternating sides, with typing indicators before replies", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or glow. One accent, ${p.accent}, used only on the 10px "Active now" dot.`,
      `Type: Inter. Messages 30px weight 400, line-height 1.36, -0.012em. Contact "${p.name}" 30px weight 500, -0.02em, ${p.ink}; "Active now" 22px ${p.ink2}. A centred Geist Mono label "TODAY 9:41" at 18px, +0.12em, ${p.ink3}.`,
      `Window card: ${CHAT_W.wide}px wide at 16:9 (${CHAT_W.narrow} in 9:16 and 1:1), padding 36/40/44, radius ${RADIUS.card}, fill ${p.card}, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). Header: a 64px ${p.fill} avatar with the initial "${p.name.trim().charAt(0).toUpperCase()}" in ${p.ink2} weight 500, then a ${STROKE.hair}px ${p.line} divider.`,
      `Bubbles: padding 20/30, max 72% wide, radius ${RADIUS.card} with a ${RADIUS.chip}px corner on the speaker's bottom side, 20px apart, no shadows. Sent (right): ${p.button} with ${p.onButton} text. Received (left): ${p.fill} with ${p.ink} text. Lay out every bubble from the start so nothing reflows; only animate their appearance.`,
      `Motion: frames 0–${ENTER} the card fades in and rises 24px (${p.ease}, ${bezierText(p.ease)}).`,
      `Bubbles land at frames ${b[0].at} (right, "${p.msg1}"), ${b[1].at} (left, "${p.msg2}"), ${b[2].at} (right, "${p.msg3}") and ${b[3].at} (left, "${p.msg4}"). Each fades in, rises 12px and scales 0.9 → 1 from its tail corner over ${BUBBLE_IN} frames (${p.ease}).`,
      `Typing indicator before each reply, from frames ${b[1].typing} and ${b[3].typing}: an 80px-tall ${p.fill} bubble scales 0.9 → 1 and fades in over 18 frames (${p.ease}), with three 12px ${p.ink3} dots bouncing 5px in a wave. It fades out on exit ${bezierText("exit")} over 12 frames as the reply lands in its place.`,
      `The last bubble settles by frame ${b[3].at + BUBBLE_IN}; hold the full thread completely still to the end.`,
    ].join("\n");
  },
});
