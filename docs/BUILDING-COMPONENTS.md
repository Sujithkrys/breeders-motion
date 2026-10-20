# Building a motion component

Every component in the Breeders library is a **live Remotion component**, not a video file. The site plays it with
`@remotion/player`, generates the Edit panel from its controls, writes the copy-ready prompt from its current props,
and exports it in the browser with `@remotion/web-renderer`.

Read these three files before writing one:

- `src/motion/types.ts`: the `MotionDef` contract.
- `src/motion/kit.ts`: shared helpers. Use them; don't re-derive timing or layout math.
- `src/motion/items/card-fan/`: the reference component. Match its structure and quality.

## Files

```
src/motion/items/<slug>/
  <Name>.tsx     the Remotion component (more .tsx files allowed; all of them show in the Code tab)
  index.ts       default export: defineMotion<Props>({...})
```

Then add one import to your batch file, `src/motion/batches/<batch>.ts`, and append it to the `batch` array.

## Hard rules

1. **Everything is driven by `useCurrentFrame()`.** Don't use CSS animations, transitions, `setTimeout`, `useState`
   timers or `Math.random()`. For randomness, use `random(seed)` from `remotion`, which is deterministic.
2. **Responsive across ratios.** Use `useLayout()` from the kit. `u` is 1px at 1080 on the short side, so write
   every size as `n * u`. Use `isVertical` to re-flow for 9:16. List only the ratios that really look right in
   `ratios` (first = default). Most components should support all three.
3. **Root is an `<AbsoluteFill>` painted with a `background` prop**, so users can recolour it and export
   with transparency.
4. **Export-safe CSS only.** The browser exporter redraws the DOM onto a canvas, so stick to what it supports:
   - Allowed: `linear-gradient` backgrounds, solid colours, border-radius, borders, `box-shadow`, opacity,
     2D and 3D transforms, `clip-path`, `overflow: hidden`, `filter: blur()`, `mask-image`, text and inline SVG
     (including SVG `<radialGradient>`, `<linearGradient>`, `<filter>`, paths, strokes, `strokeDasharray`).
   - Not allowed: CSS `radial-gradient` / `conic-gradient`, `backdrop-filter`, `mix-blend-mode`,
     `text-shadow`, `background-clip: text`, external images and fonts.
   - Make soft glows with SVG radial gradients, blurred shapes or box-shadow.
   - Make gradient text with an SVG `<text>` filled by a `<linearGradient>`.
5. **Fonts:** only `FONT_SANS` (Geist) and `FONT_MONO` (Geist Mono) from the kit. Display type uses weight 600–700
   with -0.03 to -0.045em tracking. Secondary text uses weight 400 in a quieter colour. Never write
   `var(--font-…)` in a component: exported SVG text can't resolve CSS variables and falls back to serif.
6. **Loop or hold.** Loops must end exactly where they start; `envelope()` helps. One-shot reveals ease in and
   hold the final state for the last 25% or more. Use 60–180 frames at 30fps.
7. **Deterministic, light and self-contained.** No network, no data fetching, no new npm packages. The grid plays
   dozens of these at once, so keep the DOM small: generally fewer than ~150 nodes, and fewer for 3D scenes.

## The v2 look (approved 2026-10-20, see the Library v2 sheet)

Taken from our approved films (Framer, Figma Motion, ClaudeFull, Pine) and the references we picked (Hairline UI,
the context-window card, Wispr Flow, the OpenAI specimen). Premium means **restraint**: real UI, white space,
crisp type, one colour doing one job.

**Colour system**: use these values, not invented ones.

| Role | Colours |
|---|---|
| Canvas | White `#FFFFFF`, Paper `#FAFAF8`, Soft `#F2F2EF`, Cream `#F5F1E8` |
| Dark (flat only) | Ink `#0E0F12`, Black `#000000` |
| Flat blocks | Lavender `#C4B9FD`, Lime `#E3F79C`, Deep green `#0C5A2F`, Plum `#5B2A5E`, Blue `#2443FF`, Breeders `#0067FC`, Coral `#FF5A1F` |
| UI | Selection `#0099FF` with `#E5F4FF` fill, hairline `#E8E8EC`, ink2 `#3B3D44`, sub `#7B7E87` |

**Rules**
- **Canvas:** white, paper or cream. Dark only as flat ink or black.
- **Colour:** one flat colour block or one accent per component.
- **UI:** real product UI. White cards with hairline borders (`1px #E8E8EC`) and tiny shadows
  (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`). Figma-style selection boxes with size labels, and
  name-tag cursors where they help.
- **Type:** Geist. Large titles at weight 400–500 with -0.035 to -0.045em tracking (the Figma-film look).
  Small UI labels at 13–16px equivalent are fine *inside* UI that is framed large.
- **Scale:** the UI piece fills most of the frame (60–80% width at 16:9). Small UI floating in empty space reads
  as a mockup.
- **Motion:** calm and precise. Cursor-driven interactions, morphs, reflows and match cuts. Ease out softly.
- **Never:**
  - gold, amber or brass
  - coloured glow fog or blurry colour blobs
  - gradient app-icon tiles
  - muddy tinted darks (brown, olive or teal-black)
  - neon
  - rainbow gradients

**Palettes:** 3–5 per component, each one a coherent look from the system above. For example: white canvas plus
Breeders accent; cream plus coral; a lavender block; a lime block; ink plus white. `values` sets **every** colour
prop including `background`. `swatch` lists 2–4 representative colours.

## Shape and motion (approved 2026-10-20)

These keep 50+ components feeling like one product. The values live in `src/motion/kit.ts`; use the constants, never
ad hoc numbers.

**Shape** (`RADIUS`, `STROKE`, in px at 1080 on the short side, so multiply by `u`):

| Token | Value | Use it for |
|---|---|---|
| `RADIUS.chip` | 8 | chips, tags, the leading end of chart bars |
| `RADIUS.button` | 16 | buttons, inputs, small panels |
| `RADIUS.card` | 32 | cards and tiles 100px and over |
| `RADIUS.hero` | 48 | hero objects |
| `STROKE.hair` | 1.5 | chart axes, gridlines, dividers, connector lines |
| `STROKE.ring` | 2.5 | rings, borders, selection rings |
| `STROKE.bar` | 6 | progress bars, thick bars |

- No other radii or stroke widths.
- Strokes sit at 18–30% opacity unless the stroke is the accent itself.

**Motion** (`CURVES`, `SPRING_CONFIG`, `progress(frame, from, to, ease)`):

| Name | Curve | Use it for |
|---|---|---|
| `enter` | cubic-bezier(0.22, 1, 0.36, 1) | anything arriving: titles rising, cards dropping in, rows appearing |
| `exit` | cubic-bezier(0.64, 0, 0.78, 0) | anything leaving: fades out, scenes pushed away |
| `travel` | cubic-bezier(0.65, 0, 0.35, 1) | moving between two on-screen states: a value flying into place, a ring sliding, a cursor gliding |
| `linear` | linear | only continuous motion: marquees, orbits, sweeps, playheads |
| `spring` | damping 200, mass 0.6, stiffness 120 | physical objects: cards, tiles, chips, cubes |

- The `ease` select uses `EASE_OPTIONS`, which lists exactly these five. `envelope()` enters with the chosen ease
  and leaves on `exit`.
- Durations are 120, 150 or 180 frames (`DURATIONS`). Write timing in frames.
- The last 12 frames (`FINAL_HOLD`) are a held, still final state. The loop restarts without a jolt, and that
  region holds the poster frame. A continuous element may keep moving through the hold.
- Entrances run 18–24 frames and exits 12–16 frames.
- Siblings stagger by 3 frames (`STAGGER`), 8 at most; beyond 8, stagger in groups of 8.
- An entrance uses at most two of these: fade from 0, scale from below 0.9, offset over 40px.

## Controls

Give each component 4–8 controls:
- every visible piece of text (`text`)
- the 1–3 most important colours (`color`)
- 1–3 motion levers (`number`), such as spread, stagger, intensity or count
- `ease` as a `select` over `EASE_OPTIONS`

Every `key` must be a prop. Number ranges must keep the design looking good at both ends.

## Prompt

`prompt(props, ctx)` returns the copy-ready prompt written from the **current** props, so what users copy
matches what they see. Rules:

- Start with `targetLine(ctx.target, "<what it is>", ctx.width, ctx.height, ctx.seconds)`.
- Give exact values: hex colours, sizes in px at 1080 on the short side, radii, font and tracking, timing as % of
  the loop or in seconds, stagger, and easing name plus `bezierText()`.
- Write 6–14 lines in plain, specific language. A developer pasting it into Claude should get the same result.

## Quality bar

Premium product-launch motion, at the level of Apple, Linear, Stripe, Vercel and Raycast:
- Calm, readable motion; real-looking UI pieces, isolated and large.
- Tight typography, restrained colour (see the v2 look), depth from hairlines and tiny shadows.
- No clip-art, emoji, lorem ipsum or "AI tropes" (rainbow gradient washes everywhere, neon on everything).
- Every frame should look good as a still.

## Metadata

- `slug`: kebab-case; also the folder name.
- `name`: Title Case, 2–3 words.
- `description`: one sentence.
- `tags`: 3–6 lowercase tags.
- `addedAt`: a `YYYY-MM-DD` date between 2026-09-01 and 2026-10-20. Give one or two per batch a date between
  2026-10-14 and 2026-10-20 so they show as New.
- `fps`: 30.
