// Export options and the sizes and file names they produce. Pure data, safe to import on the server.
import { RATIO_SIZE, type Ratio } from "@/motion/types";

export type ExportFormat = "mp4" | "webm" | "gif" | "png";

export type FormatInfo = {
  id: ExportFormat;
  label: string;
  note: string;
  noteTransparent?: string;
  ext: string;
  supportsTransparency: boolean;
};

export const EXPORT_FORMATS: FormatInfo[] = [
  { id: "mp4", label: "MP4", note: "H.264 · for socials", ext: "mp4", supportsTransparency: false },
  { id: "webm", label: "WebM", note: "VP9 · for the web", noteTransparent: "VP9 · transparent background", ext: "webm", supportsTransparency: true },
  { id: "gif", label: "GIF", note: "For docs and chat", ext: "gif", supportsTransparency: false },
  { id: "png", label: "PNG seq", note: "Frames for After Effects", ext: "zip", supportsTransparency: true },
];

export const formatInfo = (id: ExportFormat) => EXPORT_FORMATS.find((f) => f.id === id) ?? EXPORT_FORMATS[0];

export type ResolutionId = "720p" | "1080p" | "4K";

// Scale relative to the composition size in RATIO_SIZE (1080 on the short side).
export const RESOLUTIONS: { id: ResolutionId; scale: number }[] = [
  { id: "720p", scale: 2 / 3 },
  { id: "1080p", scale: 1 },
  { id: "4K", scale: 2 },
];

export const resolutionScale = (id: ResolutionId) => RESOLUTIONS.find((r) => r.id === id)?.scale ?? 1;

export const GIF_MAX_SIDE = 720;
export type GifFps = 15 | 30;
export const GIF_FPS_OPTIONS: GifFps[] = [15, 30];

// GIFs ignore the resolution choice: the long side is capped so files stay small enough for docs and chat.
export const gifScale = (ratio: Ratio) => {
  const { width, height } = RATIO_SIZE[ratio];
  return Math.min(1, GIF_MAX_SIDE / Math.max(width, height));
};

export const exportScale = (format: ExportFormat, ratio: Ratio, resolution: ResolutionId) =>
  format === "gif" ? gifScale(ratio) : resolutionScale(resolution);

export const outputSize = (ratio: Ratio, scale: number) => {
  const { width, height } = RATIO_SIZE[ratio];
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

export const exportFileName = (slug: string, size: { width: number; height: number }, format: ExportFormat) =>
  `breeders-${slug}-${size.width}x${size.height}.${formatInfo(format).ext}`;
