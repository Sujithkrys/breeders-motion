import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { RING_GAP, RingBurst, timeline, type RingBurstProps } from "./RingBurst";

const palettes = [
  { name: "Gold", swatch: ["#FFC94D", "#F08A00", "#100C04"], values: { background: "#100C04", ringColor: "#FFC94D", badgeA: "#FFC94D", badgeB: "#F08A00", badgeInk: "#1C1203" } },
  { name: "Ruby", swatch: ["#FF8FA8", "#FF5C7A", "#B0123C"], values: { background: "#12060A", ringColor: "#FF8FA8", badgeA: "#FF5C7A", badgeB: "#B0123C", badgeInk: "#FFF0F3" } },
  { name: "Teal", swatch: ["#7FF0DD", "#2DD4BF", "#0F766E"], values: { background: "#03110F", ringColor: "#7FF0DD", badgeA: "#2DD4BF", badgeB: "#0F766E", badgeInk: "#F0FFFC" } },
  { name: "Forest", swatch: ["#F6F1E7", "#3C7A4B", "#1F4029"], values: { background: "#F6F1E7", ringColor: "#2F5D3A", badgeA: "#3C7A4B", badgeB: "#1F4029", badgeInk: "#F6F1E7" } },
  { name: "Plum", swatch: ["#D8B4FE", "#A855F7", "#581C87"], values: { background: "#0F0716", ringColor: "#D8B4FE", badgeA: "#A855F7", badgeB: "#581C87", badgeInk: "#FAF5FF" } },
];

export default defineMotion<RingBurstProps>({
  slug: "ring-burst",
  name: "Ring Burst",
  description: "Concentric rings burst outward and fade, leaving a circular badge logo that pops in with overshoot.",
  category: "logo",
  tags: ["logo", "badge", "burst", "rings", "seal"],
  addedAt: "2026-10-09",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: RingBurst,
  defaultProps: {
    ...palettes[0].values,
    monogram: "K",
    name: "Kiln Coffee",
    tagline: "Roasted daily",
    rings: 5,
    ease: "enter",
  } as RingBurstProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 16 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 22 },
    { type: "color", key: "badgeA", label: "Badge" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "rings", label: "Rings", min: 3, max: 8, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D);
    const B = vertical ? 500 : 440;
    const k = B / 200;
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a logo reveal where ${p.rings} concentric rings burst outward and a circular "${p.name}" badge pops in`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only. Everything centred.`,
      "",
      `${s(tl.flash[0])}–${s(tl.flash[1])}: a soft ${p.ringColor} radial flash swells to ${Math.round(B * 0.45)}px and fades.`,
      `Rings: ${p.rings} ${p.ringColor} stroked circles, starting ${RING_GAP} frames apart from ${s(tl.ringStart)}. Each grows from ${Math.round(B * 0.12)}px radius to about ${Math.round(B * 0.5 + 430)}px (+10% per ring) over ${s(tl.ringDur)}, stroke 14px → 1px, opacity (alternating 90% / 50%) falling as (1 − t)^1.3.`,
      `Badge: a ${B}px circle, 135° gradient ${p.badgeA} → ${p.badgeB}, top gloss, ${p.badgeB} glow at 45% (0 36px 100px), a hairline ring at ${Math.round(93 * k)}px radius and a 1.2px ring at ${Math.round(70 * k)}px, both ${p.badgeInk} at ~30%.`,
      `Around the band: "${p.name.toUpperCase()}" on the top arc (Geist 650, ${Math.round(11.5 * k)}px, 0.22em tracking) and "${p.tagline.toUpperCase()}" on the bottom arc reading upright (Geist 500, ${Math.round(9.5 * k)}px, 0.2em, 80%), with a dot at 9 and 3 o'clock. Use SVG textPath, both centred.`,
      `From ${s(tl.pop)} the badge springs from scale 0 with overshoot (spring damping 10, stiffness 120, mass 0.9) while a ${p.badgeA} halo appears behind it.`,
      `${s(tl.mono[0])}–${s(tl.mono[1])}: monogram "${p.monogram}" (Geist 700, ${Math.round((p.monogram.length > 1 ? 50 : 66) * k)}px, -0.045em, ${p.badgeInk}) scales up from 60%. ${s(tl.text[0])}–${s(tl.text[1])}: the arc text fades in while rotating from -70° to 0°.`,
      `Ease ${p.ease} ${bezierText(p.ease)} for the rings and badge details. Hold the badge to the end.`,
    ].join("\n");
  },
});
