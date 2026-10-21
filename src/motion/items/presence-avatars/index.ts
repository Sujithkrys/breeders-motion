import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { DOT, EVENTS, GEO, LABEL, POP, PresenceAvatars, RIPPLE, START, TOAST, TOAST_H, TONES, firstName, initials, type PresenceAvatarsProps } from "./PresenceAvatars";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  success: t.success,
}));

export default defineMotion<PresenceAvatarsProps>({
  slug: "presence-avatars",
  name: "Presence Avatars",
  description: "Three large avatars whose status dots pop between online, away and offline while an \"is online\" toast slides in.",
  category: "ui",
  tags: ["avatars", "presence", "status", "toast", "team"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: PresenceAvatars,
  defaultProps: {
    ...palettes[0].values,
    name1: "Maya Chen",
    name2: "Ava Stone",
    name3: "Leo Park",
    ease: "enter",
  } as PresenceAvatarsProps,
  palettes,
  controls: [
    { type: "text", key: "name1", label: "Name 1", maxLength: 18 },
    { type: "text", key: "name2", label: "Name 2", maxLength: 18 },
    { type: "text", key: "name3", label: "Name 3 (comes online)", maxLength: 18 },
    { type: "color", key: "accent", label: "Away" },
    { type: "color", key: "success", label: "Online" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const s = (f: number) => secs(f, c.fps);
    const names = [p.name1, p.name2, p.name3];
    const layout =
      ratio === "9:16"
        ? `a left-aligned list of 3 rows ${g.step}px apart: avatar on the left, name and status 56px to its right`
        : `one row, avatar centres ${g.step}px apart, name and status centred 48px below each`;
    return [
      targetLine(c.target, `three large presence avatars whose status dots change between online, away and offline, with an "is online" toast`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter, sentence case; names ${g.name}px/500 -0.02em ${p.ink}, status words ${g.status}px/400 ${p.ink2}; Geist Mono ${g.head}px +0.12em for the header "DESIGN TEAM · N ONLINE" (${p.ink3} / ${p.ink2}). No images, gradients or glows.`,
      `Layout: ${layout}. Avatars are ${g.d}px circles with initials ${Math.round(g.d * 0.32)}px/500 (${names.map(initials).join(", ")}), filled with ${p.ink} mixed into ${p.card} at ${TONES.map((t) => `${Math.round(t.bg * 100)}%`).join(", ")} and a 1px ${p.line} hairline.`,
      `Status dot: ${Math.round(g.d * DOT)}px at the lower-right (45°), ${STROKE.bar}px ${p.background} cut-out ring. Online ${p.success}, away ${p.accent}, offline ${p.ink3}; offline avatars drop to 50% opacity and their names to 65%.`,
      `Start: ${names.map((n, i) => `${firstName(n)} ${START[i]}`).join(", ")}. Changes: ${EVENTS.map((e) => `${s(e.f)} ${firstName(names[e.i])} → ${e.to}`).join(", ")}. Every person ends where they started.`,
      `On each change the dot pops (scale 1 → 0.55 → 1.15 → 1 at +${POP[1]}, +${POP[2]}, +${POP[3]} frames), its colour crossfades over frames +3 to +9 on travel ${bezierText("travel")}, and a ${STROKE.ring}px ring in the new colour expands to 2.3× and fades over frames +${RIPPLE[0]} to +${RIPPLE[1]}. The status word rolls: the old word rises and fades, the new one rises in, over 12 frames on ${p.ease} ${bezierText(p.ease)}. The header count updates 6 frames after a change.`,
      `Toast at the top centre, ${s(TOAST.inA)}–${s(TOAST.inB)}: slides down 40px and fades in (${p.ease}), holds, then ${s(TOAST.outA)}–${s(TOAST.outB)} lifts 24px and fades on exit ${bezierText("exit")}. It is a ${TOAST_H}px ${p.card} pill (radius ${RADIUS.hero}px, 1px ${p.line} border, soft shadow on light canvases): a 56px "${initials(names[2])}" avatar with a small ${p.success} dot, "${firstName(names[2])}" 30px/500 ${p.ink}, "is online" 30px ${p.ink2}, and mono "NOW" 18px ${p.ink3}.`,
      `Statuses read: ${Object.values(LABEL).join(", ")}. The last 12 frames hold still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
