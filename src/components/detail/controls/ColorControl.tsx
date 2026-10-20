"use client";
import { useState } from "react";
import type { ControlDef } from "@/motion/types";
import { FIELD_LABEL, cx } from "../ui";
import { INPUT_CLASS } from "./TextControl";

const HEX = /^#?([0-9a-f]{6})$/i;

// Hex stays uppercase in props so it matches the defs' palettes and reads cleanly in prompts.
const normalise = (raw: string) => {
  const match = HEX.exec(raw.trim());
  return match ? `#${match[1].toUpperCase()}` : null;
};

type ColorControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "color" }>;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ id, control, value, onChange }: ColorControlProps) {
  // While typing, the field shows the draft; it only commits once the draft is a full #RRGGBB.
  const [draft, setDraft] = useState<string | null>(null);
  const valid = normalise(value);
  const shown = draft ?? value;
  const draftInvalid = draft !== null && normalise(draft) === null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className={FIELD_LABEL}>
        {control.label}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cx(
            "relative size-10 shrink-0 overflow-hidden rounded-[10px] border border-line-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
            !valid && "checker",
          )}
          style={valid ? { background: valid } : undefined}
        >
          <input
            type="color"
            aria-label={`${control.label} colour picker`}
            value={(valid ?? "#000000").toLowerCase()}
            onChange={(e) => {
              const next = normalise(e.currentTarget.value);
              if (next) {
                setDraft(null);
                onChange(next);
              }
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
        <input
          id={`${id}-hex`}
          type="text"
          value={shown}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={draftInvalid || undefined}
          onChange={(e) => {
            const raw = e.currentTarget.value;
            setDraft(raw);
            const next = normalise(raw);
            if (next) onChange(next);
          }}
          onBlur={() => setDraft(null)}
          className={cx(INPUT_CLASS, "font-mono", draftInvalid && "border-red-500/70 focus-visible:border-red-500 focus-visible:ring-red-500/30")}
        />
      </div>
    </div>
  );
}
