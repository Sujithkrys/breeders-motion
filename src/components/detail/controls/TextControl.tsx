"use client";
import type { ControlDef } from "@/motion/types";
import { FIELD_LABEL, cx } from "../ui";

export const INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-[10px] border border-line-2 bg-input px-3 text-sm text-ink placeholder:text-ink-3 outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

type TextControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "text" }>;
  value: string;
  onChange: (value: string) => void;
};

export function TextControl({ id, control, value, onChange }: TextControlProps) {
  const near = control.maxLength !== undefined && value.length >= control.maxLength;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={FIELD_LABEL}>
          {control.label}
        </label>
        {control.maxLength !== undefined && (
          <span className={cx("font-mono text-[11px] tabular-nums", near ? "text-ink-2" : "text-ink-3")}>
            {value.length}/{control.maxLength}
          </span>
        )}
      </div>
      <input id={id} type="text" value={value} maxLength={control.maxLength} spellCheck={false} autoComplete="off" onChange={(e) => onChange(e.currentTarget.value)} className={INPUT_CLASS} />
    </div>
  );
}
