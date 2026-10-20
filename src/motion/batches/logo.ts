// Batch "logo": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import shardAssemble from "../items/shard-assemble";
import strokeDrawMark from "../items/stroke-draw-mark";
import tileGridReveal from "../items/tile-grid-reveal";
import orbitLockup from "../items/orbit-lockup";
import splitSlideWordmark from "../items/split-slide-wordmark";
import ringBurst from "../items/ring-burst";
import endCard from "../items/end-card";

export const batch: AnyMotionDef[] = [shardAssemble, strokeDrawMark, tileGridReveal, orbitLockup, splitSlideWordmark, ringBurst, endCard];
