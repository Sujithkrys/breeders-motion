// In-browser rendering for the Export tab. Every function runs on the visitor's device: MP4 and WebM go through
// renderMediaOnWeb (WebCodecs); GIF and PNG sequences render one still per frame and encode them here.
// Import this module dynamically from client code: it pulls in the renderer and both encoders.
import type { ComponentType } from "react";
import { canRenderMediaOnWeb, renderMediaOnWeb, renderStillOnWeb, type CanRenderIssue, type WebRendererContainer, type WebRendererVideoCodec } from "@remotion/web-renderer";
import { Zip, ZipPassThrough } from "fflate";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { RATIO_SIZE, type AnyMotionDef, type MotionProps, type Ratio } from "@/motion/types";
import { ensureExportFonts } from "./fonts";
import { withMatte } from "./matte";
import type { ExportFormat, GifFps } from "./formats";

export type ProgressCallback = (fraction: number) => void;

type RenderBase = {
  def: AnyMotionDef;
  props: MotionProps;
  ratio: Ratio;
  signal: AbortSignal;
  onProgress: ProgressCallback;
};

const VIDEO_BITRATE = "high" as const;

const VIDEO_SETTINGS: Record<"mp4" | "webm", { container: WebRendererContainer; videoCodec: WebRendererVideoCodec }> = {
  mp4: { container: "mp4", videoCodec: "h264" },
  webm: { container: "webm", videoCodec: "vp9" },
};

const compositionFor = (def: AnyMotionDef, ratio: Ratio, opaque: boolean) => {
  const { width, height } = RATIO_SIZE[ratio];
  const component = def.component as ComponentType<MotionProps>;
  return {
    id: def.slug,
    component: opaque ? withMatte(component) : component,
    width,
    height,
    fps: def.fps,
    durationInFrames: def.durationInFrames,
    defaultProps: def.defaultProps as MotionProps,
  };
};

// Every component paints its root from `props.background`, so this is all transparency needs.
export const renderProps = (props: MotionProps, transparent: boolean): MotionProps =>
  transparent ? { ...props, background: "transparent" } : props;

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ---- support check

export type SupportResult = { ok: true } | { ok: false; message: string };

const videoIssueMessage = (issue: CanRenderIssue, format: "mp4" | "webm", scale: number): string => {
  const name = format === "mp4" ? "MP4" : "WebM";
  const other = format === "mp4" ? "WebM" : "MP4";
  switch (issue.type) {
    case "webcodecs-unavailable":
      return "Your browser can't encode video here. Try Chrome or Edge, or export a GIF or PNG sequence.";
    case "video-codec-unsupported":
      return scale > 1
        ? `Your browser can't encode ${name} at 4K. Try 1080p, or use Chrome or Edge.`
        : `Your browser can't encode ${name} here. Try Chrome or Edge, or choose ${other}.`;
    case "transparent-video-unsupported":
      return "Transparent video needs WebM. Turn transparency off, or choose WebM.";
    case "invalid-dimensions":
      return "That size is too large for your browser's video encoder. Try a smaller resolution.";
    case "webgl-unsupported":
      return "This export needs WebGL, which is turned off or unavailable in your browser.";
    default:
      return issue.message;
  }
};

export async function checkExportSupport({
  format,
  ratio,
  scale,
  transparent,
}: {
  format: ExportFormat;
  ratio: Ratio;
  scale: number;
  transparent: boolean;
}): Promise<SupportResult> {
  if (format === "gif" || format === "png") {
    return typeof OffscreenCanvas === "undefined"
      ? { ok: false, message: "Your browser can't render frames here. Try a recent Chrome, Edge, Firefox or Safari." }
      : { ok: true };
  }
  const { width, height } = RATIO_SIZE[ratio];
  try {
    const result = await canRenderMediaOnWeb({
      ...VIDEO_SETTINGS[format],
      width,
      height,
      scale,
      transparent,
      muted: true,
      videoBitrate: VIDEO_BITRATE,
    });
    if (result.canRender) return { ok: true };
    const blocking = result.issues.find((i) => i.severity === "error") ?? result.issues[0];
    return {
      ok: false,
      message: blocking ? videoIssueMessage(blocking, format, scale) : `Your browser can't export ${format.toUpperCase()} here. Try Chrome or Edge.`,
    };
  } catch {
    return { ok: false, message: "Your browser can't encode video here. Try Chrome or Edge, or export a GIF or PNG sequence." };
  }
}

// ---- MP4 / WebM

export async function renderVideo({
  def,
  props,
  ratio,
  format,
  scale,
  transparent,
  signal,
  onProgress,
}: RenderBase & { format: "mp4" | "webm"; scale: number; transparent: boolean }): Promise<Blob> {
  const alpha = format === "webm" && transparent;
  await ensureExportFonts();
  const result = await renderMediaOnWeb({
    composition: compositionFor(def, ratio, !alpha),
    inputProps: renderProps(props, alpha),
    ...VIDEO_SETTINGS[format],
    transparent: alpha,
    muted: true,
    scale,
    videoBitrate: VIDEO_BITRATE,
    signal,
    onProgress: (p) => onProgress(p.progress),
  });
  return result.getBlob();
}

// ---- GIF

export async function renderGif({
  def,
  props,
  ratio,
  scale,
  gifFps,
  signal,
  onProgress,
}: RenderBase & { scale: number; gifFps: GifFps }): Promise<Blob> {
  const composition = compositionFor(def, ratio, true);
  await ensureExportFonts();
  const step = Math.max(1, Math.round(def.fps / gifFps));
  const frames: number[] = [];
  for (let f = 0; f < def.durationInFrames; f += step) frames.push(f);

  const frameMs = (step * 1000) / def.fps;
  const encoder = GIFEncoder();
  let elapsedMs = 0;

  for (let i = 0; i < frames.length; i++) {
    signal.throwIfAborted();
    const still = await renderStillOnWeb({ composition, inputProps: props, frame: frames[i], scale, signal });
    const canvas = await still.canvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't read the rendered frame.");
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    // GIF delays are whole centiseconds; carry the rounding forward so the loop keeps its real length.
    const endMs = Math.round(((i + 1) * frameMs) / 10) * 10;
    encoder.writeFrame(index, width, height, { palette, delay: endMs - elapsedMs, repeat: 0 });
    elapsedMs = endMs;
    onProgress((i + 1) / frames.length);
    await nextTask();
  }

  signal.throwIfAborted();
  encoder.finish();
  return new Blob([encoder.bytes()], { type: "image/gif" });
}

// ---- PNG sequence (.zip)

export async function renderPngZip({
  def,
  props,
  ratio,
  scale,
  transparent,
  signal,
  onProgress,
}: RenderBase & { scale: number; transparent: boolean }): Promise<Blob> {
  const composition = compositionFor(def, ratio, !transparent);
  const inputProps = renderProps(props, transparent);
  await ensureExportFonts();
  const total = def.durationInFrames;
  const digits = Math.max(4, String(total).length);

  const parts: Uint8Array<ArrayBuffer>[] = [];
  const zipState: { error: Error | null; done: boolean } = { error: null, done: false };
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      zipState.error = err;
      return;
    }
    // fflate allocates plain ArrayBuffers; the cast only narrows the generic for the Blob constructor.
    parts.push(chunk as Uint8Array<ArrayBuffer>);
    if (final) zipState.done = true;
  });

  try {
    for (let frame = 0; frame < total; frame++) {
      signal.throwIfAborted();
      const still = await renderStillOnWeb({ composition, inputProps, frame, scale, signal });
      const png = await still.blob({ format: "png" });
      const bytes = new Uint8Array(await png.arrayBuffer());
      // PNGs are already compressed, so store them as-is instead of deflating again.
      const entry = new ZipPassThrough(`frame-${String(frame + 1).padStart(digits, "0")}.png`);
      zip.add(entry);
      entry.push(bytes, true);
      if (zipState.error) throw zipState.error;
      onProgress((frame + 1) / total);
      await nextTask();
    }
    signal.throwIfAborted();
    zip.end();
  } catch (err) {
    zip.terminate();
    throw err;
  }

  if (zipState.error) throw zipState.error;
  if (!zipState.done) throw new Error("The zip archive didn't finish writing.");
  return new Blob(parts, { type: "application/zip" });
}
