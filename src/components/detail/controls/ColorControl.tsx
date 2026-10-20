"use client";
import { useRef, useState } from "react";
import type { ControlDef } from "@/motion/types";
import { normaliseHex } from "@/lib/color";
import { FIELD_LABEL, cx } from "../ui";
import { ColorPicker } from "./ColorPicker";
import { INPUT_CLASS } from "./TextControl";

type ColorControlProps = {
  id: string;
  control: Extract<ControlDef, { type: "color" }>;
  value: string;
  onChange: (value: string) => void;
};

// Hex stays uppercase in props so it matches the defs' palettes and reads cleanly in prompts. The swatch opens the
// picker; the text field takes #RRGGBB or #RRGGBBAA directly.
export function ColorControl({ id, control, value, onChange }: ColorControlProps) {
  // While typing, the field shows the draft; it only commits once the draft is a full hex colour.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const swatch = useRef<HTMLButtonElement>(null);
  const valid = normaliseHex(value);
  const shown = draft ?? value;
  const draftInvalid = draft !== null && normaliseHex(draft) === null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className={FIELD_LABEL}>
        {control.label}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <button
          ref={swatch}
          type="button"
          aria-label={`${control.label} colour picker`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cx(
            "checker relative size-10 shrink-0 overflow-hidden rounded-[10px] border border-line-2 outline-none focus-visible:ring-2 focus-visible:ring-accent",
            open && "ring-2 ring-accent",
          )}
        >
          {valid && <span className="absolute inset-0" style={{ background: valid }} />}
        </button>
        <input
          id={`${id}-hex`}
          type="text"
          value={shown}
          maxLength={9}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={draftInvalid || undefined}
          onChange={(e) => {
            const raw = e.currentTarget.value;
            setDraft(raw);
            const next = normaliseHex(raw);
            if (next) onChange(next);
          }}
          onBlur={() => setDraft(null)}
          className={cx(INPUT_CLASS, "font-mono", draftInvalid && "border-red-500/70 focus-visible:border-red-500 focus-visible:ring-red-500/30")}
        />
      </div>
      {open && <ColorPicker title={control.label} value={valid ?? "#000000"} anchor={swatch} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}
