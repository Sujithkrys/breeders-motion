import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { ACCENT_ROW, DOCK_H, DockMenu, GEO, PAD, SUB, SUB_FROM, T, type DockMenuProps } from "./DockMenu";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
}));

export default defineMotion<DockMenuProps>({
  slug: "dock-menu",
  name: "Dock Menu",
  description: "A black icon dock unfolds into a menu card; the cursor hovers rows, opens a nested submenu that slides in, goes back, and the card folds away.",
  category: "ui",
  tags: ["menu", "dock", "dropdown", "submenu", "cursor", "morph"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: DockMenu,
  defaultProps: {
    ...palettes[0].values,
    item1: "Home",
    item2: "Discover",
    item3: "Favorites",
    item4: "Notebooks",
    item5: "Settings",
    ease: "travel",
  } as DockMenuProps,
  palettes,
  controls: [
    { type: "text", key: "item1", label: "Row 1", maxLength: 16 },
    { type: "text", key: "item2", label: "Row 2 (hovered)", maxLength: 16 },
    { type: "text", key: "item3", label: "Row 3", maxLength: 16 },
    { type: "text", key: "item4", label: "Row 4", maxLength: 16 },
    { type: "text", key: "item5", label: "Row 5 (opens submenu)", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const main = [p.item1, p.item2, p.item3, p.item4, p.item5];
    const f = (a: readonly [number, number]) => `${a[0]}–${a[1]}`;
    return [
      targetLine(c.target, `a black icon dock that unfolds into a menu card with a nested submenu, driven by a cursor`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter only: rows ${g.font}px/500, -0.01em tracking, sentence case. Monochrome: surface ${p.button}, text ${p.onButton} at 86% (100% on hover), icons at 72%, chevrons at 50%; the only colour is the "${SUB[ACCENT_ROW]}" icon in ${p.accent}.`,
      `Dock (frame 0 and the final hold): a ${p.button} pill ${DOCK_H}px tall, radius ${RADIUS.hero}px, five ${g.dockIcon}px stroked icons on ${g.slot}px slots — home, search, heart, notebook, up/down chevrons — strokes ${STROKE.ring}px, round caps. 1px inner hairline in ${p.onButton} at 8%; shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). It sits low in the frame; the menu grows upward from its bottom edge.`,
      `Menu card: ${g.w}px wide, radius ${RADIUS.card}px, ${PAD}px top/bottom padding, ${g.row}px rows: icon ${g.icon}px at 36px in, 20px gap, label; "${main[SUB_FROM - 1]}" and "${main[SUB_FROM]}" end in a chevron. Rows: ${main.map((s) => `"${s}"`).join(", ")}. Hover: a ${p.onButton} 10% fill, radius ${RADIUS.button}px, inset 12px.`,
      `Submenu (same card, taller): ${SUB.map((s) => `"${s}"`).join(", ")} with back-arrow, person, half-circle, sparkle, person-plus and log-out icons.`,
      `Frames ${f(T.toMore)}: the arrow cursor glides to the chevrons icon, which gets a 64px ${p.onButton} 14% circle; click at ${T.click1} (cursor scales to 0.88).`,
      `Frames ${f(T.open)}: the pill morphs into the card — width, height and radius (${RADIUS.hero}→${RADIUS.card}px) on ${p.ease}; dock icons blur out over ${f(T.iconsOut)}; rows rise 14px and un-blur from 6px, staggered 3 frames from ${T.rowsIn}, 18 frames each.`,
      `Cursor hovers "${main[1]}" (${f(T.hov2)}), then "${main[SUB_FROM]}" and clicks at ${T.click2}: the main list slides 22% left and fades (${f(T.mainOut)}, exit), the submenu slides in from 22% right (${f(T.subRowsIn)}, enter, rows staggered 3 frames), the card grows to fit (${f(T.subIn)}).`,
      `Cursor hovers "${SUB[ACCENT_ROW]}" (${f(T.hovUp)}), then clicks "${SUB[0]}" at ${T.click3}: the submenu slides out right (${f(T.subOut)}) and the main list returns from the left (${f(T.mainIn)}); the card shrinks back.`,
      `The cursor leaves to the right (${f(T.toSide)}); the card folds back into the pill (${f(T.close)}), rows fade (${f(T.rowsOut)}), dock icons return (${f(T.iconsIn)}), and the cursor glides home by ${T.toRest[1]}. Last 12 frames hold still.`,
      `Cursor moves use ${bezierText("travel")} with a slight bow; morphs use ${p.ease} ${bezierText(p.ease)}. Loop ${c.seconds}s, seamless.`,
    ].join("\n");
  },
});
