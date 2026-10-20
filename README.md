# Breeders Motion

A free, public library of motion components. Browse the grid, open a component, and then:

- **copy the prompt**: a precise build prompt written from the component's current settings, for Claude Code, React + Framer Motion or plain CSS;
- **take the code**: the real Remotion source of the component;
- **edit and export**: recolour it, change its text and motion, and render MP4, WebM, GIF or a PNG sequence in your browser.

Every component is a live [Remotion](https://www.remotion.dev) component, not a video file. The site plays it with
`@remotion/player` and exports it with `@remotion/web-renderer`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4, with theme tokens in `src/app/globals.css`
- Remotion 4: `remotion`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/three` with three.js and React Three Fiber
- `cmdk` (command menu), `lucide-react` (icons), `sugar-high` (code highlighting)
- `gifenc` (GIF encoding) and `fflate` (zipping PNG sequences) for export

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

`npm run gen` regenerates `src/motion/sources.generated.ts`, the component sources shown in the Code tab. It also runs
automatically before `dev`, `build` and `typecheck`.

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Development server                                  |
| `npm run build`     | Production build                                    |
| `npm run start`     | Serve the production build                          |
| `npm run typecheck` | Regenerate sources, then `tsc --noEmit`             |
| `npm run gen`       | Regenerate the Code-tab sources only                |

Set `NEXT_PUBLIC_SITE_URL` to your deployed URL so the sitemap, robots file and Open Graph tags point at it
(see `src/lib/site.ts`).

## Project structure

```
src/
  app/                      routes, layout, theme tokens, sitemap, robots, icon and Open Graph image
    components/[slug]/      the component page
  components/
    library/                the browsable grid, sidebar and filters
    detail/                 the component page: stage, player, Prompt / Code / Edit / Export tabs
    shell/                  shared chrome: logo, theme toggle, command menu
  lib/
    export/                 in-browser rendering (video, GIF, PNG zip) and download helpers
    prefs.ts                theme and saved components (localStorage)
    site.ts                 site name, URL and repo
  motion/
    types.ts                the MotionDef contract
    kit.ts                  shared timing, easing and layout helpers
    registry.ts             every component, sorted newest first
    batches/                one file per batch of components
    items/<slug>/           one folder per component
scripts/gen-sources.mjs     builds sources.generated.ts for the Code tab
docs/                       guides for contributors
```

## How a component works

Each component lives in `src/motion/items/<slug>/` and exports a `MotionDef` from `index.ts`: the Remotion component,
its default props, palettes, Edit-tab controls, supported ratios, and a `prompt()` function that writes the copy-ready
prompt from the current props. The site only talks to components through that definition, so adding one never touches
site code.

Read [docs/BUILDING-COMPONENTS.md](docs/BUILDING-COMPONENTS.md) for the full contract and quality bar, and
[docs/ADDING-A-COMPONENT.md](docs/ADDING-A-COMPONENT.md) for the short checklist.

## Export notes

Exports render entirely on the visitor's device. Nothing is uploaded.

- **MP4** (H.264) and **WebM** (VP9) use `renderMediaOnWeb`, which needs the WebCodecs API. Chromium browsers
  (Chrome, Edge, Arc, Brave) work best. Other browsers may not be able to encode one or both codecs; the Export tab checks
  first and says so.
- **Transparent backgrounds** work for WebM and PNG sequences: the component is rendered with `background: "transparent"`.
- **GIF** renders one still per frame and encodes it with `gifenc`, capped at 720px on the long side, at 15 or 30 fps.
- **PNG sequence** renders one PNG per frame and zips them as `frame-0001.png` onwards.
- **4K** works, but takes noticeably longer and uses much more memory in the browser.
- Each render also sends Remotion's usage event (`@remotion/licensing`) to remotion.pro; no frames or files are sent.

## Licensing

The site's code is in this repository. Remotion itself is **not** open source under a permissive licence: it uses the
[Remotion License](https://www.remotion.dev/license) (see `node_modules/@remotion/web-renderer/LICENSE.md`).

In short, according to that file, you can use Remotion for free, including commercially, if you are:

- an individual
- a for-profit organization with up to 3 employees
- a non-profit or not-for-profit organization
- evaluating whether Remotion is a good fit, and not yet using it in a commercial way

Everyone else needs a **Company License** ([remotion.pro](https://www.remotion.pro/license)). The licence also says
it is not allowed to copy or modify Remotion code to sell, rent, license, relicense or sublicense your own derivative
of Remotion. The file notes that the licence will change slightly in Remotion 5.0.

If you copy a component's code into your own project, these Remotion terms apply to your use of Remotion there. Read
the full licence before relying on this summary.
