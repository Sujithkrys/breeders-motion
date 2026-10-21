import { RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { BODIES, GEO, MilestoneTimeline, T, arrival, type MilestoneTimelineProps } from "./MilestoneTimeline";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<MilestoneTimelineProps>({
  slug: "milestone-timeline",
  name: "Milestone Timeline",
  description: "A vertical company timeline where an accent fill runs down the spine, each milestone pops filled as it is reached and its text rises in, with the camera following.",
  category: "ui",
  tags: ["timeline", "milestones", "progress", "story", "company"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: MilestoneTimeline,
  defaultProps: {
    ...palettes[0].values,
    title1: "Founded in a spare room",
    title2: "First 100 customers",
    title3: "Seed round closed",
    title4: "A team of twenty",
    title5: "Public launch",
    date1: "MAR 2025",
    date2: "JUN 2025",
    date3: "SEP 2025",
    date4: "JAN 2026",
    date5: "OCT 2026",
  } as MilestoneTimelineProps,
  palettes,
  controls: [
    { type: "text", key: "title1", label: "Title 1", maxLength: 32 },
    { type: "text", key: "date1", label: "Date 1", maxLength: 12 },
    { type: "text", key: "title2", label: "Title 2", maxLength: 32 },
    { type: "text", key: "date2", label: "Date 2", maxLength: 12 },
    { type: "text", key: "title3", label: "Title 3", maxLength: 32 },
    { type: "text", key: "date3", label: "Date 3", maxLength: 12 },
    { type: "text", key: "title4", label: "Title 4", maxLength: 32 },
    { type: "text", key: "date4", label: "Date 4", maxLength: 12 },
    { type: "text", key: "title5", label: "Title 5", maxLength: 32 },
    { type: "text", key: "date5", label: "Date 5", maxLength: 12 },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const s = (f: number) => secs(f, c.fps);
    const titles = [p.title1, p.title2, p.title3, p.title4, p.title5];
    const dates = [p.date1, p.date2, p.date3, p.date4, p.date5];
    return [
      targetLine(c.target, `a vertical milestone timeline where an accent progress fill runs down the spine and each milestone pops filled as it is reached`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter only, Geist Mono for dates. No cards, gradients or glows.`,
      `Spine: a ${STROKE.hair}px hairline (${p.ink} at 20%) through 5 nodes ${g.S}px apart; the progress fill on top is ${STROKE.bar}px ${p.accent} with ${RADIUS.chip}px round ends.`,
      `Nodes: ${g.node}px circles in ${p.background} with a ${STROKE.ring}px ring (${p.ink} at 28%). Reached: a ${p.accent} disc with a ${Math.round(g.node * 0.3)}px ${p.background} centre dot.`,
      g.stacked
        ? `Text sits right of the spine: the date (Geist Mono ${g.date}px, +0.12em, caps) on the node line, then the title ${g.title}px/400 -0.035em ${p.ink} and one line of body ${g.body}px ${p.ink2} below it.`
        : `Dates sit left of the spine, right-aligned 48px from it (Geist Mono ${g.date}px, +0.12em, caps); right of it, 56px out, the title ${g.title}px/400 -0.035em ${p.ink} centred on the node line with one line of body ${g.body}px ${p.ink2} below. Dates read ${p.ink3} until reached, then ${p.ink2}.`,
      `Milestones: ${titles.map((t, i) => `${String(dates[i]).toUpperCase()} "${t}" — "${BODIES[i]}"`).join("; ")}.`,
      `Starts with the first node filled and its text shown. From ${s(T.segA)} the fill travels to each next node over ${T.travel} frames on travel ${bezierText("travel")}, resting 4 frames between (arrivals at ${[1, 2, 3, 4].map((i) => s(arrival(i))).join(", ")}).`,
      `On arrival the node pops: the accent disc scales 0.5 → 1.2 → 1 over 16 frames, and the title and body rise ${24}px while fading in over ${T.rise} frames on enter ${bezierText("enter")}.`,
      `The camera scrolls with the fill: the view centre moves from ${g.cam[0]} to ${g.cam[1]} node gaps down the spine as the fill goes from the first node to the last.`,
      `${s(T.resetA)}–${s(T.resetB)}: rewind; the fill retracts to the first node on travel, nodes empty as it passes, texts fade out on exit (last first, 3-frame stagger) and the camera returns. The last 12+ frames hold the opening state, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
