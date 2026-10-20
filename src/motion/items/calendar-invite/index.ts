import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CalendarInvite, ENTER, EXIT, GUESTS, TL, cardWidth, zoomFor, type CalendarInviteProps } from "./CalendarInvite";

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

const DURATION = 150;

export default defineMotion<CalendarInviteProps>({
  slug: "calendar-invite",
  name: "Calendar Invite",
  description: "An event invite slides in, guest avatars stack up, and the Accept button presses into an Accepted state.",
  category: "ui",
  tags: ["calendar", "invite", "avatars", "button", "card"],
  addedAt: "2026-09-29",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CalendarInvite,
  defaultProps: {
    ...palettes[0].values,
    title: "Product review",
    time: "Thu · 10:00 – 10:45 AM",
    location: "Studio 3B, 4th floor",
    ease: "enter",
  } as CalendarInviteProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 24 },
    { type: "text", key: "time", label: "Time", maxLength: 28 },
    { type: "text", key: "location", label: "Location", maxLength: 28 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const k = zoomFor(c.width > c.height);
    const px = (n: number) => Math.round(n * k);
    const lastAvatar = TL.avatarsIn + GUESTS.length * STAGGER;
    return [
      targetLine(c.target, "a calendar invite card whose Accept button presses into an Accepted state", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. One card, ${px(cardWidth(c.height > c.width))}px wide, ${p.card} fill, 1px ${p.line} border, radius ${px(RADIUS.card)}, ${px(44)}px padding, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (no shadow on a dark canvas).`,
      `Type: Inter, sentence case, hierarchy by grey (${p.ink} → ${p.ink2} → ${p.ink3}). "Invitation from Maya Chen" ${px(20)}px 400 ${p.ink3}; "${p.title}" ${px(46)}px weight 500, -0.035em, ${p.ink}; "${p.time}" and "${p.location}" ${px(24)}px 400 ${p.ink2} with ${p.ink3} clock and pin line icons. Date block: "OCT" in Geist Mono ${px(18)}px 500, +0.12em, ${p.accent}, over "24" ${px(60)}px weight 600, -0.04em.`,
      `Geometry: date block ${px(124)}×${px(136)}, radius ${px(RADIUS.button)}, ${p.fill} fill. A ${STROKE.hair}px ${p.line} divider. ${GUESTS.length} grey initials avatars (${GUESTS.join(", ")}), ${px(64)}px, ${p.fill} fill, ${p.ink2} initials weight 500, overlapping ${px(16)}px with a ${STROKE.ring}px ${p.card} ring, then a "+3" pill with a ${p.line} hairline. "8 guests · 5 going" ${px(21)}px ${p.ink3} on the right.`,
      `Buttons ${px(76)}px tall, radius ${px(RADIUS.button)}, weight 500: "Decline" with a ${STROKE.hair}px ${p.line} border, and a wider "Accept" in ${p.button} with ${p.onButton} text. ${p.accent} appears only on "OCT" and the Accepted check. No gradients, glows or coloured shadows.`,
      `Motion: frames 0–${TL.cardIn} the card fades in and slides 120px from the right (${p.ease} ${bezierText(p.ease)}); frames ${TL.dateIn}–${TL.dateIn + ENTER} the date block scales 0.8 → 1 with a spring (${bezierText("spring")}); from frame ${TL.textIn} the four text lines fade up 14px over ${ENTER} frames, ${STAGGER} frames apart.`,
      `Frames ${TL.avatarsIn}–${lastAvatar + ENTER}: avatars and the "+3" pill fade in and scale 0.7 → 1 (spring), ${STAGGER} frames apart. Frame ${TL.buttonsIn}: buttons fade up.`,
      `Frames ${TL.cursorIn}–${TL.press - 4}: a ${p.button} cursor with a ${p.onButton} outline glides onto Accept (travel ${bezierText("travel")}) and clicks at frame ${TL.press} (${secs(TL.press, c.fps)}); the button dips to 97%.`,
      `Frames ${TL.done}–${TL.done + ENTER}: Accept cross-fades to ${p.fill} with ${p.ink} "Accepted", the label rolling up 12px; the ${p.accent} check draws on over frames ${TL.check}–${TL.check + ENTER}; Decline fades to 40% and the count reads "6 going".`,
      `Frames ${TL.cursorOut}–${TL.cursorOut + EXIT}: the cursor drifts 40px down and fades (exit ${bezierText("exit")}). Frames ${DURATION - FINAL_HOLD}–${DURATION}: completely still.`,
    ].join("\n");
  },
});
