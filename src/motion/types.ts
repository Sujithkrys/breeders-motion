// The contract every motion component in the library follows. The site (grid, component page, editor, export) only
// ever talks to a component through a MotionDef, so adding a component never touches site code.
import type React from "react";
import type { CategoryId } from "./categories";

export type Ratio = "16:9" | "9:16" | "1:1";

export const RATIO_SIZE: Record<Ratio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};

// Props every component receives on top of its own. Values are plain JSON so they can live in the URL and in prompts.
export type PropValue = string | number | boolean;
export type MotionProps = Record<string, PropValue>;

// Editor controls, generated into the Edit tab. `key` is a key of the component's props.
export type ControlDef =
  | { type: "text"; key: string; label: string; maxLength?: number }
  | { type: "color"; key: string; label: string }
  | { type: "select"; key: string; label: string; options: { label: string; value: string }[] }
  | { type: "number"; key: string; label: string; min: number; max: number; step: number; unit?: string }
  | { type: "toggle"; key: string; label: string };

// A colourway: a named set of colour props applied together. The first palette is the default look.
// `swatch` is 2–4 colours used to draw the palette button.
export type Palette = { name: string; swatch: string[]; values: MotionProps };

export type PromptTarget = "claude" | "react" | "css";

export type PromptContext = {
  target: PromptTarget;
  width: number;
  height: number;
  seconds: number; // durationInFrames / fps, already formatted-ready
  fps: number;
};

export interface MotionDef<P extends MotionProps = MotionProps> {
  slug: string; // kebab-case, unique, also the folder name under src/motion/items/
  name: string; // "Card Fan"
  description: string; // one sentence, shown under the name
  category: CategoryId;
  tags: string[];
  addedAt: string; // YYYY-MM-DD; drives "New this week" and Newest sort
  durationInFrames: number;
  fps: number; // always 30 for now
  ratios: Ratio[]; // ratios the layout supports; first is the default
  component: React.FC<P>;
  defaultProps: P; // must already include the first palette's values
  controls: ControlDef[];
  palettes: Palette[];
  // Writes the copy-ready prompt from the CURRENT props, so the prompt always matches what the user sees.
  prompt: (props: P, ctx: PromptContext) => string;
}

// Erase the generic so defs with different prop shapes can sit in one array.
export type AnyMotionDef = MotionDef<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const defineMotion = <P extends MotionProps>(def: MotionDef<P>): MotionDef<P> => def;
