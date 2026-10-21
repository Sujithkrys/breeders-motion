import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, SPRING_CONFIG, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  INK,
  SHOTS,
  T,
  TILE,
  TRACK,
  WebinarPromo,
  agendaField,
  agendaOf,
  cardSlots,
  fitRows,
  inkOn,
  onAccent,
  places,
  rowsText,
  speakersOf,
  type WebinarPromoProps,
} from "./WebinarPromo";

// Each colourway sets the opening field (also the URL pill) and the accent (the tile's month strip and the live dot).
const looks: { name: string; field: string; accent: string }[] = [
  { name: "Plum", field: FILM.plum, accent: FILM.orange },
  { name: "Black", field: FILM.black, accent: FILM.lime },
  { name: "Green", field: FILM.green, accent: FILM.greenInk },
  { name: "Lavender", field: FILM.lavender, accent: ACCENT.blue },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.field, l.accent], values: { field: l.field, accent: l.accent } }));

export default defineMotion<WebinarPromoProps>({
  slug: "webinar-promo",
  name: "Webinar Promo",
  description: "A promo for a live session: a calendar date tile drops in, the title rises, the speakers and agenda play, and the tile returns with your call to save a seat.",
  category: "templates",
  tags: ["webinar", "event", "speakers", "agenda", "live"],
  addedAt: "2026-10-21",
  durationInFrames: 450,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: WebinarPromo,
  defaultProps: {
    ...palettes[0].values,
    month: "NOV",
    day: "14",
    kind: "Live session",
    time: "5 PM CET · 45 min",
    title: "How the best teams plan their week",
    speakersLabel: "Speakers",
    speaker1Photo: SAMPLE.avatar,
    speaker1Name: "Maya Jensen",
    speaker1Role: "Head of Ops, Northwind",
    speaker2Photo: SAMPLE.people[0].photo,
    speaker2Name: SAMPLE.people[0].name,
    speaker2Role: "Design Lead, Halcyon",
    speaker3Photo: SAMPLE.people[1].photo,
    speaker3Name: SAMPLE.people[1].name,
    speaker3Role: "Founder, Quanta",
    agendaLabel: "Agenda",
    at1: "00:00",
    topic1: "Why weekly plans fall apart",
    at2: "15:00",
    topic2: "The Monday ritual, step by step",
    at3: "30:00",
    topic3: "Live Q&A",
    cta: "Save your seat",
    url: "lumen.app/live",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
  } as WebinarPromoProps,
  palettes,
  controls: [
    { type: "text", key: "month", label: "Month", maxLength: 4 },
    { type: "text", key: "day", label: "Day", maxLength: 2 },
    { type: "text", key: "kind", label: "Event type", maxLength: 24 },
    { type: "text", key: "time", label: "Time and length", maxLength: 24 },
    { type: "text", key: "title", label: "Title", maxLength: 56 },
    { type: "text", key: "speakersLabel", label: "Speakers caption", maxLength: 16 },
    { type: "image", key: "speaker1Photo", label: "Speaker 1 photo", hint: "Square headshot, at least 400 × 400" },
    { type: "text", key: "speaker1Name", label: "Speaker 1 name", maxLength: 22 },
    { type: "text", key: "speaker1Role", label: "Speaker 1 role", maxLength: 36 },
    { type: "image", key: "speaker2Photo", label: "Speaker 2 photo", hint: "Square headshot, at least 400 × 400" },
    { type: "text", key: "speaker2Name", label: "Speaker 2 name", maxLength: 22 },
    { type: "text", key: "speaker2Role", label: "Speaker 2 role", maxLength: 36 },
    { type: "image", key: "speaker3Photo", label: "Speaker 3 photo", hint: "Square headshot, at least 400 × 400" },
    { type: "text", key: "speaker3Name", label: "Speaker 3 name", maxLength: 22 },
    { type: "text", key: "speaker3Role", label: "Speaker 3 role", maxLength: 36 },
    { type: "text", key: "agendaLabel", label: "Agenda caption", maxLength: 16 },
    { type: "text", key: "at1", label: "Topic 1 time", maxLength: 8 },
    { type: "text", key: "topic1", label: "Topic 1", maxLength: 40 },
    { type: "text", key: "at2", label: "Topic 2 time", maxLength: 8 },
    { type: "text", key: "topic2", label: "Topic 2", maxLength: 40 },
    { type: "text", key: "at3", label: "Topic 3 time", maxLength: 8 },
    { type: "text", key: "topic3", label: "Topic 3", maxLength: 40 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 28 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const G = places(tall, W, H);
    const L = G.L;
    const end = Math.round(c.seconds * c.fps);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const springText = (frames: number) => `a spring (damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness}) stretched to ${frames} frames`;
    const ink = inkOn(p.field);
    const agenda = agendaField(p.field);
    const k = L.tileK;
    const tw = r(G.tw);
    const th = r(G.th);
    const at = (pl: { x: number; y: number; s: number }) => `top-left (${r(pl.x)}, ${r(pl.y)})px at scale ${pl.s}`;
    const time = fitRows(p.time, L.timeMaxW, L.time, 2);
    const title = fitRows(p.title, L.titleMaxW, L.title, L.titleLines);
    const cta = fitRows(p.cta, L.ctaMaxW, L.cta, L.ctaLines);
    const slots = cardSlots(tall, W, H);
    const c3 = L.card;
    const people = speakersOf(p)
      .map((s, i) => `${i + 1}) the user's speaker ${i + 1} photo, "${s.name}", "${s.role}"`)
      .join("; ");
    const rows = agendaOf(p)
      .map((x) => `"${x.at}" — "${x.topic}"`)
      .join("; ");
    const caption = (size: number) => `Geist Mono 500 ${size}px capitals, tracking 0.12em`;
    const header = (label: string, fieldInk: string) =>
      `A header on the badge's centre line: "${label.toUpperCase()}" in ${caption(L.caption)}, ${fieldInk} at ${INK.caption * 100}%, followed (gap 28px) by a ${STROKE.hair}px hairline in ${fieldInk} at ${INK.rule * 100}% running to 40px left of the badge; the caption rises out of a mask over frames ${T.header[0]}–${T.header[1]} of the shot on ${enter}, and the hairline draws from the left over ${T.header[0] + 4}–${T.header[1] + 8} on ${travel}.`;
    const badgeLine = `The date tile sits as a badge in the top-right corner, ${L.edge}px in from the top and right (${r(G.badgeW)}×${r(G.badgeH)}px, corner radius ${RADIUS.button}).`;
    const counter = `Bottom-left at ${L.edge}px: a frame counter "0n / 05" in Geist Mono ${L.counter}px, tracking 0.08em, at ${INK.counter * 100}% of the type colour.`;

    return [
      targetLine(c.target, "a five-shot promo film for a live session: a calendar date tile drops in, the title rises, speaker cards glide past, the agenda draws in, then the tile returns with a call to save a seat", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")}; the date tile is the motif and carries across two cuts as a match move (1→2 into the corner badge, 4→5 back out). Flat colour fields only: no gradients, glows or text shadows. Inter only, Geist Mono for tiny labels, sentence case. Sizes are px at 1080 on the short side. Fields: ${p.field}, ${p.field}, ${FILM.cream}, ${agenda}, ${FILM.white}.`,
      `The date tile (${tw}×${th}px at full size): a white card, radius ${RADIUS.card}, a 1px rgba(0,0,0,0.06) ring and shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06). Its top ${r(TILE.strip * k)}px is a strip in ${p.accent} holding "${p.month.toUpperCase()}" in Geist Mono 500 ${r(TILE.month * k)}px, tracking 0.14em, ${onAccent(p.accent, p.field)}, centred. Below, "${p.day}" in Inter 600 ${r(TILE.day * k)}px, tracking ${TRACK.day}em, #111111, centred. To shrink it, scale the whole card from its top-left corner (the corner radius eases ${RADIUS.card}→${RADIUS.button} on screen).`,
      `Word rise: each row of type sits in its own overflow-hidden mask; a word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.field}. The tile rests ${at(G.open)}; it drops in from ${T.dropFrom}px above on ${springText(T.dropDur)} from frame ${T.drop}, fading in over ${T.dropFade} frames. ${tall ? `Below it (gap ${L.gap}px), left-aligned at x ${L.margin}` : `To its right (gap ${L.gap}px), a left-aligned block centred on the tile's height`}: a ${r(L.caption * 0.55)}px ${p.accent} dot then "${p.kind.toUpperCase()}" in ${caption(L.caption)}, ${ink} at ${INK.caption * 100}% (dot scales 0.6→1, caption rises out of its mask, frames ${T.kind[0]}–${T.kind[1]} on enter); 30px below, ${rowsText(time.rows)} in Inter 500 ${r(time.size)}px, tracking ${TRACK.display}em, ${ink}, rising row by row from frame ${T.timeStart}; 40px below that a ${L.ruleW}px hairline (${ink} at ${INK.rule * 100}%) draws from the left, frames ${T.rule[0]}–${T.rule[1]} on travel. Top-left at ${L.edge}px: the user's logo file at ${r(L.logo * 0.8)}px tall with "${p.brand}" (Inter 500, ${ink}), fading in over frames ${T.logoIn[0]}–${T.logoIn[1]}. ${counter}`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): the same field; the tile starts exactly where shot 1 left it and travels to the badge, ${at(G.badge)}, over frames ${f(1, T.toBadge[0])}–${f(1, T.toBadge[1])} on ${travel}. The title ${rowsText(title.rows)} in Inter 600 ${r(title.size)}px, tracking ${TRACK.title}em, line height 1.0, ${ink}, left-aligned at x ${L.margin}, vertically centred (${tall ? 80 : 40}px low), with the dot + "${p.kind.toUpperCase()}" caption 40px above it. The caption rises from frame ${f(1, T.titleStart - 6)}; the words rise from frame ${f(1, T.titleStart)}. The title block pushes in from scale 1 to ${1 + T.push} over the whole shot, linear, from its left edge.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): flat ${FILM.cream}, type #111111. ${badgeLine} ${header(p.speakersLabel, "#111111")}`,
      `Three speaker cards: ${people}. Each card is white, ${c3.w}×${c3.h}px, radius ${RADIUS.card}, ${c3.pad}px padding, a 1px rgba(0,0,0,0.05) ring and the soft shadow. ${tall ? `Stacked in a column centred at x ${r(slots[0].x)}–${r(slots[0].x + c3.w)}, tops at y ${slots.map((s) => r(s.y)).join(", ")}; inside, the ${L.photo}px round photo on the left and, 48px to its right, the name and role` : `In a row at y ${r(slots[0].y)}, lefts at x ${slots.map((s) => r(s.x)).join(", ")}; inside, the ${L.photo}px round photo top-left and the name and role at the bottom`}: name in Inter 600 ${L.name}px, tracking ${TRACK.name}em, #111111; role 12px below in Inter 400 ${L.role}px, line height 1.35, #111111 at ${INK.role * 100}%; "01"/"02"/"03" in Geist Mono 20px at ${INK.counter * 100}% in the top-right corner.`,
      `The cards slide in from ${T.slide}px to the right on ${springText(T.cardDur)}, from frame ${f(2, T.cardStart)}, ${T.cardStagger} frames apart, each fading in over ${T.cardFade} frames. Over the whole shot the camera glides linearly: the ${tall ? "stack moves up" : "row moves left"} from +${L.glide / 2}px to −${L.glide / 2}px. ${counter}`,
      `Shot 4 (frames ${SHOTS[3]}–${SHOTS[4]}): flat ${agenda}, type ${inkOn(agenda)}. ${badgeLine} ${header(p.agendaLabel, inkOn(agenda))} Three agenda rows: ${rows}. Rows are ${L.rowH}px tall from y ${L.rowsTop}, spanning x ${L.margin}–${r(W - L.margin)}; ${tall ? `in each, the time in Geist Mono ${L.at}px (${INK.caption * 100}%) sits 22px above the topic, both bottom-aligned 44px above the row's base` : `in each, the time in Geist Mono ${L.at}px (${INK.caption * 100}%) in a ${L.atW}px column, then the topic, vertically centred`}; topics in Inter 500 ${L.topic}px (shrunk to fit ${L.topicLines === 1 ? "one line" : "two lines"}), tracking ${TRACK.topic}em. Row n starts at frame ${f(3, T.rowStart)} + ${T.rowStagger}n: time and topic rise out of their masks over ${T.rowDur} frames on enter, and a ${STROKE.hair}px hairline (${INK.rule * 100}%) along the row's base draws from the left over frames +${T.rowRule[0]}–+${T.rowRule[1]} on travel. ${counter}`,
      `Shot 5 (frames ${SHOTS[4]}–${end}): flat ${FILM.white}, type #000000. The tile starts at the badge and travels back to ${at(G.end)} over frames ${f(4, T.toEnd[0])}–${f(4, T.toEnd[1])} on ${travel}. ${tall ? `Below it (gap ${L.gap}px), left-aligned at x ${L.margin}` : `To its right (gap ${L.gap}px), centred on the tile's height`}: ${rowsText(cta.rows)} in Inter 600 ${r(cta.size)}px, tracking ${TRACK.title}em, rising word by word from frame ${f(4, T.ctaStart)} over ${T.rowDur} frames; 44px below, a ${L.pillH}px full pill in ${p.field} with ${r(L.pillH * 0.42)}px side padding: a 14px ${p.accent} dot, then "${p.url}" in Inter 500 ${L.url}px, ${inkOn(p.field)}; it fades in and rises ${T.pillRise}px over frames ${f(4, T.pill[0])}–${f(4, T.pill[1])} on enter.`,
      `Along the bottom at ${L.edge}px from the edges: the user's logo file at ${L.logo}px tall with "${p.brand}" (Inter 500 ${r(L.logo * 0.82)}px, tracking -0.02em) bottom-left, and "${`${p.month} ${p.day} · ${p.time}`.toUpperCase()}" in Geist Mono ${L.counter}px, tracking 0.08em, ${INK.caption * 100}% black, bottom-right; both fade in and rise 16px over frames ${f(4, T.endLogo[0])}–${f(4, T.endLogo[1])} on enter.`,
      `Everything is settled by frame ${f(4, T.endLogo[1])}; hold the end card perfectly still to frame ${end} (the last ${FINAL_HOLD}+ frames are still).`,
    ].join("\n");
  },
});
