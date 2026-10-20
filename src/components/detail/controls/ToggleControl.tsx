"use client";
import type { ControlDef } from "@/motion/types";
import { FIELD_LABEL, FOCUS_RING, cx } from "../ui";

type ToggleControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "toggle" }>;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ id, control, value, onChange }: ToggleControlProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <label htmlFor={id} className={cx(FIELD_LABEL, "cursor-pointer")}>
        {control.label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cx("relative h-6 w-10 shrink-0 rounded-full transition-colors", value ? "bg-accent" : "bg-line-2", FOCUS_RING)}
      >
        <span
          aria-hidden
          className={cx("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform", value && "translate-x-4")}
        />
      </button>
    </div>
  );
}
