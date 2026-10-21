import { FILM, SAMPLE } from "../../film";
import { ACCENT, CANVAS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  LINE_H,
  PRICE_LH,
  PricingUpdate,
  SHADOW,
  SHOTS,
  SIZE,
  T,
  TRACK,
  camAt,
  endGeometry,
  firstSentence,
  fitRows,
  inkOn,
  plansGeometry,
  prices,
  savePct,
  toScreen,
  zoomGeometry,
  type PricingUpdateProps,
} from "./PricingUpdate";

// Each colourway sets the four fields and the one accent together.
const looks: { name: string; open: string; plans: string; zoom: string; end: string; accent: string }[] = [
  { name: "Lime", open: FILM.white, plans: FILM.cream, zoom: FILM.lime, end: FILM.black, accent: FILM.orange },
  { name: "Lavender", open: FILM.white, plans: FILM.canvas, zoom: FILM.lavender, end: FILM.black, accent: ACCENT.blue },
  { name: "Green", open: FILM.cream, plans: FILM.white, zoom: FILM.lime, end: FILM.green, accent: FILM.orange },
  { name: "Plum", open: FILM.white, plans: FILM.cream, zoom: FILM.lavender, end: FILM.plum, accent: FILM.orange },
];
const palettes = looks.map((l) => ({
  name: l.name,
  swatch: [l.plans, l.zoom, l.end, l.accent],
  values: { open: l.open, plans: l.plans, zoom: l.zoom, end: l.end, accent: l.accent },
}));

export default defineMotion<PricingUpdateProps>({
  slug: "pricing-update",
  name: "Pricing Update",
  description: "Announce new plans or a free tier: three plan cards whose prices count up and roll to yearly, a zoom on the free plan, then the call to action.",
  category: "templates",
  tags: ["pricing", "plans", "saas", "announcement", "launch"],
  addedAt: "2026-10-21",
  durationInFrames: 480,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: PricingUpdate,
  defaultProps: {
    ...palettes[0].values,
    kicker: "Pricing · New",
    headline: "Simpler pricing. A free plan for everyone.",
    plan1: "Free",
    plan2: "Pro",
    plan3: "Team",
    price1: "0",
    price2: "12",
    price3: "24",
    yearly1: "0",
    yearly2: "10",
    yearly3: "20",
    desc1: "For personal projects.",
    desc2: "For professionals.",
    desc3: "For teams that ship together.",
    p1f1: "Up to 3 projects",
    p1f2: "Basic analytics",
    p1f3: "Community support",
    p2f1: "Unlimited projects",
    p2f2: "Advanced analytics",
    p2f3: "Priority support",
    p3f1: "Everything in Pro",
    p3f2: "Shared workspaces",
    p3f3: "Admin controls",
    freeNote: "Free forever for up to 3 people.",
    cta: "Start free",
    url: "lumen.app/pricing",
    currency: "$",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    showCursor: true,
  } as PricingUpdateProps,
  palettes,
  controls: [
    { type: "text", key: "kicker", label: "Kicker", maxLength: 28 },
    { type: "text", key: "headline", label: "Headline", maxLength: 56 },
    { type: "text", key: "plan1", label: "Plan 1 name (free plan)", maxLength: 12 },
    { type: "text", key: "price1", label: "Plan 1 monthly price", maxLength: 4 },
    { type: "text", key: "yearly1", label: "Plan 1 yearly (per month)", maxLength: 4 },
    { type: "text", key: "desc1", label: "Plan 1 line", maxLength: 30 },
    { type: "text", key: "p1f1", label: "Plan 1 feature 1", maxLength: 26 },
    { type: "text", key: "p1f2", label: "Plan 1 feature 2", maxLength: 26 },
    { type: "text", key: "p1f3", label: "Plan 1 feature 3", maxLength: 26 },
    { type: "text", key: "plan2", label: "Plan 2 name (popular)", maxLength: 12 },
    { type: "text", key: "price2", label: "Plan 2 monthly price", maxLength: 4 },
    { type: "text", key: "yearly2", label: "Plan 2 yearly (per month)", maxLength: 4 },
    { type: "text", key: "desc2", label: "Plan 2 line", maxLength: 30 },
    { type: "text", key: "p2f1", label: "Plan 2 feature 1", maxLength: 26 },
    { type: "text", key: "p2f2", label: "Plan 2 feature 2", maxLength: 26 },
    { type: "text", key: "p2f3", label: "Plan 2 feature 3", maxLength: 26 },
    { type: "text", key: "plan3", label: "Plan 3 name", maxLength: 12 },
    { type: "text", key: "price3", label: "Plan 3 monthly price", maxLength: 4 },
    { type: "text", key: "yearly3", label: "Plan 3 yearly (per month)", maxLength: 4 },
    { type: "text", key: "desc3", label: "Plan 3 line", maxLength: 30 },
    { type: "text", key: "p3f1", label: "Plan 3 feature 1", maxLength: 26 },
    { type: "text", key: "p3f2", label: "Plan 3 feature 2", maxLength: 26 },
    { type: "text", key: "p3f3", label: "Plan 3 feature 3", maxLength: 26 },
    { type: "text", key: "currency", label: "Currency", maxLength: 3 },
    { type: "text", key: "freeNote", label: "Free plan note", maxLength: 48 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 18 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "toggle", key: "showCursor", label: "Cursor" },
    { type: "color", key: "open", label: "Headline field" },
    { type: "color", key: "plans", label: "Plans field" },
    { type: "color", key: "zoom", label: "Free plan field" },
    { type: "color", key: "end", label: "End field" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const L = tall ? SIZE.tall : SIZE.wide;
    const C = L.card;
    const end = c.seconds * c.fps;
    const r = (n: number) => Math.round(n);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const pr = prices(p);
    const pct = savePct(pr.monthly[1], pr.yearly[1]);
    const cur = p.currency;
    const showCursor = p.showCursor !== false;
    const G = plansGeometry(W, H, 1, tall);
    const Z = zoomGeometry(W, H, 1, tall, p.freeNote);
    const E = endGeometry(W, H, 1, tall, p.cta, cur, pr.yearly[0]);
    const head = fitRows(p.headline, L.headMaxW, L.headline, L.headLines, TRACK.display, true);
    const grey = firstSentence(p.headline);
    const rowsText = (rows: string[][]) => rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const ink = (bg: string) => inkOn(bg).ink;
    const ink2 = (bg: string) => inkOn(bg).ink2;
    const camEnd = camAt(SHOTS[3] - 1);
    const s0 = toScreen(G.cards[0].x, G.cards[0].y, camEnd, W, H);
    const seg = G.segCentre(1);
    const fieldOf = (bg: string) => `flat ${bg}`;
    const cardsWhere = tall
      ? `a fanned vertical stack: ${C.w}×${C.h}px cards, centred, ${L.step}px apart from y ${L.cardsTop}px (each overlaps the one above by ${C.h - L.step}px, covering its button; later cards on top), nudged sideways by ${L.fan.join(", ")}px`
      : `one row of three ${C.w}×${C.h}px cards, ${L.gap}px apart, centred, top at y ${L.cardsTop}px`;
    const plans = [
      `"${p.plan1}" ${cur}${pr.monthly[0]}`,
      `"${p.plan2}" ${cur}${pr.monthly[1]} (highlighted: ${CANVAS.paper.ink} card, white type, a "Popular" chip)`,
      `"${p.plan3}" ${cur}${pr.monthly[2]}`,
    ].join(", ");
    const feats = [
      [p.p1f1, p.p1f2, p.p1f3],
      [p.p2f1, p.p2f2, p.p2f3],
      [p.p3f1, p.p3f2, p.p3f3],
    ]
      .map((x, i) => `${[p.plan1, p.plan2, p.plan3][i]}: ${x.map((y) => `"${y}"`).join(", ")}`)
      .join("; ");

    return [
      targetLine(c.target, "a five-shot pricing announcement film: a headline, three plan cards whose prices count up and then roll to yearly on a Monthly/Yearly toggle, a zoom on the free plan, then the call to action that the free price lands in", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")}. Shots 2 and 3 are one continuous scene (same field, same camera), so that cut is invisible; shots 4 and 5 open on match cuts. Flat colour fields only: no gradients, glows or text shadows. Inter only, Geist Mono for tiny captions; sentence case. Sizes are px at 1080 on the short side. The one accent, ${p.accent}, is used only for the price motif, the "Popular" and "Save" chips and the ticks.`,
      `The motif is the price, drawn as a one-line odometer: the currency "${cur}" then one clip cell per character column (overflow hidden, ${PRICE_LH}em tall, right-aligned columns, one text node per digit), Inter 600, no tabular figures, no masks, no blur. A digit column rolls through the digits in between by translating the current and next digit by the fractional position; a column that appears or vanishes swaps in one step; each column's width interpolates between Inter's digit widths, so "1" stays narrow.`,
      `Word rise (headline, note, CTA): each row sits in its own overflow-hidden mask; each word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}), ${fieldOf(p.open)}: the user's logo file at ${L.logoSmall}px tall plus "${p.brand}" top-left at (${L.M}, 64)px. "${p.kicker}" in Geist Mono ${L.kicker}px at 55% ${ink(p.open)}, then 40px below it the headline ${rowsText(head.rows)} in Inter 600 ${r(head.size)}px, tracking ${TRACK.display}em, line height ${LINE_H.display}, left at ${L.M}px, the block centred vertically${grey ? `; the first sentence in ${ink2(p.open)}, the rest in ${ink(p.open)} (two-tone, no colour highlight)` : `, in ${ink(p.open)}`}. Kicker fades and rises 12px over frames ${T.kicker[0]}–${T.kicker[1]}; words start at frame ${T.wordStart}. The kicker and headline push in from 1 to ${T.openPush} (origin: left margin, mid-height) over the whole shot on ${travel}.`,
      `Shot 1 also sets up the motif: a ${STROKE.hair}px hairline at 20% ${ink(p.open)} across the frame ${tall ? 200 : 150}px above the bottom, drawn left to right (scaleX) over frames ${T.rule[0]}–${T.rule[1]} on enter; under it, left, "${[p.plan1, p.plan2, p.plan3].join(" · ")}" in Geist Mono ${L.caption}px at 50%; right, "from" in the same mono and the price motif "${cur}${pr.monthly[0]}" at 40px in ${p.accent}, baseline-aligned, fading and rising 12px over frames ${T.motif[0]}–${T.motif[1]}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}), ${fieldOf(p.plans)}: captions in Geist Mono ${L.caption}px at 50% ink, ${L.M}px from the top: "${p.brand} — Pricing" left, "Billed monthly" right. A Monthly/Yearly segmented toggle, ${r(G.toggle.w)}×${L.toggleH}px, centred, top at y ${L.toggleTop}px: a full pill at 6% ink with a 1px 8% ink hairline, a white sliding pill (${L.seg}px, inset ${L.togglePad}px, shadow ${SHADOW}), labels Inter 500 ${L.toggleText}px (active ${CANVAS.paper.ink}, inactive ${ink2(p.plans)}). It fades and rises 24px over frames ${T.chrome[0]}–${T.chrome[1]}. Below it, ${cardsWhere}: ${plans}.`,
      `Card anatomy: radius ${RADIUS.card}, white with a 1px 8% ink hairline and shadow ${SHADOW} (the highlighted card: ${CANVAS.paper.ink}, a 12% white hairline, white type, ${CANVAS.ink.ink2} secondary). Padding ${C.pad}px. Name Inter 500 ${C.name}px; "Popular" chip top-right (white Inter 500 ${C.chip}px on ${p.accent}, ${C.chipH}px tall, radius ${RADIUS.chip}). Price motif ${C.price}px at y ${C.priceTop}px, then "/mo" Inter 500 ${C.per}px in the secondary grey on the same baseline. The plan line (${[p.desc1, p.desc2, p.desc3].map((x) => `"${x}"`).join(", ")}) Inter 400 ${C.desc}px secondary at y ${C.descTop}px; a ${STROKE.hair}px hairline at y ${C.divTop}px; three feature rows from y ${C.featTop}px, ${C.rowH}px apart: a ${C.check}px check (a ${STROKE.hair}px ring at 22% ink around a ${STROKE.ring}px tick in the secondary grey) and Inter 400 ${C.feat}px text (${feats}). A ${C.btnH}px button at the bottom, radius ${RADIUS.button}, Inter 500 ${C.btnText}px: "${p.cta}" black with white type on the first card, "Get ${p.plan2}" white on the highlighted card, "Get ${p.plan3}" in ${CANVAS.paper.fill} on the last.`,
      `Shot 2 timing: cards rise ${T.cardRise}px and fade in on ${spring}, ${T.cardDur} frames each from frame ${T.cardStart}, ${T.cardStagger} frames apart. Prices count up from "0" to their monthly values over ${T.countDur} frames on ${enter} from frame ${T.countStart} (+${T.cardStagger} per card); the units column spins one extra turn, a new tens column swaps in from below, and a price that stays the same does not move. Feature rows fade and rise 16px over ${T.rowDur} frames from frame ${T.rowStart} (+${T.cardStagger} per card, +${STAGGER} per row). The chip pops (scale 0.85→1 plus fade, from its right edge) over frames ${T.popular[0]}–${T.popular[1]} on spring. Camera: the whole scene (not the captions or cursor) scales about the frame centre from 1 to ${T.camPush} over frames ${SHOTS[1]}–${SHOTS[3]} on ${travel}.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}), the same scene: ${showCursor ? `the cursor clicks "Yearly" (press dips its scale 10% over frames ${T.press[0]}–${T.press[1]}, releases ${T.press[2]}–${T.press[3]}); ` : "no cursor (cursor off); "}the white pill slides to "Yearly" over frames ${T.slide[0]}–${T.slide[1]} on ${travel}, the label colours swapping with it, and "Billed monthly" crossfades to "Billed yearly" over ${T.billed[0]}–${T.billed[1]}. The prices roll down to yearly per month (${pr.yearly.map((x) => `${cur}${x}`).join(", ")}) over ${T.rollDur} frames on ${travel} from frame ${T.rollStart}, ${T.cardStagger} frames apart: only the changed columns move, the old digit leaving downward and the new one arriving from above.${pct > 0 ? ` A "Save ${pct}%" chip (white Inter 500 ${L.saveText}px on ${p.accent}, ${L.saveH}px tall, radius ${RADIUS.chip}) pops in 16px right of the toggle over frames ${T.save[0]}–${T.save[1]} on spring (scale 0.85→1 from its left edge, plus fade); the % is computed from the ${p.plan2} plan's prices.` : ""}`,
      showCursor
        ? `Cursor: a plain pointer (arrow in ${CANVAS.paper.ink} with a 1.6px white outline, ${r(34 * L.cursor)}px tall, no name tag), drawn in screen space so it does not scale with the camera. It glides in from off-frame right along a slight arc (bowed by 10% of the distance) to the "Yearly" label's centre (${r(seg.x)}, ${r(seg.y)})px in scene space, following the camera, over frames ${T.cursorIn[0]}–${T.cursorIn[1]} on ${travel}; after the click it eases 12px right and 16px down over ${T.cursorRest[0]}–${T.cursorRest[1]}.`
        : `No cursor is drawn (cursor off); the toggle still slides at the same frames.`,
      `Shot 4 (frames ${SHOTS[3]}–${SHOTS[4]}), ${fieldOf(p.zoom)}, match cut: only the "${p.plan1}" card, starting exactly where shot 3 left it (top-left (${r(s0.x)}, ${r(s0.y)})px at scale ${camEnd.toFixed(3)}), travels and scales from its top-left corner to (${r(Z.x)}, ${r(Z.y)})px at ${Z.s}× over frames ${f(3, T.zoom[0])}–${f(3, T.zoom[1])} on ${travel}. Its feature rows tick in one by one from frame ${f(3, T.tickStart)}, ${T.tickStagger} frames apart, ${T.tickDur} frames each on spring: an ${p.accent} disc grows from 60% to full behind the tick and a white tick draws on (stroke-dashoffset). Its price "${cur}${pr.yearly[0]}" turns from ink to ${p.accent} over frames ${f(3, T.tint[0])}–${f(3, T.tint[1])}.`,
      `${tall ? "Below the card" : "Right of the card"}, at (${r(Z.noteX)}, ${r(Z.capY)})px: "${p.plan1} plan · ${cur}${pr.yearly[0]} / mo" in Geist Mono ${L.caption}px at 55% ${ink(p.zoom)} (fades and rises 12px over frames ${f(3, T.caption[0])}–${f(3, T.caption[1])}), then the note ${rowsText(Z.note.rows)} in Inter 500 ${r(Z.note.size)}px, tracking ${TRACK.note}em, line height ${LINE_H.note}, ${ink(p.zoom)}, word rise from frame ${f(3, T.noteStart)}.`,
      `Shot 5 (frames ${SHOTS[4]}–${end}), ${fieldOf(p.end)}, match cut: the accent price "${cur}${pr.yearly[0]}" starts at its shot-4 place and size (${r(C.price * Z.s)}px) and shrinks (one translate + scale from its top-left) to ${L.endPrice}px at (${r(E.priceX)}, ${r(E.priceY)})px over frames ${f(4, T.fly[0])}–${f(4, T.fly[1])} on ${travel}. "${p.cta}" in Inter 600 ${r(E.ctaSize)}px, tracking ${TRACK.display}em, ${ink(p.end)}, left at ${L.M}px with its top at y ${r(E.ctaTop)}px, word rise from frame ${f(4, T.ctaStart)}. ${tall ? "Below it" : "Beside it, on the same baseline"}: "from" in Inter 500 ${L.from}px ${ink2(p.end)} (fades in over frames ${f(4, T.from[0])}–${f(4, T.from[1])}), then the price.`,
      `Under it at y ${r(E.urlY)}px: a full pill ${L.urlH}px tall in ${ink(p.end)} with "${p.url}" in Inter 500 ${L.url}px in ${p.end} and a ${STROKE.ring}px arrow, rising 20px and fading over frames ${f(4, T.url[0])}–${f(4, T.url[1])} on enter. "${p.kicker}" in Geist Mono ${L.caption}px at 50% top-left (frames ${f(4, T.endKicker[0])}–${f(4, T.endKicker[1])}). Bottom-left at ${L.M}px: the user's logo file at ${L.logo}px tall plus "${p.brand}" in Inter 500, rising 16px over frames ${f(4, T.logo[0])}–${f(4, T.logo[1])}.`,
      `Everything has landed by frame ${f(4, T.logo[1])}; hold the end card perfectly still to the end (the last ${end - f(4, T.logo[1])} frames, at least ${FINAL_HOLD}).`,
    ].join("\n");
  },
});
