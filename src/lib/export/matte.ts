// An opaque black matte under a composition, for output without alpha. A colour with opacity on a component's root
// would otherwise leave see-through pixels: the MP4/GIF encoder flattens them to black anyway, but on a path ~15x
// slower. The player uses the same matte, inside the composition, so the preview matches the export.
import { createElement, type ComponentType } from "react";
import { AbsoluteFill } from "remotion";
import type { MotionProps } from "@/motion/types";

const matted = new WeakMap<ComponentType<MotionProps>, ComponentType<MotionProps>>();

export const withMatte = (component: ComponentType<MotionProps>) => {
  let m = matted.get(component);
  if (!m) {
    m = (props: MotionProps) => createElement(AbsoluteFill, { style: { background: "#000000" } }, createElement(component, props));
    matted.set(component, m);
  }
  return m;
};
