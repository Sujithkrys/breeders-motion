// Batch "v3-e": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import handleReel from "../items/handle-reel";
import rollingCountdown from "../items/rolling-countdown";
import wordsPreloader from "../items/words-preloader";
import blurReveal from "../items/blur-reveal";
import flipText from "../items/flip-text";

export const batch: AnyMotionDef[] = [handleReel, rollingCountdown, wordsPreloader, blurReveal, flipText];
