import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CalendarInvite, GUESTS, PRESS_FRAME, type CalendarInviteProps } from "./CalendarInvite";

const palettes = [
  { name: "Lime", swatch: ["#0E100B", "#B4F03C", "#FDE047", "#34D399"], values: { background: "#0E100B", card: "#191C14", ink: "#F5FAEC", accent: "#B4F03C", onAccent: "#10140A", avatarA: "#FDE047", avatarB: "#34D399" } },
  { name: "Coral", swatch: ["#F7F1EC", "#F0563A", "#FDBA74", "#F472B6"], values: { background: "#F7F1EC", card: "#FFFFFF", ink: "#1F1714", accent: "#F0563A", onAccent: "#FFFFFF", avatarA: "#FDBA74", avatarB: "#F472B6" } },
  { name: "Iris", swatch: ["#0C0B16", "#8B7CFF", "#C4B5FD", "#F0ABFC"], values: { background: "#0C0B16", card: "#171528", ink: "#F1EFFF", accent: "#8B7CFF", onAccent: "#FFFFFF", avatarA: "#C4B5FD", avatarB: "#F0ABFC" } },
  { name: "Teal", swatch: ["#061312", "#2DD4BF", "#67E8F9", "#A7F3D0"], values: { background: "#061312", card: "#0F1F1E", ink: "#E7FFFB", accent: "#2DD4BF", onAccent: "#042220", avatarA: "#67E8F9", avatarB: "#A7F3D0" } },
  { name: "Graphite", swatch: ["#0B0B0C", "#FAFAFA", "#A1A1AA", "#52525B"], values: { background: "#0B0B0C", card: "#18181B", ink: "#F4F4F5", accent: "#FAFAFA", onAccent: "#0B0B0C", avatarA: "#A1A1AA", avatarB: "#52525B" } },
];

export default defineMotion<CalendarInviteProps>({
  slug: "calendar-invite",
  name: "Calendar Invite",
  description: "An event invite slides in, guest avatars stack up, and the Accept button presses into an Accepted state.",
  category: "ui",
  tags: ["calendar", "invite", "avatars", "button", "card"],
  addedAt: "2026-09-29",
  durationInFrames: 165,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CalendarInvite,
  defaultProps: {
    ...palettes[0].values,
    title: "Product review",
    time: "Thu · 10:00 – 10:45 AM",
    location: "Studio 3B, 4th floor",
    stagger: 5,
    ease: "enter",
  } as CalendarInviteProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 24 },
    { type: "text", key: "time", label: "Time", maxLength: 28 },
    { type: "text", key: "location", label: "Location", maxLength: 28 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Avatar stagger", min: 2, max: 9, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const press = PRESS_FRAME / c.fps;
    return [
      targetLine(c.target, "a calendar invite card whose Accept button presses into an Accepted state", c.width, c.height, c.seconds),
      `Background ${p.background}. Card ${p.card}, ${c.width < c.height ? 880 : 820}px wide, radius 40, 44px padding, 1.5px ${p.ink} border at 8%, soft deep shadow. Font Geist; text ${p.ink}, secondary at 56%.`,
      `Top: a 124×136 date block (radius 26, ${p.accent} tint at 14% with a 30% border) reading "OCT" (20px, weight 700, 0.12em, ${p.accent}) over "24" (62px, weight 650, -0.04em).`,
      `Beside it: "Invitation from Maya Chen" 20px muted, "${p.title}" 46px weight 650 (-0.035em), then "${p.time}" and "${p.location}" at 24px with ${p.accent} clock and pin line icons.`,
      `Below a hairline divider: ${GUESTS.length} overlapping 64px avatars (−18px overlap, 4px ${p.card} ring) with initials ${GUESTS.join(", ")}, filled with a gradient that steps from ${p.avatarA} to ${p.avatarB}, then a "+3" chip; "8 guests · 5 going" on the right.`,
      `Buttons, 76px tall, radius 20: "Decline" outlined, and a wider "Accept" filled ${p.accent} with ${p.onAccent} text and a ${p.accent} glow.`,
      "",
      `0–0.87s: the card slides in from 140px right with a 2° tilt (${p.ease} ${bezierText(p.ease)}); the date block pops in with a bouncy scale and the text lines fade up 14px in sequence.`,
      `From 1.1s: avatars pop in left to right, ${secs(p.stagger, c.fps)} apart, from 50% scale and 16px left, with a bouncy ease. Buttons fade up at 1.8s.`,
      `A cursor glides onto Accept and clicks at ${press.toFixed(1)}s (button dips to 95%). Accept cross-fades to a ${p.accent} 14% tint with ${p.accent} text "Accepted" and a check that draws on; the label rolls up 12px, Decline fades to 40%, the count reads "6 going".`,
      `The cursor drifts away and the final state holds from ${(press + 0.8).toFixed(1)}s to ${c.seconds}s.`,
    ].join("\n");
  },
});
