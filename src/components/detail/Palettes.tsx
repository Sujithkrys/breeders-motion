"use client";
import type { MotionProps, Palette } from "@/motion/types";
import { sameValue } from "@/lib/url-props";
import { FIELD_LABEL, FOCUS_RING, cx } from "./ui";

type PalettesProps = {
  palettes: Palette[];
  props: MotionProps;
  onApply: (palette: Palette) => void;
};

const swatchBackground = (colors: string[]) => {
  if (colors.length === 0) return "transparent";
  if (colors.length === 1) return colors[0];
  const stops = colors.map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`);
  return `linear-gradient(135deg, ${stops.join(", ")})`;
};

export const isPaletteActive = (palette: Palette, props: MotionProps) =>
  Object.entries(palette.values).every(([key, value]) => sameValue(props[key], value));

// Colourways sit above the tabs on purpose: colour is the first thing people want to try.
export function Palettes({ palettes, props, onApply }: PalettesProps) {
  if (palettes.length === 0) return null;
  const active = palettes.find((p) => isPaletteActive(p, props));

  return (
    <section aria-labelledby="colourways-heading" className="border-b border-line px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="colourways-heading" className={FIELD_LABEL}>
          Colourways
        </h3>
        <span className="text-xs text-ink-3" aria-live="polite">
          {active ? active.name : "Custom"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
        {palettes.map((palette) => {
          const on = palette === active;
          return (
            <button
              key={palette.name}
              type="button"
              aria-pressed={on}
              aria-label={`${palette.name} colourway`}
              title={palette.name}
              onClick={() => onApply(palette)}
              className={cx("group flex w-14 flex-col items-center gap-1.5 rounded-[10px]", FOCUS_RING)}
            >
              <span
                className={cx(
                  "block h-[34px] w-full rounded-[10px] border-2 p-0.5 transition-colors",
                  on ? "border-ink" : "border-transparent group-hover:border-line-2",
                )}
              >
                <span className="block size-full rounded-[6px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" style={{ background: swatchBackground(palette.swatch) }} />
              </span>
              <span className={cx("max-w-full truncate text-[11px] font-medium transition-colors", on ? "text-ink" : "text-ink-2 group-hover:text-ink")}>{palette.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
