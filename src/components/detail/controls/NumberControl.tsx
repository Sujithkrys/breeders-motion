"use client";
import type { ControlDef } from "@/motion/types";
import { FIELD_LABEL } from "../ui";

type NumberControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "number" }>;
  value: number;
  onChange: (value: number) => void;
};

// Shows as many decimals as the step implies, so 0.05 steps read "0.35" and whole steps read "360".
const decimalsOf = (step: number) => {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
};

export function NumberControl({ id, control, value, onChange }: NumberControlProps) {
  const decimals = decimalsOf(control.step);
  const unit = control.unit ?? "";
  // Short units (px, °, %, s) sit flush against the number; word units like "fps" get a space.
  const display = `${value.toFixed(decimals)}${unit.length > 2 ? " " : ""}${unit}`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={FIELD_LABEL}>
          {control.label}
        </label>
        <output htmlFor={id} className="font-mono text-[13px] font-medium text-ink tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="h-5 w-full cursor-pointer accent-accent outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent/40"
      />
    </div>
  );
}
