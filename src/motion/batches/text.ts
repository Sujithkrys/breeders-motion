// Batch "text": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import maskedWordRise from "../items/masked-word-rise";
import typeMarquee from "../items/type-marquee";
import rollingCounter from "../items/rolling-counter";
import highlightSweep from "../items/highlight-sweep";
import letterWave from "../items/letter-wave";
import gradientShine from "../items/gradient-shine";
import wordSwap from "../items/word-swap";

export const batch: AnyMotionDef[] = [maskedWordRise, typeMarquee, rollingCounter, highlightSweep, letterWave, gradientShine, wordSwap];
