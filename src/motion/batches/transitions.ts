// Batch "transitions": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import panelWipe from "../items/panel-wipe";
import circleReveal from "../items/circle-reveal";
import gridFlip from "../items/grid-flip";
import sliceShift from "../items/slice-shift";
import meshGradient from "../items/mesh-gradient";
import signalRipple from "../items/signal-ripple";
import dotGridWave from "../items/dot-grid-wave";
import auroraRibbons from "../items/aurora-ribbons";

export const batch: AnyMotionDef[] = [panelWipe, circleReveal, gridFlip, sliceShift, meshGradient, signalRipple, dotGridWave, auroraRibbons];
