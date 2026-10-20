import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AppDock, type AppDockProps } from "./AppDock";

const palettes = [
  { name: "Ember", swatch: ["#FFC24B", "#FF7A3D", "#E5375B"], values: { background: "#140F0D", dock: "#2A211D", ink: "#FFF4EC", iconA: "#FFC24B", iconB: "#FF7A3D", iconC: "#E5375B" } },
  { name: "Lagoon", swatch: ["#A3F7B5", "#2DD4BF", "#0E7490"], values: { background: "#071513", dock: "#12302B", ink: "#E9FFF8", iconA: "#A3F7B5", iconB: "#2DD4BF", iconC: "#0E7490" } },
  { name: "Orchid", swatch: ["#F9A8D4", "#C055F0", "#6D3BF5"], values: { background: "#120A1A", dock: "#261A33", ink: "#F8EEFF", iconA: "#F9A8D4", iconB: "#C055F0", iconC: "#6D3BF5" } },
  { name: "Sherbet", swatch: ["#EEEAE3", "#FDBA74", "#F472B6", "#818CF8"], values: { background: "#EEEAE3", dock: "#FFFFFF", ink: "#1A1714", iconA: "#FDBA74", iconB: "#F472B6", iconC: "#818CF8" } },
  { name: "Graphite", swatch: ["#A1A1AA", "#5B5B66", "#2E2E35"], values: { background: "#0C0C0E", dock: "#1E1E22", ink: "#F2F2F3", iconA: "#A1A1AA", iconB: "#5B5B66", iconC: "#2E2E35" } },
];

export default defineMotion<AppDockProps>({
  slug: "app-dock",
  name: "App Dock",
  description: "A desktop dock magnifies under a passing cursor, then one app bounces open and gets its running dot.",
  category: "ui",
  tags: ["desktop", "dock", "icons", "launch"],
  addedAt: "2026-10-17",
  durationInFrames: 165,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: AppDock,
  defaultProps: {
    ...palettes[0].values,
    label: "Studio",
    magnify: 1.55,
    active: 4,
    ease: "enter",
  } as AppDockProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "App name", maxLength: 20 },
    { type: "color", key: "iconB", label: "Icon colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "magnify", label: "Magnify", min: 1.2, max: 1.8, step: 0.05, unit: "×" },
    { type: "number", key: "active", label: "Launching icon", min: 1, max: 7, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const size = c.width > c.height ? 112 : 96;
    return [
      targetLine(c.target, "a desktop app dock with a magnification wave and one app launching", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Everything is drawn in code; no brand logos or images.`,
      "",
      `Dock: a ${p.dock} bar (vertical gradient from 94% to 80% opacity), radius ${Math.round(size * 0.36)}px, 1.5px ${p.ink} border at 12% opacity, 0 30px 70px rgba(0,0,0,0.32) shadow, centred slightly below the middle with a soft blurred ${p.iconB} glow behind it.`,
      `Seven ${size}px squircle icons (radius 23.5%), ${Math.round(size * 0.16)}px apart. Their 160° gradients step evenly along ${p.iconA} → ${p.iconB} → ${p.iconC}, each with a white top sheen and a white 1.7px line glyph: folder, compass, chat, music, calendar, camera, sliders.`,
      `Small ${p.ink} running dots sit under icons 1 and 4.`,
      "",
      `0–0.7s: the dock rises 80px and fades in (${p.ease}). A white arrow cursor enters from the left at 0.6s and sweeps to the right edge by 2.3s.`,
      `Icons magnify under the cursor up to ${Math.round(p.magnify * 100) / 100}× with a Gaussian falloff (σ = 1.1 icons), grow from their bottom edge, and push their neighbours apart so the dock widens.`,
      `2.3–3s: the cursor glides back to icon ${Math.round(p.active)} (${p.ease} ${bezierText(p.ease)}). A "${p.label}" tooltip (26px, weight 500, ${p.dock} pill with a hairline border) fades up 10px above it.`,
      `3s: click (the icon and cursor dip to 88%), then the icon bounces twice: a ${Math.round(size * 0.5)}px hop over 0.73s, then ${Math.round(size * 0.22)}px over 0.53s.`,
      `3.7s: its running dot pops in with a bouncy scale and a soft glow. Hold the final state to ${c.seconds}s.`,
    ].join("\n");
  },
});
