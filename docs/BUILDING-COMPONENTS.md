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
     2D and 3D transforms, `clip-path`, `overflow: hidden`, `filter: blur()`, `object-fit`, text and inline SVG
     (including SVG `<radialGradient>`, `<linearGradient>`, `<filter>`, paths, strokes, `strokeDasharray`).
   - Not allowed: CSS `radial-gradient` / `conic-gradient`, `backdrop-filter`, `mix-blend-mode`,
     `text-shadow`, `background-clip: text`, CSS `mask-image` (it exports as a ghost duplicate; use an SVG mask or
     gradient stroke), `object-position`, `font-variant-numeric` (tabular figures), external images and fonts.
   - Keep a word or number in **one text node**: the exporter draws each text node separately, so `{n}{suffix}`
     or invisible padding spans drift apart in the video. Write `{`${n}${suffix}`}`.
   - Hundreds of text nodes make exports slow; draw repeated text (code textures, tick labels) in one inline SVG.
5. **Fonts:** only `FONT_SANS` (Inter) and `FONT_MONO` (Geist Mono) from the kit; see the colour and type system below.
   Never write `var(--font-…)` in a component: exported SVG text can't resolve CSS variables and falls back to serif.
6. **Loop or hold.** Loops must end exactly where they start; `envelope()` helps. One-shot reveals ease in and
   hold the final state. Durations are 120, 150 or 180 frames, and the last 12 are held still (see Shape and motion).
7. **Deterministic, light and self-contained.** No network, no data fetching, no new npm packages. The grid plays
   dozens of these at once, so keep the DOM small: generally fewer than ~150 nodes, and fewer for 3D scenes.

## Colour and type system (approved 2026-10-20)

Measured from the 108 premium references in our collection (sheet: `E:/Breeders/out/Breeders-Premium-System.png`).
Across those 108:
- **0** sit on a gradient or wallpaper.
- **73** use no accent colour or just one.
- **89** use one Inter/SF-style grotesk.

Premium is **restraint**: neutral canvases, real UI, one small accent, hierarchy in grey.

**Colour.** Use the kit's tokens: `CANVAS`, `ACCENT`, `STATE`, `tokensFor()`, `systemPalettes()`. Never write a hex in a
component.

| Canvas | bg | card | line | fill | text (ink / ink2 / ink3) | button / onButton |
|---|---|---|---|---|---|---|
| `paper` (default) | #FAFAF9 | #FFFFFF | #EAEAEA | #F2F2F0 | #111111 / #6B6B6B / #A3A3A3 | #111111 / #FFFFFF |
| `stone` | #F2F1EC | #FFFFFF | #E4E2DC | #EAE8E2 | #111111 / #6B6B6B / #A3A39E | #111111 / #FFFFFF |
| `ink` | #111111 | #1A1A1A | #262626 | #222222 | #FFFFFF / #9A9A9A / #5A5A5A | #FFFFFF / #111111 |

- **Accent:** `ACCENT.orange` #FF5A1F or `ACCENT.blue` #2F5FF5. Use **one** per component, on about 1–5% of the frame:
  a button, a line, a dot, the active or selected state, the one key number.
- **State:** `STATE.success` #22C55E and `STATE.error` #E5484D, for success and error states only.
- **Primary buttons:** `button` (black; white on Ink), not the accent. Selection uses `fill`, a neutral grey.
- **Surfaces:** a `card` on `bg` with a 1px `line` border and a near-invisible shadow
  (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`; none on Ink).
- **Palettes:** every component ships exactly the four standard looks, `palettes: systemPalettes(t => ({ background:
  t.bg, ... }))`: Paper, Paper Blue, Stone and Ink. `defaultProps` spreads the first.
- **Never:**
  - gradients on UI, or glows of any kind
  - gold, neon or rainbow
  - more than one accent hue
  - coloured canvases, wallpapers or photos as canvas
  - colour used for hierarchy
  - multi-colour avatars or charts. Data series are the accent plus greys: `ink`, `ink2`, `ink3`, `line`.

**Type.** `FONT_SANS` (Inter) for everything, `FONT_MONO` (Geist Mono) only for tiny labels and numerals.
- **Weights:** 400 for headlines and body, 500 for labels and buttons, 600 for one key word or number. Nothing else.
- **Case and tracking:** sentence case everywhere. Display sizes get tight tracking (-0.035 to -0.045em). Capitals
  only on tiny mono labels with open tracking (+0.08 to +0.14em).
- **Hierarchy:** grey steps `ink` → `ink2` → `ink3`. A two-tone line (ink + ink2) beats a colour highlight.
- **Two size regimes:** small, quiet text with lots of space, or one big word or number. No mid-size shouting.
- **Never:** serif, condensed or heavy caps, weight 700+, italics or emoji.

**Scale and realism.**
- The subject (a real-looking UI piece, chart or object) fills most of the frame: 60–80% of the width at 16:9.
- Calm and precise motion, real interactions: cursor clicks, state changes, morphs.

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

## Templates (approved 2026-10-21)

Templates are short designed films, not UI loops: 4–6 full-frame shots cut on a steady rhythm, in the look of the
OpenAI specimen, the Figma films and our Figma, Spotify and Elon films. Users change the words, upload their logo and
screenshots, pick a colourway and export. The 44 components above stay in the library as Elements.

Look frames: `E:/Breeders/out/Breeders-Templates-look-frames.png`. Toolkit: `src/motion/film.tsx`.

**Shape of a template**
- `category: "templates"`, `ratios: ["16:9", "9:16"]` (16:9 first; it is the main film).
- 180–300 frames at 30fps (6–10s), one of `TEMPLATE_DURATIONS`. Not a loop: it ends on the logo or title card,
  held still for the last `FINAL_HOLD` frames.
- Shots are hard cuts at fixed frames (`useShot(starts)`, default `SHOT` = 45f). Motion inside a shot uses the kit
  curves; nothing drifts aimlessly. One idea per shot, readable in a still.
- **9:16 is designed, not squeezed.** Branch on `isVertical` and lay each shot out again: stack instead of row,
  bigger type relative to the width, screenshots swapped for the phone screen where that reads better.

**Colour.** Each shot is one flat field from `FILM` (black, white, cream, canvas grey, lavender, lime, deep green,
plum) with black or white type; `FILM.select` for selection boxes, `FILM.orange` only for data or a call to action.
No gradients, glows or tinted darks. Ship 3–4 palettes; each changes the field colours together.

**Type.** Inter only: 500 for statements, 600 for one key word, tracking −0.03 to −0.045em at display sizes, sentence
case. Statement type is big: 96–140u on 16:9, 88–120u on 9:16. Geist Mono only for tiny labels and code texture.

**Uploads.** Use `image` controls for the logo and screenshots, defaulting to `SAMPLE.logo`, `SAMPLE.site` and
`SAMPLE.phone`. Render them only through `Logo` and `Screenshot` (or Remotion's `Img`) so uploads of any size and
aspect ratio still look right: a logo is sized by height; a screenshot fills its frame's width and crops from the top.
Keep the brand name as a separate `text` control (default `SAMPLE.brand`).

**Toolkit (`film.tsx`)**
- `useShot(starts)` → `{ index, local, length }` for the current shot.
- `CodeTexture` dim monospace code on black (Figma film openers).
- `Cursor` multiplayer cursor with a name tag (`CURSOR_COLORS`); `SelectionBox` hairline frame, handles, size tag.
- `Logo` uploaded mark plus name, or an initial tile; `Screenshot` top-cropped image in a rounded frame.

**Controls.** 6–10: the statement lines and brand name (`text`, with `maxLength`), the image slots, the 2–3 field
colours (`color`), and pace (`number`, frames per shot) if the template allows it.

**Prompt.** Describe the film shot by shot with frame ranges, exact colours, type sizes and curves. Refer to uploads
as "the user's logo file" / "the user's screenshot"; never paste an image URL into the prompt.

**Cursors and selection boxes are optional and placeable (2026-10-21).** Any template that shows a cursor or a
selection box gives users:
- Toggles: `showCursor` and `showSelection` (`toggle`, default `true`). Off means it isn't drawn at all; the rest of
  the shot still plays (a button still presses, a camera still zooms).
- Placements (`area` / `point` controls, values parsed with `parseArea` / `parsePoint` from `src/motion/placement.ts`):
  - `image` is the key of the image prop the placement sits on. `aspect` is the slot's width / height exactly as
    the template draws it (16 / 10 for a 16:10 screenshot frame, 600 / 1300 for a 600×1300 phone frame). The
    editor shows the image the way `Screenshot` does, width-fitted and cropped from the top, so fractions are of the
    visible slot.
  - One key per ratio, because each ratio shows a different image: e.g. `clickPoint` with `ratio: "16:9"` on
    `screenshot`, and `clickPointTall` with `ratio: "9:16"` on `phoneShot`.
  - `when` is the toggle that reveals it, e.g. `when: "showCursor"`.
  - Defaults are tuned to the sample images and exported as constants. Map fractions onto the drawn slot with
    `areaOn` / `pointOn`. Clamp anything derived (zoom, pan) so the camera never leaves the image.
- The prompt states the placement in % (`areaText` / `pointText`) and says whether cursors and selection are shown.
