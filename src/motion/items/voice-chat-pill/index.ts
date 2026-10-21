import { CANVAS, EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { EXTRA, PANEL_H, PANEL_W, PILL, PULSE, ROW, SCALE, SPEAKER, SUBS, T, VoiceChatPill, initials, isDark, pillWidth, type VoiceChatPillProps } from "./VoiceChatPill";

// The pill and panel are the `button` surface (black; white on Ink), so their greys come from the opposite canvas.
const palettes = systemPalettes((t) => {
  const onInk = t.bg === CANVAS.ink.bg;
  const opp = onInk ? CANVAS.paper : CANVAS.ink;
  return {
    background: t.bg,
    button: t.button,
    onButton: t.onButton,
    sub: opp.ink2,
    faint: opp.ink3,
    cardLine: opp.line,
    ink: t.ink,
    accent: t.accent,
  };
});

export default defineMotion<VoiceChatPillProps>({
  slug: "voice-chat-pill",
  name: "Voice Chat Pill",
  description: "A compact voice-room pill with a live waveform and stacked avatars opens into a participants panel with a pulsing speaker, then folds back.",
  category: "ui",
  tags: ["voice", "avatars", "morph", "pill", "cursor"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: VoiceChatPill,
  defaultProps: {
    ...palettes[0].values,
    title: "Design sync",
    name1: "Maya Chen",
    name2: "Leo Park",
    name3: "Ava Stone",
    name4: "Noah Kim",
    ease: "spring",
  } as VoiceChatPillProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Room title", maxLength: 22 },
    { type: "text", key: "name1", label: "Name 1", maxLength: 18 },
    { type: "text", key: "name2", label: "Name 2 (speaking)", maxLength: 18 },
    { type: "text", key: "name3", label: "Name 3", maxLength: 18 },
    { type: "text", key: "name4", label: "Name 4", maxLength: 18 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Open easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const names = [p.name1, p.name2, p.name3, p.name4];
    return [
      targetLine(c.target, `a voice-room pill (waveform, 4 stacked avatars, "+${EXTRA}") that morphs into a participants panel and back`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, nothing else on it. Sizes are px at 1080 on the short side. Inter 400/500, sentence case; Geist Mono only for the tiny "${names.length + EXTRA} IN ROOM" label (+0.1em, ${p.faint}). No images, gradients or glows${isDark(p.background) ? "" : "; the surface has shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}.`,
      `Pill: ${pillWidth()} × ${PILL.h}px, ${p.button}, radius ${RADIUS.hero}px, centred. Inside: a ${PILL.wave}px five-bar waveform in ${p.accent} (bars breathe with |sin| at periods of 20–36 frames), 4 initials avatars of ${PILL.d}px stepping ${PILL.step}px with a ${STROKE.bar}px ${p.button} cut-out (${names.map(initials).join(", ")}), then "+${EXTRA}" 30px/500 ${p.sub}. Avatar fills are ${p.onButton} mixed into ${p.button} at 10–28%, the speaker's tinted with the accent at 30%.`,
      `Speaker "${names[SPEAKER]}": a ${STROKE.ring}px ${p.accent} ring 4px outside the avatar, plus a second ring that pulses every ${PULSE} frames (scale 1→1.32, opacity 0.7→0, linear).`,
      `${s(T.mv1A)}–${s(T.mv1B)}: a 30px arrow cursor (${p.ink}) glides to the pill on travel ${bezierText("travel")} and clicks at ${s(T.click1)} (pill dips to 0.97). ${s(T.openA)}–${s(T.openB)}: the same surface grows into a ${px(PANEL_W)} × ${px(PANEL_H)} panel, radius ${RADIUS.hero}px → ${RADIUS.card}px, width and height together, ${p.ease} ${bezierText(p.ease)}. The waveform and "+${EXTRA}" fade out in 10 frames.`,
      `The 4 avatars fly from the stack into a list column (${px(ROW.d)}, rows ${px(ROW.h)} apart), staggered 3 frames, over ${T.avLen} frames on the same ease; the cut-outs melt away.`,
      `Panel, rising 8px and fading in from ${s(T.contentA)} with a 3-frame stagger: header with a small accent waveform, "${p.title}" ${px(16)}/500 ${p.onButton}, the mono count and a ${px(30)} round collapse button (${p.cardLine}, shrink icon in ${p.sub}); a 1px ${p.cardLine} rule; rows of name ${px(15)}/500 over a state line ${px(12)}: ${names.map((n, i) => `${n} "${SUBS[i]}"`).join(", ")} (speaking in ${p.accent}, others ${p.faint}). Right side: an accent 3-bar equaliser for the speaker, a mic or struck-through mic in ${p.faint} for the rest. Footer: "${EXTRA} others listening" ${p.faint} and a "Leave" button (${p.cardLine}, radius ${RADIUS.button}px).`,
      `${s(T.mv2A)}–${s(T.click2)}: the cursor clicks the collapse button. Contents fade out over 12 frames on exit ${bezierText("exit")}; ${s(T.closeA)}–${s(T.closeB)} the panel folds back into the pill on travel while the avatars restack and the cursor returns. Hold from ${s(T.pillInB)}; the waveform, equaliser and pulse keep moving and loop seamlessly over ${c.seconds}s.`,
    ].join("\n");
  },
});
