import { FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { HandleReel, REEL, fitFor, namesOf, type HandleReelProps } from "./HandleReel";

const palettes = systemPalettes((t) => ({ background: t.bg, ink: t.ink, ink3: t.ink3, accent: t.accent }));

const DURATION = 180;

export default defineMotion<HandleReelProps>({
  slug: "handle-reel",
  name: "Handle Reel",
  description: "A fixed URL prefix with a slot-machine reel of handles that spins, slows and springs into place on the next name.",
  category: "text",
  tags: ["handle", "reel", "slot", "username", "loop"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: HandleReel,
  defaultProps: {
    ...palettes[0].values,
    prefix: "lumen.app/",
    name1: "maya",
    name2: "theo",
    name3: "ines",
    name4: "kofi",
    name5: "lena",
    name6: "arlo",
  } as HandleReelProps,
  palettes,
  controls: [
    { type: "text", key: "prefix", label: "Prefix", maxLength: 16 },
    { type: "text", key: "name1", label: "Name 1", maxLength: 10 },
    { type: "text", key: "name2", label: "Name 2", maxLength: 10 },
    { type: "text", key: "name3", label: "Name 3", maxLength: 10 },
    { type: "text", key: "name4", label: "Name 4", maxLength: 10 },
    { type: "text", key: "name5", label: "Name 5", maxLength: 10 },
    { type: "text", key: "name6", label: "Name 6", maxLength: 10 },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const size = Math.round(fitFor(p, c.width, u, ratio).size / u);
    const names = namesOf(p);
    const rest = REEL.spins.map((s, i) => `"${names[((i + 1) * REEL.travel) % names.length]}" (spin at frame ${s})`);
    const row = Math.round(REEL.rowH * size);
    return [
      targetLine(c.target, "a URL prefix followed by a slot-machine reel of handles that spins and springs onto the next name", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. One centred row; sizes are px at 1080 on the short side. No gradients, glows or shadows.`,
      `Type: Inter 400, ${size}px, tracking ${REEL.tracking}em, sentence case. "${p.prefix}" in ${p.ink}, then the reel directly after it on the same baseline.`,
      `Reel: one overflow-hidden column 6 rows tall (row height ${row}px = ${REEL.rowH}em), its centre slot level with the prefix, cycling ${names.map((n) => `"${n}"`).join(", ")}. Each name is one text node, absolutely placed by its distance d (in rows) from the centre slot.`,
      `The centred name is ${p.ink}; neighbours blend to ${p.ink3} by d = 1. Fade the edges with opacity only (no CSS mask): opacity = 1 − max(0, d − 0.5) / 2.2, so ~77% one row out, ~32% two rows out, gone by 2.7.`,
      `Spins: ${REEL.spins.length} per loop at frames ${REEL.spins.join(", ")}, each ${REEL.travel} rows (names move up). Rows 0 → ${REEL.travel + REEL.over} over ${REEL.decel} frames on enter ${bezierText("enter")}, a slot-machine slowdown that overshoots by ${REEL.over} of a row.`,
      `Then spring back into the slot over ${REEL.settle} frames (damping ${REEL.spring.damping}, mass ${REEL.spring.mass}, stiffness ${REEL.spring.stiffness}), a gentle overshoot with one small counter-swing.`,
      `While spinning, blur the whole column by min(10, 7 × rows-per-frame)px for motion blur.`,
      `The resting name turns ${p.accent} ${REEL.accentIn[0]}–${REEL.accentIn[1]} frames after the slowdown ends and back to ${p.ink} in the first ${REEL.accentOut} frames of the next spin. It rests on ${rest.join(", ")}.`,
      `${REEL.spins.length} × ${REEL.travel} = ${REEL.spins.length * REEL.travel} rows is a whole number of laps, so frame ${DURATION} matches frame 0 ("${names[0]}" in ${p.accent}); the last ${FINAL_HOLD} frames hold still.`,
    ].join("\n");
  },
});
