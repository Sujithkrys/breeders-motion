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
   with -0.03 to -0.045em tracking. Secondary text uses weight 400 in a quieter colour.
6. **Loop or hold.** Loops must end exactly where they start; `envelope()` helps. One-shot reveals ease in and
   hold the final state for the last 25% or more. Use 60–180 frames at 30fps.
7. **Deterministic, light and self-contained.** No network, no data fetching, no new npm packages. The grid plays
   dozens of these at once, so keep the DOM small: generally fewer than ~150 nodes, and fewer for 3D scenes.

## Colour: be colourful

Breeders blue (#0067FC) is the **site's** accent. Components are **not** blue by default.

- Every component ships **4–6 palettes** from clearly different hue families: warm (amber, coral, red),
  fresh (mint, lime, teal), cool (indigo, sky), vivid (magenta, violet), pastel, and a mono or graphite one.
  Mix in at least one **light-background** palette.
- A palette's `values` sets **every** colour prop, including `background`, so switching palettes changes the
  whole look.
- `defaultProps` spreads the first palette's values. Across a batch, the first palettes must differ, so the grid
  looks like a box of crayons, not a wall of blue.
- `swatch` lists the 2–4 colours that best represent the palette.

## Controls

Give each component 4–7 controls:
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
- Tight typography, rich but tasteful colour, depth from soft shadows.
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
