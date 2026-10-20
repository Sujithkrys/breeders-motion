import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { ENTER, MusicPlayer, PLAY_FRAME, START_SECONDS, TRACK_SECONDS, isDark, scaleFor, type MusicPlayerProps } from "./MusicPlayer";

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

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default defineMotion<MusicPlayerProps>({
  slug: "music-player",
  name: "Music Player",
  description: "A now-playing card with flat geometric album art, a live reactive waveform, a progress bar and a ticking time readout.",
  category: "ui",
  tags: ["music", "player", "waveform", "audio", "card"],
  addedAt: "2026-10-19",
  durationInFrames: 150,
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
    const wide = c.width >= c.height;
    const s = scaleFor(c.width > c.height, c.width === c.height);
    const px = (n: number) => Math.round(n * s);
    const dark = isDark(p.background);
    return [
      targetLine(c.target, "a now-playing music card with live waveform bars and a progress bar", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Card ${p.card}, radius ${px(RADIUS.hero)}, ${px(40)}px padding, 1px ${p.line} border${dark ? ", no shadow on this dark canvas" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. No gradients or glows.`,
      wide
        ? `Layout: ${px(400)}px album art on the left, a ${px(560)}px info column on the right, ${px(48)}px gap (sizes at 1080 on the short side).`
        : `Layout: ${px(600)}px album art on top, the info column below it at the same width.`,
      `Album art (radius ${px(RADIUS.card)}), flat SVG: a ${p.ink} square, two concentric discs rising from the lower left (${p.ink2} outer, ${p.ink3} inner), one small ${p.accent} dot upper right.`,
      `Type: Inter. "NOW PLAYING" in Geist Mono ${px(15)}px, +0.12em, ${p.ink3}, with a filled ${p.accent} heart; title "${p.title}" ${px(52)}px weight 500 (-0.035em) in ${p.ink}; artist "${p.artist}" ${px(28)}px weight 400 in ${p.ink2}; times in Geist Mono ${px(18)}px, ${p.ink3}.`,
      `Waveform: ${Math.round(p.bars)} pill bars in ${p.accent}, mirrored around the centre line, ${px(104)}px tall. Each bar's height is a centre-weighted shape × two sines at its own speed, plus a kick every beat (120 bpm) that hits the left bars hardest; reactivity ${Math.round(p.intensity * 100) / 100}. Taller bars get more opacity (45% → 100%).`,
      `Below: a ${STROKE.bar}px ${p.fill} track with a ${p.ink} fill and an 18px ${p.ink} knob; "${clock(START_SECONDS)}" and "-${clock(TRACK_SECONDS - START_SECONDS)}"; then shuffle, previous, a ${px(74)}px ${p.button} play button (${p.onButton} glyph), next, repeat. Icon strokes ${STROKE.ring}px; shuffle and repeat in ${p.ink3}, skip in ${p.ink}.`,
      "",
      `Frames ${ENTER.card[0]}–${ENTER.card[1]}: the card fades in and rises ${ENTER.rise}px; frames ${ENTER.art[0]}–${ENTER.art[1]}: the art scales from 0.94. Ease: ${p.ease}, ${bezierText(p.ease)}.`,
      `Frame ${PLAY_FRAME}: the play button presses to 0.9 and its triangle cross-fades into pause on travel, ${bezierText("travel")}; frames ${PLAY_FRAME}–${PLAY_FRAME + 18}: the bars swell from flat on enter, ${bezierText("enter")}.`,
      `From then on the elapsed time counts up in real seconds, the remaining time counts down and the fill grows to match (track length ${clock(TRACK_SECONDS)}). The bars and clock are continuous and keep moving to ${c.seconds}s; the card itself is still.`,
    ].join("\n");
  },
});
