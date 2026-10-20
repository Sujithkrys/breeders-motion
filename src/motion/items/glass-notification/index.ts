import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DROP_LEN, EXIT_AT, FIRST_DROP, GlassNotification, PEEK, type GlassNotificationProps } from "./GlassNotification";

const palettes = [
  { name: "Sky", swatch: ["#070B16", "#2F6BFF", "#22D3EE"], values: { background: "#070B16", blobA: "#2F6BFF", blobB: "#22D3EE", icon1: "#38BDF8", icon2: "#6366F1", icon3: "#14C8A0", text: "#FFFFFF" } },
  { name: "Sunset", swatch: ["#140A0C", "#FF5E3A", "#FF2D87"], values: { background: "#140A0C", blobA: "#FF5E3A", blobB: "#FF2D87", icon1: "#FF8A3D", icon2: "#FF4F70", icon3: "#FFB020", text: "#FFFFFF" } },
  { name: "Aurora", swatch: ["#06110D", "#12B886", "#A3E635"], values: { background: "#06110D", blobA: "#12B886", blobB: "#A3E635", icon1: "#2FD08F", icon2: "#7CC72F", icon3: "#22B8CF", text: "#FFFFFF" } },
  { name: "Lilac", swatch: ["#EFEAF7", "#B794F6", "#F9A8D4"], values: { background: "#EFEAF7", blobA: "#B794F6", blobB: "#F9A8D4", icon1: "#8B5CF6", icon2: "#EC4899", icon3: "#F59E0B", text: "#1C1626" } },
  { name: "Peach", swatch: ["#FBEFE6", "#FDBA74", "#FCA5A5"], values: { background: "#FBEFE6", blobA: "#FDBA74", blobB: "#FCA5A5", icon1: "#F97316", icon2: "#EF4444", icon3: "#14B8A6", text: "#2A1A12" } },
];

export default defineMotion<GlassNotificationProps>({
  slug: "glass-notification",
  name: "Glass Notifications",
  description: "Three frosted-glass notifications drop in one after another and compress into an iOS-style stack.",
  category: "ui",
  tags: ["notification", "glass", "ios", "stack", "loop"],
  addedAt: "2026-09-24",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: GlassNotification,
  defaultProps: {
    ...palettes[0].values,
    app1: "Messages",
    msg1: "Lena: Landed! Grabbing a coffee first.",
    app2: "Calendar",
    msg2: "Design review in 10 minutes",
    app3: "Orders",
    msg3: "Your order is out for delivery",
    stagger: 30,
    ease: "enter",
  } as GlassNotificationProps,
  palettes,
  controls: [
    { type: "text", key: "app1", label: "App 1", maxLength: 20 },
    { type: "text", key: "msg1", label: "Message 1", maxLength: 48 },
    { type: "text", key: "app2", label: "App 2", maxLength: 20 },
    { type: "text", key: "msg2", label: "Message 2", maxLength: 48 },
    { type: "text", key: "app3", label: "App 3", maxLength: 20 },
    { type: "text", key: "msg3", label: "Message 3", maxLength: 48 },
    { type: "color", key: "icon1", label: "First icon" },
    { type: "color", key: "blobA", label: "Glow" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stagger", min: 20, max: 40, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "three frosted-glass notifications dropping in and stacking like iOS", c.width, c.height, c.seconds),
      `Background ${p.background} with two large soft glows drawn as SVG radial gradients: ${p.blobA} (480px radius, upper left of centre) and ${p.blobB} (440px, lower right), drifting slowly in a loop.`,
      `Cards: 820×148 (860 wide in 9:16 and 1:1), radius 44, padding 30. Fake the glass without backdrop-filter: a 135° white gradient fill (20% → 7% on dark, 78% → 50% on light), a 1.5px white border, a soft 60px drop shadow and a 1.5px inner top highlight.`,
      `Each card: an 88px app icon square (radius 22, 160° gradient of its colour with a white line glyph: chat bubble, calendar, bag), the app name at 30px weight 600, "now" at 23px and 50% on the right, and the message at 28px, 78%, one line. Font Geist, colour ${p.text}.`,
      `Notifications: "${p.app1}" ${p.icon1} "${p.msg1}"; "${p.app2}" ${p.icon2} "${p.msg2}"; "${p.app3}" ${p.icon3} "${p.msg3}".`,
      `Card n drops in at ${secs(FIRST_DROP, c.fps)} + n × ${secs(p.stagger, c.fps)} over ${secs(DROP_LEN, c.fps)}: from 170px above, scale 0.92 → 1, fading in. Newer cards sit on top.`,
      `As each new card lands, every older card moves one slot back: down ${PEEK}px, scale −5.5%, opacity −18%, scaling from its bottom edge so it peeks out below; its icon and text fade out.`,
      `At ${secs(EXIT_AT, c.fps)} the whole stack lifts 90px and fades out, ending empty so the loop is seamless. Ease ${p.ease} ${bezierText(p.ease)}.`,
    ].join("\n"),
});
