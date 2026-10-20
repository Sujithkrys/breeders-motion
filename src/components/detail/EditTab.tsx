"use client";
import { RotateCcw } from "lucide-react";
import type { AnyMotionDef, ControlDef, MotionProps, PropValue, Ratio } from "@/motion/types";
import { propsEqual } from "@/lib/url-props";
import { ColorControl } from "./controls/ColorControl";
import { ImageControl } from "./controls/ImageControl";
import { PlacementControl } from "./controls/PlacementControl";
import { NumberControl } from "./controls/NumberControl";
import { SelectControl } from "./controls/SelectControl";
import { TextControl } from "./controls/TextControl";
import { ToggleControl } from "./controls/ToggleControl";
import { OUTLINE_BUTTON, cx } from "./ui";

type EditTabProps = {
  def: AnyMotionDef;
  props: MotionProps;
  ratio: Ratio;
  onChange: (key: string, value: PropValue) => void;
  onReset: () => void;
};

const fitsHalf = (c: ControlDef) => c.type === "text" || c.type === "color";

// Short fields pair up two to a row, but only with a neighbour, so a lone field never leaves a ragged gap.
const layoutSpans = (controls: ControlDef[]) => {
  const half: boolean[] = controls.map(() => false);
  for (let i = 0; i < controls.length - 1; i++) {
    if (!half[i] && fitsHalf(controls[i]) && fitsHalf(controls[i + 1])) {
      half[i] = true;
      half[i + 1] = true;
      i++;
    }
  }
  return half;
};

type ControlProps = { control: ControlDef; props: MotionProps; fallback: PropValue | undefined; onChange: (value: PropValue) => void };

function Control({ control, props, fallback, onChange }: ControlProps) {
  const value = props[control.key];
  const id = `edit-${control.key}`;
  switch (control.type) {
    case "text":
      return <TextControl id={id} control={control} value={String(value ?? "")} onChange={onChange} />;
    case "color":
      return <ColorControl id={id} control={control} value={String(value ?? "")} onChange={onChange} />;
    case "select":
      return <SelectControl id={id} control={control} value={String(value ?? "")} onChange={onChange} />;
    case "number":
      return <NumberControl id={id} control={control} value={typeof value === "number" ? value : control.min} onChange={onChange} />;
    case "toggle":
      return <ToggleControl id={id} control={control} value={Boolean(value)} onChange={onChange} />;
    case "image":
      return <ImageControl id={id} control={control} value={String(value ?? "")} fallback={String(fallback ?? "")} onChange={onChange} />;
    case "area":
    case "point":
      return <PlacementControl id={id} control={control} value={String(value ?? "")} fallback={String(fallback ?? "")} src={String(props[control.image] ?? "")} onChange={onChange} />;
  }
}

// A control can belong to one ratio (a placement on that ratio's image) or sit under a toggle (`when`).
const isShown = (c: ControlDef, props: MotionProps, ratio: Ratio) => (!c.ratio || c.ratio === ratio) && (!c.when || props[c.when] === true);

export function EditTab({ def, props, ratio, onChange, onReset }: EditTabProps) {
  const controls = def.controls.filter((c) => isShown(c, props, ratio));
  const half = layoutSpans(controls);
  const isDefault = propsEqual(props, def.defaultProps as MotionProps);

  return (
    <div className="flex flex-col gap-5">
      {controls.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-ink-2">This component has no editable settings beyond its colourways.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5">
          {controls.map((control, i) => (
            <div key={control.key} className={cx("min-w-0", half[i] ? "col-span-1" : "col-span-2")}>
              <Control control={control} props={props} fallback={(def.defaultProps as MotionProps)[control.key]} onChange={(value) => onChange(control.key, value)} />
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={onReset} disabled={isDefault} className={cx(OUTLINE_BUTTON, "h-10 rounded-[10px] text-[13px] text-ink-2 disabled:opacity-45 disabled:hover:bg-transparent")}>
        <RotateCcw size={14} aria-hidden />
        Reset to default
      </button>
    </div>
  );
}
