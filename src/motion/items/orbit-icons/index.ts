import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { OrbitIcons, type OrbitIconsProps } from "./OrbitIcons";

const palettes = [
  { name: "Violet", swatch: ["#8B5CF6", "#EC4899", "#F59E0B"], values: { background: "#0D0B14", colorA: "#8B5CF6", colorB: "#EC4899", colorC: "#F59E0B", ink: "#EDE9FE" } },
  { name: "Daylight", swatch: ["#FF6B3D", "#14B8A6", "#6366F1"], values: { background: "#F4F2EE", colorA: "#FF6B3D", colorB: "#14B8A6", colorC: "#6366F1", ink: "#1C1A17" } },
  { name: "Citrus", swatch: ["#84CC16", "#EAB308", "#16A34A"], values: { background: "#0E1008", colorA: "#84CC16", colorB: "#EAB308", colorC: "#16A34A", ink: "#F7FEE7" } },
  { name: "Ocean", swatch: ["#0EA5E9", "#22D3EE", "#6366F1"], values: { background: "#06101A", colorA: "#0EA5E9", colorB: "#22D3EE", colorC: "#6366F1", ink: "#E0F2FE" } },
  { name: "Coral", swatch: ["#FB7185", "#FB923C", "#E11D48"], values: { background: "#160B0A", colorA: "#FB7185", colorB: "#FB923C", colorC: "#E11D48", ink: "#FFE4E6" } },
  { name: "Mono", swatch: ["#3F3F46", "#52525B", "#71717A"], values: { background: "#0C0C0D", colorA: "#3F3F46", colorB: "#52525B", colorC: "#71717A", ink: "#F4F4F5" } },
];

export default defineMotion<OrbitIconsProps>({
  slug: "orbit-icons",
  name: "Orbit Icons",
  description: "Six app icon tiles orbit a centre mark on a tilted 3D ring, stepping round like a carousel.",
  category: "3d",
  tags: ["css 3d", "orbit", "icons", "integrations", "loop"],
  addedAt: "2026-10-19",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: OrbitIcons,
  defaultProps: {
    ...palettes[0].values,
    caption: "Works with your whole stack",
    tilt: 66,
    radius: 400,
    ease: "travel",
  } as OrbitIconsProps,
  palettes,
  controls: [
    { type: "text", key: "caption", label: "Caption", maxLength: 40 },
    { type: "color", key: "colorA", label: "Accent" },
    { type: "color", key: "colorB", label: "Second tile" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "tilt", label: "Ring tilt", min: 50, max: 76, step: 1, unit: "°" },
    { type: "number", key: "radius", label: "Radius", min: 300, max: 460, step: 10, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "six icon tiles orbiting a centre mark on a tilted 3D ring", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Pure CSS 3D: each element carries its own "perspective(1900px) rotateX(${p.tilt}deg) …" transform with no preserve-3d parent, and DOM order is the paint order.`,
      "",
      `Ring: radius ${p.radius}px (86% in 9:16), a 2.5px ${p.ink} line at 22% plus a dashed inner ring at 60% radius (12%), tilted ${p.tilt}° on X. Each ring is split with clip-path into a back half (drawn before the back icons) and a front half (drawn before the front icons).`,
      `Icons: six 116px tiles, radius 32, 150° gradients cycling ${p.colorA}, ${p.colorB}, ${p.colorC}, white 1.9px-stroke glyphs (chat, calendar, bolt, photo, mail, code) at 54px, soft drop shadow.`,
      `Each tile sits on the ring via translate3d(R·cos a, R·sin a, 0) then rotateX(−${p.tilt}deg) so it stays upright; sort tiles by depth, scale 0.84 → 1.04 and fade 40% → 100% from back to front.`,
      `Centre: a 168px tile, radius 48, 145° gradient ${p.colorA} → ${p.colorB}, white four-point spark glyph, coloured glow, bobbing ±6px twice per loop; a soft ${p.colorA} radial glow behind the ring.`,
      p.caption ? `Caption "${p.caption}" centred near the bottom, 34px weight 600, tracking −0.03em, ${p.ink} at 72%.` : "No caption.",
      "",
      `Motion: the ring turns in six steps of 60°, one per sixth of the loop; each step takes the first 62% of its slot with ${p.ease} easing ${bezierText(p.ease)}, then rests. A full turn per loop, so it loops seamlessly.`,
    ].join("\n"),
});
