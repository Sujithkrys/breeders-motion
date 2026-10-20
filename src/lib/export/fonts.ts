// The browser exporter rasterises inline SVG on its own, where the page's next/font faces aren't visible, so SVG
// <text> would fall back to a serif. Registering Geist with Remotion lets the exporter embed it into those SVGs.
// Family names match what next/font/google declares, so computed `font-family` values resolve to these faces.
import { loadFont } from "@remotion/fonts";

let ready: Promise<unknown> | null = null;

export const ensureExportFonts = () =>
  (ready ??= Promise.all([
    loadFont({ family: "Geist", url: "/fonts/Geist-Variable.woff2", weight: "100 900" }),
    loadFont({ family: "Geist Mono", url: "/fonts/GeistMono-Variable.woff2", weight: "100 900" }),
  ]).catch((error) => {
    ready = null;
    throw error;
  }));
