import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { GAP, REVEAL, ROWS, ROW_H, ROW_W, SCALE, SwipeNotifications, T, isDark, type SwipeNotificationsProps } from "./SwipeNotifications";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  error: t.error,
  onError: t.onAccent,
}));

export default defineMotion<SwipeNotificationsProps>({
  slug: "swipe-notifications",
  name: "Swipe to Dismiss",
  description: "A stack of notifications where a cursor swipes the top one left to reveal Archive, flings it away, and the rest move up before a new one drops in.",
  category: "ui",
  tags: ["notifications", "swipe", "gesture", "cursor", "inbox"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SwipeNotifications,
  defaultProps: {
    ...palettes[0].values,
    title1: "Design review moved to 3:30",
    title2: "Ava commented on Pricing v2",
    title3: "Deploy to production passed",
    title4: "Your weekly report is ready",
    ease: "travel",
  } as SwipeNotificationsProps,
  palettes,
  controls: [
    { type: "text", key: "title1", label: "Title 1 (swiped)", maxLength: 30 },
    { type: "text", key: "title2", label: "Title 2", maxLength: 30 },
    { type: "text", key: "title3", label: "Title 3", maxLength: 30 },
    { type: "text", key: "title4", label: "Title 4", maxLength: 30 },
    { type: "color", key: "accent", label: "Unread dot" },
    { type: "select", key: "ease", label: "Swipe easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const titles = [p.title1, p.title2, p.title3, p.title4];
    return [
      targetLine(c.target, `a stack of four notifications where a cursor swipes the top one left to reveal Archive and flings it away`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 400/500 sentence case; Geist Mono caps (+0.12em) only for times. No gradients or glows.`,
      `Four rows ${px(ROW_W)} × ${px(ROW_H)}, ${px(GAP)} apart, centred: ${p.card}, 1px ${p.line} ring, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}.`,
      `Each row: a ${px(48)} app tile (${p.fill}, radius ${RADIUS.button}px) with a ${px(26)} line icon in ${p.ink} (${STROKE.ring}px; calendar, chat, terminal, bar chart), the title ${px(16)}/500 ${p.ink} over the body ${px(14)} ${p.ink2}, the time top-right in mono ${px(11)} ${p.ink3}, and a ${px(9)} ${p.accent} unread dot under it on the first two rows.`,
      `Rows: ${titles.map((t, i) => `"${t}" / "${ROWS[i].body}" / ${ROWS[i].time}`).join("; ")}.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor (${p.ink}) glides onto the top row (travel ${bezierText("travel")}) and presses at ${s(T.grab)}. ${s(T.dragA)}–${s(T.dragB)}: it drags the row ${px(REVEAL)} left (${p.ease}, ${bezierText(p.ease)}), revealing a ${p.error} panel behind it (same radius) with a white archive icon and "Archive" ${px(15)}/500 in ${p.onError}, centred in the revealed strip.`,
      `${s(T.flingA)}–${s(T.flingB)}: the row flings off to the left on exit ${bezierText("exit")}, fading over its last 10 frames; the red panel fills the slot, then fades and shrinks to 0.95 (${s(T.panelA)}–${s(T.panelB)}). The cursor releases at ${s(T.release)} and glides away.`,
      `From ${s(T.upA)} the three rows below move up one slot on spring (${bezierText("spring")}, 20 frames, 3-frame stagger).`,
      `From ${s(T.downA)} they move back down the same way and the first notification drops in at the top (fades in from ${px(48)} above, ${s(T.newA)}–${s(T.newB)} on enter ${bezierText("enter")}), unread. The last 12+ frames hold still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
