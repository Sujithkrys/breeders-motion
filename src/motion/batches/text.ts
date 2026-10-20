// Batch "text": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import maskedWordRise from "../items/masked-word-rise";
import rollingCounter from "../items/rolling-counter";
import wordSwap from "../items/word-swap";

export const batch: AnyMotionDef[] = [maskedWordRise, rollingCounter, wordSwap];
