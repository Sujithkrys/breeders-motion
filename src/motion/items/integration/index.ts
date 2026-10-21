import { FILM, SAMPLE } from "../../film";
import { ACCENT, CANVAS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  BADGE,
  CAMERA,
  CARD,
  CARD_TALL,
  CARD_WIDE,
  CHIP,
  FLY_FROM,
  Integration,
  K,
  LINE_H,
  MARGIN,
  MARK,
  MESSAGE_TIME,
  PULSE_R,
  SHOTS,
  SIZE,
  T,
  TRACK,
  endInk,
  fitRows,
  geometry,
  textOn,
  type IntegrationProps,
} from "./Integration";

// Each colourway sets the connector field, the title card and the one accent together.
const looks: { name: string; field: string; end: string; accent: string }[] = [
  { name: "Grey / Lime", field: FILM.canvas, end: FILM.lime, accent: FILM.select },
  { name: "Cream / Green", field: FILM.cream, end: FILM.green, accent: FILM.orange },
  { name: "White / Lavender", field: FILM.white, end: FILM.lavender, accent: ACCENT.blue },
  { name: "Black", field: FILM.black, end: FILM.lime, accent: FILM.orange },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.field, l.end, l.accent], values: { field: l.field, end: l.end, accent: l.accent } }));

export default defineMotion<IntegrationProps>({
  slug: "integration",
  name: "Integration",
  description: "Two app icons slide together and connect, a booking flies across the line and lands as a message in the partner app, then a title card.",
  category: "templates",
  tags: ["integration", "partnership", "announcement", "launch", "saas"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: Integration,
  defaultProps: {
    ...palettes[0].values,
    brand: SAMPLE.brand,
    partner: SAMPLE.partner,
    logo: SAMPLE.logo,
    partnerLogo: SAMPLE.partnerIcon,
    event1: "Design review · 3:00 PM",
    event2: "Maya booked Design review for 3:00 PM",
    headline: "Lumen now works with Relay",
    cta: "lumen.app/integrations",
    iconTile: false,
  } as IntegrationProps,
  palettes,
  controls: [
    { type: "text", key: "headline", label: "Headline", maxLength: 40 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "text", key: "partner", label: "Partner name", maxLength: 16 },
    { type: "image", key: "logo", label: "Your app icon", hint: "Square app icon or logo, PNG or SVG" },
    { type: "image", key: "partnerLogo", label: "Partner app icon", hint: "Square app icon, PNG or SVG" },
    { type: "toggle", key: "iconTile", label: "White tile behind icons" },
    { type: "text", key: "event1", label: "Event card", maxLength: 32 },
    { type: "text", key: "event2", label: "Partner message", maxLength: 60 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 32 },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "end", label: "Title card" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const G = geometry(W, H, 1, tall);
    const L = G.L;
    const end = c.seconds * c.fps;
    const ink = textOn(p.field);
    const endI = endInk(p.end);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const px = (q: { x: number; y: number }) => `(${Math.round(q.x)}, ${Math.round(q.y)})`;
    const t = fitRows(p.headline, L.titleMaxW, L.title, L.maxLines);
    const rowsText = t.rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const icon = p.iconTile
      ? "a white tile behind the image, the image drawn at 100% of the tile with object-fit contain, a 1px rgba(0,0,0,0.06) inset hairline, clipped to the radius"
      : "the image itself is the icon (no tile behind it), drawn at 100% with object-fit contain and clipped to the radius";
    const shadow = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";

    const layout = tall
      ? `The two icons stack vertically, centred horizontally: the user's at ${px(G.A)}, the partner's at ${px(G.B)} (centres), ${L.gap}px apart edge to edge. The user's slides down from above the frame, the partner's up from below.`
      : `The two icons sit side by side, centres at ${px(G.A)} and ${px(G.B)}, ${L.gap}px apart edge to edge. The user's slides in from off the left edge, the partner's from off the right edge.`;
    const connector = tall
      ? `a vertical quadratic curve from ${px(G.a)} (${L.port}px below the top icon) to ${px(G.b)} (${L.pad}px above the bottom icon), control point ${px(G.c)}, bowing ${L.arc}px to the right`
      : `a quadratic curve from ${px(G.a)} to ${px(G.b)} (${L.pad}px off each icon), control point ${px(G.c)}, arching ${L.arc}px upward`;
    const cam = tall
      ? `scale 1→${CAMERA.scale} while gliding the icon column from x ${Math.round(G.P.x)} to x ${Math.round(G.Q.x)} (world point ${px(G.P)} lands on screen ${px(G.Q)}), leaving room for the cards on its right; icons and cards then span 81–999px, 85% of the width`
      : `scale 1→${CAMERA.scale} while the icon row rises ${-CAMERA.wideDy}px (world point ${px(G.P)} lands on screen ${px(G.Q)}); icons and cards then span ${Math.round(W / 2 - 720)}–${Math.round(W / 2 + 720)}px, 75% of the width`;
    const cards = tall
      ? `Card 1 settles beside the user's icon and card 2 beside the partner's: each card's left edge at screen x ${CARD_TALL.x}, vertically centred on its icon (screen positions after the camera lands; peel points at ${Math.round(G.peel[0] * 100)}% and ${Math.round(G.peel[1] * 100)}% along the curve).`
      : `Card 1 settles above the user's icon, its bottom-centre at screen (${Math.round(W / 2 + CARD_WIDE[0].dx)}, ${Math.round(G.Q.y + CARD_WIDE[0].dy)}); card 2 below the partner's icon and its caption, top-centre at (${Math.round(W / 2 + CARD_WIDE[1].dx)}, ${Math.round(G.Q.y + CARD_WIDE[1].dy)}) (screen positions after the camera lands; peel points at ${Math.round(G.peel[0] * 100)}% and ${Math.round(G.peel[1] * 100)}% along the curve).`;
    const sizes = `All card sizes below are as seen on screen after the pull-back; draw them at size ÷ ${CAMERA.scale} (×${K.toFixed(3)}) inside the camera.`;

    return [
      targetLine(c.target, `a three-shot integration announcement film: "${p.brand}" connects to "${p.partner}", real UI cards travel across the connection, then a title card`, c.width, c.height, c.seconds),
      `Shots start at frames ${SHOTS.join(", ")}. Shots 1–2 are one continuous ${p.field} field and camera; frame ${SHOTS[2]} is a hard cut. Flat colour fields only: no gradients, glows or text shadows. Inter only (Geist Mono for tiny labels), sentence case. Sizes are px at 1080 on the short side. One accent, ${p.accent}, for the data pulses, the event bar, the badge and the CTA dot.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): two ${L.tile}px app icon tiles, radius ${RADIUS.hero}, ${icon}, shadow ${shadow}. Left/top: the user's logo file; right/bottom: the partner's icon file. ${layout} Each slides on ${spring}: frames ${T.tileA[0]}–${T.tileA[1]} and ${T.tileB[0]}–${T.tileB[1]}.`,
      `Captions ${L.captionGap}px under each icon, centred: "${p.brand.toUpperCase()}" and "${p.partner.toUpperCase()}" in Geist Mono ${L.caption}px, tracking 0.1em, ${ink} at 55%, fading in and rising 12px over frames ${T.captions[0]}–${T.captions[1]} on ${enter}. Corner marks at a ${MARGIN}px margin in Geist Mono ${MARK}px, ${ink} at 50%: top-left "${`${p.brand} × ${p.partner}`.toUpperCase()}", top-right a running timecode (00:00:SS:FF); they fade in over frames ${T.marks[0]}–${T.marks[1]}.`,
      `Connector: ${connector}, ${STROKE.hair}px stroke in ${ink} at 28%, round caps, drawn on with stroke-dashoffset over frames ${T.draw[0]}–${T.draw[1]} on ${enter}; a 5px port dot (${ink} at 35%) at each end. At the curve's midpoint a ${CHIP}px white circle chip with a hairline and the same soft shadow holds a 22px "+" drawn as two ${STROKE.ring}px ink lines; it pops (scale 0.85→1 plus fade) over frames ${T.chip[0]}–${T.chip[1]} on ${spring}.`,
      `Data pulses from frame ${T.pulseStart}: ${T.pulses} dots of radius ${PULSE_R}px in ${p.accent}, drawn in the connector's SVG, travel from the user's icon to the partner's on linear timing, ${T.pulsePeriod} frames per crossing, ${T.pulseGap} frames apart, looping; each fades with sin(π·t) along the way. They keep running through shot 2.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): the camera pulls back over frames ${f(1, T.camera[0])}–${f(1, T.camera[1])} on ${travel}: ${cam}. Icons, connector, chip, pulses and cards all live in this camera; the corner marks stay fixed.`,
      `${sizes} Card 1 (event), ${L.cardW}px wide: white, radius ${RADIUS.card}, 1px rgba(0,0,0,0.08) hairline, the same soft shadow, ${CARD.pad}px padding. Header: the user's logo as a ${CARD.icon}px icon (radius ${RADIUS.chip}), "${p.brand}" Inter 500 ${CARD.name}px, and "now" in Geist Mono ${CARD.meta}px ${CANVAS.paper.ink3} on the right. Body ${CARD.gap}px below: a ${STROKE.bar}px pill bar in ${p.accent}, then "New booking" Inter 600 ${CARD.title}px ${CANVAS.paper.ink} tracking -0.025em over "${p.event1}" Inter 400 ${CARD.body}px ${CANVAS.paper.ink2}, line height 1.3 (wraps if long), and on the right a ${CARD.avatar}px ${CANVAS.paper.fill} circle avatar with the initial "${(p.event2.trim().charAt(0) || "M").toUpperCase()}" in Inter 500 ${CARD.initial}px.`,
      `Card 2 (message in ${p.partner}), ${L.cardW}px wide, same card style: a ${CARD.partnerIcon}px partner icon and "${p.partner.toUpperCase()}" in Geist Mono ${CARD.meta}px; a 1.5px ${CANVAS.paper.line} divider; then the user's logo as a ${CARD.avatar}px avatar (radius ${RADIUS.button}) beside "${p.brand}" Inter 600 ${CARD.body}px, an "APP" tag (Geist Mono ${CARD.tag}px on ${CANVAS.paper.fill}, radius ${RADIUS.chip}), "${MESSAGE_TIME}" in Geist Mono ${CARD.meta}px ${CANVAS.paper.ink3}, and the message "${p.event2}" in Inter 400 ${CARD.body}px ${CANVAS.paper.ink}, line height 1.35.`,
      `Card flights on ${spring}: card 1 over frames ${f(1, T.card1[0])}–${f(1, T.card1[1])}, card 2 over ${f(1, T.card2[0])}–${f(1, T.card2[1])}. Each leaves the connector's start at scale ${FLY_FROM} (fading in over the first third), runs along the curve to its peel point during the first 60% of the move, and lifts off to its resting place from 30% on (${enter}). ${cards} When card 2 lands, a ${BADGE}px ${p.accent} badge with a white "1" (Inter 500 28px, a 3px ring in the field colour) pops onto the partner icon's top corner over frames ${f(1, T.badge[0])}–${f(1, T.badge[1])} on ${spring}.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): flat ${p.end}. ${rowsText} in ${endI}, Inter 600 ${Math.round(t.size)}px, tracking ${TRACK}em, line height ${LINE_H}, top-left at a ${MARGIN}px margin${tall ? ", wrapping within the width" : ""}. Word rise: each row sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${f(2, T.wordStart)}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Bottom row at a ${MARGIN}px margin: left, the two icons as ${L.endIcon}px tiles (radius ${RADIUS.button}, same hairline and shadow) with an 18px "×" drawn in ${STROKE.ring}px lines (${endI} at 55%) between them, 20px gaps, each fading in and rising 16px over 18 frames from frame ${f(2, T.icons[0])}, ${STAGGER} frames apart, on ${enter}; right, a 10px ${p.accent} dot and "${p.cta}" in Geist Mono ${L.cta}px ${endI}, rising the same way from frame ${f(2, T.cta[0])}. A ${STROKE.hair}px hairline (${endI} at 22%) spans the margins 40px above the row, drawing left to right over frames ${f(2, T.rule[0])}–${f(2, T.rule[1])} on ${travel}.`,
      `Hold the title card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
