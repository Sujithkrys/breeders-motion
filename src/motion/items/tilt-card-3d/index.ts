import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { TiltCard3D, type TiltCard3DProps } from "./TiltCard3D";

const palettes = [
  { name: "Tangerine", swatch: ["#F3EDE4", "#FF9F5A", "#FF5A1F"], values: { background: "#F3EDE4", card: "#FFFFFF", accentA: "#FF9F5A", accentB: "#FF5A1F", ink: "#1A1714" } },
  { name: "Plum", swatch: ["#1A1520", "#E879F9", "#7C3AED"], values: { background: "#0E0B12", card: "#1A1520", accentA: "#E879F9", accentB: "#7C3AED", ink: "#F6F1FA" } },
  { name: "Sage", swatch: ["#E8EDE4", "#A3D9A5", "#2F8F5B"], values: { background: "#E8EDE4", card: "#FBFCF8", accentA: "#A3D9A5", accentB: "#2F8F5B", ink: "#16201A" } },
  { name: "Cobalt", swatch: ["#141A2A", "#7DD3FC", "#2563EB"], values: { background: "#0A0D17", card: "#141A2A", accentA: "#7DD3FC", accentB: "#2563EB", ink: "#EEF3FF" } },
  { name: "Cherry", swatch: ["#221213", "#FF8A80", "#E11D48"], values: { background: "#160909", card: "#221213", accentA: "#FF8A80", accentB: "#E11D48", ink: "#FFF1F0" } },
  { name: "Graphite", swatch: ["#1C1C1F", "#D4D4D8", "#52525B"], values: { background: "#0E0E10", card: "#1C1C1F", accentA: "#D4D4D8", accentB: "#52525B", ink: "#FAFAFA" } },
];

export default defineMotion<TiltCard3DProps>({
  slug: "tilt-card-3d",
  name: "Tilt Card 3D",
  description: "A product card tilts in 3D while its badge, title and image float apart in parallax under a moving sheen.",
  category: "3d",
  tags: ["css 3d", "card", "parallax", "product", "loop"],
  addedAt: "2026-10-16",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: TiltCard3D,
  defaultProps: {
    ...palettes[0].values,
    badge: "New",
    title: "Halo Speaker",
    price: "$249",
    tilt: 12,
    depth: 70,
    ease: "smooth",
  } as TiltCard3DProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 18 },
    { type: "text", key: "price", label: "Price", maxLength: 10 },
    { type: "text", key: "badge", label: "Badge", maxLength: 12 },
    { type: "color", key: "accentA", label: "Product" },
    { type: "number", key: "tilt", label: "Tilt", min: 4, max: 20, step: 1, unit: "°" },
    { type: "number", key: "depth", label: "Parallax depth", min: 20, max: 120, step: 5, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "a product card tilting in 3D with parallax layers and a moving sheen", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Pure CSS 3D: give every layer its own transform "perspective(1700px) rotateX(rx) rotateY(ry) translateZ(z)" around the card centre, with no preserve-3d parent, drawn back to front.`,
      "",
      `Card 560×760, radius 44, 160° gradient from a lightened ${p.card} to ${p.card}, hairline ${p.ink} border at 8%, soft drop shadow, blurred floor shadow below.`,
      `Image block (z = 0.55 × depth): inset 36, 56% of the card height, radius 30, 150° gradient ${p.accentA} → ${p.accentB}, with an SVG orb product (radial gradient highlight upper left, a thin equator ring) and a soft floor shadow.`,
      `Title layer (z = 0.8 × depth): "${p.title}" 46px weight 650, tracking −0.035em, ${p.ink}; below it "${p.price}" 32px weight 500 at 62% opacity and three 24px colour dots (${p.accentA}, ${p.accentB}, ${p.ink}).`,
      `Badge (z = 1.3 × depth): pill 50px tall over the image's top-left, ${p.ink} fill, ${p.card} text "${p.badge}" 22px weight 600, with a 10px ${p.accentA} dot.`,
      "Sheen: a 105° linear-gradient white band (38% → 50% → 62%) inside the card and the image, sliding with rotateY.",
      "",
      `Motion: an envelope rises over 0–25% and falls over 82–100% with ${p.ease} easing ${bezierText(p.ease)}; it scales everything below.`,
      `rotateY = ${p.tilt}° × sin(2πt), rotateX = ${p.tilt / 2}° × sin(4πt), layers separate to ${p.depth}px depth and the card scales up 3%. Starts and ends flat, so it loops seamlessly.`,
    ].join("\n"),
});
