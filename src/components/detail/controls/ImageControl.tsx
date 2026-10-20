"use client";
import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import type { ControlDef } from "@/motion/types";
import { FIELD_LABEL, GHOST_BUTTON, cx } from "../ui";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 20 * 1024 * 1024;
const SVG_RASTER = 1024; // px on the long side

// The exporter draws an <img> at its intrinsic size, and an SVG without width/height has none (it crops to a corner).
// So SVG uploads are sized from their viewBox and rasterised to a PNG once, on upload.
const rasteriseSvg = async (file: File): Promise<Blob> => {
  const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg") throw new Error("Not an SVG");
  const box = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  const w0 = box.length === 4 && box[2] > 0 ? box[2] : parseFloat(svg.getAttribute("width") ?? "") || 1;
  const h0 = box.length === 4 && box[3] > 0 ? box[3] : parseFloat(svg.getAttribute("height") ?? "") || 1;
  const k = SVG_RASTER / Math.max(w0, h0);
  const w = Math.round(w0 * k);
  const h = Math.round(h0 * k);
  if (box.length !== 4) svg.setAttribute("viewBox", `0 0 ${w0} ${h0}`);
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Raster failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
};

type ImageControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "image" }>;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
};

// The upload stays in this browser as a blob: URL; the player and the exporter read it directly.
export function ImageControl({ id, control, value, fallback, onChange }: ImageControlProps) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const isOwn = value.startsWith("blob:");

  // Release the previous upload once it has been replaced or reset. Not on unmount: switching tabs unmounts
  // this field while the player keeps showing the image.
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current !== value && previous.current.startsWith("blob:")) URL.revokeObjectURL(previous.current);
    previous.current = value;
  }, [value]);

  const take = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) return setError("Use a PNG, JPG, WebP or SVG.");
    if (file.size > MAX_BYTES) return setError("Keep the file under 20 MB.");
    let blob: Blob = file;
    if (file.type === "image/svg+xml") {
      try {
        blob = await rasteriseSvg(file);
      } catch {
        return setError("This SVG couldn't be read. Try a PNG.");
      }
    }
    setError(null);
    setName(file.name);
    onChange(URL.createObjectURL(blob));
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {control.label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files[0]);
        }}
        className={cx("flex min-w-0 items-center gap-2.5 rounded-[12px] border border-dashed p-1.5 transition-colors", dragging ? "border-accent bg-sel" : "border-line-2")}
      >
        <span className="checker flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-line">
          {value && <img src={value} alt="" className="size-full object-contain" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-ink">{isOwn ? (name ?? "Your image") : "Sample"}</p>
          <p className={cx("truncate text-[11px]", error ? "text-red-500" : "text-ink-3")}>{error ?? control.hint ?? "Drop a file or upload"}</p>
        </div>
        {isOwn && (
          <button type="button" aria-label={`Use the sample ${control.label.toLowerCase()}`} onClick={() => onChange(fallback)} className={cx(GHOST_BUTTON, "w-[34px] justify-center px-0")}>
            <X size={14} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => input.current?.click()} className={GHOST_BUTTON}>
          <ImageUp size={14} aria-hidden />
          Upload
        </button>
        <input
          ref={input}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            take(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
