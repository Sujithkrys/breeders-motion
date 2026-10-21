"use client";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { ControlDef } from "@/motion/types";
import { MIN_AREA, areaText, areaValue, parseArea, parsePoint, pointText, pointValue, type Area, type Point } from "@/motion/placement";
import { FIELD_LABEL, FOCUS_RING, cx } from "../ui";

const SELECT = "#0D99FF"; // the selection blue the templates draw with
const TALL_HEIGHT = 300; // px: tall images (phone screens) are fitted to this height instead of the panel width
const FALLBACK_AREA: Area = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
const FALLBACK_POINT: Point = { x: 0.5, y: 0.5 };

type Corner = "nw" | "ne" | "sw" | "se";
type Drag =
  | { mode: "move"; x0: number; y0: number; area: Area }
  | { mode: Corner; x0: number; y0: number; area: Area }
  | { mode: "draw"; ax: number; ay: number }
  | { mode: "point"; x0: number; y0: number; point: Point };

type PlacementControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "area" | "point" }>;
  value: string;
  fallback: string;
  src: string;
  onChange: (value: string) => void;
};

// Drag a box (move it, pull a corner, or draw a new one on empty image) or drag the cursor, over the user's own image
// shown in the template's slot shape.
// Arrow keys nudge the focused box or cursor by 1% (10% with Shift).
export function PlacementControl({ id, control, value, fallback, src, onChange }: PlacementControlProps) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const aspect = control.aspect;
  const isArea = control.type === "area";
  const area = parseArea(value, parseArea(fallback, FALLBACK_AREA));
  const point = parsePoint(value, parsePoint(fallback, FALLBACK_POINT));
  const tall = aspect < 1;

  const toFraction = (e: PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const start = (e: PointerEvent<HTMLElement>, d: Drag) => {
    e.preventDefault();
    e.stopPropagation();
    frame.current!.setPointerCapture(e.pointerId);
    drag.current = d;
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const f = toFraction(e);
    if (d.mode === "point") {
      onChange(pointValue({ x: d.point.x + f.x - d.x0, y: d.point.y + f.y - d.y0 }));
      return;
    }
    if (d.mode === "draw") {
      onChange(areaValue({ x: Math.min(d.ax, f.x), y: Math.min(d.ay, f.y), w: Math.abs(f.x - d.ax), h: Math.abs(f.y - d.ay) }));
      return;
    }
    const dx = f.x - d.x0;
    const dy = f.y - d.y0;
    const a = d.area;
    if (d.mode === "move") {
      onChange(areaValue({ ...a, x: a.x + dx, y: a.y + dy }));
      return;
    }
    // A corner moves two edges; the opposite corner stays put.
    let l = a.x;
    let t = a.y;
    let r = a.x + a.w;
    let b = a.y + a.h;
    if (d.mode.includes("w")) l = Math.min(r - MIN_AREA, Math.max(0, l + dx));
    if (d.mode.includes("e")) r = Math.max(l + MIN_AREA, Math.min(1, r + dx));
    if (d.mode.includes("n")) t = Math.min(b - MIN_AREA, Math.max(0, t + dy));
    if (d.mode.includes("s")) b = Math.max(t + MIN_AREA, Math.min(1, b + dy));
    onChange(areaValue({ x: l, y: t, w: r - l, h: b - t }));
  };

  const end = (e: PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    if (frame.current?.hasPointerCapture(e.pointerId)) frame.current.releasePointerCapture(e.pointerId);
  };

  // Empty image: in area mode a press draws a new box from that spot; in point mode the cursor jumps there.
  const pressFrame = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const f = toFraction(e);
    if (isArea) start(e, { mode: "draw", ax: f.x, ay: f.y });
    else {
      onChange(pointValue(f));
      start(e, { mode: "point", x0: f.x, y0: f.y, point: f });
    }
  };

  const nudge = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    if (isArea) onChange(areaValue({ ...area, x: area.x + d[0], y: area.y + d[1] }));
    else onChange(pointValue({ x: point.x + d[0], y: point.y + d[1] }));
  };

  const corners: { c: Corner; left: string; top: string; cursor: string }[] = [
    { c: "nw", left: "0%", top: "0%", cursor: "nwse-resize" },
    { c: "ne", left: "100%", top: "0%", cursor: "nesw-resize" },
    { c: "sw", left: "0%", top: "100%", cursor: "nesw-resize" },
    { c: "se", left: "100%", top: "100%", cursor: "nwse-resize" },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span id={`${id}-label`} className={FIELD_LABEL}>
          {control.label}
        </span>
        <button
          type="button"
          onClick={() => onChange(fallback)}
          disabled={value === fallback}
          className={cx("rounded text-[12px] font-medium text-ink-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40", FOCUS_RING)}
        >
          Reset
        </button>
      </div>
      <div
        ref={frame}
        onPointerDown={pressFrame}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="checker relative touch-none overflow-hidden rounded-[10px] border border-line select-none"
        style={{ aspectRatio: `${aspect}`, width: tall ? "auto" : "100%", height: tall ? TALL_HEIGHT : "auto", margin: tall ? "0 auto" : undefined, cursor: isArea ? "crosshair" : "default" }}
      >
        {src && (
          // Width-fitted and cropped from the top, exactly as the template's Screenshot slot draws it.
          <img src={src} alt="" draggable={false} className="pointer-events-none absolute top-0 left-0 block h-auto w-full bg-white" />
        )}
        {isArea ? (
          <div
            role="group"
            tabIndex={0}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-help`}
            onKeyDown={nudge}
            onPointerDown={(e) => {
              const f = toFraction(e);
              start(e, { mode: "move", x0: f.x, y0: f.y, area });
            }}
            className={cx("absolute cursor-move", FOCUS_RING)}
            style={{
              left: `${area.x * 100}%`,
              top: `${area.y * 100}%`,
              width: `${area.w * 100}%`,
              height: `${area.h * 100}%`,
              boxShadow: `inset 0 0 0 1.5px ${SELECT}, 0 0 0 9999px rgba(0, 0, 0, 0.32)`,
            }}
          >
            {corners.map(({ c, left, top, cursor }) => (
              <span
                key={c}
                onPointerDown={(e) => {
                  const f = toFraction(e);
                  start(e, { mode: c, x0: f.x, y0: f.y, area });
                }}
                className="absolute size-[11px] -translate-x-1/2 -translate-y-1/2 bg-white"
                style={{ left, top, cursor, boxShadow: `inset 0 0 0 1.5px ${SELECT}` }}
              />
            ))}
          </div>
        ) : (
          <div
            role="group"
            tabIndex={0}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-help`}
            onKeyDown={nudge}
            onPointerDown={(e) => {
              const f = toFraction(e);
              start(e, { mode: "point", x0: f.x, y0: f.y, point });
            }}
            className={cx("absolute size-9 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full active:cursor-grabbing", FOCUS_RING)}
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, background: "rgba(13, 153, 255, 0.18)", boxShadow: `inset 0 0 0 1.5px ${SELECT}` }}
          >
            {/* the arrow's tip sits exactly on the point */}
            <svg width={18} height={24} viewBox="0 0 16 22" className="pointer-events-none absolute" style={{ left: "50%", top: "50%" }}>
              <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill="#111111" stroke="#FFFFFF" strokeWidth={1.3} strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <p id={`${id}-help`} className="relative font-mono text-[11px] text-ink-3">
        <span className="sr-only">
          {isArea ? "Drag to move, drag a corner to resize, or draw a new box on the image. Arrow keys nudge. " : "Drag the cursor, or click the image to place it. Arrow keys nudge. "}
        </span>
        {isArea ? areaText(area) : pointText(point)}
        {control.hint ? ` · ${control.hint}` : ""}
      </p>
    </div>
  );
}
