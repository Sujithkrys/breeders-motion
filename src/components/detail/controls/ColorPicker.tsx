"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pipette, Plus, X } from "lucide-react";
import { hslToHsv, hsvToHsl, hsvToRgb, parseHex, rgbToHsv, toHex, type HSV } from "@/lib/color";
import { FOCUS_RING, cx } from "../ui";

const WIDTH = 304;
const GAP = 8;
const MAX_SAVED = 18;
const SAVED_KEY = "breeders.savedColours";
// Until someone saves their own, the row offers the film and system colours the templates are designed around.
const DEFAULT_SAVED = ["#111111", "#FFFFFF", "#F2EFE8", "#E6E6E6", "#C4B9FD", "#E3F79C", "#0C5A2F", "#5B2A5E", "#0D99FF", "#2F5FF5", "#FF5A1F"];
const HUES = "linear-gradient(to right, #F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00)";

type Mode = "HEX" | "RGB" | "HSL";

// Saved colours are a per-viewer convenience, so browser storage is enough; it may be unavailable, hence the guards.
const loadSaved = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "null");
    return Array.isArray(raw) ? raw.filter((c): c is string => typeof c === "string" && !!parseHex(c)) : DEFAULT_SAVED;
  } catch {
    return DEFAULT_SAVED;
  }
};
const storeSaved = (list: string[]) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    // storage blocked: the list still works for this session
  }
};

type EyeDropperResult = { sRGBHex: string };
type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };

type ColorPickerProps = {
  title: string;
  value: string;
  anchor: RefObject<HTMLElement | null>;
  onChange: (hex: string) => void;
  onClose: () => void;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Drag on a track or square: reports the pointer as 0–1 fractions of the element, from press until release.
function usePad(onPick: (x: number, y: number) => void) {
  const pick = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPick(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height));
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pick(e);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
    },
  };
}

// A number field that keeps what you type while focused and commits each valid number.
function NumField({ label, value, min, max, onCommit, suffix }: { label: string; value: number; min: number; max: number; onCommit: (n: number) => void; suffix?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="relative flex h-10 min-w-0 flex-1 items-center border-l border-line first:border-l-0">
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={draft ?? String(Math.round(value))}
        onFocus={(e) => {
          setDraft(String(Math.round(value)));
          e.currentTarget.select();
        }}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const raw = e.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 3);
          setDraft(raw);
          if (raw !== "") onCommit(Math.min(max, Math.max(min, Number(raw))));
        }}
        onKeyDown={(e) => {
          const step = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const next = Math.min(max, Math.max(min, Math.round(value) + step * (e.shiftKey ? 10 : 1)));
          setDraft(String(next));
          onCommit(next);
        }}
        className={cx("h-full w-full min-w-0 bg-transparent text-center font-mono text-[13px] text-ink outline-none", suffix && "pr-4")}
      />
      {suffix && <span className="pointer-events-none absolute right-2 text-[12px] text-ink-3">{suffix}</span>}
    </label>
  );
}

function HexField({ hex, onCommit }: { hex: string; onCommit: (raw: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = hex.slice(1, 7);
  return (
    <label className="flex h-10 min-w-0 flex-[3] items-center gap-1 px-3">
      <span className="text-[13px] text-ink-3">#</span>
      <span className="sr-only">Hex</span>
      <input
        value={draft ?? shown}
        maxLength={6}
        spellCheck={false}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const raw = e.currentTarget.value.replace(/[^0-9a-f]/gi, "");
          setDraft(raw);
          if (raw.length === 6) onCommit(raw);
        }}
        className="h-full w-full min-w-0 bg-transparent font-mono text-[13px] text-ink uppercase outline-none"
      />
    </label>
  );
}

export function ColorPicker({ title, value, anchor, onChange, onClose }: ColorPickerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [mode, setMode] = useState<Mode>("HEX");
  const [saved, setSaved] = useState<string[]>(DEFAULT_SAVED);

  // HSV is the picker's own state, so hue survives greys and black (where the hex value has no hue).
  const initial = parseHex(value) ?? { rgb: { r: 0, g: 0, b: 0 }, a: 1 };
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(initial.rgb));
  const [alpha, setAlpha] = useState(initial.a);
  const emitted = useRef(value.toUpperCase());

  useEffect(() => setSaved(loadSaved()), []);

  // A change from outside (typing in the hex field, a colourway, Reset) re-seeds the picker.
  useEffect(() => {
    if (value.toUpperCase() === emitted.current) return;
    const p = parseHex(value);
    if (!p) return;
    emitted.current = value.toUpperCase();
    const next = rgbToHsv(p.rgb);
    setHsv((cur) => ({ h: next.s === 0 || next.v === 0 ? cur.h : next.h, s: next.s, v: next.v }));
    setAlpha(p.a);
  }, [value]);

  const emit = useCallback(
    (next: HSV, a: number) => {
      setHsv(next);
      setAlpha(a);
      const hex = toHex(hsvToRgb(next), a);
      emitted.current = hex;
      onChange(hex);
    },
    [onChange],
  );

  const hex = toHex(hsvToRgb(hsv), alpha);
  const opaque = toHex(hsvToRgb(hsv));
  const rgb = hsvToRgb(hsv);
  const hsl = hsvToHsl(hsv);

  // Placement: under the swatch, flipped above when there's no room, kept inside the window.
  const place = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect();
    const h = panel.current?.offsetHeight ?? 0;
    if (!a) return;
    const left = Math.min(window.innerWidth - WIDTH - GAP, Math.max(GAP, a.left));
    const below = a.bottom + GAP;
    const top = below + h > window.innerHeight - GAP && a.top - GAP - h > GAP ? a.top - GAP - h : Math.min(below, window.innerHeight - h - GAP);
    setPos({ left, top: Math.max(GAP, top) });
  }, [anchor]);

  useLayoutEffect(place, [place]);
  useEffect(() => {
    const close = (e: Event) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", esc);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", esc);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, onClose, place]);

  const square = usePad((x, y) => emit({ h: hsv.h, s: x, v: 1 - y }, alpha));
  const hueTrack = usePad((x) => emit({ ...hsv, h: Math.min(359.9, x * 360) }, alpha));
  const alphaTrack = usePad((x) => emit(hsv, x));

  const sliderKeys = (current: number, max: number, set: (n: number) => void) => (e: KeyboardEvent) => {
    const step = (e.shiftKey ? 10 : 1) * (max / 100);
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0;
    if (!d) return;
    e.preventDefault();
    set(Math.min(max, Math.max(0, current + d)));
  };

  const EyeDropper = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
  const sample = async () => {
    if (!EyeDropper) return;
    try {
      const { sRGBHex } = await new EyeDropper().open();
      const p = parseHex(sRGBHex);
      if (p) emit(rgbToHsv(p.rgb), alpha);
    } catch {
      // cancelled
    }
  };

  const save = () => {
    const next = [hex, ...saved.filter((c) => c.toUpperCase() !== hex)].slice(0, MAX_SAVED);
    setSaved(next);
    storeSaved(next);
  };
  const remove = (c: string) => {
    const next = saved.filter((s) => s !== c);
    setSaved(next);
    storeSaved(next);
  };

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={`${title} colour`}
      className="fixed z-50 flex flex-col gap-4 rounded-[16px] border border-line bg-panel p-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.28)]"
      style={{ width: WIDTH, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        <button type="button" aria-label="Close" onClick={onClose} className={cx("flex size-7 items-center justify-center rounded-[8px] text-ink-2 hover:bg-sel hover:text-ink", FOCUS_RING)}>
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* saturation × brightness */}
      <div
        {...square}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.01;
          const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
          if (!d) return;
          e.preventDefault();
          emit({ h: hsv.h, s: clamp01(hsv.s + d[0]), v: clamp01(hsv.v + d[1]) }, alpha);
        }}
        className={cx("relative h-[184px] cursor-crosshair touch-none rounded-[12px]", FOCUS_RING)}
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, hsl(${hsv.h} 100% 50%))` }}
      >
        <span
          className="pointer-events-none absolute size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.25)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: opaque }}
        />
      </div>

      <div className="flex items-center gap-3">
        {EyeDropper ? (
          <button type="button" aria-label="Pick a colour from the screen" onClick={sample} className={cx("flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-2 hover:bg-sel hover:text-ink", FOCUS_RING)}>
            <Pipette size={17} aria-hidden />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div
            {...hueTrack}
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            onKeyDown={sliderKeys(hsv.h, 359.9, (h) => emit({ ...hsv, h }, alpha))}
            className={cx("relative h-3 cursor-pointer touch-none rounded-full", FOCUS_RING)}
            style={{ background: HUES }}
          >
            <Thumb at={hsv.h / 360} color={`hsl(${hsv.h} 100% 50%)`} />
          </div>
          <div
            {...alphaTrack}
            role="slider"
            tabIndex={0}
            aria-label="Opacity"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(alpha * 100)}
            onKeyDown={sliderKeys(alpha, 1, (a) => emit(hsv, a))}
            className={cx("checker relative h-3 cursor-pointer touch-none rounded-full", FOCUS_RING)}
          >
            <span className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${opaque})` }} />
            <Thumb at={alpha} color={hex} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <label className="relative flex h-10 shrink-0 items-center rounded-[10px] bg-chip">
          <span className="sr-only">Colour format</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.currentTarget.value as Mode)}
            className={cx("h-full cursor-pointer appearance-none rounded-[10px] bg-transparent pr-8 pl-3 text-[13px] font-semibold text-ink", FOCUS_RING)}
          >
            {(["HEX", "RGB", "HSL"] as Mode[]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden className="pointer-events-none absolute right-2.5 text-ink-2" />
        </label>
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-[10px] border border-line-2 bg-input focus-within:border-accent">
          {mode === "HEX" && (
            <HexField
              hex={hex}
              onCommit={(raw) => {
                const p = parseHex(raw);
                if (p) emit(rgbToHsv(p.rgb), alpha);
              }}
            />
          )}
          {mode === "RGB" &&
            (["r", "g", "b"] as const).map((k) => (
              <NumField key={k} label={k.toUpperCase()} value={rgb[k]} min={0} max={255} onCommit={(n) => emit(rgbToHsv({ ...rgb, [k]: n }), alpha)} />
            ))}
          {mode === "HSL" && (
            <>
              <NumField label="Hue" value={hsl.h} min={0} max={360} onCommit={(n) => emit(hslToHsv({ ...hsl, h: Math.min(359.9, n) }), alpha)} />
              <NumField label="Saturation" value={hsl.s * 100} min={0} max={100} onCommit={(n) => emit(hslToHsv({ ...hsl, s: n / 100 }), alpha)} />
              <NumField label="Lightness" value={hsl.l * 100} min={0} max={100} onCommit={(n) => emit(hslToHsv({ ...hsl, l: n / 100 }), alpha)} />
            </>
          )}
          <NumField label="Opacity" value={alpha * 100} min={0} max={100} suffix="%" onCommit={(n) => emit(hsv, n / 100)} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-ink">Saved colours</span>
          <button type="button" aria-label="Save this colour" title="Save this colour" onClick={save} className={cx("flex size-7 items-center justify-center rounded-[8px] text-ink-2 hover:bg-sel hover:text-ink", FOCUS_RING)}>
            <Plus size={17} aria-hidden />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {saved.map((c) => {
            const on = c.toUpperCase() === hex;
            return (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                aria-pressed={on}
                title={`${c} · right-click to remove`}
                onClick={() => {
                  const p = parseHex(c);
                  if (p) emit(rgbToHsv(p.rgb), p.a);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  remove(c);
                }}
                className={cx("checker relative size-6 overflow-hidden rounded-full", FOCUS_RING, on && "ring-2 ring-accent ring-offset-2 ring-offset-panel")}
              >
                <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_var(--border-2)]" style={{ background: c }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Thumb({ at, color }: { at: number; color: string }) {
  return (
    <span
      className="pointer-events-none absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.25)]"
      style={{ left: `${at * 100}%`, background: color }}
    />
  );
}
