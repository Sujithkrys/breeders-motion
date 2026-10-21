import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  BARS,
  CARD,
  CHART,
  CHART_TOTAL,
  ChangelogRoundup,
  COUNT,
  KEY_BAR,
  NUMBER_INK,
  QUERY,
  SHADOW,
  SHOTS,
  T,
  TRACK,
  VIS_BOX,
  VIS_FILL,
  VIS_MIN_TEXT,
  VISUAL_OPTIONS,
  cardStart,
  enterAt,
  exitAt,
  fitSize,
  geometry,
  textOn,
  updatesOf,
  visScale,
  type ChangelogRoundupProps,
  type Visual,
} from "./ChangelogRoundup";

// Each colourway sets the card field and the accent together; the opener always stays black.
const looks: { name: string; field: string; accent: string }[] = [
  { name: "Cream", field: FILM.cream, accent: FILM.orange },
  { name: "White", field: FILM.white, accent: ACCENT.blue },
  { name: "Lavender", field: FILM.lavender, accent: FILM.orange },
  { name: "Grey", field: FILM.canvas, accent: FILM.select },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [FILM.black, l.field, l.accent], values: { field: l.field, accent: l.accent } }));

// What each mini interface does, in the prompt's words. `s` is the first frame of the card's 50-frame window.
const visText = (v: Visual, s: number, accent: string, label: string) => {
  const f = (n: number) => s + n;
  const ui = `white, radius ${RADIUS.button}, 1.5px #EAEAEA border, the same soft shadow`;
  switch (v) {
    case "toggle":
      return `a settings panel (720×220, ${ui}) with two 110px rows, each a 48px #F2F2F0 icon tile (radius ${RADIUS.chip}, a 24px line icon), a 22px Inter 500 label, an 18px #6B6B6B sub-line and a 64×36 pill switch with a 28px white knob: "Daily digest" stays off (track 14% black); "${label}" switches on over frames ${f(12)}–${f(24)} on travel (${bezierText("travel")}): the knob slides 28px and the track fills ${accent}`;
    case "chart":
      return `a chart card (720×244, ${ui}): Geist Mono 18px "FOCUS HOURS · THIS WEEK", a total counting 0→${CHART_TOTAL}h in Inter 600 36px over frames ${f(4)}–${f(4 + STAGGER * 6 + 18)} on travel, "+12% VS LAST WEEK" top-right; below, 7 bars ${CHART.bar}px wide on a ${CHART.step}px step (heights ${BARS.map((b) => Math.round(b * 100)).join("/")}% of ${CHART.base}px, top corners radius ${RADIUS.chip}) rise from a hairline baseline, ${STAGGER} frames apart from frame ${f(4)}, 18 frames each on enter. Bar ${KEY_BAR + 1} (the tallest) is ${accent}, the rest 12% black; day initials in Geist Mono 18px under them`;
    case "search":
      return `a search field (720×64, ${ui}) that takes focus at frame ${f(2)} (border turns ${accent} with a 3px ${accent} ring at 14%), then types "${QUERY}" one letter every 2.5 frames from frame ${f(4)} (Inter 400 22px, a 2px black caret after the text; an "ESC" mono 18px chip on the right). A results list (720×172, same surface) drops in 8px with a fade over frames ${f(14)}–${f(26)} on enter; its 3 rows (52px, the first on a #F2F2F0 highlight) fade and rise 6px ${STAGGER} frames apart from frame ${f(16)}: a 20px line icon, "Design" in Inter 600 + " review" / " system" / " team" in Inter 400 #6B6B6B, and a mono 18px kind (DOC, PROJECT, TEAM) on the right`;
    case "avatars":
      return `a shared-calendar card (720×216, ${ui}): a 10px ${accent} dot + "${label}" in Inter 500 22px, Geist Mono 18px "7 MEMBERS · EDITING LIVE" (and "SYNCED JUST NOW" bottom-right), a black "Invite" button (radius ${RADIUS.button}) top-right. Five 80px circles (Inter 500 22px initials) with a 4px white ring, 60px apart, pop in 4 frames apart from frame ${f(4)} (scale 0.6→1 plus a fade over 14 frames on spring): MJ on #111111, AK on #6B6B6B, SL on #A3A3A3, RT on #F2F2F0, then "+3" in #6B6B6B on #F2F2F0`;
    case "keys":
      return `two 128px white keycaps (radius ${RADIUS.button}, hairline, a 6px solid bottom edge at 8% black plus a soft shadow): ⌘ (a 48px line icon) presses at frames ${f(4)}–${f(8)}, K (Inter 500 48px) at ${f(9)}–${f(13)}; pressed caps drop 5px and the edge shrinks to 1px; both release by frame ${f(33)}. A command menu (404×252, ${ui}, 40px right of the keys) opens beside them over frames ${f(13)}–${f(27)} on enter (fade, scale 0.96→1 from its left edge): a search row with a 2px ${accent} caret and "Type a command" in Inter 400 20px #A3A3A3, a hairline, then rows "New event", "Go to today", "Invite people" (Inter 500 18px, the first on a #F2F2F0 highlight) with 32px mono 18px shortcut chips N, T, I, fading in ${STAGGER} frames apart from frame ${f(16)}`;
    case "calendar":
      return `a work-week calendar (720×244, ${ui}): day labels "Mon 13" … "Fri 17" in Inter 500 18px #A3A3A3 (Wed in #111111, 600), a 56px hour gutter (9–12 in Geist Mono 18px), 128px columns and 48px hour rows in 6% black hairlines, and four #F2F2F0 busy blocks (radius ${RADIUS.chip}): Standup, 1:1, Review, Sync (Inter 500 18px #6B6B6B). A "Focus time" block (Wed 9:00–11:00, ${accent} at 14% with a 2.5px ${accent} left bar, Inter 600 18px title and mono 18px "9–11 AM") glides in from the Friday column to Wednesday over frames ${f(6)}–${f(26)} on travel, fading in over its first 6 frames`;
  }
};

export default defineMotion<ChangelogRoundupProps>({
  slug: "changelog-roundup",
  name: "Changelog Roundup",
  description: "A monthly what's-new film: a black title card, four update cards with live mini interfaces, then an overview grid and your logo.",
  category: "templates",
  tags: ["changelog", "updates", "product", "saas", "release notes"],
  addedAt: "2026-10-21",
  durationInFrames: 300,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: ChangelogRoundup,
  defaultProps: {
    ...palettes[0].values,
    title: "What's new",
    month: "October",
    update1: "Smart scheduling",
    update2: "Command menu",
    update3: "Team insights",
    update4: "Shared calendars",
    detail1: "Lumen finds focus time for you.",
    detail2: "Everything, one shortcut away.",
    detail3: "See where the week went.",
    detail4: "Plan together, in real time.",
    visual1: "calendar",
    visual2: "keys",
    visual3: "chart",
    visual4: "avatars",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
  } as ChangelogRoundupProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 18 },
    { type: "text", key: "month", label: "Month", maxLength: 12 },
    { type: "text", key: "update1", label: "Update 1", maxLength: 26 },
    { type: "text", key: "detail1", label: "Detail 1", maxLength: 44 },
    { type: "select", key: "visual1", label: "Visual 1", options: VISUAL_OPTIONS },
    { type: "text", key: "update2", label: "Update 2", maxLength: 26 },
    { type: "text", key: "detail2", label: "Detail 2", maxLength: 44 },
    { type: "select", key: "visual2", label: "Visual 2", options: VISUAL_OPTIONS },
    { type: "text", key: "update3", label: "Update 3", maxLength: 26 },
    { type: "text", key: "detail3", label: "Detail 3", maxLength: 44 },
    { type: "select", key: "visual3", label: "Visual 3", options: VISUAL_OPTIONS },
    { type: "text", key: "update4", label: "Update 4", maxLength: 26 },
    { type: "text", key: "detail4", label: "Detail 4", maxLength: 44 },
    { type: "select", key: "visual4", label: "Visual 4", options: VISUAL_OPTIONS },
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
    const G = geometry(W, H, tall);
    const { S, C } = G;
    const end = c.seconds * c.fps;
    const ink = textOn(p.field);
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const exit = `exit, ${bezierText("exit")}`;
    const spring = bezierText("spring");
    const ups = updatesOf(p);
    const q = visScale(tall);
    const tSize = r(fitSize(p.title, G.open.maxW, S.openTitle));
    const mSize = r(fitSize(p.month, G.open.maxW, S.openMonth));
    const caption = `"${`${p.brand} Changelog`.toUpperCase()}"`;
    const cell = G.cells[0];
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const f3 = (n: number) => SHOTS[2] + n;

    return [
      targetLine(c.target, `a monthly changelog film ("${p.title}", ${p.month}): a black title card, four update cards with live mini interfaces, then an overview grid and the logo`, c.width, c.height, c.seconds),
      `Three shots: frames ${SHOTS[0]}–${SHOTS[1]} on flat ${FILM.black}, ${SHOTS[1]}–${SHOTS[2]} four update cards on flat ${p.field}, ${SHOTS[2]}–${end} the overview on the same ${p.field} (that cut is invisible: the cards themselves move). No gradients, glows or text shadows. Inter only, with Geist Mono for tiny labels; sentence case. Sizes are px at 1080 on the short side. Type on the field is ${ink}; the accent ${p.accent} appears only inside the mini interfaces.`,
      `Word rise (all big type): each row sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, ${STAGGER} frames apart.`,
      `Captions in every shot, Geist Mono ${S.caption}px, tracking 0.1em, ink at 50%, at a ${G.m}px side margin and ${G.captionY}px from the top: ${caption} top-left; top-right "${String(COUNT).padStart(2, "0")} UPDATES" (shots 1 and 3) or a live "01 / 04" counter for the card on screen (shot 2). In shot 1 they fade in over frames ${T.caption[0]}–${T.caption[1]}.`,
      `Shot 1: "${p.title}" in white Inter 500 ${tSize}px, tracking ${TRACK.title}em, and under it (8px gap) "${p.month}" in white Inter 600 ${mSize}px, tracking ${TRACK.month}em, line height 1, left-aligned at x ${G.m}px, top ${G.open.y}px. The title rises from frame ${T.title}; the month rises from frame ${T.month} over ${T.monthDur} frames. The whole block pushes in from scale 1 to ${1 + T.push} linearly across the shot, anchored at its left edge.`,
      `Progress bar (shots 1–2): four segments from x ${G.bar.x0} to ${r(G.bar.x1)}px at y ${G.bar.y}px with ${G.bar.gap}px gaps; each is a ${STROKE.hair}px track at 22% ink with a ${STROKE.ring}px solid-ink fill on top. 16px above each segment, Geist Mono ${S.barLabel}px: the index "01"…"04"${tall ? "" : " and the update title, 12px apart"}. In shot 1 (white on black) the tracks draw on left to right with scaleX from frame ${T.bar}, ${STAGGER} frames apart, ${T.segDur} frames each on enter, labels at 60%. In shot 2 the bar stays in place in ${ink}: segment n fills linearly across its card's 50 frames (${[0, 1, 2, 3].map((i) => `${cardStart(i)}–${cardStart(i) + CARD.len}`).join(", ")}); the active label is at 100%, the others at 40%.`,
      `Update cards: white ${C.w}×${C.h}px, radius ${RADIUS.card}, a ${STROKE.hair}px rgba(0,0,0,0.08) hairline, shadow ${SHADOW}, ${tall ? `full-width at x ${r(G.stage.x)}, top ${G.stage.y}px` : `centre-right at x ${r(G.stage.x)}, y ${r(G.stage.y)}px`}. Inside at a ${C.pad}px padding: the mono index "01" (20px, black at 45%) top-left and an 8px #6B6B6B dot + "NEW" (mono 18px, tracking 0.1em) top-right; the update title at top ${C.titleTop}px in Inter 600 ${C.title}px (shrunk to fit one line), tracking ${TRACK.card}em, #111111; the detail at top ${C.detailTop}px in Inter 400 ${C.detail}px, line height 1.35, black at 60%. The lower part is a #F2F2F0 panel (radius ${RADIUS.button}) inset ${C.inset}px from the sides and bottom, top at ${C.panelTop}px, holding the card's mini interface: designed edge to edge on a ${VIS_BOX.w}×${VIS_BOX.h} box and scaled ×${q.toFixed(2)} so it fills ${Math.round(VIS_FILL * 100)}% of the panel width, centred; its smallest text is ${VIS_MIN_TEXT}px before scaling.`,
      `Card motion: card 1 enters at frame ${enterAt(0)}; every next card enters ${CARD.overlap} frames before the previous card's 50-frame window ends (frames ${[1, 2, 3].map(enterAt).join(", ")}). It slides in from ${CARD.inFrom}px to the right over ${CARD.enter} frames on ${spring}, fading in over its first ${CARD.fadeIn} frames, while the current card slides ${CARD.outTo}px left and fades out over ${CARD.exit} frames on ${exit} (frames ${[0, 1, 2].map((i) => `${exitAt(i)}–${exitAt(i) + CARD.exit}`).join(", ")}). Inside each card the title words rise from ${T.cardTitle} frames after it starts entering, and the detail fades in and rises 12px over frames ${T.detail[0]}–${T.detail[1]} of its entry on enter.`,
      ...ups.map((d, i) => `Card ${i + 1} (frames ${cardStart(i)}–${cardStart(i) + CARD.len}): "${d.title}" / "${d.detail}". Mini interface: ${visText(d.visual, cardStart(i), p.accent, d.title)}.`),
      tall
        ? `Above the card: the big index "01"…"04" in Inter 600 ${S.number}px, tracking ${TRACK.number}em, ${ink} at ${pct(NUMBER_INK)}, left at x ${G.m}px, top ${G.number.y}px. Below the card at top ${G.label.y}px: a two-tone line "${p.title}" in ${ink} + "${p.month}" in ${ink} at 50%, Inter 500 ${S.label}px, tracking -0.02em, rising at frame ${SHOTS[1] + T.label}.`
        : `Left column: the big index "01"…"04" in Inter 600 ${S.number}px, tracking ${TRACK.number}em, ${ink} at ${pct(NUMBER_INK)}, at x ${G.m}px, top ${r(G.number.y)}px; under it at top ${r(G.label.y)}px a two-tone line "${p.title}" in ${ink} + "${p.month}" in ${ink} at 50%, Inter 500 ${S.label}px, tracking -0.02em, rising at frame ${SHOTS[1] + T.label}.`,
      `Each index rises into its own mask with its card (${T.numberIn} frames on enter) and lifts up out of the mask as the card leaves (${T.numberOut} frames on exit), so the numbers roll from one to the next.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): the index, the two-tone line and the progress bar fade out over frames ${f3(T.fade[0])}–${f3(T.fade[1])} on exit. The details fade and every card shortens to ${C.hc}px (the panel moves up to ${C.panelTopC}px) over ${f3(T.compact[0])}–${f3(T.compact[1])} on enter. The cards form a 2×2 grid of ${r(G.cw)}×${r(G.ch)}px cells (scale ${cell.s.toFixed(3)}, 24px gaps) with its top-left at (${r(cell.x)}, ${r(cell.y)})px: card 4 shrinks from its stage position into the bottom-right cell over ${f3(T.shrink[0])}–${f3(T.shrink[1])} on spring; cards 1–3 slide ${T.flyFrom}px in from the left with a 12-frame fade into their cells, ${STAGGER} frames apart from frame ${f3(T.fly)}, ${T.flyDur} frames each on spring. Their mini interfaces show their final, resting state.`,
      `${tall ? "Above the grid" : "Beside the grid"} at (${G.over.x}, ${r(G.over.y)})px: "${p.title}" in Inter 500 ${r(fitSize(p.title, G.over.maxW, S.overTitle))}px at 55% ${ink}, then "${p.month}" in Inter 600 ${r(fitSize(p.month, G.over.maxW, S.overMonth))}px ${ink}, tracking ${TRACK.month}em, rising from frames ${f3(T.overTitle)} and ${f3(T.overMonth)}.`,
      `Bottom-left at (${G.logo.x}, ${G.logo.y})px: the user's logo file at ${S.logo}px tall (width auto), then "${p.brand}" in Inter 500 ${r(S.logo * 0.82)}px, tracking -0.02em, ${ink}, gap ${r(S.logo * 0.32)}px. It fades in and rises 16px over frames ${f3(T.logo[0])}–${f3(T.logo[1])} on enter.`,
      `Everything settles by frame ${f3(T.fly + STAGGER * 2 + T.flyDur)}; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
