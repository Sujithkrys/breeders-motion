"use client";
// The Export tab: pick a format and size, render on the visitor's device, and download the file.
// The renderer and encoders load on first use (dynamic import), so the component page stays light.
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Download } from "lucide-react";
import type { AnyMotionDef, MotionProps, Ratio } from "@/motion/types";
import {
  EXPORT_FORMATS,
  GIF_FPS_OPTIONS,
  GIF_MAX_SIDE,
  RESOLUTIONS,
  exportFileName,
  exportScale,
  formatInfo,
  outputSize,
  type ExportFormat,
  type GifFps,
  type ResolutionId,
} from "@/lib/export/formats";
import { downloadBlob, formatBytes, formatElapsed } from "@/lib/export/download";
import type { SupportResult } from "@/lib/export/render";

type Job =
  | { status: "idle" }
  | { status: "rendering"; progress: number; startedAt: number }
  | { status: "done"; key: string; blob: Blob; fileName: string }
  | { status: "error"; key: string; message: string };

const loadRenderer = () => import("@/lib/export/render");

const readableError = (err: unknown) => {
  const raw = err instanceof Error ? err.message : String(err);
  if (/delayRender|timed? ?out/i.test(raw)) return "A frame took too long to get ready, so the export stopped. Try again, or pick a smaller size.";
  if (/out of memory|allocation failed|array buffer allocation/i.test(raw)) return "Your browser ran out of memory. Try a smaller resolution.";
  return `Export failed: ${raw.length > 220 ? `${raw.slice(0, 220)}…` : raw}`;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{children}</span>
);

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-[3px] rounded-[10px] bg-chip p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`h-8 flex-1 rounded-[7px] text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
              on ? "bg-pill text-ink shadow-pill" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-line bg-code p-3.5 text-[13px] leading-[1.5] text-ink-2">
      <CircleAlert aria-hidden className="mt-[2px] size-4 shrink-0 text-ink-3" />
      <p className="m-0">{children}</p>
    </div>
  );
}

export function ExportTab({ def, props, ratio }: { def: AnyMotionDef; props: MotionProps; ratio: Ratio }) {
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [resolution, setResolution] = useState<ResolutionId>("1080p");
  const [transparentOn, setTransparentOn] = useState(false);
  const [gifFps, setGifFps] = useState<GifFps>(15);
  const [support, setSupport] = useState<{ key: string; result: SupportResult } | null>(null);
  const [job, setJob] = useState<Job>({ status: "idle" });
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const info = formatInfo(format);
  const alpha = transparentOn && info.supportsTransparency;
  const scale = exportScale(format, ratio, resolution);
  const size = outputSize(ratio, scale);
  const fileName = exportFileName(def.slug, size, format);
  const rendering = job.status === "rendering";

  // A finished render or error only applies to the exact settings and props it was made with.
  const propsKey = useMemo(() => JSON.stringify(props), [props]);
  const settingsKey = `${def.slug}|${ratio}|${format}|${scale}|${alpha}|${format === "gif" ? gifFps : ""}|${propsKey}`;
  const done = job.status === "done" && job.key === settingsKey ? job : null;
  const failed = job.status === "error" && job.key === settingsKey ? job : null;

  const supportKey = `${ratio}|${format}|${scale}|${alpha}`;
  const supportResult = support?.key === supportKey ? support.result : null;
  const unsupported = supportResult && !supportResult.ok ? supportResult.message : null;

  useEffect(() => {
    let stale = false;
    loadRenderer()
      .then(({ checkExportSupport }) => checkExportSupport({ format, ratio, scale, transparent: alpha }))
      .then((result) => {
        if (!stale) setSupport({ key: supportKey, result });
      })
      .catch(() => {
        if (!stale) setSupport({ key: supportKey, result: { ok: false, message: "The exporter couldn't load. Refresh the page and try again." } });
      });
    return () => {
      stale = true;
    };
  }, [supportKey, format, ratio, scale, alpha]);

  useEffect(() => {
    if (!rendering) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [rendering]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = async () => {
    if (rendering) return;
    if (done) {
      downloadBlob(done.blob, done.fileName);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();
    const key = settingsKey;
    const name = fileName;
    setNow(startedAt);
    setJob({ status: "rendering", progress: 0, startedAt });

    const onProgress = (fraction: number) =>
      setJob((j) => (j.status === "rendering" && j.startedAt === startedAt ? { ...j, progress: Math.max(j.progress, Math.min(1, fraction)) } : j));

    try {
      const renderer = await loadRenderer();
      const base = { def, props, ratio, signal: controller.signal, onProgress };
      const blob =
        format === "gif"
          ? await renderer.renderGif({ ...base, scale, gifFps })
          : format === "png"
            ? await renderer.renderPngZip({ ...base, scale, transparent: alpha })
            : await renderer.renderVideo({ ...base, format, scale, transparent: alpha });
      if (controller.signal.aborted) return;
      downloadBlob(blob, name);
      setJob({ status: "done", key, blob, fileName: name });
    } catch (err) {
      if (controller.signal.aborted) return;
      setJob({ status: "error", key, message: readableError(err) });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setJob({ status: "idle" });
  };

  const percent = job.status === "rendering" ? Math.round(job.progress * 100) : 0;
  const elapsed = job.status === "rendering" ? formatElapsed(now - job.startedAt) : "";
  const buttonLabel = done ? "Done · Download again" : `Render ${info.label} · ${format === "gif" ? `${gifFps} fps` : resolution}`;
  const sizeHint =
    format === "gif"
      ? `${size.width} × ${size.height}. GIFs are capped at ${GIF_MAX_SIDE}px on the long side.`
      : `${size.width} × ${size.height}. ${resolution === "4K" ? "4K renders in your browser but takes noticeably longer." : "Render time depends on your device; keep this tab open."}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <SectionLabel>Format</SectionLabel>
        <div role="radiogroup" aria-label="Format" className="grid grid-cols-2 gap-2">
          {EXPORT_FORMATS.map((f) => {
            const on = f.id === format;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={rendering}
                onClick={() => setFormat(f.id)}
                className={`flex h-[58px] flex-col justify-center gap-0.5 rounded-[11px] border px-3.5 text-left text-ink transition-colors disabled:cursor-not-allowed ${
                  on ? "border-accent bg-accent/10" : "border-line-2 bg-transparent hover:bg-chip"
                }`}
              >
                <span className="text-[14px] font-semibold">{f.label}</span>
                <span className="truncate text-[12px] text-ink-2">{alpha && on && f.noteTransparent ? f.noteTransparent : f.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {format === "gif" ? (
          <>
            <SectionLabel>Frame rate</SectionLabel>
            <Segmented
              label="Frame rate"
              options={GIF_FPS_OPTIONS.map((fps) => ({ value: fps, label: `${fps} fps` }))}
              value={gifFps}
              onChange={setGifFps}
              disabled={rendering}
            />
          </>
        ) : (
          <>
            <SectionLabel>Resolution</SectionLabel>
            <Segmented
              label="Resolution"
              options={RESOLUTIONS.map((r) => ({ value: r.id, label: r.id }))}
              value={resolution}
              onChange={setResolution}
              disabled={rendering}
            />
          </>
        )}
        <p className="m-0 text-[12px] text-ink-3">{sizeHint}</p>
      </div>

      <div className={`flex items-center justify-between gap-4 ${info.supportsTransparency ? "" : "opacity-50"}`}>
        <div className="flex flex-col gap-0.5">
          <span id="export-transparent-label" className="text-[13px] font-medium text-ink">
            Transparent background
          </span>
          <span className="text-[12px] text-ink-3">{info.supportsTransparency ? "Exports with an alpha channel" : "WebM and PNG only"}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={alpha}
          aria-labelledby="export-transparent-label"
          disabled={!info.supportsTransparency || rendering}
          onClick={() => setTransparentOn((v) => !v)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${alpha ? "bg-accent" : "bg-line-2"}`}
        >
          <span
            aria-hidden
            className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform ${alpha ? "translate-x-4" : ""}`}
          />
        </button>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2.5">
        {unsupported && !rendering ? <Notice>{unsupported}</Notice> : null}

        {job.status === "rendering" ? (
          <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-code p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[13px] text-ink-2">Rendering in your browser…</p>
              <span className="text-[13px] font-medium tabular-nums text-ink">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Export progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 overflow-hidden rounded-[3px] bg-line-2"
            >
              <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] tabular-nums text-ink-3">{elapsed} elapsed</span>
              <button
                type="button"
                onClick={cancel}
                className="h-8 rounded-lg border border-line-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-chip"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={start}
              disabled={!done && (!supportResult || !supportResult.ok)}
              className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {done ? <Download aria-hidden className="size-4" /> : null}
              {buttonLabel}
            </button>
            {done ? (
              <p className="m-0 truncate text-[12px] text-ink-3" title={done.fileName}>
                {done.fileName} · {formatBytes(done.blob.size)}
              </p>
            ) : null}
            {failed ? <Notice>{failed.message}</Notice> : null}
          </>
        )}
      </div>

      <p className="m-0 text-[12px] leading-[1.5] text-ink-3">Rendered on your device. Nothing is uploaded.</p>
    </div>
  );
}
