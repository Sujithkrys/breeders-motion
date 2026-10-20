// Batch "v2-b" (library v2): one import per component folder in src/motion/items/. Owned by one builder.
import type { AnyMotionDef } from "../types";
import keyframeTimeline from "../items/keyframe-timeline";

export const batch: AnyMotionDef[] = [keyframeTimeline];
