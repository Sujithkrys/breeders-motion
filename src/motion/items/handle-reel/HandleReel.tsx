import React from "react";
import { AbsoluteFill, interpolateColors, spring, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type HandleReelProps = {
  background: string;
  ink: string; // the prefix and the centred name
  ink3: string; // the names above and below
  accent: string; // the settled name
  prefix: string;
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  name5: string;
  name6: string;
};

// Timing in frames on the 180-frame loop, sizes in px at 1080 on the short side.
// Three spins of 8 slots each (24 = 4 laps of the 6 names), so the reel ends exactly where it started.
export const REEL = {
  spins: [12, 72, 132], // frame each spin starts
  decel: 22, // the spin itself, on the enter curve (fast start, long slot-machine slowdown)
  settle: 14, // the overshoot springing back into the slot
  travel: 8, // slots per spin
  over: 0.16, // overshoot past the slot, in rows
  rowH: 1.14, // row height, em
  tracking: -0.04, // em
  base: { wide: 160, square: 150, vertical: 150 },
  spring: { damping: 9, mass: 0.6, stiffness: 150 },
  accentIn: [4, 14] as const, // frames after the decel ends: the settled name takes the accent
  accentOut: 4, // frames at the start of a spin: the accent lets go
} as const;

// Inter 400 advance widths at display optical size (opsz 32), per 1000 em, for fitting and centring.
const GLYPHS = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-'!?&/@_#%+$";
const ADV = [
  250, 518, 565, 523, 565, 536, 306, 565, 547, 206, 206, 507, 206, 839, 547, 549, 565, 565, 322, 475, 311, 547, 512, 752, 507, 512, 479, 653, 638, 722,
  689, 580, 554, 730, 708, 232, 535, 634, 535, 857, 710, 749, 612, 749, 632, 614, 610, 703, 653, 949, 646, 643, 613, 613, 362, 561, 599, 618, 577, 584,
  516, 582, 584, 220, 220, 220, 429, 254, 220, 524, 608, 325, 974, 454, 600, 844, 628, 614,
];
export const textEm = (s: string) => [...s].reduce((a, c) => a + (GLYPHS.indexOf(c) < 0 ? 0.56 : ADV[GLYPHS.indexOf(c)] / 1000) + REEL.tracking, 0);

export const namesOf = (p: HandleReelProps) => [p.name1, p.name2, p.name3, p.name4, p.name5, p.name6].map((n) => String(n ?? ""));

// Which slot the reel is on: continuous, in rows. Integer values are names resting in the window.
export const reelPos = (frame: number, fps: number) => {
  let pos = 0;
  for (const s of REEL.spins) {
    const f = frame - s;
    if (f <= 0) break;
    if (f < REEL.decel) pos += (REEL.travel + REEL.over) * progress(f, 0, REEL.decel, "enter");
    else pos += REEL.travel + REEL.over * (1 - spring({ frame: f - REEL.decel, fps, config: REEL.spring, durationInFrames: REEL.settle }));
  }
  return pos;
};

// 1 while a name rests in the window, 0 while the reel spins.
const settled = (frame: number) => {
  for (let i = REEL.spins.length - 1; i >= 0; i--) {
    const f = frame - REEL.spins[i];
    if (f < 0) continue;
    if (f < REEL.decel) return 1 - progress(f, 0, REEL.accentOut, "exit");
    return progress(f, REEL.decel + REEL.accentIn[0], REEL.decel + REEL.accentIn[1], "enter");
  }
  return 1;
};

// Opacity by distance from the window: 1 at the centre, ~0.77 one row out, ~0.32 two rows out, gone by 2.7.
const fade = (d: number) => Math.max(0, Math.min(1, 1 - Math.max(0, d - 0.5) / 2.2));

// One row on every ratio: prefix + the longest name fit inside the safe area (96px at 16:9, 8% of the width otherwise).
export const fitFor = (p: HandleReelProps, width: number, u: number, ratio: "16:9" | "1:1" | "9:16") => {
  const longest = Math.max(0.5, ...namesOf(p).map(textEm));
  const prefixW = Math.max(0, textEm(p.prefix));
  const room = width - 2 * (ratio === "16:9" ? 96 * u : width * 0.08);
  const base = (ratio === "16:9" ? REEL.base.wide : ratio === "1:1" ? REEL.base.square : REEL.base.vertical) * u;
  return { size: Math.min(base, room / (prefixW + longest + 0.08)), longest, prefixW };
};

export const HandleReel: React.FC<HandleReelProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, fps, ratio } = useLayout();
  const names = namesOf(p);
  const n = names.length;
  const { size, longest } = fitFor(p, width, u, ratio);

  const pos = reelPos(frame, fps);
  const speed = Math.abs(reelPos(frame + 1, fps) - reelPos(frame - 1, fps)) / 2; // rows per frame
  const blur = Math.min(10, speed * 7) * u;
  const centre = interpolateColors(settled(frame), [0, 1], [p.ink, p.accent]);

  const rowH = REEL.rowH * size;
  const rows = 6; // the masked window: ±3 rows, names fade out by 2.7
  const reelW = (longest + 0.08) * size;
  const first = Math.floor(pos) - 3;
  const items = Array.from({ length: 7 }, (_, j) => first + j);

  const type: React.CSSProperties = {
    fontSize: size,
    fontWeight: 400,
    letterSpacing: `${REEL.tracking}em`,
    lineHeight: `${rowH}px`,
    whiteSpace: "pre",
  };

  const reel = (
    <div style={{ position: "relative", width: reelW, height: rows * rowH, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        {items.map((k) => {
          const d = Math.abs(k - pos);
          const o = fade(d);
          if (o <= 0) return null;
          return (
            <div
              key={k}
              style={{
                ...type,
                position: "absolute",
                left: 0,
                right: 0,
                top: (rows / 2 - 0.5 + (k - pos)) * rowH,
                height: rowH,
                textAlign: "left",
                color: interpolateColors(Math.min(d, 1), [0, 1], [centre, p.ink3]),
                opacity: o,
              }}
            >
              {names[((k % n) + n) % n]}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ ...type, color: p.ink }}>{p.prefix}</div>
        {reel}
      </div>
    </AbsoluteFill>
  );
};
