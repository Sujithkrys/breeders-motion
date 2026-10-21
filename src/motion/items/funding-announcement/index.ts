import { FILM, SAMPLE, customerLogo } from "../../film";
import { ACCENT, CANVAS, FINAL_HOLD, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  BASELINE,
  FIELDS,
  FundingAnnouncement,
  GLIDE,
  INK,
  MARKER,
  MASK,
  PEOPLE,
  PIXEL,
  PUSH,
  SHOTS,
  T,
  TILE,
  TYPE,
  amountEm,
  blockRect,
  counterText,
  fitRows,
  grid,
  inkOn,
  lockupEnd,
  lockupOpen,
  missionLayout,
  riseEnd,
  rowsText,
  sizesFor,
  team,
  toWords,
  type FundingAnnouncementProps,
} from "./FundingAnnouncement";

// Each colourway sets the one accent: the pixel, the amount block, the mission marker and the end tile. The six
// fields (black, black, cream, white, canvas, black) stay; type on the accent flips between white and near-black.
const looks: { name: string; accent: string }[] = [
  { name: "Orange", accent: FILM.orange },
  { name: "Blue", accent: ACCENT.blue },
  { name: "Lime", accent: FILM.lime },
  { name: "Lavender", accent: FILM.lavender },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [FILM.black, l.accent, FILM.cream], values: { accent: l.accent } }));

export default defineMotion<FundingAnnouncementProps>({
  slug: "funding-announcement",
  name: "Funding Announcement",
  description: "A calm, editorial “we raised” film: one accent square grows from beside your logo into the amount, then your mission, investors, team and a thank-you.",
  category: "templates",
  tags: ["funding", "announcement", "company news", "investors", "editorial"],
  addedAt: "2026-10-21",
  durationInFrames: 570,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: FundingAnnouncement,
  defaultProps: {
    ...palettes[0].values,
    kicker: "Company news · Oct 2026",
    amount: "$24M",
    round: "Series A",
    lead: "led by Northwind Capital",
    mission: "We're building the calendar that gives every team its time back.",
    highlight: "its time back",
    investor1: customerLogo("halcyon"),
    investor2: customerLogo("quanta"),
    investor3: customerLogo("fieldwork"),
    investor4: customerLogo("orbital"),
    investor5: customerLogo("parallel"),
    investor6: customerLogo("monolith"),
    hiring: "We're hiring across design and engineering",
    url: "lumen.so/careers",
    thanks: "Thank you to our customers.",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
  } as FundingAnnouncementProps,
  palettes,
  controls: [
    { type: "text", key: "kicker", label: "Kicker", maxLength: 32 },
    { type: "text", key: "amount", label: "Amount", maxLength: 8 },
    { type: "text", key: "round", label: "Round", maxLength: 20 },
    { type: "text", key: "lead", label: "Lead investor line", maxLength: 40 },
    { type: "text", key: "mission", label: "Mission", maxLength: 90 },
    { type: "text", key: "highlight", label: "Highlighted phrase", maxLength: 40 },
    { type: "image", key: "investor1", label: "Investor 1", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "image", key: "investor2", label: "Investor 2", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "image", key: "investor3", label: "Investor 3", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "image", key: "investor4", label: "Investor 4", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "image", key: "investor5", label: "Investor 5", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "image", key: "investor6", label: "Investor 6", hint: "Logo, PNG or SVG, transparent, dark ink" },
    { type: "text", key: "hiring", label: "Hiring line", maxLength: 56 },
    { type: "text", key: "url", label: "Link", maxLength: 32 },
    { type: "text", key: "thanks", label: "Thank-you line", maxLength: 40 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "Square mark, PNG or SVG, transparent" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = sizesFor(tall);
    const k = Math.min(c.width, c.height) / 1080;
    const W = c.width / k;
    const H = c.height / k;
    const end = Math.round(c.seconds * c.fps);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const onAccent = inkOn(p.accent);
    const ink = CANVAS.paper.ink;
    const rect = (q: { x: number; y: number; w: number; h: number }) => `${r(q.w)}×${r(q.h)}px at (${r(q.x)}, ${r(q.y)})`;

    const o = lockupOpen(p.brand, tall, W, H);
    const block = blockRect(tall, W, H);
    const aSize = Math.min(L.amount, (block.w - 2 * L.amountPad) / amountEm(p.amount));
    const info = tall ? `the bottom half, inset ${L.infoPad}px, vertically centred` : `the right half, inset ${L.infoPad}px, vertically centred`;
    const infoW = tall ? W - 2 * L.infoPad : W / 2 - 2 * L.infoPad;
    const round = fitRows(toWords(p.round), infoW, L.round, L.round * 0.7, 2);
    const lead = fitRows(toWords(p.lead), infoW, L.lead, L.lead * 0.8, 2);
    const m = missionLayout(p, tall, W, H);
    const g = grid(tall, W, H);
    const tm = team(p.hiring, tall, W, H);
    const e = lockupEnd(p.brand, tall, W, H);
    const th = fitRows(toWords(p.thanks), L.thanksW, L.thanks, L.thanks * 0.75, L.thanksLines);
    const hl = m.range ? `"${p.mission.slice(m.range[0], m.range[1])}"` : "";

    return [
      targetLine(c.target, "a six-shot funding announcement film, calm and editorial: one accent square (a \"pixel\") grows from beside the logo into the amount, then the mission, investors, team and a thank-you, and shrinks back into the logo tile", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")}. Each shot is one flat field: ${FIELDS.join(", ")}. One accent, ${p.accent}, for the pixel, the amount block, the marker and the end tile; type on it is ${onAccent}. Type is white on black and ${ink} on light fields. Inter only (Geist Mono for tiny capitals labels at +0.1em tracking), sentence case, no gradients, glows or text shadows. Sizes are px at 1080 on the short side.`,
      `Word rise: each row of type is its own overflow-hidden mask (padded ${MASK.y}em/${MASK.x}em, given back with a negative margin); every word is its own span rising from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps), rows ${T.lineGap} frames apart.`,
      `Running head (shots 2–5): "${p.kicker.toUpperCase()}" top-left and a shot counter ("${counterText(1)}" etc.) top-right, Geist Mono ${L.head}px, ${L.headTop}px from the top and ${L.margin}px from the sides, the field's ink at ${Math.round(INK.head * 100)}%, fading in over 12 frames.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): black. The user's logo file in white (${L.logo}px tall) and "${p.brand}" in Inter 500 ${r(o.fs)}px, -0.02em, white, gap ${r(L.logo * 0.32)}px, centred on y ${r(o.cy)}px; it fades in and rises ${T.lockupRise}px, frames ${f(0, T.lockup[0])}–${f(0, T.lockup[1])} on ${enter}. A ${r(o.pixel.w)}px square in ${p.accent} sits on the name's baseline (${BASELINE}em below the line's centre), ${r(PIXEL.gap * o.fs)}px after the last letter like a full stop (${rect(o.pixel)}); it scales 0→1 on ${spring} from frame ${f(0, T.pixel)}. The lockup is right-anchored to the pixel so that gap stays exact. "${p.kicker.toUpperCase()}" in Geist Mono ${L.kicker}px, +0.12em, white at ${Math.round(INK.caption * 100)}%, centred ${L.kickerGap}px below the mark, rises from its mask, frames ${f(0, T.kicker[0])}–${f(0, T.kicker[1])}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): black; match cut, the pixel stays exactly where it was. Frames ${f(1, T.grow[0])}–${f(1, T.grow[1])} on ${travel}: its rect grows to a flat full-bleed block, ${rect(block)} (${tall ? "the top half" : "the left half"}), square corners. On it, ${L.amountPad}px from its left edge and vertically centred: "${p.amount}" in Inter 600 ${r(aSize)}px, tracking ${TYPE.amountTrack}em, line height 1, ${onAccent}, one text node. It rises from its mask over frames ${f(1, T.amount[0])}–${f(1, T.amount[1])} on enter while the number counts up from 0 (same prefix, suffix and decimals) over frames ${f(1, T.count[0])}–${f(1, T.count[1])} on ${enter}.`,
      `In ${info}: a ${L.ruleW}px white hairline (${STROKE.hair}px, ${Math.round(INK.rule * 100)}%) draws on left to right, frames ${f(1, T.rule[0])}–${f(1, T.rule[1])} on travel; 40px below, ${rowsText(round.rows)} in Inter 500 ${r(round.size)}px, ${TYPE.displayTrack}em, white, word rise from frame ${f(1, T.round)}; 24px below, ${rowsText(lead.rows)} in Inter 400 ${r(lead.size)}px, -0.015em, white at ${Math.round(INK.lead * 100)}%, word rise from frame ${f(1, T.lead)}. Camera: the whole shot (not the running head) pushes in 1→${PUSH} around the centre, frames ${f(1, T.push2[0])}–${f(1, T.push2[1])} on travel.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): cream ${FIELDS[2]}. ${rowsText(m.rows)} in Inter 500 ${r(m.size)}px, tracking ${TYPE.track}em, line height ${TYPE.lineH}, ${ink}, left-aligned at x ${r(m.x)}px, vertically centred, word rise from frame ${f(2, T.mission)}. The block glides up ${GLIDE}px across the shot, linear.${hl ? ` Then a flat ${p.accent} marker sweeps behind ${hl}, frames ${f(2, m.marker[0])}–${f(2, m.marker[1])} on ${travel}: every word is its own span, and each highlighted word span (trailing punctuation included) holds an absolutely positioned rect sized from that span itself (left 0 / right 0 of the rendered word, from ${MARKER.top}em to ${MARKER.bottom}em of the line box, in px), overshooting the phrase evenly by ${MARKER.pad}em at each end and bridging the word gaps between highlighted words, scaling 0→1 in x from the left as the sweep reaches it; the type on it turns ${onAccent}.` : " No highlight phrase is found, so no marker is drawn."}`,
      `Shot 4 (frames ${SHOTS[3]}–${SHOTS[4]}): white. A ${g.cols} × ${g.rows} grid of investor cells, ${r(g.w)}×${r(g.h)}px centred (${r(g.cellW)}×${r(g.cellH)}px cells, top at y ${r(g.y)}px): ${STROKE.hair}px hairlines in ${ink} at ${Math.round(INK.line * 100)}%, every row line full width and the inner column lines only, all drawn as one SVG that grows on frames ${f(3, T.lines[0])}–${f(3, T.lines[1])} on travel. Each cell: a Geist Mono ${L.index}px index ("01"–"06") 20px in from its top-left at ${Math.round(INK.index * 100)}%, and the user's investor logo file centred, ${L.investorH}px tall, width auto (max 66% of the cell, object-fit contain). Cells assemble on a diagonal: cell (row, col) starts at frame ${f(3, T.logos)} + (row + col) × ${STAGGER}, on ${spring}: fade in, rise 24px, scale 0.96→1. ${L.captionGap}px above the grid's left edge: a 10px ${p.accent} square and "WITH PARTICIPATION FROM" in Geist Mono ${L.caption}px at ${Math.round(INK.caption * 100)}%, rising in frames ${f(3, T.caption[0])}–${f(3, T.caption[1])}. Camera pushes in 1→${PUSH} across the shot on travel.`,
      `Shot 5 (frames ${SHOTS[4]}–${SHOTS[5]}): canvas ${FIELDS[4]}. A row of ${PEOPLE.length} round ${L.avatar}px avatars ${-L.overlap}px apart (no overlap, so the monogram initials never touch), each with a ${L.ring}px ring in the field colour, then ${L.seatGap}px further an open seat: a dashed ${STROKE.ring}px ring at 30% ink with a plus sign; row centred, top at y ${r(tm.top)}px. Each springs in (${spring}) rising 32px with a fade, ${STAGGER} frames apart from frame ${f(4, T.avatars)}. ${L.gapAvatars}px below: ${rowsText(tm.rows)} in Inter 500 ${r(tm.size)}px, ${TYPE.track}em, ${ink}, centred, word rise from frame ${f(4, T.hiring)}. ${L.gapPill}px below: a white ${L.pillH}px pill (full radius, 1px hairline at 10%, soft shadow) holding a ${r(L.pillText * 0.42)}px ${p.accent} square, "${p.url}" in Inter 500 ${L.pillText}px and a small arrow, springing in from frame ${f(4, T.pill)}.`,
      `Shot 6 (frames ${SHOTS[5]}–${end}): black. It opens on the same ${p.accent} block as shot 2 (${rect(block)}), which shrinks on ${travel}, frames ${f(5, T.shrink[0])}–${f(5, T.shrink[1])}, into a ${r(e.tile.w)}px square tile at (${r(e.tile.x)}, ${r(e.tile.y)}), on the same centre line as shot 1's logo. The user's logo file (${L.logo}px tall, in its ${onAccent === FILM.white ? "light" : "dark"} version) sits centred on the tile (padding ${TILE.pad}× its height), fading in with scale 0.96→1, frames ${f(5, T.mark[0])}–${f(5, T.mark[1])}; "${p.brand}" in Inter 500 ${r(e.fs)}px, white, ${r(TILE.gap * L.logo)}px right of the tile, fades in and rises 12px, frames ${f(5, T.name[0])}–${f(5, T.name[1])}. ${L.thanksGap}px below the tile: ${rowsText(th.rows)} in Inter 500 ${r(th.size)}px, ${TYPE.displayTrack}em, white, centred, word rise from frame ${f(5, T.thanks)}, landing by frame ${f(5, riseEnd(th.rows, T.thanks, T.thanksCap))}.`,
      `Hold the end card perfectly still from frame ${f(5, Math.max(T.name[1], riseEnd(th.rows, T.thanks, T.thanksCap)))} to ${end} (at least the last ${Math.max(FINAL_HOLD, 15)} frames).`,
    ].join("\n");
  },
});
