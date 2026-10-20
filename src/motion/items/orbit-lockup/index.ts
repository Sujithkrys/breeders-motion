import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { OrbitLockup, timeline, type OrbitLockupProps } from "./OrbitLockup";

const palettes = [
  { name: "Lime", swatch: ["#C6F432", "#5FA30F", "#0C0E08"], values: { background: "#0C0E08", accent: "#C6F432", accentB: "#5FA30F", monogramColor: "#0C0E08", nameColor: "#F3FBDF" } },
  { name: "Sunset", swatch: ["#FFB25B", "#F0473C", "#150906"], values: { background: "#150906", accent: "#FFB25B", accentB: "#F0473C", monogramColor: "#FFF6EC", nameColor: "#FFEFE4" } },
  { name: "Aqua", swatch: ["#67E8F9", "#0891B2", "#031316"], values: { background: "#031316", accent: "#67E8F9", accentB: "#0891B2", monogramColor: "#04181C", nameColor: "#E3FAFD" } },
  { name: "Lilac", swatch: ["#F5F2FB", "#A78BFA", "#6D28D9"], values: { background: "#F5F2FB", accent: "#A78BFA", accentB: "#6D28D9", monogramColor: "#FFFFFF", nameColor: "#1C1530" } },
  { name: "Mono", swatch: ["#F4F4F5", "#8B8B93", "#0B0B0C"], values: { background: "#0B0B0C", accent: "#F4F4F5", accentB: "#8B8B93", monogramColor: "#0B0B0C", nameColor: "#F4F4F5" } },
];

export default defineMotion<OrbitLockupProps>({
  slug: "orbit-lockup",
  name: "Orbit Lockup",
  description: "Dots orbit, accelerate and collapse into a circular mark that pops in, then the name slides out from behind it.",
  category: "logo",
  tags: ["logo", "orbit", "particles", "lockup", "reveal"],
  addedAt: "2026-10-02",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: OrbitLockup,
  defaultProps: {
    ...palettes[0].values,
    monogram: "o",
    name: "orbital",
    count: 9,
    turns: 2.5,
    ease: "enter",
  } as OrbitLockupProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "count", label: "Dots", min: 5, max: 14, step: 1 },
    { type: "number", key: "turns", label: "Turns", min: 1, max: 4, step: 0.5 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D);
    const S = vertical ? 320 : 260;
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a logo reveal where ${p.count} orbiting dots accelerate and collapse into a circular "${p.monogram}" mark, then "${p.name}" slides out from behind it`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only.`,
      "",
      `Orbit: ${p.count} dots (9px radius growing to 13px), alternating ${p.accent} and ${p.accentB}, evenly spaced on a ${Math.round(S * 1.18)}px-radius ring with a faint 1.5px guide circle at 14%.`,
      `${s(tl.orbit[0])}–${s(tl.orbit[1])}: they spin ${p.turns} turns clockwise with angle = start + ${p.turns} × 360° × t² (accelerating), while the radius shrinks by (1 − t³), so they spiral into the centre at the end. Each dot drags a round-capped arc trail whose length grows with its speed (two layers, 18% and 40%).`,
      `${s(tl.collapse)}: the dots vanish into the centre and a ${S}px circle mark springs in from scale 0 with overshoot (spring damping 11, stiffness 150, mass 0.8), plus a soft flash and a shockwave ring that expands to ${Math.round(S * 1.15)}px radius and fades.`,
      `Mark: 145° gradient ${p.accent} → ${p.accentB}, top gloss, ${p.accentB} glow at 45%, monogram "${p.monogram}" in Geist 700, -0.045em, ${p.monogramColor}, scaling up from 70% over ${s(tl.mono[0])}–${s(tl.mono[1])}.`,
      `${s(tl.ring[0])}–${s(tl.ring[1])}: a thin 1.5px ${p.accent} ring at 35% fades in 26px outside the mark, and a 14px glowing dot rides it and settles at the upper right.`,
      vertical
        ? `${s(tl.name[0])}–${s(tl.name[1])}: the mark rises while "${p.name}" slides down out from behind it, clipped at the mark's centre, ending as a centred stack ${Math.round(S * 0.32)}px below.`
        : `${s(tl.name[0])}–${s(tl.name[1])}: the mark moves left while "${p.name}" slides right out from behind it, clipped at the mark's centre, ending as a centred lockup ${Math.round(S * 0.32)}px from the mark.`,
      `Name: Geist 650, ${vertical ? 116 : 120}px, -0.04em, ${p.nameColor}. Ease ${p.ease} ${bezierText(p.ease)}. Hold to the end.`,
    ].join("\n");
  },
});
