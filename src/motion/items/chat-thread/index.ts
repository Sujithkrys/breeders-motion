import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { ChatThread, chatBeats, type ChatThreadProps } from "./ChatThread";

const palettes = [
  { name: "Teal", swatch: ["#071312", "#19C3A6", "#15221F"], values: { background: "#071312", surface: "#15221F", accent: "#19C3A6", accentText: "#04120F", text: "#E8F3F0" } },
  { name: "Berry", swatch: ["#12080E", "#F0468C", "#241520"], values: { background: "#12080E", surface: "#241520", accent: "#F0468C", accentText: "#FFFFFF", text: "#F7EAF1" } },
  { name: "Sand", swatch: ["#F3EEE6", "#E2711D", "#FFFFFF"], values: { background: "#F3EEE6", surface: "#FFFFFF", accent: "#E2711D", accentText: "#FFFFFF", text: "#1E1914" } },
  { name: "Iris", swatch: ["#ECEEF8", "#5B5BF0", "#FFFFFF"], values: { background: "#ECEEF8", surface: "#FFFFFF", accent: "#5B5BF0", accentText: "#FFFFFF", text: "#161833" } },
  { name: "Graphite", swatch: ["#0C0C0E", "#F1F1F3", "#1C1C20"], values: { background: "#0C0C0E", surface: "#1C1C20", accent: "#F1F1F3", accentText: "#0C0C0E", text: "#F1F1F3" } },
];

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
    ease: "smooth",
  } as ChatThreadProps,
  palettes,
  controls: [
    { type: "text", key: "name", label: "Contact", maxLength: 22 },
    { type: "text", key: "msg1", label: "Message 1 (sent)", maxLength: 70 },
    { type: "text", key: "msg2", label: "Message 2 (reply)", maxLength: 70 },
    { type: "text", key: "msg3", label: "Message 3 (sent)", maxLength: 70 },
    { type: "text", key: "msg4", label: "Message 4 (reply)", maxLength: 70 },
    { type: "color", key: "accent", label: "Sent bubble" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "pace", label: "Pace", min: 16, max: 24, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const b = chatBeats(p.pace);
    return [
      targetLine(c.target, "a chat thread where bubbles arrive on alternating sides, with typing indicators before replies", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. One column, 900px wide (860 in 9:16 and 1:1), centred; lay out all bubbles from the start so nothing reflows, and only animate their appearance.`,
      `Header: 72px ${p.accent} gradient avatar with the initial "${p.name.trim().charAt(0).toUpperCase()}", "${p.name}" at 32px weight 600 and "Active now" at 22px, 50%, with a ${p.accent} dot. 44px below it the messages start, 22px apart.`,
      `Bubbles: 32px text, line-height 1.36, padding 22/32, max 74% wide, radius 34 with a 10px corner on the speaker's bottom side. Sent (right): ${p.accent} vertical gradient, text ${p.accentText}, soft ${p.accent} shadow. Received (left): ${p.surface}, text ${p.text}, soft shadow.`,
      `Order: right "${p.msg1}" at ${secs(b[0].at, c.fps)}; left "${p.msg2}" at ${secs(b[1].at, c.fps)}; right "${p.msg3}" at ${secs(b[2].at, c.fps)}; left "${p.msg4}" at ${secs(b[3].at, c.fps)}.`,
      `Each bubble rises 24px and scales 0.86 → 1 from its tail corner over 0.47s. Before each reply, at ${secs(b[1].typing, c.fps)} and ${secs(b[3].typing, c.fps)}, a 76px-tall ${p.surface} typing bubble scales in with three 14px dots bouncing 6px in a wave; it fades out as the reply lands in its place.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the full thread to the end.`,
    ].join("\n");
  },
});
