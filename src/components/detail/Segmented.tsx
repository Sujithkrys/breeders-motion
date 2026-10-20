"use client";
import { FOCUS_RING, cx } from "./ui";

export type SegmentedOption<T extends string> = { label: string; value: T };

type SegmentedProps<T extends string> = {
  label: string; // accessible name of the group
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // "pill": raised pill on a chip track (tabs, ratios, selects). "outline": quiet bordered chips (prompt target).
  variant?: "pill" | "outline";
  stretch?: boolean; // share the full width equally
  className?: string;
};

export function Segmented<T extends string>({ label, options, value, onChange, variant = "pill", stretch = false, className }: SegmentedProps<T>) {
  if (variant === "outline") {
    return (
      <div role="group" aria-label={label} className={cx("flex gap-0.5", className)}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={cx(
                "h-7 rounded-[7px] border px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                on ? "border-line-2 bg-sel text-ink" : "border-transparent text-ink-2 hover:text-ink",
                stretch && "flex-1",
                FOCUS_RING,
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div role="group" aria-label={label} className={cx("flex gap-[3px] rounded-[10px] bg-chip p-[3px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "h-[30px] min-w-0 truncate rounded-[7px] px-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow]",
              on ? "bg-pill text-ink shadow-pill" : "text-ink-2 hover:text-ink",
              stretch && "flex-1",
              FOCUS_RING,
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
