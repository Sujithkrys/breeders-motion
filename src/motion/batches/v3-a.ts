// Batch "v3-a": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import slideToConfirm from "../items/slide-to-confirm";
import detachableAccordion from "../items/detachable-accordion";
import interactiveChecklist from "../items/interactive-checklist";
import themeReveal from "../items/theme-reveal";

export const batch: AnyMotionDef[] = [slideToConfirm, detachableAccordion, interactiveChecklist, themeReveal];
