import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { MusicPlayer, PLAY_FRAME, START_SECONDS, TRACK_SECONDS, type MusicPlayerProps } from "./MusicPlayer";

const palettes = [
  { name: "Fuchsia", swatch: ["#FF4FA3", "#FF8A5B", "#C2186B"], values: { background: "#14070F", card: "#22111B", ink: "#FFEFF7", accent: "#FF4FA3", art1: "#FF8A5B", art2: "#C2186B", art3: "#FFD27A" } },
  { name: "Lime", swatch: ["#A3E635", "#D9F99D", "#3F6212"], values: { background: "#0C1006", card: "#171D0E", ink: "#F4FFE6", accent: "#A3E635", art1: "#D9F99D", art2: "#3F6212", art3: "#FDE047" } },
  { name: "Tide", swatch: ["#38BDF8", "#22D3EE", "#1E3A8A"], values: { background: "#050D17", card: "#0E1A2A", ink: "#EAF4FF", accent: "#38BDF8", art1: "#22D3EE", art2: "#1E3A8A", art3: "#A5F3FC" } },
  { name: "Peach", swatch: ["#FBF1EA", "#F25C2A", "#E8476A"], values: { background: "#FBF1EA", card: "#FFFFFF", ink: "#26160F", accent: "#F25C2A", art1: "#FFB38A", art2: "#E8476A", art3: "#FFE3A3" } },
  { name: "Graphite", swatch: ["#E4E4E7", "#71717A", "#18181B"], values: { background: "#0B0B0C", card: "#18181B", ink: "#F4F4F5", accent: "#E4E4E7", art1: "#71717A", art2: "#27272A", art3: "#D4D4D8" } },
];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default defineMotion<MusicPlayerProps>({
  slug: "music-player",
  name: "Music Player",
  description: "A now-playing card with gradient album art, a live reactive waveform, a progress bar and a ticking time readout.",
  category: "ui",
  tags: ["music", "player", "waveform", "audio", "card"],
  addedAt: "2026-10-19",
  durationInFrames: 165,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: MusicPlayer,
  defaultProps: {
    ...palettes[0].values,
    title: "Golden Hour",
    artist: "Nova Lane",
    bars: 40,
    intensity: 0.7,
    ease: "enter",
  } as MusicPlayerProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 22 },
    { type: "text", key: "artist", label: "Artist", maxLength: 28 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "bars", label: "Bars", min: 24, max: 56, step: 4 },
    { type: "number", key: "intensity", label: "Reactivity", min: 0.2, max: 1, step: 0.05 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const wide = c.width > c.height;
    return [
      targetLine(c.target, "a now-playing music card with live waveform bars and a progress bar", c.width, c.height, c.seconds),
      `Background ${p.background}. Card ${p.card}, radius 44, 40px padding, 1.5px ${p.ink} border at 8%, shadow 0 50px 120px ${p.art2} at 28% plus a dark drop shadow. Font Geist; times in Geist Mono.`,
      wide
        ? "Layout: 400px album art on the left, a 560px info column on the right, 48px gap."
        : "Layout: 600px album art on top, the info column below it at the same width (scale everything to 72% on 1:1).",
      `Album art (radius 26), drawn as SVG: a ${p.art1} → ${p.art2} sky, a ${p.art3} sun with a soft radial glow that drifts slowly, three layered dark hills that sway, and a white diagonal sheen.`,
      `Info: "NOW PLAYING" 17px weight 600, 0.1em tracking, in ${p.accent}, with a filled heart; title "${p.title}" 52px weight 650 (-0.035em) in ${p.ink}; artist "${p.artist}" 28px at 55%.`,
      `Waveform: ${Math.round(p.bars)} rounded ${p.accent} bars, mirrored around the centre line, 104px tall. Each bar's height is a centre-weighted shape × a mix of two sines at its own speed, plus a kick on every beat (120 bpm) that hits the left bars hardest; reactivity ${Math.round(p.intensity * 100) / 100}. Brighter bars get more opacity.`,
      `Below: an 8px track with a ${p.ink} fill and an 18px knob, then "${clock(START_SECONDS)}" and "-${clock(TRACK_SECONDS - START_SECONDS)}" in 18px mono, then shuffle, previous, a 74px ${p.ink} play button, next, repeat.`,
      "",
      `0–0.8s: the card rises 50px and fades in (${p.ease} ${bezierText(p.ease)}); the art scales from 94%.`,
      `${(PLAY_FRAME / c.fps).toFixed(2)}s: the play button presses to 90% and its triangle morphs into pause; the bars swell up from flat over 0.6s.`,
      `From then on the elapsed time counts up in real seconds, the remaining time counts down and the progress fill grows to match (track length ${clock(TRACK_SECONDS)}). Keep the bars moving to ${c.seconds}s.`,
    ].join("\n");
  },
});
