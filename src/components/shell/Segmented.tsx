"use client";
import type { ReactNode } from "react";
import { SEGMENTED_GROUP, SEGMENT_BUTTON, SEGMENT_OFF, SEGMENT_ON } from "./ui";

export type SegmentOption<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className={SEGMENTED_GROUP}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`${SEGMENT_BUTTON} px-3 ${on ? SEGMENT_ON : SEGMENT_OFF}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
