import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { RW, SCALE, SW, SidebarCollapse, T, W, isDark, type SidebarCollapseProps } from "./SidebarCollapse";

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

export default defineMotion<SidebarCollapseProps>({
  slug: "sidebar-collapse",
  name: "Sidebar Collapse",
  description: "An app sidebar folds down to an icon rail and opens back out, labels blurring away while the main panel reflows.",
  category: "ui",
  tags: ["sidebar", "navigation", "app", "collapse", "cursor"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SidebarCollapse,
  defaultProps: {
    ...(palettes[0].values as Record<string, string>),
    workspace: "Northwind",
    greeting: "Good morning, Maya",
    section1: "Overview",
    section2: "Customers",
    active: "Dashboard",
    morph: 22,
    ease: "travel",
  } as SidebarCollapseProps,
  palettes,
  controls: [
    { type: "text", key: "workspace", label: "Workspace", maxLength: 14 },
    { type: "text", key: "greeting", label: "Greeting", maxLength: 26 },
    { type: "text", key: "active", label: "Selected item", maxLength: 14 },
    { type: "text", key: "section1", label: "Section 1", maxLength: 14 },
    { type: "text", key: "section2", label: "Section 2", maxLength: 14 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "accent", label: "Unread dot" },
    { type: "number", key: "morph", label: "Morph length", min: 16, max: 28, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio].k;
    const px = (n: number) => `${Math.round(n * k * 10) / 10}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const L = Math.min(28, Math.max(16, Math.round(Number(p.morph) || 22)));
    return [
      targetLine(c.target, `an app sidebar that collapses to an icon rail and expands again, driven by a cursor`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, no gradients or glows. Sizes are px at 1080 on the short side. Font Inter only, weights 400/500, sentence case.`,
      `Subject ${px(W)} × ${px(SCALE[ratio].h)}, centred: a sidebar sitting straight on the canvas (${px(SW)} wide, ${px(RW)} as a rail) and, to its right, a main panel in ${p.card} (radius ${RADIUS.card}px, 1px ${p.line} border${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}).`,
      `Sidebar, top to bottom: a stacked-layers mark and "${p.workspace}" ${px(16)}/500 ${p.ink}, with a panel-toggle icon button (${px(36)}, radius ${RADIUS.chip}px) at the right; a search field in ${p.fill} (radius ${RADIUS.button}px, "Search" in ${p.ink3}); "Ask ${p.workspace}"; section header "${p.section1}" (${px(13)}, ${p.ink3}) with "${p.active}" and Calendar; "${p.section2}" with Conversations, Contacts, Automations; a "Maya Chen" profile row pinned to the bottom with a grey initials avatar.`,
      `Rows ${px(40)} tall, ${px(15)} labels in ${p.ink2}, ${px(20)} line icons (stroke ${STROKE.hair}) centred in the first ${px(48)} of the row so they never move sideways. The selected "${p.active}" row is a ${p.card} chip with a 1px ${p.line} border, radius ${RADIUS.chip}px and a tiny shadow; its label is 500 ${p.ink}. Conversations has one ${px(7)} unread dot in ${p.accent}, the only colour.`,
      `Main panel: "${p.greeting}" ${px(30)}/400, -0.035em, a ${p.ink2} subline, three bordered stat tiles (radius ${RADIUS.button}px) and a bar chart of 14 ${p.fill} bars with the last one ${p.ink}. All of it is flex, so it reflows as the panel widens.`,
      `0–${s(T.mv1A)}: still. ${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides from the panel to the toggle (travel ${bezierText("travel")}, slight bow); the toggle gets a ${p.fill} hover square.`,
      `Click at ${s(T.click1)} (cursor scales to 0.88). From ${s(T.colA)} the sidebar width eases ${SW}→${RW} over ${L} frames (${p.ease} ${bezierText(p.ease)}); rows shrink to ${px(48)} square chips, labels fade and blur out over 12 frames on exit ${bezierText("exit")}, the mark and workspace name go with them, the toggle slides to the rail centre, and each section header closes up into a ${px(32)} ${p.line} divider. The unread dot tucks onto the corner of its icon. The main panel grows left and its tiles and bars stretch.`,
      `${s(T.mv2A)}–${s(T.mv3B)}: the cursor drifts into the panel, then returns to the rail toggle. Click at ${s(T.click2)}: the same morph runs in reverse, with labels fading back in over 20 frames on enter ${bezierText("enter")} once the width has mostly opened.`,
      `${s(T.mv4A)}–${s(T.mv4B)}: the cursor glides back to its start point; hold still for the last 12 frames so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
