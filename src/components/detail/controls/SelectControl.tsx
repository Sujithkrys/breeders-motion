"use client";
import { ChevronDown } from "lucide-react";
import type { ControlDef } from "@/motion/types";
import { Segmented } from "../Segmented";
import { FIELD_LABEL } from "../ui";
import { INPUT_CLASS } from "./TextControl";

type SelectControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "select" }>;
  value: string;
  onChange: (value: string) => void;
};

// Up to four options read best as a segmented control; longer lists fall back to a native select.
export function SelectControl({ id, control, value, onChange }: SelectControlProps) {
  if (control.options.length <= 4) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <span className={FIELD_LABEL}>
          {control.label}
        </span>
        <Segmented label={control.label} options={control.options} value={value} onChange={onChange} stretch />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {control.label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.currentTarget.value)} className={`${INPUT_CLASS} cursor-pointer appearance-none pr-9`}>
          {control.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />
      </div>
    </div>
  );
}
