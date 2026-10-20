# Adding a component

A short checklist. The full contract, rules and quality bar are in [BUILDING-COMPONENTS.md](BUILDING-COMPONENTS.md);
read it first.

1. **Create the folder** `src/motion/items/<slug>/`, where `<slug>` is kebab-case and unique.
2. **Write the component** in `<Name>.tsx`: an `<AbsoluteFill>` painted with `props.background`, driven only by
   `useCurrentFrame()`, with sizes written as `n * u` from `useLayout()`, and export-safe CSS only.
3. **Define it** in `index.ts` with `defineMotion<Props>({...})`: metadata, 4–6 palettes, `defaultProps` that spread the
   first palette, 4–7 controls, `ratios`, and a `prompt()` written from the current props.
4. **Register it**: import it in your batch file `src/motion/batches/<batch>.ts` and append it to the `batch` array.
5. **Check it in the site** with `npm run dev`: play it at every listed ratio, try every palette and both ends of every
   control, read the prompt, and confirm the Code tab shows your files (`npm run gen` refreshes them).
6. **Export it once** from the Export tab (MP4 and a transparent WebM or PNG sequence) to confirm it renders the
   same as the preview, then run `npm run typecheck`.
