// The browser exporter rasterises inline SVG on its own, where the page's next/font faces aren't visible, so SVG
// <text> would fall back to a serif. Registering Inter and Geist Mono with Remotion lets the exporter embed them into
// those SVGs. Family names match what next/font/google declares, so computed `font-family` values resolve to them.
import { loadFont } from "@remotion/fonts";

let ready: Promise<unknown> | null = null;

export const ensureExportFonts = () =>
  (ready ??= Promise.all([
    loadFont({ family: "Inter", url: "/fonts/Inter-Variable.woff2", weight: "100 900" }),
    loadFont({ family: "Geist Mono", url: "/fonts/GeistMono-Variable.woff2", weight: "100 900" }),
  ]).catch((error) => {
    ready = null;
    throw error;
  }));
