import { EASE_OPTIONS, RADIUS, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { ARRIVALS, ARRIVE, BODIES, DROP, NotificationStack, SCALE, TH, TW, isDark, splitToast, type NotificationStackProps } from "./NotificationStack";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<NotificationStackProps>({
  slug: "notification-stack",
  name: "Notification Stack",
  description: "Toast notifications land one after another, folding the older ones back into faded slivers behind the newest.",
  category: "ui",
  tags: ["notifications", "toast", "stack", "social", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: NotificationStack,
  defaultProps: {
    ...palettes[0].values,
    toast1: "@maya liked your post",
    toast2: "@theo replied to you",
    toast3: "@iris started following you",
    toast4: "@sam mentioned you",
    peek: 14,
    ease: "enter",
  } as NotificationStackProps,
  palettes,
  controls: [
    { type: "text", key: "toast1", label: "Toast 1", maxLength: 34 },
    { type: "text", key: "toast2", label: "Toast 2", maxLength: 34 },
    { type: "text", key: "toast3", label: "Toast 3", maxLength: 34 },
    { type: "text", key: "toast4", label: "Toast 4", maxLength: 34 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "accent", label: "Unread dot" },
    { type: "number", key: "peek", label: "Stack peek", min: 8, max: 20, step: 1, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const peek = Math.min(20, Math.max(8, Number(p.peek) || 14));
    const toasts = [p.toast1, p.toast2, p.toast3, p.toast4].map((t, i) => {
      const [h, a] = splitToast(t);
      return `"${h}" + "${a}" / "${BODIES[i]}"`;
    });
    return [
      targetLine(c.target, `a stack of social notification toasts where each new one lands in front and folds the older ones back`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, nothing else on it. Sizes are px at 1080 on the short side. Inter only, 400/500, sentence case. No gradients or glows.`,
      `Toast: ${px(TW)} × ${px(TH)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.hero}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Inside, left to right: a ${px(44)} grey avatar circle (${p.fill}, 1px ${p.line}) with the handle's initial in ${p.ink2} 500; a two-tone title ${px(16)}, handle 500 ${p.ink} then the action 400 ${p.ink2}; a ${px(14)} body line in ${p.ink3}; at the right "now" ${px(13)} ${p.ink3} above an ${px(8)} unread dot in ${p.accent} (the only colour, front toast only).`,
      `Toasts in order: ${toasts.join("; ")}. They cycle, so toast 4 is in front at frame 0 with 3 and 2 behind it.`,
      `Depth model: each toast has a depth (0 = front). Behind toasts scale by 1 − 0.06 × depth from their bottom-centre, sit ${px(peek)} lower per step so only a sliver of each shows under the front one, fade their content out (gone by depth 0.6) and are veiled toward the canvas colour by 32% per step while staying opaque. Depth 2→3 fades the toast away. Show at most three.`,
      `Arrivals at ${ARRIVALS.map(s).join(", ")}: a new toast fades in from ${px(DROP)} above over ${ARRIVE} frames (${p.ease} ${bezierText(p.ease)}) while every older toast moves one depth back on the same curve; the old front's unread dot fades as it leaves the front.`,
      `After the fourth arrival the stack matches frame 0 exactly; hold still for the last 12 frames so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
